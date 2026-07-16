import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Layout } from '../components/Layout'
import type { AdminStats, Course, StudentProfile, User } from '../types'

type StudentRow = User & { profile?: StudentProfile }
type Tab = 'equipo' | 'altas' | 'asignar'

const CURSO_OPTIONS = ['6to Economía', '6to Naturales'] as const

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('equipo')
  const [professors, setProfessors] = useState<User[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [profForm, setProfForm] = useState({
    name: '',
    email: '',
    password: 'prof123',
    courseName: '',
  })
  const [aluForm, setAluForm] = useState({
    name: '',
    email: '',
    password: 'alu123',
    professorId: '',
    courseId: '',
  })
  const [editUser, setEditUser] = useState<{ id: string; name: string; email: string } | null>(
    null,
  )
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [assign, setAssign] = useState<{ studentId: string; professorId: string; courseId: string }>(
    {
      studentId: '',
      professorId: '',
      courseId: '',
    },
  )
  const [courseAssign, setCourseAssign] = useState<{ professorId: string; name: string }>({
    professorId: '',
    name: CURSO_OPTIONS[0],
  })

  const flash = (ok: string) => {
    setMsg(ok)
    setError('')
    window.setTimeout(() => setMsg(''), 2800)
  }

  const load = useCallback(async () => {
    setError('')
    try {
      const [profs, alus, cours, st] = await Promise.all([
        api<User[]>('listProfessors'),
        api<StudentRow[]>('listStudents'),
        api<Course[]>('listCourses'),
        api<AdminStats>('getStats'),
      ])
      setProfessors(profs)
      setStudents(alus)
      setCourses(cours)
      setStats(st)
      setAluForm((f) => ({
        ...f,
        professorId: f.professorId || profs[0]?.id || '',
        courseId:
          f.courseId ||
          cours.find((c) => c.professorId === (f.professorId || profs[0]?.id))?.id ||
          cours[0]?.id ||
          '',
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function createProfessor(e: FormEvent) {
    e.preventDefault()
    try {
      await api('createUser', { ...profForm, role: 'profesor' })
      setProfForm({ name: '', email: '', password: 'prof123', courseName: '' })
      flash('Profesor creado')
      setTab('equipo')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  async function createStudent(e: FormEvent) {
    e.preventDefault()
    try {
      await api('createUser', { ...aluForm, role: 'alumno' })
      setAluForm((f) => ({ ...f, name: '', email: '', password: 'alu123' }))
      flash('Alumno creado')
      setTab('equipo')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editUser) return
    try {
      await api('updateUser', editUser)
      setEditUser(null)
      flash('Usuario actualizado')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  async function removeUser() {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setPendingDelete(null)
    try {
      await api('deleteUser', { id })
      flash('Usuario eliminado')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  async function assignStudent(e: FormEvent) {
    e.preventDefault()
    try {
      await api('assignStudent', assign)
      flash('Asignación guardada')
      setTab('equipo')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  async function assignCourse(e: FormEvent) {
    e.preventDefault()
    try {
      const existing = courses.find((c) => c.professorId === courseAssign.professorId)
      if (existing) {
        await api('updateCourse', { id: existing.id, name: courseAssign.name })
      } else {
        await api('createCourse', {
          name: courseAssign.name,
          professorId: courseAssign.professorId,
        })
      }
      flash('Curso asignado al profesor')
      setTab('equipo')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  const coursesForProfessor = courses.filter((c) => c.professorId === aluForm.professorId)
  const assignCourses = courses.filter((c) => c.professorId === assign.professorId)

  return (
    <Layout
      title="Administración"
      subtitle="Gestioná profesores, alumnos y asignaciones de curso."
    >
      {(msg || error) && (
        <div className={`toast ${error ? 'toast-error' : 'toast-ok'}`} role="status">
          {error || msg}
        </div>
      )}

      {stats && (
        <section className="glass-panel stats-sheet">
          <div className="sheet-head">
            <div>
              <h2>Estadísticas</h2>
              <p className="sheet-sub">
                Semana {stats.weekStart} → {stats.weekEnd}
              </p>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-tile">
              <span>Profesores</span>
              <strong>{stats.professors}</strong>
            </div>
            <div className="stat-tile">
              <span>Alumnos</span>
              <strong>{stats.students}</strong>
            </div>
            <div className="stat-tile accent">
              <span>Alumnos activos</span>
              <strong>{stats.studentsActive}</strong>
              <em>perfil completo</em>
            </div>
            <div className="stat-tile">
              <span>Sin configurar</span>
              <strong>{stats.studentsPendingSetup}</strong>
            </div>
            <div className="stat-tile">
              <span>Cursos</span>
              <strong>{stats.courses}</strong>
            </div>
            <div className="stat-tile accent">
              <span>Reportes hoy</span>
              <strong>{stats.reportsToday}</strong>
            </div>
            <div className="stat-tile accent">
              <span>Reportes esta semana</span>
              <strong>{stats.reportsThisWeek}</strong>
            </div>
            <div className="stat-tile">
              <span>Comentarios esta semana</span>
              <strong>{stats.commentsThisWeek}</strong>
            </div>
          </div>
        </section>
      )}

      <div className="tabs" role="tablist">
        {(
          [
            ['equipo', 'Equipo'],
            ['altas', 'Dar de alta'],
            ['asignar', 'Asignar'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={`tab ${tab === id ? 'active' : ''}`}
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'equipo' && (
        <div className="split-board">
          <section className="glass-panel">
            <div className="sheet-head">
              <div>
                <h2>Profesores</h2>
                <p className="sheet-sub">{professors.length} en el sistema</p>
              </div>
            </div>
            {professors.length === 0 ? (
              <p className="empty">Todavía no hay profesores.</p>
            ) : (
              <ul className="people">
                {professors.map((p) => (
                  <li key={p.id} className="person">
                    <div className="avatar md" aria-hidden>
                      {initials(p.name)}
                    </div>
                    <div className="person-info">
                      <strong>{p.name}</strong>
                      <span>{p.email}</span>
                      <span className="tag soft">
                        {courses.find((c) => c.professorId === p.id)?.name ?? 'Sin curso'}
                      </span>
                    </div>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn-ghost-lujan"
                        onClick={() => setEditUser({ id: p.id, name: p.name, email: p.email })}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-danger-lujan"
                        onClick={() => setPendingDelete({ id: p.id, name: p.name })}
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass-panel">
            <div className="sheet-head">
              <div>
                <h2>Alumnos</h2>
                <p className="sheet-sub">{students.length} registrados</p>
              </div>
            </div>
            {students.length === 0 ? (
              <p className="empty">Todavía no hay alumnos.</p>
            ) : (
              <ul className="people">
                {students.map((s) => (
                  <li key={s.id} className="person">
                    <div className="avatar md" aria-hidden>
                      {initials(s.name)}
                    </div>
                    <div className="person-info">
                      <strong>{s.name}</strong>
                      <span>{s.email}</span>
                      <span className="tag soft">
                        {professors.find((p) => p.id === s.profile?.professorId)?.name ??
                          'Sin profesor'}
                      </span>
                    </div>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn-ghost-lujan"
                        onClick={() => setEditUser({ id: s.id, name: s.name, email: s.email })}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-danger-lujan"
                        onClick={() => setPendingDelete({ id: s.id, name: s.name })}
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'altas' && (
        <div className="split-board">
          <section className="glass-panel">
            <div className="sheet-head">
              <div>
                <h2>Nuevo profesor</h2>
                <p className="sheet-sub">Crea la cuenta y, si querés, su curso inicial.</p>
              </div>
            </div>
            <form className="stack-form" onSubmit={createProfessor}>
              <label>
                Nombre
                <input
                  value={profForm.name}
                  onChange={(e) => setProfForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={profForm.email}
                  onChange={(e) => setProfForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
              <label>
                Contraseña
                <input
                  value={profForm.password}
                  onChange={(e) => setProfForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </label>
              <label>
                Curso inicial
                <input
                  value={profForm.courseName}
                  onChange={(e) => setProfForm((f) => ({ ...f, courseName: e.target.value }))}
                  placeholder="Opcional"
                />
              </label>
              <button className="btn-gold" type="submit">
                Crear profesor
              </button>
            </form>
          </section>

          <section className="glass-panel">
            <div className="sheet-head">
              <div>
                <h2>Nuevo alumno</h2>
                <p className="sheet-sub">Lo vinculás a un profesor y un curso.</p>
              </div>
            </div>
            <form className="stack-form" onSubmit={createStudent}>
              <label>
                Nombre
                <input
                  value={aluForm.name}
                  onChange={(e) => setAluForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={aluForm.email}
                  onChange={(e) => setAluForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
              <label>
                Contraseña
                <input
                  value={aluForm.password}
                  onChange={(e) => setAluForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </label>
              <label>
                Profesor
                <select
                  value={aluForm.professorId}
                  onChange={(e) => {
                    const professorId = e.target.value
                    const firstCourse = courses.find((c) => c.professorId === professorId)
                    setAluForm((f) => ({
                      ...f,
                      professorId,
                      courseId: firstCourse?.id ?? '',
                    }))
                  }}
                  required
                >
                  <option value="">Elegir…</option>
                  {professors.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Curso
                <select
                  value={aluForm.courseId}
                  onChange={(e) => setAluForm((f) => ({ ...f, courseId: e.target.value }))}
                  required
                >
                  <option value="">Elegir…</option>
                  {coursesForProfessor.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn-gold" type="submit">
                Crear alumno
              </button>
            </form>
          </section>
        </div>
      )}

      {tab === 'asignar' && (
        <div className="split-board">
        <section className="glass-panel">
          <div className="sheet-head">
            <div>
              <h2>Reasignar alumno</h2>
              <p className="sheet-sub">Mové un alumno a otro profesor o curso.</p>
            </div>
          </div>
          <form className="stack-form" onSubmit={assignStudent}>
            <label>
              Alumno
              <select
                value={assign.studentId}
                onChange={(e) => setAssign((a) => ({ ...a, studentId: e.target.value }))}
                required
              >
                <option value="">Elegir…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Profesor
              <select
                value={assign.professorId}
                onChange={(e) => {
                  const professorId = e.target.value
                  const firstCourse = courses.find((c) => c.professorId === professorId)
                  setAssign((a) => ({
                    ...a,
                    professorId,
                    courseId: firstCourse?.id ?? '',
                  }))
                }}
                required
              >
                <option value="">Elegir…</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Curso
              <select
                value={assign.courseId}
                onChange={(e) => setAssign((a) => ({ ...a, courseId: e.target.value }))}
                required
              >
                <option value="">Elegir…</option>
                {assignCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn-gold" type="submit">
              Guardar asignación
            </button>
          </form>
        </section>

        <section className="glass-panel">
          <div className="sheet-head">
            <div>
              <h2>Asignar curso a profesor</h2>
              <p className="sheet-sub">Definí el curso a cargo de cada profesor.</p>
            </div>
          </div>
          <form className="stack-form" onSubmit={assignCourse}>
            <label>
              Profesor
              <select
                value={courseAssign.professorId}
                onChange={(e) => {
                  const professorId = e.target.value
                  const current = courses.find((c) => c.professorId === professorId)
                  setCourseAssign((a) => ({
                    ...a,
                    professorId,
                    name: current?.name ?? a.name,
                  }))
                }}
                required
              >
                <option value="">Elegir…</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Curso
              <select
                value={courseAssign.name}
                onChange={(e) => setCourseAssign((a) => ({ ...a, name: e.target.value }))}
                required
              >
                {CURSO_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn-gold" type="submit">
              Guardar curso
            </button>
          </form>
        </section>
        </div>
      )}

      {editUser && (
        <div className="modal-backdrop" onClick={() => setEditUser(null)}>
          <section
            className="glass-panel modal-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
          >
            <div className="sheet-head">
              <div>
                <h2 id="edit-user-title">Editar usuario</h2>
                <p className="sheet-sub">Actualizá nombre o email.</p>
              </div>
            </div>
            <form className="stack-form" onSubmit={saveEdit}>
              <label>
                Nombre
                <input
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  required
                />
              </label>
              <div className="actions end">
                <button type="button" className="btn-ghost-lujan" onClick={() => setEditUser(null)}>
                  Cancelar
                </button>
                <button className="btn-gold" type="submit">
                  Guardar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Eliminar usuario"
        message={
          pendingDelete
            ? `¿Seguro que querés eliminar a ${pendingDelete.name}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void removeUser()}
      />
    </Layout>
  )
}
