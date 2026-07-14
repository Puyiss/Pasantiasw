import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Layout } from '../components/Layout'
import type { StudentProfile, User, WeekSchedule, Weekday } from '../types'
import { WEEKDAYS, emptyWeekSchedule } from '../types'

export function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState('')
  const [lugarPasantia, setLugarPasantia] = useState('')
  const [responsableNombre, setResponsableNombre] = useState('')
  const [mentorId, setMentorId] = useState('')
  const [mentors, setMentors] = useState<User[]>([])
  const [horariosSemana, setHorariosSemana] = useState<WeekSchedule>(emptyWeekSchedule())
  const [professorLocked, setProfessorLocked] = useState(false)
  const [professorName, setProfessorName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const [profile, mentorList, professors] = await Promise.all([
          api<StudentProfile>('getProfile', { studentId: user.id }),
          api<User[]>('listMentors'),
          api<User[]>('listProfessors'),
        ])
        if (cancelled) return
        setMentors(mentorList)
        setEmpresa(profile.empresa || '')
        setLugarPasantia(profile.lugarPasantia || '')
        setResponsableNombre(profile.responsableNombre || '')
        setMentorId(profile.mentorId || '')
        setHorariosSemana(profile.horariosSemana || emptyWeekSchedule())
        setProfessorLocked(Boolean(profile.professorId))
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

  function setDay(day: Weekday, field: 'entrada' | 'salida', value: string) {
    setHorariosSemana((h) => ({
      ...h,
      [day]: { ...h[day], [field]: value },
    }))
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
        mentorId,
        horariosSemana,
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
      subtitle="Completá entidad, responsable y horarios de lunes a viernes."
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

            <div className="grid-form-2">
              <label className="field">
                <span className="label-gold">Responsable a cargo (nombre)</span>
                <input
                  className="input-lujan"
                  value={responsableNombre}
                  onChange={(e) => setResponsableNombre(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span className="label-gold">Mentor en el sistema</span>
                <select
                  className="input-lujan"
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  required
                >
                  <option value="">Elegí mentor…</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <span className="label-gold">Horarios lunes a viernes</span>
              <div className="schedule-grid">
                {WEEKDAYS.map(({ key, label }) => (
                  <div key={key} className="schedule-row">
                    <strong>{label}</strong>
                    <input
                      className="input-lujan"
                      type="time"
                      value={horariosSemana[key].entrada}
                      onChange={(e) => setDay(key, 'entrada', e.target.value)}
                    />
                    <input
                      className="input-lujan"
                      type="time"
                      value={horariosSemana[key].salida}
                      onChange={(e) => setDay(key, 'salida', e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <span className="hint" style={{ color: 'var(--steel)', fontSize: '0.8rem' }}>
                Completá entrada y salida en al menos un día.
              </span>
            </div>

            {error && <p className="error">{error}</p>}
            <button className="btn-gold" type="submit" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar información en servidor'}
            </button>
          </form>
        )}
      </section>
    </Layout>
  )
}
