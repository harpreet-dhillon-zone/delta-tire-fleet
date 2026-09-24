import { Hono } from 'hono'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/health', async (c) => {
  try {
    const row = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()
    return c.json({ status: 'ok', db: row?.ok === 1 })
  } catch {
    return c.json({ status: 'error', db: false }, 500)
  }
})

app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))

export default app