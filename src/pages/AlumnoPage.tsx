import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Layout } from '../components/Layout'
import type { DailyReport, InternshipPeriodConfig, StudentProfile, User } from '../types'
import {
  DEFAULT_INTERNSHIP_PERIOD,
  datesInRange,
  formatDateLong,
  formatDateShort,
  internshipPeriodLabel,
} from '../types'
import {
  canEditReport,
  getCommentsSeenAt,
  isCommentUnread,
  markCommentsSeen,
  todayISO,
} from '../utils/comments'
import { hasReportForDate } from '../utils/validation'

export function AlumnoPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [professorName, setProfessorName] = useState('')
  const [periodConfig, setPeriodConfig] =
    useState<InternshipPeriodConfig>(DEFAULT_INTERNSHIP_PERIOD)
  const [reports, setReports] = useState<DailyReport[]>([])
  const [date, setDate] = useState(() => todayISO())
  const [content, setContent] = useState('')
  const [editingToday, setEditingToday] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [seenAt, setSeenAt] = useState<string | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  const activeDates = useMemo(
    () => datesInRange(periodConfig.startDate, periodConfig.endDate),
    [periodConfig],
  )
  const scheduleTitle = internshipPeriodLabel(periodConfig)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [p, list, professors, period] = await Promise.all([
        api<StudentProfile>('getProfile', { studentId: user.id }),
        api<DailyReport[]>('listReports', { studentId: user.id }),
        api<User[]>('listProfessors'),
        api<InternshipPeriodConfig>('getInternshipPeriod'),
      ])
      setProfile(p)
      setReports(list)
      setPeriodConfig(period)
      setProfessorName(professors.find((x) => x.id === p.professorId)?.name ?? '')
      const seen = getCommentsSeenAt(user.id)
      setSeenAt(seen)
      setShowBanner(list.some((r) => isCommentUnread(r.professorCommentAt, seen)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const today = todayISO()
  const todayReport = useMemo(
    () => reports.find((r) => r.date === today) ?? null,
    [reports, today],
  )

  useEffect(() => {
    if (editingToday && todayReport) {
      setDate(today)
      setContent(todayReport.content)
    }
  }, [editingToday, todayReport, today])

  const unreadCount = reports.filter((r) =>
    isCommentUnread(r.professorCommentAt, seenAt),
  ).length

  const dateTaken = hasReportForDate(
    reports.map((r) => r.date),
    date,
  )
  const isEditing = Boolean(editingToday && todayReport)

  function dismissBanner() {
    if (!user) return
    const now = new Date().toISOString()
    markCommentsSeen(user.id, now)
    setSeenAt(now)
    setShowBanner(false)
  }

  async function submitReport(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setMsg('')
    setError('')

    if (isEditing && todayReport) {
      try {
        await api('updateReport', {
          reportId: todayReport.id,
          studentId: user.id,
          content,
          authorId: user.id,
        })
        setMsg('Registro de hoy actualizado')
        setEditingToday(false)
        window.setTimeout(() => setMsg(''), 2800)
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo actualizar')
      }
      return
    }

    if (dateTaken) {
      setError('Ya existe un registro para esa fecha. Solo se permite uno por día.')
      return
    }

    try {
      await api('createReport', {
        studentId: user.id,
        date,
        content,
        authorId: user.id,
        authorRole: 'alumno',
      })
      setContent('')
      setMsg('Registro diario enviado')
      window.setTimeout(() => setMsg(''), 2800)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar')
    }
  }

  return (
    <Layout
      title="Panel de estudiante"
      subtitle="Cargá tu registro diario y consultá los datos de tu pasantía."
      nav={[
        { to: '/alumno', label: 'Panel', badge: unreadCount },
        { to: '/alumno/onboarding', label: 'Mis datos' },
      ]}
    >
      {showBanner && unreadCount > 0 && (
        <div className="toast toast-ok">
          <span>
            Tenés {unreadCount} comentario{unreadCount === 1 ? '' : 's'} nuevo
            {unreadCount === 1 ? '' : 's'} del profesor.
          </span>
          <button type="button" className="btn-ghost-lujan" onClick={dismissBanner}>
            Marcar como visto
          </button>
        </div>
      )}
      {!loading && profile && !profile.setupCompleted && (
        <div className="toast toast-error">
          <span>Todavía no cargaste los datos de tu pasantía.</span>
          <Link to="/alumno/onboarding" className="btn-ghost-lujan">
            Completar ahora
          </Link>
        </div>
      )}
      {(msg || error) && (
        <div className={`toast ${error ? 'toast-error' : 'toast-ok'}`}>{error || msg}</div>
      )}

      {profile && (
        <section className="glass-panel">
          <div className="sheet-head">
            <div>
              <h2>Datos de la pasantía</h2>
              <p className="sheet-sub">Información de la entidad y horarios</p>
            </div>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <span>Entidad</span>
              <strong>{profile.empresa || '—'}</strong>
            </div>
            <div className="summary-item">
              <span>Dirección</span>
              <strong>{profile.lugarPasantia || '—'}</strong>
            </div>
            <div className="summary-item">
              <span>Responsable</span>
              <strong>{profile.responsableNombre || '—'}</strong>
            </div>
            <div className="summary-item">
              <span>Profesor</span>
              <strong>{professorName || '—'}</strong>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <span className="label-gold">{scheduleTitle}</span>
            <div className="schedule-grid">
              {activeDates.map((iso) => (
                <div key={iso} className="schedule-row">
                  <strong title={formatDateLong(iso)}>{formatDateShort(iso)}</strong>
                  <div className="summary-item" style={{ padding: '0.75rem' }}>
                    <span>Entrada</span>
                    <strong>{profile.horariosFechas?.[iso]?.entrada || '—'}</strong>
                  </div>
                  <div className="summary-item" style={{ padding: '0.75rem' }}>
                    <span>Salida</span>
                    <strong>{profile.horariosFechas?.[iso]?.salida || '—'}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="split-board">
        <section className="glass-panel">
          <div className="sheet-head">
            <div>
              <h2>{isEditing ? 'Editar registro de hoy' : 'Registro diario'}</h2>
              <p className="sheet-sub">
                {isEditing
                  ? 'Podés modificarlo solo durante el día de hoy.'
                  : 'Un solo registro por día. Contá cómo te fue en la pasantía.'}
              </p>
            </div>
          </div>

          {todayReport && !isEditing && (
            <div className="stack-form">
              <div className="report-meta">
                <p className="sheet-sub" style={{ margin: 0 }}>
                  Ya cargaste el registro de hoy.
                </p>
                {todayReport.editedAt && <span className="edited-pill">Editado</span>}
              </div>
              <p>{todayReport.content}</p>
              {canEditReport(todayReport.date) && (
                <button
                  type="button"
                  className="btn-gold"
                  onClick={() => setEditingToday(true)}
                >
                  Editar registro de hoy
                </button>
              )}
            </div>
          )}

          {(!todayReport || isEditing) && (
            <form className="stack-form" onSubmit={submitReport}>
              <label className="field">
                <span className="label-gold">Fecha</span>
                <input
                  className="input-lujan"
                  type="date"
                  value={isEditing ? today : date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={isEditing}
                />
                {!isEditing && dateTaken && date !== today && (
                  <span className="hint" style={{ color: 'var(--danger)' }}>
                    Ya existe un registro para esa fecha.
                  </span>
                )}
              </label>
              <label className="field">
                <span className="label-gold">Qué hiciste / cómo te fue</span>
                <textarea
                  className="input-lujan"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ej.: Primer día hablamos sobre la infraestructura…"
                  required
                />
              </label>
              <div className="actions end">
                {isEditing && (
                  <button
                    type="button"
                    className="btn-ghost-lujan"
                    onClick={() => {
                      setEditingToday(false)
                      setContent('')
                    }}
                  >
                    Cancelar
                  </button>
                )}
                <button className="btn-gold" type="submit" disabled={!isEditing && dateTaken}>
                  {isEditing ? 'Guardar cambios' : 'Enviar registro'}
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
          {loading ? (
            <p className="empty">Cargando…</p>
          ) : reports.length === 0 ? (
            <p className="empty">Todavía no enviaste registros.</p>
          ) : (
            <ul className="report-list">
              {reports.map((r) => {
                const unread = isCommentUnread(r.professorCommentAt, seenAt)
                return (
                  <li key={r.id} className="report-item">
                    <div
                      className="report-item-head"
                      style={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <div className="report-meta">
                        <time dateTime={r.date}>{r.date}</time>
                        {r.editedAt && <span className="edited-pill">Editado</span>}
                        {r.authorRole === 'responsable' && (
                          <span className="tag">Mentor</span>
                        )}
                      </div>
                      {r.date === today && canEditReport(r.date) && r.authorRole !== 'responsable' && (
                        <button
                          type="button"
                          className="btn-ghost-lujan"
                          onClick={() => setEditingToday(true)}
                        >
                          Editar
                        </button>
                      )}
                    </div>
                    <p>{r.content}</p>
                    {r.professorComment && (
                      <aside className={`professor-comment ${unread ? 'is-new' : ''}`}>
                        <strong>
                          Comentario del profesor
                          {unread && <span className="new-pill">Nuevo</span>}
                        </strong>
                        <p>{r.professorComment}</p>
                      </aside>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  )
}
