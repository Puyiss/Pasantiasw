import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { ReactNode } from 'react'
import { LOGO_URL } from './CollegeBanner'

interface LayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  nav?: { to: string; label: string; badge?: number }[]
}

const roleLabel: Record<string, string> = {
  admin: 'Administración',
  profesor: 'Profesor',
  alumno: 'Alumno',
  responsable: 'Mentor',
}

export function Layout({ title, subtitle, children, nav = [] }: LayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function goToLoginMenu() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="shell">
      <header className="topbar-lujan">
        <button type="button" className="topbar-brand" onClick={goToLoginMenu}>
          <img src={LOGO_URL} alt="" />
          <div>
            <strong>Colegio Nuestra Señora de Luján</strong>
            <span>Portal de pasantías</span>
          </div>
        </button>
        {nav.length > 0 && (
          <nav className="nav-lujan">
            {nav.map((item) => (
              <Link key={`${item.to}-${item.label}`} to={item.to}>
                {item.label}
                {item.badge && item.badge > 0 ? (
                  <span className="nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>
                ) : null}
              </Link>
            ))}
          </nav>
        )}
        <div className="user-chip-lujan">
          <div className="meta">
            <strong>{user?.name}</strong>
            <span>{roleLabel[user?.role ?? ''] ?? user?.role}</span>
          </div>
          <button type="button" className="btn-ghost-lujan" onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      <main className="main-lujan">
        <header className="page-head-lujan fade-in">
          <p className="eyebrow">{roleLabel[user?.role ?? ''] ?? 'Panel'}</p>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-sub">{subtitle}</p>}
        </header>
        <div className="fade-in">{children}</div>
      </main>
    </div>
  )
}
