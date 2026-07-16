export type Role = 'admin' | 'profesor' | 'alumno' | 'responsable'

export type Weekday = 'lun' | 'mar' | 'mie' | 'jue' | 'vie'

export interface DaySchedule {
  entrada: string
  salida: string
}

export type WeekSchedule = Record<Weekday, DaySchedule>

export interface User {
  id: string
  email: string
  password?: string
  role: Role
  name: string
  nombre: string
  apellido: string
}

export interface Course {
  id: string
  name: string
  professorId: string
}

export type DateSchedule = Record<string, DaySchedule>

export interface StudentProfile {
  studentId: string
  empresa: string
  lugarPasantia: string
  responsableNombre: string
  mentorId: string
  horarios: string
  horariosSemana: WeekSchedule
  horariosFechas: DateSchedule
  courseId: string
  professorId: string
  setupCompleted: boolean
}

export interface DailyReport {
  id: string
  studentId: string
  date: string
  content: string
  createdAt: string
  editedAt?: string
  authorId?: string
  authorRole?: Role
  professorComment?: string
  professorCommentAt?: string
  professorCommentBy?: string
  professorCommentByName?: string
}

export interface SessionUser {
  id: string
  email: string
  role: Role
  name: string
  nombre: string
  apellido: string
}

export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

export interface AdminStats {
  professors: number
  students: number
  studentsActive: number
  studentsPendingSetup: number
  courses: number
  reportsToday: number
  reportsThisWeek: number
  commentsThisWeek: number
  weekStart: string
  weekEnd: string
}

export const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: 'lun', label: 'Lunes' },
  { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miércoles' },
  { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },
]

export interface InternshipPeriodConfig {
  startDate: string
  endDate: string
}

function isoLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Default: semana actual de lunes a viernes */
export function defaultInternshipPeriod(): InternshipPeriodConfig {
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  const day = now.getDay()
  const toMonday = day === 0 ? -6 : 1 - day
  const start = new Date(now)
  start.setDate(now.getDate() + toMonday)
  const end = new Date(start)
  end.setDate(start.getDate() + 4)
  return { startDate: isoLocal(start), endDate: isoLocal(end) }
}

export const DEFAULT_INTERNSHIP_PERIOD: InternshipPeriodConfig = defaultInternshipPeriod()

export function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d, 12, 0, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Formato corto tipo 27/7 */
export function formatDateShort(iso: string) {
  const date = parseIsoDate(iso)
  if (!date) return iso
  return `${date.getDate()}/${date.getMonth() + 1}`
}

export function formatDateLong(iso: string) {
  const date = parseIsoDate(iso)
  if (!date) return iso
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  })
}

export function datesInRange(startDate: string, endDate: string): string[] {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  if (!start || !end || start > end) return []
  const out: string[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    out.push(isoLocal(cursor))
    cursor.setDate(cursor.getDate() + 1)
    if (out.length > 62) break
  }
  return out
}

export function internshipPeriodLabel(config: InternshipPeriodConfig) {
  if (!config.startDate || !config.endDate) return 'Horarios de la pasantía'
  if (config.startDate === config.endDate) {
    return `Horario · ${formatDateShort(config.startDate)}`
  }
  return `Horarios ${formatDateShort(config.startDate)} a ${formatDateShort(config.endDate)}`
}

export function emptyWeekSchedule(): WeekSchedule {
  return {
    lun: { entrada: '', salida: '' },
    mar: { entrada: '', salida: '' },
    mie: { entrada: '', salida: '' },
    jue: { entrada: '', salida: '' },
    vie: { entrada: '', salida: '' },
  }
}

export function emptyDateSchedule(dates: string[] = []): DateSchedule {
  return Object.fromEntries(dates.map((d) => [d, { entrada: '', salida: '' }]))
}

export function formatWeekSchedule(s: WeekSchedule, activeDays = WEEKDAYS): string {
  return activeDays
    .map(({ key, label }) => {
      const d = s[key]
      if (!d.entrada || !d.salida) return null
      return `${label.slice(0, 3)} ${d.entrada}-${d.salida}`
    })
    .filter(Boolean)
    .join(' · ')
}

export function formatDateSchedule(s: DateSchedule, dates: string[]): string {
  return dates
    .map((iso) => {
      const d = s[iso]
      if (!d?.entrada || !d?.salida) return null
      return `${formatDateShort(iso)} ${d.entrada}-${d.salida}`
    })
    .filter(Boolean)
    .join(' · ')
}
