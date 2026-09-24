import { Hono } from 'hono'
import { validate } from '../validate'
import { z } from 'zod'
import { buildUpdate, type AppEnv } from '../types'
import { AXLE_LAYOUTS, isLayoutKey, positionsFor } from '../../shared/layouts'

const r = new Hono<AppEnv>()

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')

const unitFields = {
  unit_number: z.string().trim().min(1).max(20).transform((s) => s.toUpperCase()),
  unit_class: z.enum(['tractor', 'trailer']),
  equipment_type: z.string().max(60).optional(),
  carrier_id: z.number().int().positive().optional(),
  plate: z.string().trim().max(15).transform((s) => s.toUpperCase()).optional(),
  vin: z.string().trim().length(17).transform((s) => s.toUpperCase()).optional(),
  axle_layout: z.string().refine(isLayoutKey, 'Unknown axle layout'),
  mvi_expiry: isoDate.optional(),
  status: z.enum(['active', 'out_of_service', 'retired']).optional(),
  notes: z.string().max(1000).optional(),
}

const createSchema = z.object(unitFields).refine(
  (u) => !isLayoutKey(u.axle_layout) || AXLE_LAYOUTS[u.axle_layout].unitClass === u.unit_class,
  { message: 'Axle layout does not match unit class', path: ['axle_layout'] },
)
const updateSchema = z.object(unitFields).partial()

// List units with their worst tire status, for the units page
r.get(
  '/',
  validate('query', z.object({
    search: z.string().optional(),
    carrier_id: z.coerce.number().int().optional(),
    unit_class: z.enum(['tractor', 'trailer']).optional(),
    status: z.enum(['active', 'out_of_service', 'retired']).optional(),
  })),
  async (c) => {
    const q = c.req.valid('query')
    const where: string[] = []
    const params: unknown[] = []
    if (q.search) {
      where.push('(u.unit_number LIKE ? OR u.plate LIKE ? OR u.vin LIKE ?)')
      const like = `%${q.search}%`
      params.push(like, like, like)
    }
    if (q.carrier_id) { where.push('u.carrier_id = ?'); params.push(q.carrier_id) }
    if (q.unit_class) { where.push('u.unit_class = ?'); params.push(q.unit_class) }
    if (q.status) { where.push('u.status = ?'); params.push(q.status) }

    const sql = `
      SELECT u.id, u.unit_number, u.unit_class, u.equipment_type, u.plate, u.vin,
             u.axle_layout, u.mvi_expiry, u.status, c.name AS carrier,
             COALESCE(s.worst, -1) AS worst_severity,
             COALESCE(s.critical, 0) AS critical_tires,
             COALESCE(s.warning, 0) AS warning_tires,
             COALESCE(s.tires, 0) AS tire_count
      FROM units u
      LEFT JOIN carriers c ON c.id = u.carrier_id
      LEFT JOIN (
        SELECT unit_id, MAX(severity) AS worst,
               SUM(severity = 3) AS critical, SUM(severity = 2) AS warning, COUNT(*) AS tires
        FROM v_tire_status GROUP BY unit_id
      ) s ON s.unit_id = u.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY worst_severity DESC, u.unit_number`
    const { results } = await c.env.DB.prepare(sql).bind(...params).all()
    return c.json(results)
  },
)

// One unit with its tires and every position its layout has (so empty spots show)
r.get('/:id{[0-9]+}', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  const unit = await db.prepare(`
    SELECT u.*, c.name AS carrier FROM units u
    LEFT JOIN carriers c ON c.id = u.carrier_id WHERE u.id = ?`).bind(id).first<{ axle_layout: string }>()
  if (!unit) return c.json({ error: 'Unit not found' }, 404)

  const { results: tires } = await db.prepare(`
    SELECT t.id AS tire_id, t.position, t.serial_number, t.brand, t.model, t.size, t.dot_week, t.dot_year,
           v.min_tread_32, v.age_years, v.last_inspected, v.tread_status, v.age_status, v.severity, v.axle_role
    FROM tires t
    LEFT JOIN v_tire_status v ON v.tire_id = t.id
    WHERE t.unit_id = ?`).bind(id).all()

  return c.json({ unit, positions: positionsFor(unit.axle_layout), tires })
})

r.post('/', validate('json', createSchema), async (c) => {
  const u = c.req.valid('json')
  const res = await c.env.DB.prepare(`
    INSERT INTO units (unit_number, unit_class, equipment_type, carrier_id, plate, vin, axle_layout, mvi_expiry, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 'active'), ?)`)
    .bind(u.unit_number, u.unit_class, u.equipment_type ?? null, u.carrier_id ?? null, u.plate ?? null,
          u.vin ?? null, u.axle_layout, u.mvi_expiry ?? null, u.status ?? null, u.notes ?? null)
    .run()
  return c.json({ id: res.meta.last_row_id }, 201)
})

r.patch('/:id{[0-9]+}', validate('json', updateSchema), async (c) => {
  const id = Number(c.req.param('id'))
  const body = c.req.valid('json')
  const { sets, params } = buildUpdate(body, [
    'unit_number', 'unit_class', 'equipment_type', 'carrier_id', 'plate', 'vin',
    'axle_layout', 'mvi_expiry', 'status', 'notes',
  ])
  if (!sets.length) return c.json({ error: 'Nothing to update' }, 400)
  const res = await c.env.DB.prepare(`UPDATE units SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`)
    .bind(...params, id).run()
  if (!res.meta.changes) return c.json({ error: 'Unit not found' }, 404)
  return c.json({ ok: true })
})

export default r
