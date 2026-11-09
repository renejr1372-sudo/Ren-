const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayISO = () => toISODate(new Date())

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** Lunes de la semana de la fecha dada. */
export function startOfWeek(iso: string): string {
  const d = parseISODate(iso)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return toISODate(d)
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export const fromMinutes = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'p. m.' : 'a. m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${pad(m)} ${suffix}`
}

export function formatTimeShort(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${pad(m)}`
}

export const endTime = (start: string, duration: number) => fromMinutes(toMinutes(start) + duration)

export const dayName = (iso: string) => DAYS[parseISODate(iso).getDay()]
export const dayShort = (iso: string) => DAYS_SHORT[parseISODate(iso).getDay()]
export const dayNum = (iso: string) => parseISODate(iso).getDate()

export function formatLongDate(iso: string): string {
  const d = parseISODate(iso)
  return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

export function formatShortDate(iso: string): string {
  const d = parseISODate(iso)
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

export function formatMonthRange(startIso: string, endIso: string): string {
  const a = parseISODate(startIso)
  const b = parseISODate(endIso)
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${b.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()}`
  return `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]} ${b.getFullYear()}`
}

export function relativeDay(iso: string): string {
  const t = todayISO()
  if (iso === t) return 'Hoy'
  if (iso === addDays(t, 1)) return 'Mañana'
  if (iso === addDays(t, -1)) return 'Ayer'
  return formatShortDate(iso)
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}
