import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Layout } from '../components/Layout'
import type { Course, DailyReport, StudentProfile, User } from '../types'
import { exportReportsCsv, reportsToExportRows } from '../utils/exportCsv'

interface Detail {
  user: User
  profile?: StudentProfile
  reports: DailyReport[]
  course?: Course
}

export function AlumnoDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const data = await api<Detail>('getStudentDetail', { studentId: id })
      setDetail(data)
      const next: Record<string, string> = {}
      for (const r of data.reports) {
        next[r.id] = r.professorComment ?? ''
      }
      setDrafts(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  function exportStudent() {
    if (!detail) return
    if (detail.reports.length === 0) {
      setError('No hay reportes para exportar')
      return
    }
    exportReportsCsv(
      `reportes-${detail.user.name.replace(/\s+/g, '-').toLowerCase()}`,
      reportsToExportRows(detail.reports, {
        name: detail.user.name,
        email: detail.user.email,
      }),
    )
    setMsg('Exportación lista (CSV para Excel)')
    window.setTimeout(() => setMsg(''), 2800)
  }

  async function saveComment(e: FormEvent, reportId: string) {
    e.preventDefault()
    if (!user) return
    setSavingId(reportId)
    setError('')
    try {
      await api('commentReport', {
        reportId,
        professorId: user.id,
        comment: drafts[reportId] ?? '',
      })
      setMsg('Comentario guardado')
      window.setTimeout(() => setMsg(''), 2800)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el comentario')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Layout
      title={detail?.user.name ?? 'Ficha del alumno'}
      subtitle="Datos de pasantía, reportes y tus comentarios."
      nav={[{ to: '/profesor', label: 'Mis alumnos' }]}
    >
      <p>
        <Link to="/profesor" className="btn-ghost-lujan" style={{ display: 'inline-flex', paddingLeft: 0 }}>
          ← Volver al listado
        </Link>
      </p>
      {(msg || error) && (
        <div className={`toast ${error ? 'toast-error' : 'toast-ok'}`} role="status">
          {error || msg}
        </div>
      )}
      {!detail && !error && <p className="empty">Cargando ficha…</p>}
      {detail && (
        <>
          <section className="glass-panel">
            <div className="sheet-head">
              <div>
                <h2>Información</h2>
                <p className="sheet-sub">{detail.user.email}</p>
              </div>
            </div>
            <dl className="meta">
              <div>
                <dt>Curso</dt>
                <dd>{detail.course?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>Empresa</dt>
                <dd>{detail.profile?.empresa || '—'}</dd>
              </div>
              <div>
                <dt>Lugar de pasantía</dt>
                <dd>{detail.profile?.lugarPasantia || '—'}</dd>
              </div>
              <div>
                <dt>Horarios</dt>
                <dd>{detail.profile?.horarios || '—'}</dd>
              </div>
            </dl>
          </section>
          <section className="glass-panel">
            <div className="sheet-head">
              <div>
                <h2>Reportes diarios</h2>
                <p className="sheet-sub">{detail.reports.length} enviados</p>
              </div>
              <button
                type="button"
                className="btn-ghost-lujan"
                disabled={detail.reports.length === 0}
                onClick={exportStudent}
              >
                Exportar (Excel)
              </button>
            </div>
            {detail.reports.length === 0 ? (
              <p className="empty">Sin reportes todavía.</p>
            ) : (
              <ul className="report-list">
                {detail.reports.map((r) => (
                  <li key={r.id} className="report-item">
                    <div className="report-item-head">
                      <div className="report-meta">
                        <time dateTime={r.date}>{r.date}</time>
                        {r.editedAt && (
                          <span
                            className="edited-pill"
                            title={`Editado el ${new Date(r.editedAt).toLocaleString('es-AR')}`}
                          >
                            Editado
                          </span>
                        )}
                      </div>
                    </div>
                    <p>{r.content}</p>
                    <form className="comment-box" onSubmit={(e) => void saveComment(e, r.id)}>
                      <label>
                        Tu comentario
                        <textarea
                          rows={3}
                          value={drafts[r.id] ?? ''}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                          }
                          placeholder="Escribí un comentario para el alumno…"
                          required
                        />
                      </label>
                      {r.professorCommentAt && (
                        <span className="field-hint">
                          Última actualización:{' '}
                          {new Date(r.professorCommentAt).toLocaleString('es-AR')}
                        </span>
                      )}
                      <button
                        className="btn-gold"
                        type="submit"
                        disabled={savingId === r.id}
                      >
                        {savingId === r.id
                          ? 'Guardando…'
                          : r.professorComment
                            ? 'Actualizar comentario'
                            : 'Comentar'}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Layout>
  )
}
