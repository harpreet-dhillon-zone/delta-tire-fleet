import { Hono } from 'hono'
import type { AppEnv } from './types'
import { AXLE_LAYOUTS } from '../shared/layouts'
import dashboard from './routes/dashboard'
import units from './routes/units'
import tires from './routes/tires'
import inspections from './routes/inspections'
import settings from './routes/settings'
import carriers from './routes/carriers'
import vin from './routes/vin'

const app = new Hono<AppEnv>().basePath('/api')

app.get('/health', async (c) => {
  const row = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>()
  return c.json({ status: 'ok', db: row?.ok === 1 })
})

app.get('/layouts', (c) => c.json(AXLE_LAYOUTS))

app.route('/dashboard', dashboard)
app.route('/units', units)
app.route('/tires', tires)
app.route('/inspections', inspections)
app.route('/settings', settings)
app.route('/carriers', carriers)
app.route('/vin', vin)

app.notFound((c) => c.json({ error: 'Not found' }, 404))

// One place that turns database errors into clear HTTP responses
app.onError((err, c) => {
  const msg = String(err?.message ?? err)
  if (msg.includes('UNIQUE constraint failed')) {
    return c.json({ error: 'That value already exists', detail: msg }, 409)
  }
  if (msg.includes('CHECK constraint failed') || msg.includes('FOREIGN KEY constraint failed')) {
    return c.json({ error: 'Invalid data', detail: msg }, 400)
  }
  console.error(err)
  return c.json({ error: 'Server error' }, 500)
})

export default app
