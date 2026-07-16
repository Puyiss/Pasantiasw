import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Layout } from '../components/Layout'
import type {
  DateSchedule,
  InternshipPeriodConfig,
  StudentProfile,
  User,
} from '../types'
import {
  DEFAULT_INTERNSHIP_PERIOD,
  datesInRange,
  formatDateLong,
  formatDateShort,
  internshipPeriodLabel,
} from '../types'

export function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState('')
  const [lugarPasantia, setLugarPasantia] = useState('')
  const [responsableNombre, setResponsableNombre] = useState('')
  const [mentorId, setMentorId] = useState('')
  const [mentors, setMentors] = useState<User[]>([])
  const [horariosFechas, setHorariosFechas] = useState<DateSchedule>({})
  const [periodConfig, setPeriodConfig] =
    useState<InternshipPeriodConfig>(DEFAULT_INTERNSHIP_PERIOD)
  const [professorLocked, setProfessorLocked] = useState(false)
  const [professorName, setProfessorName] = useState('')
  const [setupCompleted, setSetupCompleted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(true)

  const activeDates = useMemo(
    () => datesInRange(periodConfig.startDate, periodConfig.endDate),
    [periodConfig],
  )
  const scheduleTitle = internshipPeriodLabel(periodConfig)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const [profile, mentorList, professors, period] = await Promise.all([
          api<StudentProfile>('getProfile', { studentId: user.id }),
          api<User[]>('listMentors'),
          api<User[]>('listProfessors'),
          api<InternshipPeriodConfig>('getInternshipPeriod'),
        ])
        if (cancelled) return
        setMentors(mentorList)
        setPeriodConfig(period)
        setEmpresa(profile.empresa || '')
        setLugarPasantia(profile.lugarPasantia || '')
        setResponsableNombre(profile.responsableNombre || '')
        setMentorId(profile.mentorId || '')
        setHorariosFechas(profile.horariosFechas || {})
        setProfessorLocked(Boolean(profile.professorId))
        setSetupCompleted(Boolean(profile.setupCompleted))
        setProfessorName(
          professors.find((p) => p.id === profile.professorId)?.name ?? 'Asignado por el colegio',
        )
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar')
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  function setDay(iso: string, field: 'entrada' | 'salida', value: string) {
    setHorariosFechas((h) => ({
      ...h,
      [iso]: { entrada: h[iso]?.entrada ?? '', salida: h[iso]?.salida ?? '', [field]: value },
    }))
  }

  function resolveMentorId(nombre: string) {
    const normalized = nombre.trim().toLowerCase()
    if (!normalized) return mentorId
    const byName = mentors.find((m) => m.name.toLowerCase() === normalized)
    return byName?.id || mentorId
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')
    try {
      await api('updateProfile', {
        studentId: user.id,
        empresa,
        lugarPasantia,
        responsableNombre,
        mentorId: resolveMentorId(responsableNombre),
        horariosFechas,
        setupCompleted: true,
      })
      navigate('/alumno')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout
      title="Datos de la pasantía"
      subtitle={`Completá entidad, responsable y ${scheduleTitle.toLowerCase()}.`}
      nav={[
        { to: '/alumno', label: 'Panel' },
        { to: '/alumno/onboarding', label: 'Mis datos' },
      ]}
    >
      <section className="glass-panel">
        {booting ? (
          <p className="empty">Cargando…</p>
        ) : (
          <form className="stack-form" onSubmit={onSubmit}>
            {professorLocked && (
              <div className="summary-item">
                <span>Profesor asignado</span>
                <strong>{professorName}</strong>
              </div>
            )}

            <div className="grid-form-2">
              <label className="field">
                <span className="label-gold">Nombre de la entidad / empresa</span>
                <input
                  className="input-lujan"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span className="label-gold">Dirección / lugar</span>
                <input
                  className="input-lujan"
                  value={lugarPasantia}
                  onChange={(e) => setLugarPasantia(e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="field">
              <span className="label-gold">Responsable a cargo (nombre)</span>
              <input
                className="input-lujan"
                value={responsableNombre}
                onChange={(e) => setResponsableNombre(e.target.value)}
                required
              />
            </label>

            <div>
              <span className="label-gold">{scheduleTitle}</span>
              {activeDates.length === 0 ? (
                <p className="empty">El administrador todavía no configuró el período.</p>
              ) : (
                <div className="schedule-grid">
                  {activeDates.map((iso) => (
                    <div key={iso} className="schedule-row">
                      <strong title={formatDateLong(iso)}>{formatDateShort(iso)}</strong>
                      <input
                        className="input-lujan"
                        type="time"
                        value={horariosFechas[iso]?.entrada ?? ''}
                        onChange={(e) => setDay(iso, 'entrada', e.target.value)}
                      />
                      <input
                        className="input-lujan"
                        type="time"
                        value={horariosFechas[iso]?.salida ?? ''}
                        onChange={(e) => setDay(iso, 'salida', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
              <span className="hint" style={{ color: 'var(--steel)', fontSize: '0.8rem' }}>
                Completá entrada y salida en al menos un día del período.
              </span>
            </div>

            {error && <p className="error">{error}</p>}
            <div className="actions end">
              <Link to="/alumno" className="btn-ghost-lujan">
                {setupCompleted ? 'Volver sin guardar' : 'Volver al panel'}
              </Link>
              <button className="btn-gold" type="submit" disabled={loading}>
                {loading ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </section>
    </Layout>
  )
}
