import { Hono } from 'hono'
import type { AppEnv } from '../types'

const r = new Hono<AppEnv>()

// Headline numbers for the top of the dashboard
r.get('/summary', async (c) => {
  const db = c.env.DB
  const [sev, units] = await db.batch([
    db.prepare('SELECT severity, COUNT(*) AS n FROM v_tire_status GROUP BY severity'),
    db.prepare(`
      SELECT
        COUNT(*) AS total_units,
        SUM(CASE WHEN mvi_expiry < date('now') THEN 1 ELSE 0 END) AS mvi_expired,
        SUM(CASE WHEN mvi_expiry >= date('now')
                  AND mvi_expiry <= date('now', '+' || (SELECT CAST(value AS INTEGER) FROM settings WHERE key = 'mvi_warn_days') || ' days')
             THEN 1 ELSE 0 END) AS mvi_due_soon
      FROM units WHERE status = 'active'`),
  ])

  const names = ['ok', 'no_data', 'warning', 'critical'] as const
  const tires = { ok: 0, no_data: 0, warning: 0, critical: 0 }
  for (const row of sev.results as { severity: number; n: number }[]) {
    tires[names[row.severity]] = row.n
  }
  return c.json({ tires, units: units.results[0] })
})

export default r
