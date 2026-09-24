import { Hono } from 'hono'
import { validate } from '../validate'
import { z } from 'zod'
import type { AppEnv } from '../types'

const r = new Hono<AppEnv>()

const tread = z.number().min(0).max(40).optional()

const reading = z.object({
  tire_id: z.number().int().positive(),
  tread_outer_32: tread,
  tread_center_32: tread,
  tread_inner_32: tread,
  pressure_psi: z.number().min(0).max(200).optional(),
  condition: z.string().trim().max(40).optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (x) => x.tread_outer_32 !== undefined || x.tread_center_32 !== undefined || x.tread_inner_32 !== undefined,
  { message: 'Enter at least one tread reading' },
)

// Save a whole walk-around at once: one reading per tire
r.post(
  '/',
  validate('json', z.object({
    inspected_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    inspector: z.string().trim().max(60).optional(),
    readings: z.array(reading).min(1).max(30),
  })),
  async (c) => {
    const body = c.req.valid('json')
    const db = c.env.DB
    const ids = [...new Set(body.readings.map((x) => x.tire_id))]

    // Check every tire exists before writing anything
    const placeholders = ids.map(() => '?').join(', ')
    const { results } = await db.prepare(`SELECT id FROM tires WHERE id IN (${placeholders})`).bind(...ids).all<{ id: number }>()
    const found = new Set(results.map((x) => x.id))
    const missing = ids.filter((id) => !found.has(id))
    if (missing.length) return c.json({ error: 'Unknown tire ids', missing }, 400)

    const date = body.inspected_at ?? new Date().toISOString().slice(0, 10)
    // INSERT ... SELECT copies the tire's current unit and position into the inspection
    const stmts = body.readings.map((x) =>
      db.prepare(`
        INSERT INTO inspections (tire_id, unit_id, position, inspected_at, tread_outer_32, tread_center_32,
                                 tread_inner_32, pressure_psi, condition, notes, inspector)
        SELECT id, unit_id, position, ?, ?, ?, ?, ?, ?, ?, ? FROM tires WHERE id = ?`)
        .bind(date, x.tread_outer_32 ?? null, x.tread_center_32 ?? null, x.tread_inner_32 ?? null,
              x.pressure_psi ?? null, x.condition ?? null, x.notes ?? null, body.inspector ?? null, x.tire_id),
    )
    await db.batch(stmts)
    return c.json({ saved: stmts.length }, 201)
  },
)

// Undo a mistaken entry
r.delete('/:id{[0-9]+}', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM inspections WHERE id = ?').bind(Number(c.req.param('id'))).run()
  if (!res.meta.changes) return c.json({ error: 'Inspection not found' }, 404)
  return c.json({ ok: true })
})

export default r
