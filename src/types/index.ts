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

export interface StudentProfile {
  studentId: string
  empresa: string
  lugarPasantia: string
  responsableNombre: string
  mentorId: string
  horarios: string
  horariosSemana: WeekSchedule
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

export function emptyWeekSchedule(): WeekSchedule {
  return {
    lun: { entrada: '', salida: '' },
    mar: { entrada: '', salida: '' },
    mie: { entrada: '', salida: '' },
    jue: { entrada: '', salida: '' },
    vie: { entrada: '', salida: '' },
  }
}

export function formatWeekSchedule(s: WeekSchedule): string {
  return WEEKDAYS.map(({ key, label }) => {
    const d = s[key]
    if (!d.entrada || !d.salida) return null
    return `${label.slice(0, 3)} ${d.entrada}-${d.salida}`
  })
    .filter(Boolean)
    .join(' · ')
}
