import { Hono } from 'hono'
import type { AppEnv } from '../types'

const r = new Hono<AppEnv>()

const VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5,
  P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
}
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

// North American VINs have a check digit in position 9 that catches typos
export function vinCheckDigitOk(vin: string): boolean {
  const sum = [...vin].reduce((acc, ch, i) => acc + (/\d/.test(ch) ? Number(ch) : VALUES[ch] ?? 0) * WEIGHTS[i], 0)
  const rem = sum % 11
  return vin[8] === (rem === 10 ? 'X' : String(rem))
}

// Decode a VIN with the free NHTSA vPIC service
r.get('/:vin', async (c) => {
  const vin = c.req.param('vin').toUpperCase()
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return c.json({ error: 'A VIN is 17 characters and never contains I, O or Q' }, 400)
  }
  const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`, {
    cf: { cacheTtl: 86400, cacheEverything: true },
  })
  if (!res.ok) return c.json({ error: 'VIN service unavailable' }, 502)
  const data = (await res.json()) as { Results?: Record<string, string>[] }
  const v = data.Results?.[0] ?? {}
  return c.json({
    vin,
    check_digit_ok: vinCheckDigitOk(vin),
    make: v.Make || null,
    model: v.Model || null,
    year: v.ModelYear ? Number(v.ModelYear) : null,
    manufacturer: v.Manufacturer || null,
    body_class: v.BodyClass || null,
    vehicle_type: v.VehicleType || null,
  })
})

export default r
