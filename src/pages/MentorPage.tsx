import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Layout } from '../components/Layout'
import type { DailyReport, StudentProfile, User } from '../types'
import { canEditReport, todayISO } from '../utils/comments'

type StudentRow = User & { profile?: StudentProfile }

export function MentorPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<StudentRow[]>([])
  const [studentId, setStudentId] = useState('')
  const [reports, setReports] = useState<DailyReport[]>([])
  const [date, setDate] = useState(() => todayISO())
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const list = await api<StudentRow[]>('listStudents', { mentorId: user.id })
      setStudents(list)
      setStudentId((prev) => prev || list[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [user])

  const loadReports = useCallback(async () => {
    if (!studentId) {
      setReports([])
      return
    }
    try {
      setReports(await api<DailyReport[]>('listReports', { studentId }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar bitácora')
    }
  }, [studentId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const todayEntry = useMemo(
    () => reports.find((r) => r.date === todayISO()) ?? null,
    [reports],
  )

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!user || !studentId) return
    setError('')
    try {
      if (editingId) {
        await api('updateReport', {
          reportId: editingId,
          studentId,
          content,
          authorId: user.id,
        })
        setMsg('Bitácora de hoy actualizada')
        setEditingId(null)
      } else {
        await api('createReport', {
          studentId,
          date,
          content,
          authorId: user.id,
          authorRole: 'responsable',
        })
        setMsg('Bitácora guardada')
        setContent('')
      }
      window.setTimeout(() => setMsg(''), 2800)
      await loadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  function startEdit(r: DailyReport) {
    if (!canEditReport(r.date)) return
    setEditingId(r.id)
    setDate(r.date)
    setContent(r.content)
  }

  const selected = students.find((s) => s.id === studentId)

  return (
    <Layout
      title="Bitácora diaria"
      subtitle="Registrá día a día las actividades del alumno asignado."
      nav={[{ to: '/mentor', label: 'Bitácora' }]}
    >
      {(msg || error) && (
        <div className={`toast ${error ? 'toast-error' : 'toast-ok'}`}>{error || msg}</div>
      )}

      <section className="glass-panel">
        <div className="sheet-head">
          <div>
            <h2>Alumno asignado</h2>
            <p className="sheet-sub">Seleccioná a quién corresponde el diario de tareas</p>
          </div>
        </div>
        {loading ? (
          <p className="empty">Cargando…</p>
        ) : students.length === 0 ? (
          <p className="empty">
            No tenés alumnos vinculados. El alumno debe elegirte como mentor al cargar sus datos.
          </p>
        ) : (
          <label className="field">
            <span className="label-gold">Alumno</span>
            <select
              className="input-lujan"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value)
                setEditingId(null)
                setContent('')
              }}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.apellido}, {s.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        {selected?.profile && (
          <div className="summary-grid" style={{ marginTop: '1rem' }}>
            <div className="summary-item">
              <span>Entidad</span>
              <strong>{selected.profile.empresa || '—'}</strong>
            </div>
            <div className="summary-item">
              <span>Lugar</span>
              <strong>{selected.profile.lugarPasantia || '—'}</strong>
            </div>
          </div>
        )}
      </section>

      {studentId && (
        <div className="split-board">
          <section className="glass-panel">
            <div className="sheet-head">
              <div>
                <h2>{editingId ? 'Editar bitácora de hoy' : 'Nueva entrada'}</h2>
                <p className="sheet-sub">Detalle de actividades realizadas</p>
              </div>
            </div>
            {todayEntry && !editingId ? (
              <div className="stack-form">
                <p className="sheet-sub">Ya hay una entrada para hoy.</p>
                <p>{todayEntry.content}</p>
                <div className="report-meta">
                  {todayEntry.editedAt && <span className="edited-pill">Editado</span>}
                </div>
                <button type="button" className="btn-gold" onClick={() => startEdit(todayEntry)}>
                  Editar bitácora de hoy
                </button>
              </div>
            ) : (
              <form className="stack-form" onSubmit={submit}>
                <label className="field">
                  <span className="label-gold">Fecha</span>
                  <input
                    className="input-lujan"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    disabled={Boolean(editingId)}
                  />
                </label>
                <label className="field">
                  <span className="label-gold">Actividades del día</span>
                  <textarea
                    className="input-lujan"
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describí qué realizó el alumno…"
                    required
                  />
                </label>
                <div className="actions end">
                  {editingId && (
                    <button
                      type="button"
                      className="btn-ghost-lujan"
                      onClick={() => {
                        setEditingId(null)
                        setContent('')
                        setDate(todayISO())
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button className="btn-gold" type="submit">
                    {editingId ? 'Guardar cambios' : 'Guardar bitácora'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="glass-panel">
            <div className="sheet-head">
              <div>
                <h2>Historial</h2>
                <p className="sheet-sub">{reports.length} registros</p>
              </div>
            </div>
            {reports.length === 0 ? (
              <p className="empty">Sin entradas todavía.</p>
            ) : (
              <ul className="report-list">
                {reports.map((r) => (
                  <li key={r.id} className="report-item">
                    <div className="report-item-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="report-meta">
                        <time dateTime={r.date}>{r.date}</time>
                        {r.editedAt && <span className="edited-pill">Editado</span>}
                      </div>
                      {canEditReport(r.date) && (
                        <button
                          type="button"
                          className="btn-ghost-lujan"
                          onClick={() => startEdit(r)}
                        >
                          Editar
                        </button>
                      )}
                    </div>
                    <p>{r.content}</p>
                    {r.professorComment && (
                      <aside className="professor-comment">
                        <strong>Comentario del profesor</strong>
                        <p>{r.professorComment}</p>
                      </aside>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Layout>
  )
}
