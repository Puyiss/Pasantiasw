const LOGO_URL = '/logo-lujan.jpg'

interface CollegeBannerProps {
  compact?: boolean
  onLogoClick?: () => void
}

export function CollegeBanner({ compact = false, onLogoClick }: CollegeBannerProps) {
  if (compact) return null
  return (
    <header className="college-banner fade-in">
      {onLogoClick ? (
        <button type="button" className="college-logo-btn" onClick={onLogoClick} aria-label="Ir al inicio">
          <img
            className="college-logo"
            src={LOGO_URL}
            alt="Logo Colegio Nuestra Señora de Luján"
          />
        </button>
      ) : (
        <img
          className="college-logo"
          src={LOGO_URL}
          alt="Logo Colegio Nuestra Señora de Luján"
        />
      )}
      <h1 className="college-name">Colegio Nuestra Señora de Luján</h1>
      <p className="college-sub">Portal oficial de pasantías</p>
    </header>
  )
}

export { LOGO_URL }
