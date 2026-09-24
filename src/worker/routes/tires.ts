import { Hono } from 'hono'
import { validate } from '../validate'
import { z } from 'zod'
import { buildUpdate, type AppEnv } from '../types'
import { positionsFor } from '../../shared/layouts'

const r = new Hono<AppEnv>()

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
const statusEnum = z.enum(['ok', 'warning', 'critical', 'no_data'])

// DOT codes end in a 4-digit week+year, e.g. "...3223" = week 32 of 2023
function parseDot(code?: string): { week?: number; year?: number } {
  const digits = code?.replace(/\D/g, '') ?? ''
  if (digits.length < 4) return {}
  const tail = digits.slice(-4)
  const week = Number(tail.slice(0, 2))
  const year = 2000 + Number(tail.slice(2))
  return week >= 1 && week <= 53 ? { week, year } : {}
}

// Checks a position is valid for the unit and currently empty
async function checkPosition(db: D1Database, unitId: number, position: string, ignoreTireId?: number) {
  const unit = await db.prepare('SELECT axle_layout FROM units WHERE id = ?').bind(unitId).first<{ axle_layout: string }>()
  if (!unit) return 'Unit not found'
  if (!positionsFor(unit.axle_layout).includes(position)) return `Position ${position} does not exist on this unit`
  const taken = await db.prepare('SELECT id FROM tires WHERE unit_id = ? AND position = ? AND id != ?')
    .bind(unitId, position, ignoreTireId ?? 0).first()
  if (taken) return `Position ${position} already has a tire`
  return null
}

// The attention list: every mounted tire, worst first, with filters
r.get(
  '/attention',
  validate('query', z.object({
    carrier: z.string().optional(),
    unit_class: z.enum(['tractor', 'trailer']).optional(),
    axle_role: z.enum(['steer', 'drive', 'trailer']).optional(),
    unit: z.string().optional(),
    brand: z.string().optional(),
    tread_status: statusEnum.optional(),
    age_status: statusEnum.optional(),
    min_severity: z.coerce.number().int().min(0).max(3).optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(500),
  })),
  async (c) => {
    const q = c.req.valid('query')
    const where: string[] = []
    const params: unknown[] = []
    if (q.carrier) { where.push('carrier = ?'); params.push(q.carrier) }
    if (q.unit_class) { where.push('unit_class = ?'); params.push(q.unit_class) }
    if (q.axle_role) { where.push('axle_role = ?'); params.push(q.axle_role) }
    if (q.unit) { where.push('unit_number LIKE ?'); params.push(`%${q.unit}%`) }
    if (q.brand) { where.push('brand = ?'); params.push(q.brand) }
    if (q.tread_status) { where.push('tread_status = ?'); params.push(q.tread_status) }
    if (q.age_status) { where.push('age_status = ?'); params.push(q.age_status) }
    if (q.min_severity !== undefined) { where.push('severity >= ?'); params.push(q.min_severity) }

    const sql = `
      SELECT * FROM v_tire_status
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY severity DESC, min_tread_32 IS NULL, min_tread_32 ASC, unit_number, position
      LIMIT ?`
    const { results } = await c.env.DB.prepare(sql).bind(...params, q.limit).all()
    return c.json(results)
  },
)

// One tire with its full history
r.get('/:id{[0-9]+}', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  const tire = await db.prepare(`
    SELECT t.*, u.unit_number FROM tires t LEFT JOIN units u ON u.id = t.unit_id WHERE t.id = ?`).bind(id).first()
  if (!tire) return c.json({ error: 'Tire not found' }, 404)
  const [insp, moves] = await db.batch([
    db.prepare('SELECT * FROM inspections WHERE tire_id = ? ORDER BY inspected_at DESC, id DESC').bind(id),
    db.prepare(`
      SELECT m.*, fu.unit_number AS from_unit, tu.unit_number AS to_unit
      FROM tire_moves m
      LEFT JOIN units fu ON fu.id = m.from_unit_id
      LEFT JOIN units tu ON tu.id = m.to_unit_id
      WHERE m.tire_id = ? ORDER BY m.moved_at DESC, m.id DESC`).bind(id),
  ])
  return c.json({ tire, inspections: insp.results, moves: moves.results })
})

const tireFields = {
  serial_number: z.string().trim().max(40).optional(),
  dot_code: z.string().trim().max(20).optional(),
  dot_week: z.number().int().min(1).max(53).optional(),
  dot_year: z.number().int().min(1990).max(2100).optional(),
  brand: z.string().trim().max(40).optional(),
  model: z.string().trim().max(40).optional(),
  size: z.string().trim().max(20).optional(),
  tire_type: z.enum(['new', 'retread']).optional(),
  original_tread_32: z.number().min(0).max(40).optional(),
  notes: z.string().max(1000).optional(),
}

// Add a tire: mounted on a unit, or into stock if no unit is given
r.post(
  '/',
  validate('json', z.object({
    ...tireFields,
    unit_id: z.number().int().positive().optional(),
    position: z.string().optional(),
    install_date: isoDate.optional(),
  }).refine((t) => !t.unit_id === !t.position, { message: 'Give both unit_id and position, or neither' })),
  async (c) => {
    const t = c.req.valid('json')
    const db = c.env.DB
    if (t.unit_id && t.position) {
      const problem = await checkPosition(db, t.unit_id, t.position)
      if (problem) return c.json({ error: problem }, 400)
    }
    const dot = parseDot(t.dot_code)
    const installDate = t.install_date ?? new Date().toISOString().slice(0, 10)
    const mounted = Boolean(t.unit_id)

    // Both inserts run in one transaction: either both happen or neither does
    const [ins] = await db.batch([
      db.prepare(`
        INSERT INTO tires (serial_number, dot_code, dot_week, dot_year, brand, model, size, tire_type,
                           original_tread_32, unit_id, position, install_date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, 'new'), ?, ?, ?, ?, ?, ?)`)
        .bind(t.serial_number ?? null, t.dot_code ?? null, t.dot_week ?? dot.week ?? null, t.dot_year ?? dot.year ?? null,
              t.brand ?? null, t.model ?? null, t.size ?? null, t.tire_type ?? null, t.original_tread_32 ?? null,
              t.unit_id ?? null, t.position ?? null, mounted ? installDate : null,
              mounted ? 'mounted' : 'in_stock', t.notes ?? null),
      db.prepare(`
        INSERT INTO tire_moves (tire_id, to_unit_id, to_position, moved_at, reason)
        VALUES (last_insert_rowid(), ?, ?, ?, ?)`)
        .bind(t.unit_id ?? null, t.position ?? null, installDate, mounted ? 'install' : 'added_to_stock'),
    ])
    return c.json({ id: ins.meta.last_row_id }, 201)
  },
)

// Edit descriptive details (location changes go through /move)
r.patch('/:id{[0-9]+}', validate('json', z.object(tireFields).partial()), async (c) => {
  const id = Number(c.req.param('id'))
  const { sets, params } = buildUpdate(c.req.valid('json'), Object.keys(tireFields))
  if (!sets.length) return c.json({ error: 'Nothing to update' }, 400)
  const res = await c.env.DB.prepare(`UPDATE tires SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`)
    .bind(...params, id).run()
  if (!res.meta.changes) return c.json({ error: 'Tire not found' }, 404)
  return c.json({ ok: true })
})

// Move a tire: rotate to another position/unit, pull into stock, or scrap it
r.post(
  '/:id{[0-9]+}/move',
  validate('json', z.object({
    to_unit_id: z.number().int().positive().nullable(),
    to_position: z.string().nullable(),
    new_status: z.enum(['mounted', 'in_stock', 'scrapped']),
    reason: z.string().trim().min(1).max(60),
    moved_at: isoDate.optional(),
  }).refine((m) => (m.new_status === 'mounted') === Boolean(m.to_unit_id && m.to_position), {
    message: 'Mounted needs a unit and position; stock or scrapped needs neither',
  })),
  async (c) => {
    const id = Number(c.req.param('id'))
    const m = c.req.valid('json')
    const db = c.env.DB
    const tire = await db.prepare('SELECT unit_id, position, status FROM tires WHERE id = ?').bind(id)
      .first<{ unit_id: number | null; position: string | null; status: string }>()
    if (!tire) return c.json({ error: 'Tire not found' }, 404)
    if (tire.status === 'scrapped') return c.json({ error: 'Tire is scrapped' }, 400)
    if (m.to_unit_id && m.to_position) {
      const problem = await checkPosition(db, m.to_unit_id, m.to_position, id)
      if (problem) return c.json({ error: problem }, 400)
    }
    const movedAt = m.moved_at ?? new Date().toISOString().slice(0, 10)
    await db.batch([
      db.prepare(`UPDATE tires SET unit_id = ?, position = ?, status = ?,
                  install_date = CASE WHEN ? = 'mounted' THEN ? ELSE install_date END,
                  updated_at = datetime('now') WHERE id = ?`)
        .bind(m.to_unit_id, m.to_position, m.new_status, m.new_status, movedAt, id),
      db.prepare(`INSERT INTO tire_moves (tire_id, from_unit_id, from_position, to_unit_id, to_position, moved_at, reason)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, tire.unit_id, tire.position, m.to_unit_id, m.to_position, movedAt, m.reason),
    ])
    return c.json({ ok: true })
  },
)

export default r
