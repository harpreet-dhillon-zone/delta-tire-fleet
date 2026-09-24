export type Bindings = {
  DB: D1Database
}

export type AppEnv = { Bindings: Bindings }

// Turns an optional field list into "col = ?" pairs for PATCH routes.
// Only keys in `allowed` are ever used, so user input never becomes SQL.
export function buildUpdate(body: Record<string, unknown>, allowed: readonly string[]) {
  const sets: string[] = []
  const params: unknown[] = []
  for (const key of allowed) {
    if (body[key] !== undefined) {
      sets.push(`${key} = ?`)
      params.push(body[key])
    }
  }
  return { sets, params }
}
