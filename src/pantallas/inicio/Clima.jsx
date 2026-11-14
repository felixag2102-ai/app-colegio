/*
  Tarjeta del CLIMA (datos reales de Open-Meteo, para Buenos Aires).
  El dibujo cambia según el cielo: sol, nubes, lluvia, tormenta, niebla o luna de noche.
*/
import { useClima, CIUDAD } from '../../datos/clima'

const ESTILO_TARJETA = {
  borderRadius: 24, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, animationDelay: '0.22s',
  border: '1px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(16px) saturate(160%)',
  WebkitBackdropFilter: 'blur(16px) saturate(160%)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 12px 28px rgba(30,40,80,0.10)',
}

export default function Clima() {
  const { clima, estado } = useClima()

  // Todavía no hay ningún dato (primera vez, cargando o sin internet)
  if (!clima) {
    return (
      <section aria-label="Clima" className="entra" style={ESTILO_TARJETA}>
        <Dibujo tipo="nubes" deDia />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{estado === 'error' ? 'Sin conexión' : 'Cargando el clima…'}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#3B404B' }}>
            {estado === 'error' ? 'Conectate a internet para ver el clima' : CIUDAD.nombre}
          </span>
        </div>
      </section>
    )
  }

  const horas = [{ hora: 'Ahora', temp: clima.temp }].concat(clima.proximas)
  const act = new Date(clima.actualizado)
  const textoAbajo = estado === 'viejo'
    ? 'Sin conexión · dato de las ' + act.getHours() + ':' + String(act.getMinutes()).padStart(2, '0')
    : 'Máx ' + clima.max + '° · Mín ' + clima.min + '°'

  return (
    <section aria-label={'Clima en ' + CIUDAD.nombre + ': ' + clima.temp + ' grados, ' + clima.texto} className="entra" style={ESTILO_TARJETA}>
      <Dibujo tipo={clima.dibujo} deDia={clima.deDia} />
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
        <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{clima.temp}°</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2B2F38', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clima.texto}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: estado === 'viejo' ? '#9A3C00' : '#3B404B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{textoAbajo}</span>
      </div>
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {horas.map((h, i) => (
          <div key={h.hora} style={{ width: 36, padding: '6px 0', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: i === 1 ? 'rgba(21,23,28,0.06)' : undefined }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#3B404B' }}>{h.hora}</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{h.temp}°</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------- Dibujos animados del clima ----------

const NUBE = 'M14 39a6 6 0 0 1 1-11.9a9 9 0 0 1 17.3-2.6A7 7 0 0 1 40 39z'

function Sol({ x = 18, y = 18, r = 7.5 }) {
  return (
    <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'spin 24s linear infinite' }}>
      <circle cx={x} cy={y} r={r} fill="#F2A93B" />
      <path
        d={`M${x} ${y - 12.5}v3M${x} ${y + 9.5}v3M${x - 12.5} ${y}h3M${x + 9.5} ${y}h3M${x - 8.8} ${y - 8.8}l2.1 2.1M${x + 6.7} ${y + 6.7}l2.1 2.1M${x - 8.8} ${y + 8.8}l2.1-2.1M${x + 6.7} ${y - 6.7}l2.1-2.1`}
        stroke="#F2A93B" strokeWidth="2.2" strokeLinecap="round"
      />
    </g>
  )
}

function Luna({ x = 18, y = 18 }) {
  return <path d={`M${x + 4} ${y - 9}a9 9 0 1 0 6 13a7 7 0 0 1-6-13z`} fill="#8A93B8" />
}

function Nube({ gris = false }) {
  return (
    <g style={{ animation: 'cloud 6s ease-in-out infinite' }}>
      <path d={NUBE} fill={gris ? '#E4E7EE' : '#FFFFFF'} stroke="rgba(21,23,28,0.22)" strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  )
}

function Dibujo({ tipo, deDia }) {
  const astro = deDia ? <Sol /> : <Luna />
  let contenido
  if (tipo === 'sol') {
    contenido = deDia ? <Sol x={24} y={24} r={9} /> : <g transform="translate(24 24) scale(1.5) translate(-24 -24)"><Luna x={21} y={24} /></g>
  } else if (tipo === 'parcial') {
    contenido = <>{astro}<Nube /></>
  } else if (tipo === 'nubes') {
    contenido = (
      <>
        <g transform="translate(-7 -9) scale(0.8)" opacity="0.8">
          <path d={NUBE} fill="#E4E7EE" stroke="rgba(21,23,28,0.18)" strokeWidth="1.4" />
        </g>
        <Nube />
      </>
    )
  } else if (tipo === 'niebla') {
    contenido = (
      <g stroke="#8E93A0" strokeWidth="2.6" strokeLinecap="round" style={{ animation: 'cloud 5s ease-in-out infinite' }}>
        <path d="M8 18h30M12 26h28M8 34h26" />
      </g>
    )
  } else if (tipo === 'nieve') {
    contenido = (
      <>
        <Nube gris />
        <g fill="#8EA6E8">
          {[17, 25, 33].map((x, i) => <circle key={x} cx={x} cy="44" r="1.8" style={{ animation: `gota 1.6s ease-in ${i * 0.4}s infinite` }} />)}
        </g>
      </>
    )
  } else {
    // lluvia o tormenta
    contenido = (
      <>
        <Nube gris />
        <g stroke="#3D63F0" strokeWidth="2" strokeLinecap="round">
          {[17, 25, 33].map((x, i) => <path key={x} d={`M${x} 41l-1.5 4`} style={{ animation: `gota 0.9s linear ${i * 0.3}s infinite` }} />)}
        </g>
        {tipo === 'tormenta' && (
          <path d="M27 36l-4 6h4l-3 6" fill="none" stroke="#F2A93B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'rayo 2.4s ease-in-out infinite' }} />
        )}
      </>
    )
  }
  return (
    <svg width="50" height="50" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0, overflow: 'visible' }}>
      {contenido}
    </svg>
  )
}
