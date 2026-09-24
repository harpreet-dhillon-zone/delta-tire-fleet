// Same rule as parseDot in src/worker/routes/tires.ts: a DOT code ends in a
// 4-digit week+year, e.g. "...3223" = week 32 of 2023.
export function parseDot(code: string): { week: number; year: number } | null {
  const digits = code.replace(/\D/g, '')
  if (digits.length < 4) return null
  const tail = digits.slice(-4)
  const week = Number(tail.slice(0, 2))
  const year = 2000 + Number(tail.slice(2))
  return week >= 1 && week <= 53 ? { week, year } : null
}
