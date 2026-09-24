import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

app.get('/health', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()
    return c.json({ status: 'ok', db: result?.ok === 1 })
  } catch (err) {
    return c.json({ status: 'error', message: (err as Error).message }, 500)
  }
})

export const onRequest = handle(app)
