import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import type { ZodType } from 'zod'

// zValidator with a cleaner error shape the frontend can show next to each field:
// { error: 'Invalid input', issues: [{ field: 'readings.0', message: '...' }] }
export const validate = <Target extends keyof ValidationTargets, T extends ZodType>(target: Target, schema: T) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({
        error: 'Invalid input',
        issues: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      }, 400)
    }
  })
