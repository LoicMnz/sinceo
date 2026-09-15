export const STORAGE_KEY = 'sinceo.counters.v1'
export const colors = ['sage', 'peach', 'lavender', 'sand'] as const
export type Color = (typeof colors)[number]
export type Reset = { id: string; previousDate: string; date: string; recordedAt: string }
export type Counter = {
  id: string
  name: string
  description: string
  color: Color
  startDate: string
  createdAt: string
  resets: Reset[]
}
export type CounterDraft = Pick<Counter, 'name' | 'description' | 'color' | 'startDate'>

// Calendar days, independent of daylight-saving changes and the current hour.
export function today(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '0001-01-01') return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function daysSince(start: string, end = today()): number {
  return Math.max(0, Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000))
}
export function formatDate(date: string, locale = 'fr'): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
}
export function createCounter(draft: CounterDraft): Counter {
  return { ...draft, name: draft.name.trim(), description: draft.description.trim(), id: crypto.randomUUID(), createdAt: new Date().toISOString(), resets: [] }
}
export function resetCounter(counter: Counter, date: string): Counter {
  if (!validDate(date) || date > today()) throw new Error('Choisissez une date valide, au plus tard aujourd’hui.')
  return { ...counter, startDate: date, resets: [...counter.resets, { id: crypto.randomUUID(), previousDate: counter.startDate, date, recordedAt: new Date().toISOString() }] }
}
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
function isReset(value: unknown): value is Reset {
  return isObject(value) && typeof value.id === 'string' && validDate(value.previousDate) && validDate(value.date) && typeof value.recordedAt === 'string' && Number.isFinite(Date.parse(value.recordedAt))
}
function isCounter(value: unknown): value is Counter {
  return isObject(value) && typeof value.id === 'string' && typeof value.name === 'string' && value.name.trim().length > 0 && typeof value.description === 'string' && colors.includes(value.color as Color) && validDate(value.startDate) && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt)) && Array.isArray(value.resets) && value.resets.every(isReset)
}
export function decodeCounters(raw: string | null): Counter[] {
  if (raw === null) return []
  const data: unknown = JSON.parse(raw)
  if (!isObject(data) || data.version !== 1 || !Array.isArray(data.counters) || !data.counters.every(isCounter) || new Set(data.counters.map(c => c.id)).size !== data.counters.length) {
    throw new Error('Données non reconnues')
  }
  return data.counters
}
export function encodeCounters(counters: Counter[]): string {
  return JSON.stringify({ version: 1, counters })
}
