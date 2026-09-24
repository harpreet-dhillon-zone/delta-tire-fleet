// Display helpers. Dates from the API are ISO text (YYYY-MM-DD).

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysFromToday(iso: string): number {
  return Math.round((parseIso(iso).getTime() - parseIso(todayIso()).getTime()) / 86_400_000)
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return parseIso(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// "12 days ago", "Today"
export function fmtAgo(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  const days = -daysFromToday(iso)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 60) return `${days} days ago`
  const months = Math.round(days / 30.4)
  if (months < 24) return `${months} months ago`
  return `${Math.round(days / 365)} years ago`
}

export function fmtTread(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : `${round1(v)}/32″`
}

export function fmtAge(years: number | null | undefined): string {
  return years === null || years === undefined ? '—' : `${round1(years)} yr`
}

export function round1(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

export type MviState = 'expired' | 'due_soon' | 'ok'

export function mviState(expiry: string | null | undefined, warnDays: number): MviState | null {
  if (!expiry) return null
  const days = daysFromToday(expiry)
  if (days < 0) return 'expired'
  if (days <= warnDays) return 'due_soon'
  return 'ok'
}

const SIDE: Record<string, string> = {
  L: 'Left', R: 'Right', LO: 'Left outer', LI: 'Left inner', RI: 'Right inner', RO: 'Right outer',
}

// "A2-LO" -> "Axle 2 · Left outer"
export function positionLabel(position: string | null | undefined): string {
  if (!position) return '—'
  const m = /^A(\d+)-(\w+)$/.exec(position)
  if (!m) return position
  return `Axle ${m[1]} · ${SIDE[m[2]] ?? m[2]}`
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

// Empty string -> undefined, otherwise a number (or NaN if not numeric)
export function parseNum(s: string): number | undefined {
  const t = s.trim().replace(',', '.')
  return t === '' ? undefined : Number(t)
}
