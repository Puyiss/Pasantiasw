const LOGO_URL = '/logo-lujan.jpg'

export function CollegeBanner({ compact = false }: { compact?: boolean }) {
  if (compact) return null
  return (
    <header className="college-banner fade-in">
      <img
        className="college-logo"
        src={LOGO_URL}
        alt="Logo Colegio Nuestra Señora de Luján"
      />
      <h1 className="college-name">Colegio Nuestra Señora de Luján</h1>
      <p className="college-sub">Portal oficial de pasantías</p>
    </header>
  )
}

export { LOGO_URL }
