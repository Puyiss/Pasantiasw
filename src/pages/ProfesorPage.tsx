import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Layout } from '../components/Layout'
import type { Course, DailyReport, StudentProfile, User } from '../types'
import { exportReportsCsv } from '../utils/exportCsv'

type StudentRow = User & { profile?: StudentProfile }

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
  const [students, setStudents] = useState<StudentRow[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: 'alu123',
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
    if (!course) {
      setError('No tenés un curso asignado. Pedile al administrador que te asigne uno.')
      return
    }
    try {
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
        courseId: course.id,
        courseName: course.name,
      })
      setForm({
        nombre: '',
        apellido: '',
        email: '',
        password: 'alu123',
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
      subtitle="Cargá la nómina de alumnos con nombre y apellido."
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
              <p className="sheet-sub">
                {course ? `Se agregará a ${course.name}` : 'Sin curso asignado'}
              </p>
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
                  disabled={!course}
                />
              </label>
              <label className="field">
                <span className="label-gold">Apellido</span>
                <input
                  className="input-lujan"
                  value={form.apellido}
                  onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                  required
                  disabled={!course}
                />
              </label>
            </div>
            <label className="field">
              <span className="label-gold">Email (opcional)</span>
              <input
                className="input-lujan"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="se genera si lo dejás vacío"
                disabled={!course}
              />
            </label>
            <button className="btn-gold" type="submit" disabled={!course}>
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
