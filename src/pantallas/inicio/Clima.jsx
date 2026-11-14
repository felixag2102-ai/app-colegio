/*
  Tarjeta del CLIMA.
  Por ahora muestra números de ejemplo (fijos).
  En la Etapa 4 la conectamos a Open-Meteo para tener el clima real.
*/
export default function Clima() {
  return (
    <section
      aria-label="Clima"
      className="entra"
      style={{
        borderRadius: 24, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, animationDelay: '0.22s',
        border: '1px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 12px 28px rgba(30,40,80,0.10)',
      }}
    >
      <svg width="50" height="50" viewBox="0 0 48 48" role="img" aria-label="Algo nublado" style={{ flexShrink: 0, overflow: 'visible' }}>
        <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'spin 24s linear infinite' }}>
          <circle cx="18" cy="18" r="7.5" fill="#F2A93B" />
          <path d="M18 5.5v3M18 27.5v3M5.5 18h3M27.5 18h3M9.2 9.2l2.1 2.1M24.7 24.7l2.1 2.1M9.2 26.8l2.1-2.1M24.7 11.3l2.1-2.1" stroke="#F2A93B" strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <g style={{ animation: 'cloud 6s ease-in-out infinite' }}>
          <path d="M14 39a6 6 0 0 1 1-11.9a9 9 0 0 1 17.3-2.6A7 7 0 0 1 40 39z" fill="#FFFFFF" stroke="rgba(21,23,28,0.22)" strokeWidth="1.4" strokeLinejoin="round" />
        </g>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
        <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>19°</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2B2F38' }}>Algo nublado</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9A3C00' }}>Clima de ejemplo</span>
      </div>
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {[['Ahora', '19°'], ['18 h', '21°'], ['21 h', '17°']].map(([hora, temp], i) => (
          <div key={hora} style={{ width: 34, padding: '6px 0', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: i === 1 ? 'rgba(21,23,28,0.06)' : undefined }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#3B404B' }}>{hora}</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{temp}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
