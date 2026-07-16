/** Formato esperado: "Lun-Vie 9:00-13:00" o "Mar–Jue 14:00–18:00" */
const HORARIO_RE =
  /^(Lun|Mar|Mi[eé]|Jue|Vie|S[aá]b|Dom)(\s*[-–]\s*(Lun|Mar|Mi[eé]|Jue|Vie|S[aá]b|Dom))?\s+\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}$/i

export const HORARIO_HINT = 'Usá el formato: Lun-Vie 9:00-13:00'

export function isValidHorario(value: string): boolean {
  return HORARIO_RE.test(value.trim())
}

export function validateHorario(value: string): string | null {
  if (!value.trim()) return 'Indicá los horarios'
  if (!isValidHorario(value)) return HORARIO_HINT
  return null
}

export function hasReportForDate(
  dates: string[],
  date: string,
): boolean {
  return dates.includes(date)
}
