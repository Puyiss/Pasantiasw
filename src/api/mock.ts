import type {
  AdminStats,
  Course,
  DailyReport,
  StudentProfile,
  User,
  WeekSchedule,
} from '../types'
import { emptyWeekSchedule, formatWeekSchedule } from '../types'

function isoDateLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysAgoLocal(n: number) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return isoDateLocal(d)
}

function startOfWeekLocal(ref = new Date()) {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function endOfWeekLocal(ref = new Date()) {
  const start = startOfWeekLocal(ref)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function fullName(nombre: string, apellido: string) {
  return `${nombre} ${apellido}`.trim()
}

const weekJuan: WeekSchedule = {
  lun: { entrada: '09:00', salida: '13:00' },
  mar: { entrada: '09:00', salida: '13:00' },
  mie: { entrada: '09:00', salida: '13:00' },
  jue: { entrada: '09:00', salida: '13:00' },
  vie: { entrada: '09:00', salida: '13:00' },
}

const weekAna: WeekSchedule = {
  lun: { entrada: '14:00', salida: '18:00' },
  mar: { entrada: '14:00', salida: '18:00' },
  mie: { entrada: '14:00', salida: '18:00' },
  jue: { entrada: '14:00', salida: '18:00' },
  vie: { entrada: '', salida: '' },
}

export const mockUsers: User[] = [
  {
    id: 'u-admin',
    email: 'admin@lujan.edu',
    password: 'admin123',
    role: 'admin',
    nombre: 'Administrador',
    apellido: 'Sistema',
    name: 'Administrador Sistema',
  },
  {
    id: 'u-prof1',
    email: 'profesor@lujan.edu',
    password: 'prof123',
    role: 'profesor',
    nombre: 'María',
    apellido: 'González',
    name: 'María González',
  },
  {
    id: 'u-prof2',
    email: 'carlos@lujan.edu',
    password: 'prof123',
    role: 'profesor',
    nombre: 'Carlos',
    apellido: 'Ruiz',
    name: 'Carlos Ruiz',
  },
  {
    id: 'u-ment1',
    email: 'mentor@lujan.edu',
    password: 'ment123',
    role: 'responsable',
    nombre: 'Laura',
    apellido: 'Vega',
    name: 'Laura Vega',
  },
  {
    id: 'u-alu1',
    email: 'alumno@lujan.edu',
    password: 'alu123',
    role: 'alumno',
    nombre: 'Lucía',
    apellido: 'Pérez',
    name: 'Lucía Pérez',
  },
  {
    id: 'u-alu2',
    email: 'juan@lujan.edu',
    password: 'alu123',
    role: 'alumno',
    nombre: 'Juan',
    apellido: 'Martínez',
    name: 'Juan Martínez',
  },
  {
    id: 'u-alu3',
    email: 'ana@lujan.edu',
    password: 'alu123',
    role: 'alumno',
    nombre: 'Ana',
    apellido: 'López',
    name: 'Ana López',
  },
]

export const mockCourses: Course[] = [
  { id: 'c-1', name: '6to Economía', professorId: 'u-prof1' },
  { id: 'c-2', name: '6to Naturales', professorId: 'u-prof2' },
]

export const mockProfiles: StudentProfile[] = [
  {
    studentId: 'u-alu1',
    empresa: '',
    lugarPasantia: '',
    responsableNombre: '',
    mentorId: '',
    horarios: '',
    horariosSemana: emptyWeekSchedule(),
    courseId: 'c-1',
    professorId: 'u-prof1',
    setupCompleted: false,
  },
  {
    studentId: 'u-alu2',
    empresa: 'TechNova SA',
    lugarPasantia: 'Av. Corrientes 1234, CABA',
    responsableNombre: 'Laura Vega',
    mentorId: 'u-ment1',
    horarios: formatWeekSchedule(weekJuan),
    horariosSemana: weekJuan,
    courseId: 'c-1',
    professorId: 'u-prof1',
    setupCompleted: true,
  },
  {
    studentId: 'u-alu3',
    empresa: 'DataSoft',
    lugarPasantia: 'Parque Industrial Norte',
    responsableNombre: 'Laura Vega',
    mentorId: 'u-ment1',
    horarios: formatWeekSchedule(weekAna),
    horariosSemana: weekAna,
    courseId: 'c-2',
    professorId: 'u-prof2',
    setupCompleted: true,
  },
]

export const mockReports: DailyReport[] = [
  {
    id: 'r-1',
    studentId: 'u-alu2',
    date: daysAgoLocal(1),
    content:
      'Primer día: recorrido por infraestructura y presentación del equipo de redes.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    authorId: 'u-ment1',
    authorRole: 'responsable',
    professorComment: 'Bien, seguir profundizando en redes.',
    professorCommentAt: new Date(Date.now() - 1 * 20 * 60 * 60 * 1000).toISOString(),
    professorCommentBy: 'u-prof1',
    professorCommentByName: 'María González',
  },
  {
    id: 'r-2',
    studentId: 'u-alu2',
    date: daysAgoLocal(0),
    content: 'Revisión de documentación de red interna y diagrama con el mentor.',
    createdAt: new Date().toISOString(),
    authorId: 'u-ment1',
    authorRole: 'responsable',
  },
  {
    id: 'r-3',
    studentId: 'u-alu3',
    date: daysAgoLocal(2),
    content: 'Standup y pruebas de un módulo de reportes.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    authorId: 'u-ment1',
    authorRole: 'responsable',
  },
]

let users = structuredClone(mockUsers)
let courses = structuredClone(mockCourses)
let profiles = structuredClone(mockProfiles)
let reports = structuredClone(mockReports)

function safeUser(u: User) {
  const { password: _, ...rest } = u
  return rest
}

function isWeekScheduleComplete(s: WeekSchedule) {
  const days = Object.values(s)
  const filled = days.filter((d) => d.entrada && d.salida)
  return filled.length >= 1 && filled.every((d) => d.entrada < d.salida || d.entrada !== d.salida)
}

export async function mockRequest(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 160))

  switch (action) {
    case 'login': {
      const raw = String(payload.email ?? payload.usuario ?? '')
        .toLowerCase()
        .trim()
      const password = String(payload.password ?? '')
      const expectedRole = payload.expectedRole as User['role'] | undefined
      const user = users.find((u) => {
        const local = u.email.split('@')[0]
        return (u.email === raw || local === raw) && u.password === password
      })
      if (!user) throw new Error('Credenciales incorrectas')
      if (expectedRole && user.role !== expectedRole && user.role !== 'admin') {
        throw new Error(`Esta cuenta no corresponde al acceso ${expectedRole}`)
      }
      return safeUser(user)
    }

    case 'register': {
      const nombre = String(payload.nombre ?? '').trim()
      const apellido = String(payload.apellido ?? '').trim()
      const email = String(payload.email ?? '').toLowerCase().trim()
      const password = String(payload.password ?? '')
      const role = (payload.role as User['role']) || 'responsable'
      if (!nombre || !apellido || !email || !password) {
        throw new Error('Completá nombre, apellido, usuario y contraseña')
      }
      if (users.some((u) => u.email === email)) throw new Error('El usuario ya existe')
      const user: User = {
        id: uid('u'),
        email,
        password,
        role,
        nombre,
        apellido,
        name: fullName(nombre, apellido),
      }
      users.push(user)
      return safeUser(user)
    }

    case 'listUsers':
      return users.map(safeUser)

    case 'listProfessors':
      return users.filter((u) => u.role === 'profesor').map(safeUser)

    case 'listMentors':
      return users.filter((u) => u.role === 'responsable').map(safeUser)

    case 'listStudents': {
      const professorId = payload.professorId as string | undefined
      const mentorId = payload.mentorId as string | undefined
      const studentUsers = users.filter((u) => u.role === 'alumno')
      const enriched = studentUsers.map((u) => {
        const profile = profiles.find((p) => p.studentId === u.id)
        return { ...safeUser(u), profile }
      })
      if (professorId) return enriched.filter((s) => s.profile?.professorId === professorId)
      if (mentorId) return enriched.filter((s) => s.profile?.mentorId === mentorId)
      return enriched
    }

    case 'createUser': {
      const nombre = String(payload.nombre ?? '').trim()
      const apellido = String(payload.apellido ?? '').trim()
      const name =
        fullName(nombre, apellido) || String(payload.name ?? '').trim()
      const email = String(payload.email ?? '').toLowerCase().trim()
      if (users.some((u) => u.email === email)) throw new Error('El email ya existe')
      const role = payload.role as User['role']
      const user: User = {
        id: uid('u'),
        email,
        password: String(payload.password ?? 'cambiar123'),
        role,
        nombre: nombre || name.split(' ')[0] || name,
        apellido: apellido || name.split(' ').slice(1).join(' ') || '',
        name,
      }
      users.push(user)
      if (role === 'alumno') {
        let courseId = String(payload.courseId ?? '')
        const courseName = String(payload.courseName ?? payload.curso ?? '').trim()
        const professorId = String(payload.professorId ?? '')
        if (!courseId && courseName && professorId) {
          const existing = courses.find(
            (c) => c.professorId === professorId && c.name === courseName,
          )
          if (existing) courseId = existing.id
          else {
            const created = { id: uid('c'), name: courseName, professorId }
            courses.push(created)
            courseId = created.id
          }
        }
        profiles.push({
          studentId: user.id,
          empresa: '',
          lugarPasantia: '',
          responsableNombre: '',
          mentorId: String(payload.mentorId ?? ''),
          horarios: '',
          horariosSemana: emptyWeekSchedule(),
          courseId,
          professorId,
          setupCompleted: false,
        })
      }
      if (role === 'profesor' && payload.courseName) {
        courses.push({
          id: uid('c'),
          name: String(payload.courseName),
          professorId: user.id,
        })
      }
      return safeUser(user)
    }

    case 'updateUser': {
      const id = String(payload.id)
      const idx = users.findIndex((u) => u.id === id)
      if (idx < 0) throw new Error('Usuario no encontrado')
      const nombre =
        payload.nombre !== undefined ? String(payload.nombre) : users[idx].nombre
      const apellido =
        payload.apellido !== undefined ? String(payload.apellido) : users[idx].apellido
      users[idx] = {
        ...users[idx],
        nombre,
        apellido,
        name:
          payload.name !== undefined
            ? String(payload.name)
            : fullName(nombre, apellido) || users[idx].name,
        email:
          payload.email !== undefined
            ? String(payload.email).toLowerCase()
            : users[idx].email,
        password:
          payload.password !== undefined && String(payload.password)
            ? String(payload.password)
            : users[idx].password,
      }
      return safeUser(users[idx])
    }

    case 'deleteUser': {
      const id = String(payload.id)
      users = users.filter((u) => u.id !== id)
      profiles = profiles.filter((p) => p.studentId !== id && p.professorId !== id)
      profiles = profiles.map((p) =>
        p.mentorId === id ? { ...p, mentorId: '' } : p,
      )
      courses = courses.filter((c) => c.professorId !== id)
      reports = reports.filter((r) => r.studentId !== id)
      return { deleted: id }
    }

    case 'listCourses':
      return courses

    case 'getCourseByProfessor': {
      const professorId = String(payload.professorId)
      return courses.find((c) => c.professorId === professorId) ?? null
    }

    case 'updateCourse': {
      const id = String(payload.id)
      const idx = courses.findIndex((c) => c.id === id)
      if (idx < 0) throw new Error('Curso no encontrado')
      courses[idx] = {
        ...courses[idx],
        name: payload.name !== undefined ? String(payload.name) : courses[idx].name,
        professorId:
          payload.professorId !== undefined
            ? String(payload.professorId)
            : courses[idx].professorId,
      }
      return courses[idx]
    }

    case 'createCourse': {
      const course: Course = {
        id: uid('c'),
        name: String(payload.name ?? 'Nuevo curso'),
        professorId: String(payload.professorId),
      }
      courses.push(course)
      return course
    }

    case 'getProfile': {
      const studentId = String(payload.studentId)
      const profile = profiles.find((p) => p.studentId === studentId)
      if (!profile) throw new Error('Perfil no encontrado')
      return profile
    }

    case 'updateProfile': {
      const studentId = String(payload.studentId)
      const idx = profiles.findIndex((p) => p.studentId === studentId)
      if (idx < 0) throw new Error('Perfil no encontrado')
      const current = profiles[idx]

      if (
        payload.professorId !== undefined &&
        current.professorId &&
        String(payload.professorId) !== current.professorId
      ) {
        throw new Error('No podés cambiar el profesor asignado.')
      }

      let horariosSemana = current.horariosSemana
      if (payload.horariosSemana) {
        horariosSemana = payload.horariosSemana as WeekSchedule
        if (!isWeekScheduleComplete(horariosSemana)) {
          throw new Error('Completá al menos un día con entrada y salida (Lun a Vie).')
        }
      }

      profiles[idx] = {
        ...current,
        empresa: payload.empresa !== undefined ? String(payload.empresa) : current.empresa,
        lugarPasantia:
          payload.lugarPasantia !== undefined
            ? String(payload.lugarPasantia)
            : current.lugarPasantia,
        responsableNombre:
          payload.responsableNombre !== undefined
            ? String(payload.responsableNombre)
            : current.responsableNombre,
        mentorId:
          payload.mentorId !== undefined ? String(payload.mentorId) : current.mentorId,
        horariosSemana,
        horarios: formatWeekSchedule(horariosSemana) || current.horarios,
        courseId: payload.courseId !== undefined ? String(payload.courseId) : current.courseId,
        professorId:
          payload.professorId !== undefined
            ? String(payload.professorId)
            : current.professorId,
        setupCompleted:
          payload.setupCompleted !== undefined
            ? Boolean(payload.setupCompleted)
            : current.setupCompleted,
      }
      return profiles[idx]
    }

    case 'assignStudent': {
      const studentId = String(payload.studentId)
      const idx = profiles.findIndex((p) => p.studentId === studentId)
      if (idx < 0) throw new Error('Perfil no encontrado')
      profiles[idx] = {
        ...profiles[idx],
        professorId: String(payload.professorId ?? profiles[idx].professorId),
        courseId: String(payload.courseId ?? profiles[idx].courseId),
        mentorId:
          payload.mentorId !== undefined
            ? String(payload.mentorId)
            : profiles[idx].mentorId,
      }
      return profiles[idx]
    }

    case 'listReports': {
      const studentId = payload.studentId as string | undefined
      const professorId = payload.professorId as string | undefined
      const mentorId = payload.mentorId as string | undefined
      let list = [...reports]
      if (studentId) list = list.filter((r) => r.studentId === studentId)
      if (professorId) {
        const ids = profiles.filter((p) => p.professorId === professorId).map((p) => p.studentId)
        list = list.filter((r) => ids.includes(r.studentId))
      }
      if (mentorId) {
        const ids = profiles.filter((p) => p.mentorId === mentorId).map((p) => p.studentId)
        list = list.filter((r) => ids.includes(r.studentId))
      }
      return list.sort((a, b) => b.date.localeCompare(a.date))
    }

    case 'createReport': {
      const report: DailyReport = {
        id: uid('r'),
        studentId: String(payload.studentId),
        date: String(payload.date ?? isoDateLocal(new Date())),
        content: String(payload.content ?? ''),
        createdAt: new Date().toISOString(),
        authorId: payload.authorId ? String(payload.authorId) : undefined,
        authorRole: payload.authorRole as DailyReport['authorRole'],
      }
      if (!report.content.trim()) throw new Error('La bitácora no puede estar vacía')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(report.date)) throw new Error('Fecha inválida')
      const already = reports.some(
        (r) => r.studentId === report.studentId && r.date === report.date,
      )
      if (already) {
        throw new Error('Ya existe una bitácora para esa fecha. Solo se permite una por día.')
      }
      if (report.authorRole === 'responsable' && report.authorId) {
        const profile = profiles.find((p) => p.studentId === report.studentId)
        if (!profile || profile.mentorId !== report.authorId) {
          throw new Error('Solo el mentor asignado puede cargar la bitácora de este alumno')
        }
      }
      reports.push(report)
      return report
    }

    case 'updateReport': {
      const reportId = String(payload.reportId)
      const content = String(payload.content ?? '').trim()
      if (!content) throw new Error('La bitácora no puede estar vacía')
      const idx = reports.findIndex((r) => r.id === reportId)
      if (idx < 0) throw new Error('Registro no encontrado')
      const today = isoDateLocal(new Date())
      if (reports[idx].date !== today) {
        throw new Error('Solo podés editar el registro de hoy')
      }
      const studentId = payload.studentId ? String(payload.studentId) : reports[idx].studentId
      const authorId = payload.authorId ? String(payload.authorId) : undefined
      // El alumno solo edita sus propios registros; el mentor los suyos
      if (authorId && reports[idx].studentId === authorId) {
        // alumno editando su propio día
      } else if (authorId && reports[idx].authorId && reports[idx].authorId !== authorId) {
        throw new Error('No autorizado a editar este registro')
      } else if (studentId !== reports[idx].studentId) {
        throw new Error('No autorizado')
      }
      reports[idx] = { ...reports[idx], content, editedAt: new Date().toISOString() }
      return reports[idx]
    }

    case 'commentReport': {
      const reportId = String(payload.reportId)
      const professorId = String(payload.professorId)
      const comment = String(payload.comment ?? '').trim()
      if (!comment) throw new Error('El comentario no puede estar vacío')
      const idx = reports.findIndex((r) => r.id === reportId)
      if (idx < 0) throw new Error('Registro no encontrado')
      const professor = users.find((u) => u.id === professorId && u.role === 'profesor')
      if (!professor) throw new Error('Profesor no válido')
      const profile = profiles.find((p) => p.studentId === reports[idx].studentId)
      if (!profile || profile.professorId !== professorId) {
        throw new Error('Solo el profesor a cargo puede comentar')
      }
      reports[idx] = {
        ...reports[idx],
        professorComment: comment,
        professorCommentAt: new Date().toISOString(),
        professorCommentBy: professor.id,
        professorCommentByName: professor.name,
      }
      return reports[idx]
    }

    case 'getStudentDetail': {
      const studentId = String(payload.studentId)
      const user = users.find((u) => u.id === studentId && u.role === 'alumno')
      if (!user) throw new Error('Alumno no encontrado')
      const profile = profiles.find((p) => p.studentId === studentId)
      const studentReports = reports
        .filter((r) => r.studentId === studentId)
        .sort((a, b) => b.date.localeCompare(a.date))
      const course = courses.find((c) => c.id === profile?.courseId)
      return { user: safeUser(user), profile, reports: studentReports, course }
    }

    case 'getStats': {
      const today = isoDateLocal(new Date())
      const weekStart = isoDateLocal(startOfWeekLocal())
      const weekEnd = isoDateLocal(endOfWeekLocal())
      const studentProfiles = profiles.filter((p) =>
        users.some((u) => u.id === p.studentId && u.role === 'alumno'),
      )
      const studentsActive = studentProfiles.filter((p) => p.setupCompleted).length
      const stats: AdminStats = {
        professors: users.filter((u) => u.role === 'profesor').length,
        students: users.filter((u) => u.role === 'alumno').length,
        studentsActive,
        studentsPendingSetup: studentProfiles.length - studentsActive,
        courses: courses.length,
        reportsToday: reports.filter((r) => r.date === today).length,
        reportsThisWeek: reports.filter((r) => r.date >= weekStart && r.date <= weekEnd).length,
        commentsThisWeek: reports.filter((r) => {
          if (!r.professorCommentAt) return false
          const d = isoDateLocal(new Date(r.professorCommentAt))
          return d >= weekStart && d <= weekEnd
        }).length,
        weekStart,
        weekEnd,
      }
      return stats
    }

    default:
      throw new Error(`Acción no soportada: ${action}`)
  }
}
