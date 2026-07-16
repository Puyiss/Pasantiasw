import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Layout } from '../components/Layout'
import type {
  AdminStats,
  Course,
  InternshipPeriodConfig,
  StudentProfile,
  User,
} from '../types'
import {
  DEFAULT_INTERNSHIP_PERIOD,
  datesInRange,
  formatDateShort,
  internshipPeriodLabel,
} from '../types'
import { downloadStudentsTemplate, parseStudentsCsv } from '../utils/importStudents'

type StudentRow = User & { profile?: StudentProfile }
type Tab = 'equipo' | 'altas' | 'cursos' | 'asignar' | 'semana'

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
  })
  const [aluForm, setAluForm] = useState({
    name: '',
    email: '',
    password: 'alu123',
    professorId: '',
    courseId: '',
  })
  const [courseForm, setCourseForm] = useState({ name: '', professorId: '' })
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [pendingDeleteCourse, setPendingDeleteCourse] = useState<Course | null>(null)
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
  const [importing, setImporting] = useState(false)
  const [periodConfig, setPeriodConfig] =
    useState<InternshipPeriodConfig>(DEFAULT_INTERNSHIP_PERIOD)
  const [periodForm, setPeriodForm] =
    useState<InternshipPeriodConfig>(DEFAULT_INTERNSHIP_PERIOD)

  const flash = (ok: string) => {
    setMsg(ok)
    setError('')
    window.setTimeout(() => setMsg(''), 3200)
  }

  const load = useCallback(async () => {
    setError('')
    try {
      const [profs, alus, cours, st, period] = await Promise.all([
        api<User[]>('listProfessors'),
        api<StudentRow[]>('listStudents'),
        api<Course[]>('listCourses'),
        api<AdminStats>('getStats'),
        api<InternshipPeriodConfig>('getInternshipPeriod'),
      ])
      setProfessors(profs)
      setStudents(alus)
      setCourses(cours)
      setStats(st)
      setPeriodConfig(period)
      setPeriodForm(period)
      setAluForm((f) => ({
        ...f,
        professorId: f.professorId || profs[0]?.id || '',
        courseId:
          f.courseId ||
          cours.find((c) => c.professorId === (f.professorId || profs[0]?.id))?.id ||
          cours[0]?.id ||
          '',
      }))
      setCourseForm((f) => ({
        ...f,
        professorId: f.professorId || profs[0]?.id || '',
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
      setProfForm({ name: '', email: '', password: 'prof123' })
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

  async function createCourse(e: FormEvent) {
    e.preventDefault()
    try {
      await api('createCourse', courseForm)
      setCourseForm((f) => ({ ...f, name: '' }))
      flash('Curso creado')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  async function saveCourse(e: FormEvent) {
    e.preventDefault()
    if (!editCourse) return
    try {
      await api('updateCourse', {
        id: editCourse.id,
        name: editCourse.name,
        professorId: editCourse.professorId,
      })
      setEditCourse(null)
      flash('Curso actualizado')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  async function removeCourse() {
    if (!pendingDeleteCourse) return
    const { id } = pendingDeleteCourse
    setPendingDeleteCourse(null)
    try {
      await api('deleteCourse', { id })
      flash('Curso eliminado')
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

  async function saveInternshipPeriod(e: FormEvent) {
    e.preventDefault()
    try {
      const saved = await api<InternshipPeriodConfig>('updateInternshipPeriod', {
        startDate: periodForm.startDate,
        endDate: periodForm.endDate,
      })
      setPeriodConfig(saved)
      setPeriodForm(saved)
      flash('Período de pasantía actualizado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  const periodPreviewDays = datesInRange(periodForm.startDate, periodForm.endDate)

  async function onImportFile(file: File | null) {
    if (!file) return
    setImporting(true)
    setError('')
    try {
      const text = await file.text()
      const studentsRows = parseStudentsCsv(text)
      const result = await api<{ created: number; skipped: number; errors: string[] }>(
        'importStudents',
        { students: studentsRows },
      )
      flash(
        `Importación lista: ${result.created} creados` +
          (result.skipped ? `, ${result.skipped} omitidos` : ''),
      )
      if (result.errors?.length) {
        setError(result.errors.slice(0, 5).join(' · '))
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar el archivo')
    } finally {
      setImporting(false)
    }
  }

  const coursesForProfessor = courses.filter((c) => c.professorId === aluForm.professorId)
  const assignCourses = courses.filter((c) => c.professorId === assign.professorId)

  return (
    <Layout
      title="Administración"
      subtitle="Gestioná profesores, alumnos, cursos, semana de pasantía y asignaciones."
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
            ['cursos', 'Cursos'],
            ['semana', 'Período'],
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
                        {' · '}
                        {courses.find((c) => c.id === s.profile?.courseId)?.name ?? 'Sin curso'}
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
                <p className="sheet-sub">Creá la cuenta. El curso se asigna en la pestaña Cursos.</p>
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

          <section className="glass-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="sheet-head">
              <div>
                <h2>Carga masiva por Excel</h2>
                <p className="sheet-sub">
                  Subí un CSV exportado desde Excel con todos los alumnos.
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost-lujan"
                onClick={() => downloadStudentsTemplate()}
              >
                Descargar plantilla
              </button>
            </div>
            <label className="field">
              <span className="label-gold">Archivo CSV / Excel</span>
              <input
                className="file-input-lujan"
                type="file"
                accept=".csv,text/csv,.txt"
                disabled={importing}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  void onImportFile(file)
                  e.target.value = ''
                }}
              />
            </label>
            <p className="sheet-sub" style={{ marginTop: '0.75rem' }}>
              Columnas: nombre, apellido, email (opcional), password (opcional), profesor (email),
              curso. Contraseña por defecto: alu123.
            </p>
          </section>
        </div>
      )}

      {tab === 'cursos' && (
        <div className="split-board">
          <section className="glass-panel">
            <div className="sheet-head">
              <div>
                <h2>Crear curso</h2>
                <p className="sheet-sub">Definí el nombre y el profesor responsable.</p>
              </div>
            </div>
            <form className="stack-form" onSubmit={createCourse}>
              <label>
                Nombre del curso
                <input
                  value={courseForm.name}
                  onChange={(e) => setCourseForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: 6to Economía"
                  required
                />
              </label>
              <label>
                Profesor
                <select
                  value={courseForm.professorId}
                  onChange={(e) =>
                    setCourseForm((f) => ({ ...f, professorId: e.target.value }))
                  }
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
              <button className="btn-gold" type="submit">
                Crear curso
              </button>
            </form>
          </section>

          <section className="glass-panel">
            <div className="sheet-head">
              <div>
                <h2>Cursos</h2>
                <p className="sheet-sub">{courses.length} en el sistema</p>
              </div>
            </div>
            {courses.length === 0 ? (
              <p className="empty">Todavía no hay cursos. Creá el primero.</p>
            ) : (
              <ul className="people">
                {courses.map((c) => (
                  <li key={c.id} className="person">
                    <div className="avatar md" aria-hidden>
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="person-info">
                      <strong>{c.name}</strong>
                      <span>
                        {professors.find((p) => p.id === c.professorId)?.name ?? 'Sin profesor'}
                      </span>
                      <span className="tag soft">
                        {students.filter((s) => s.profile?.courseId === c.id).length} alumnos
                      </span>
                    </div>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn-ghost-lujan"
                        onClick={() => setEditCourse({ ...c })}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-danger-lujan"
                        onClick={() => setPendingDeleteCourse(c)}
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

      {tab === 'semana' && (
        <section className="glass-panel" style={{ maxWidth: '36rem' }}>
          <div className="sheet-head">
            <div>
              <h2>Período de pasantía</h2>
              <p className="sheet-sub">
                Elegí las fechas (ej. 27/7 al 8/8). Los alumnos verán esos días en horarios.
              </p>
            </div>
          </div>
          <form className="stack-form" onSubmit={saveInternshipPeriod}>
            <div className="grid-form-2">
              <label>
                Desde
                <input
                  type="date"
                  value={periodForm.startDate}
                  onChange={(e) =>
                    setPeriodForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Hasta
                <input
                  type="date"
                  value={periodForm.endDate}
                  onChange={(e) =>
                    setPeriodForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  required
                />
              </label>
            </div>
            <div className="summary-item">
              <span>Días del período ({periodPreviewDays.length})</span>
              <strong>
                {periodPreviewDays.length
                  ? periodPreviewDays.map(formatDateShort).join(' · ')
                  : '—'}
              </strong>
            </div>
            <p className="sheet-sub">
              Configuración actual: {internshipPeriodLabel(periodConfig)}
            </p>
            <button className="btn-gold" type="submit">
              Guardar período
            </button>
          </form>
        </section>
      )}

      {tab === 'asignar' && (
        <section className="glass-panel" style={{ maxWidth: '36rem' }}>
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

      {editCourse && (
        <div className="modal-backdrop" onClick={() => setEditCourse(null)}>
          <section
            className="glass-panel modal-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-course-title"
          >
            <div className="sheet-head">
              <div>
                <h2 id="edit-course-title">Editar curso</h2>
                <p className="sheet-sub">Cambiá el nombre o el profesor asignado.</p>
              </div>
            </div>
            <form className="stack-form" onSubmit={saveCourse}>
              <label>
                Nombre
                <input
                  value={editCourse.name}
                  onChange={(e) => setEditCourse({ ...editCourse, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Profesor
                <select
                  value={editCourse.professorId}
                  onChange={(e) =>
                    setEditCourse({ ...editCourse, professorId: e.target.value })
                  }
                  required
                >
                  {professors.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="actions end">
                <button
                  type="button"
                  className="btn-ghost-lujan"
                  onClick={() => setEditCourse(null)}
                >
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

      <ConfirmDialog
        open={Boolean(pendingDeleteCourse)}
        title="Eliminar curso"
        message={
          pendingDeleteCourse
            ? `¿Eliminar el curso ${pendingDeleteCourse.name}? Los alumnos quedarán sin ese curso.`
            : ''
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onCancel={() => setPendingDeleteCourse(null)}
        onConfirm={() => void removeCourse()}
      />
    </Layout>
  )
}
