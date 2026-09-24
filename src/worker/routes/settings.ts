import { Hono } from 'hono'
import { validate } from '../validate'
import { z } from 'zod'
import type { AppEnv } from '../types'

const r = new Hono<AppEnv>()

r.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT key, value, label FROM settings ORDER BY key').all()
  return c.json(results)
})

// Update any number of settings at once; unknown keys are rejected
r.put('/', validate('json', z.record(z.string(), z.number().min(0).max(100))), async (c) => {
  const values = c.req.valid('json')
  const db = c.env.DB
  const { results } = await db.prepare('SELECT key FROM settings').all<{ key: string }>()
  const known = new Set(results.map((x) => x.key))
  const unknown = Object.keys(values).filter((k) => !known.has(k))
  if (unknown.length) return c.json({ error: 'Unknown settings', unknown }, 400)
  if (!Object.keys(values).length) return c.json({ error: 'Nothing to update' }, 400)

  await db.batch(Object.entries(values).map(([key, value]) =>
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').bind(value, key)))
  return c.json({ ok: true })
})

export default r
