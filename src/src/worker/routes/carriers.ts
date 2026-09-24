import { Hono } from 'hono'
import { validate } from '../validate'
import { z } from 'zod'
import type { AppEnv } from '../types'

const r = new Hono<AppEnv>()

r.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, name FROM carriers ORDER BY name').all()
  return c.json(results)
})

r.post('/', validate('json', z.object({ name: z.string().trim().min(1).max(100) })), async (c) => {
  const { name } = c.req.valid('json')
  const res = await c.env.DB.prepare('INSERT INTO carriers (name) VALUES (?)').bind(name).run()
  return c.json({ id: res.meta.last_row_id }, 201)
})

export default r
