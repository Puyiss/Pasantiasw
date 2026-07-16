import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Layout } from '../components/Layout'
import type { Course, DailyReport, StudentProfile, User } from '../types'
import { exportReportsCsv } from '../utils/exportCsv'

type StudentRow = User & { profile?: StudentProfile }

const CURSO_OPTIONS = ['6to Economía', '6to Naturales'] as const

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProfesorPage() {
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [curso, setCurso] = useState('6to Economía')
  const [students, setStudents] = useState<StudentRow[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: 'alu123',
    curso: '6to Economía',
  })

  const flash = (ok: string) => {
    setMsg(ok)
    setError('')
    window.setTimeout(() => setMsg(''), 2800)
  }

  const load = useCallback(async () => {
    if (!user) return
    try {
      const c = await api<Course | null>('getCourseByProfessor', { professorId: user.id })
      setCourse(c)
      if (c?.name) {
        setCurso(c.name)
        setForm((f) => ({ ...f, curso: c.name }))
      }
      setStudents(await api<StudentRow[]>('listStudents', { professorId: user.id }))
      setCourses(await api<Course[]>('listCourses'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  async function createStudent(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    try {
      let courseId = course?.id
      const courseName = form.curso || curso
      if (!courseId) {
        const created = await api<Course>('createCourse', {
          name: courseName,
          professorId: user.id,
        })
        setCourse(created)
        courseId = created.id
      } else if (course && course.name !== courseName) {
        await api('updateCourse', { id: courseId, name: courseName })
      }
      const email =
        form.email.trim() ||
        `${form.nombre}.${form.apellido}@lujan.edu`.toLowerCase().replace(/\s+/g, '')
      await api('createUser', {
        nombre: form.nombre,
        apellido: form.apellido,
        email,
        password: form.password,
        role: 'alumno',
        professorId: user.id,
        courseId,
        courseName,
      })
      setForm({
        nombre: '',
        apellido: '',
        email: '',
        password: 'alu123',
        curso: courseName,
      })
      flash('Alumno cargado en la nómina')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el alumno')
    }
  }

  async function exportCourseReports() {
    if (!user) return
    try {
      const reports = await api<DailyReport[]>('listReports', { professorId: user.id })
      if (!reports.length) {
        setError('No hay bitácoras para exportar')
        return
      }
      const byId = new Map(students.map((s) => [s.id, s]))
      exportReportsCsv(
        `bitacoras-${(course?.name || 'curso').replace(/\s+/g, '-').toLowerCase()}`,
        reports.map((r) => {
          const s = byId.get(r.studentId)
          return {
            alumno: s?.name ?? r.studentId,
            email: s?.email,
            fecha: r.date,
            contenido: r.content,
            comentarioProfesor: r.professorComment,
          }
        }),
      )
      flash('Exportación lista')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar')
    }
  }

  return (
    <Layout
      title="Gestión académica"
      subtitle="Cargá la nómina de alumnos con nombre, apellido y curso."
      nav={[{ to: '/profesor', label: 'Nómina' }]}
    >
      {(msg || error) && (
        <div className={`toast ${error ? 'toast-error' : 'toast-ok'}`}>{error || msg}</div>
      )}

      <div className="split-board">
        <section className="glass-panel">
          <div className="sheet-head">
            <div>
              <h2>Cargar alumno</h2>
              <p className="sheet-sub">Nombre, apellido y curso</p>
            </div>
          </div>
          <form className="stack-form" onSubmit={createStudent}>
            <div className="grid-form-2">
              <label className="field">
                <span className="label-gold">Nombre</span>
                <input
                  className="input-lujan"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span className="label-gold">Apellido</span>
                <input
                  className="input-lujan"
                  value={form.apellido}
                  onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                  required
                />
              </label>
            </div>
            <label className="field">
              <span className="label-gold">Curso</span>
              <select
                className="input-lujan"
                value={
                  CURSO_OPTIONS.includes(form.curso as (typeof CURSO_OPTIONS)[number])
                    ? form.curso
                    : CURSO_OPTIONS[0]
                }
                onChange={(e) => setForm((f) => ({ ...f, curso: e.target.value }))}
                required
              >
                {CURSO_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label-gold">Email (opcional)</span>
              <input
                className="input-lujan"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="se genera si lo dejás vacío"
              />
            </label>
            <button className="btn-gold" type="submit">
              Cargar en nómina
            </button>
          </form>
        </section>

        <section className="glass-panel">
          <div className="sheet-head">
            <div>
              <h2>Nómina</h2>
              <p className="sheet-sub">{students.length} alumnos</p>
            </div>
            <button
              type="button"
              className="btn-ghost-lujan"
              onClick={() => void exportCourseReports()}
            >
              Exportar bitácoras
            </button>
          </div>
          {students.length === 0 ? (
            <p className="empty">Todavía no hay alumnos cargados.</p>
          ) : (
            <ul className="people">
              {students.map((s) => (
                <li key={s.id} className="person">
                  <div className="avatar">{initials(s.name)}</div>
                  <div className="person-info">
                    <strong>
                      {s.apellido}, {s.nombre}
                    </strong>
                    <span>{s.email}</span>
                    <span className="tag">
                      {courses.find((c) => c.id === s.profile?.courseId)?.name ?? 'Sin curso'}
                      {' · '}
                      {s.profile?.setupCompleted ? 'Datos OK' : 'Pendiente'}
                    </span>
                  </div>
                  <Link className="btn-ghost-lujan" to={`/profesor/alumno/${s.id}`}>
                    Ver ficha
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  )
}
