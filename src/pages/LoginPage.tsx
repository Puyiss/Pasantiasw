import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { CollegeBanner } from '../components/CollegeBanner'
import type { Role, SessionUser } from '../types'

type AccessRole = Extract<Role, 'profesor' | 'alumno' | 'responsable' | 'admin'>

const ROLES: { id: AccessRole; title: string; desc: string }[] = [
  { id: 'profesor', title: 'Acceso profesor', desc: 'Gestión académica' },
  { id: 'alumno', title: 'Acceso alumno', desc: 'Carga de datos' },
  { id: 'responsable', title: 'Acceso mentor', desc: 'Diario de tareas' },
]

export function LoginPage() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'roles' | 'auth'>('roles')
  const [role, setRole] = useState<AccessRole | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  function goHome(session: SessionUser) {
    if (session.role === 'admin') navigate('/admin')
    else if (session.role === 'profesor') navigate('/profesor')
    else if (session.role === 'responsable') navigate('/mentor')
    else navigate('/alumno')
  }

  function openRole(r: AccessRole) {
    setRole(r)
    setStep('auth')
    setMode('login')
    setError('')
    setUsuario('')
    setPassword('')
    setNombre('')
    setApellido('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!role) return
    setError('')
    setLoading(true)
    try {
      const email = usuario.includes('@')
        ? usuario.toLowerCase().trim()
        : `${usuario.toLowerCase().trim()}@lujan.edu`

      if (mode === 'register') {
        const created = await api<SessionUser>('register', {
          nombre,
          apellido,
          email,
          password,
          role: 'responsable',
        })
        setUser(created)
        goHome(created)
        return
      }

      const session = await api<SessionUser>('login', {
        email,
        password,
        expectedRole: role === 'admin' ? undefined : role,
      })
      setUser(session)
      goHome(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo validar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="shell">
      <div className="login-wrap">
        <CollegeBanner />

        {step === 'roles' && (
          <>
            <section className="role-grid fade-in">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="card-access"
                  onClick={() => openRole(r.id)}
                >
                  <div className="rule" />
                  <h3>{r.title}</h3>
                  <p>{r.desc}</p>
                </button>
              ))}
            </section>
            <button
              type="button"
              className="admin-link"
              onClick={() => {
                setRole('admin')
                setStep('auth')
                setUsuario('')
                setPassword('')
              }}
            >
              Administración
            </button>
          </>
        )}

        {step === 'auth' && role && (
          <section className="glass-panel validation-panel">
            <h2>
              Acceso{' '}
              {role === 'responsable' ? 'mentor' : role === 'admin' ? 'administración' : role}
            </h2>
            <p className="val-sub">Ingresá tus credenciales para continuar</p>

            {role === 'responsable' && (
              <div className="tabs" style={{ margin: '0 auto 1.25rem' }}>
                <button
                  type="button"
                  className={`tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => setMode('login')}
                >
                  Ingresar
                </button>
                <button
                  type="button"
                  className={`tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => setMode('register')}
                >
                  Registrarse
                </button>
              </div>
            )}

            <form className="stack-form" onSubmit={onSubmit}>
              {mode === 'register' && (
                <div className="grid-form-2">
                  <label className="field">
                    <span className="label-gold">Nombre</span>
                    <input
                      className="input-lujan"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="label-gold">Apellido</span>
                    <input
                      className="input-lujan"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      required
                    />
                  </label>
                </div>
              )}
              <label className="field">
                <span className="label-gold">Usuario / DNI / Email</span>
                <input
                  className="input-lujan"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="usuario o email"
                  required
                  autoComplete="username"
                />
              </label>
              <label className="field">
                <span className="label-gold">Contraseña</span>
                <input
                  className="input-lujan"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button className="btn-gold" type="submit" disabled={loading}>
                {loading ? 'Validando…' : 'Validar acceso'}
              </button>
              <button
                type="button"
                className="link-back"
                onClick={() => {
                  setStep('roles')
                  setRole(null)
                }}
              >
                ← Volver al inicio
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  )
}
