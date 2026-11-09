/** Formatea 525512345678 → +52 55 1234 5678 */
export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('52') && d.length === 12) {
    return `+52 ${d.slice(2, 4)} ${d.slice(4, 8)} ${d.slice(8)}`
  }
  return `+${d}`
}

/** Normaliza un número capturado por el usuario. Si son 10 dígitos asume México (+52). */
export function normalizePhone(input: string): string {
  const d = input.replace(/\D/g, '')
  if (d.length === 10) return `52${d}`
  return d
}
