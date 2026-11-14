/*
  Reloj redondo para elegir la hora (como el de Android).
  Primero elegís la hora (afuera 1–12, adentro 13–00) y solo pasa a los minutos.
  Si le pasás "dias", arriba muestra una semana para elegir también el día.

  Uso:
    <RelojElegir abierto={...} titulo="Elegí la hora" inicial={{ h: 17, m: 30 }}
      onListo={(dia, h, m) => ...} onCancelar={() => ...} />
*/
import { useEffect, useRef, useState } from 'react'
import { usePresencia } from './usePresencia'
import { pad2 } from '../utilidades/fechas'
import { conAlfa } from '../utilidades/colores'

const C = 118 // centro del reloj
const R_AFUERA = 96
const R_ADENTRO = 62

export default function RelojElegir({ abierto, titulo = 'Elegí la hora', color = '#15171C', dias, inicial, onListo, onCancelar }) {
  const { visible, saliendo } = usePresencia(abierto, 230)
  const [modo, setModo] = useState('h') // 'h' = horas, 'm' = minutos
  const [h, setH] = useState(20)
  const [m, setM] = useState(0)
  const [dia, setDia] = useState(0)
  const [anim, setAnim] = useState(0)
  const dial = useRef(null)
  const arrastrando = useRef(false)
  const temporizador = useRef(null)
  const modoActual = useRef('h')

  useEffect(() => {
    if (!abierto) return
    setModo('h')
    modoActual.current = 'h'
    setH(inicial?.h ?? 20)
    setM(inicial?.m ?? 0)
    setDia(inicial?.dia ?? 0)
    setAnim(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  useEffect(() => () => clearTimeout(temporizador.current), [])

  if (!visible) return null

  const cambiarModo = (nuevo) => {
    modoActual.current = nuevo
    setModo(nuevo)
    setAnim((a) => a + 1)
  }

  // Después de elegir la hora, a los 0,3 s pasa solo a los minutos
  const pasarAMinutos = () => {
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => {
      if (modoActual.current === 'h') cambiarModo('m')
    }, 320)
  }

  // Calcula qué número tocaste según el ángulo del dedo
  const desdePunto = (e) => {
    const r = dial.current.getBoundingClientRect()
    const k = r.width / 236 || 1
    const dx = (e.clientX - r.left) / k - C
    const dy = (e.clientY - r.top) / k - C
    let angulo = (Math.atan2(dx, -dy) * 180) / Math.PI
    if (angulo < 0) angulo += 360
    const i = Math.round(angulo / 30) % 12
    if (modoActual.current === 'h') {
      const adentro = Math.sqrt(dx * dx + dy * dy) < 79
      setH(adentro ? (i === 0 ? 0 : i + 12) : i === 0 ? 12 : i)
    } else {
      setM(i * 5)
    }
  }

  const esHora = modo === 'h'
  const numeros = []
  const agregarNumero = (valor, i, radio, adentro) => {
    const ang = (i * 30 * Math.PI) / 180
    const x = C + radio * Math.sin(ang)
    const y = C - radio * Math.cos(ang)
    const tam = adentro ? 32 : 38
    const elegido = esHora ? h === valor : m === valor
    numeros.push(
      <button
        key={(adentro ? 'a' : 'b') + valor}
        aria-label={esHora ? valor + ' horas' : valor + ' minutos'}
        aria-pressed={elegido}
        onClick={() => {
          if (esHora) { setH(valor); pasarAMinutos() } else setM(valor)
        }}
        style={{
          position: 'absolute', left: x - tam / 2, top: y - tam / 2, width: tam, height: tam, borderRadius: '50%', border: 'none', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontVariantNumeric: 'tabular-nums', cursor: 'pointer',
          transition: 'background 0.2s, color 0.2s', fontSize: adentro ? 12 : 15,
          background: elegido ? color : 'transparent', color: elegido ? '#FFFFFF' : adentro ? '#4A4F5A' : '#15171C',
        }}
      >
        {esHora ? (adentro ? pad2(valor) : String(valor)) : pad2(valor)}
      </button>
    )
  }
  if (esHora) {
    for (let i = 0; i < 12; i++) agregarNumero(i === 0 ? 12 : i, i, R_AFUERA, false)
    for (let j = 0; j < 12; j++) agregarNumero(j === 0 ? 0 : j + 12, j, R_ADENTRO, true)
  } else {
    for (let q = 0; q < 12; q++) agregarNumero(q * 5, q, R_AFUERA, false)
  }
  const radio = esHora ? (h >= 1 && h <= 12 ? R_AFUERA : R_ADENTRO) : R_AFUERA
  const angulo = esHora ? (h % 12) * 30 : m * 6
  const textoListo = 'Listo · ' + (dias ? dias[dia].completo + ' ' : '') + h + ':' + pad2(m)

  const estiloNumeroGrande = (activo) => ({
    minWidth: 88, height: 66, borderRadius: 18, border: 'none', padding: '0 8px', fontSize: 46, fontWeight: 600, letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums', cursor: 'pointer', transition: 'background 0.25s, color 0.25s',
    background: activo ? conAlfa(color, 0.12) : 'transparent', color: activo ? color : '#15171C',
  })

  return (
    <div className="capa" style={{ zIndex: 120, display: 'flex', alignItems: 'center', padding: 16 }}>
      <button className={'velo' + (saliendo ? ' sale-fade' : '')} onClick={onCancelar} aria-label="Cerrar sin guardar" style={{ background: 'rgba(15,17,22,0.32)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', animation: saliendo ? undefined : 'aiFade 0.2s ease-out both' }} />
      <div
        role="dialog"
        aria-label={titulo}
        className={saliendo ? 'sale-pop' : ''}
        style={{
          position: 'relative', width: '100%', padding: 18, borderRadius: 32, display: 'flex', flexDirection: 'column', gap: 14,
          border: '1px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px) saturate(170%)',
          WebkitBackdropFilter: 'blur(20px) saturate(170%)', boxShadow: '0 30px 70px rgba(20,24,40,0.35)',
          animation: saliendo ? undefined : 'clkPop 0.38s cubic-bezier(.34,1.3,.64,1) both',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>{titulo}</h2>

        {dias && (
          <div role="group" aria-label="Día" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
            {dias.map((d, i) => (
              <button
                key={i}
                onClick={() => setDia(i)}
                aria-pressed={i === dia}
                aria-label={d.completo}
                style={{
                  minHeight: 58, borderRadius: 16, border: 'none', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 3, cursor: 'pointer', transition: 'background 0.25s, color 0.25s, transform 0.2s',
                  ...(i === dia ? { background: color, color: '#FFFFFF', transform: 'scale(1.04)' } : { background: '#F0F1F5', color: '#15171C' }),
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600 }}>{d.corto}</span>
                <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{d.numero}</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <button onClick={() => cambiarModo('h')} aria-label="Elegir la hora" aria-pressed={esHora} style={estiloNumeroGrande(esHora)}>{pad2(h)}</button>
          <span aria-hidden="true" style={{ fontSize: 42, fontWeight: 600, color: '#15171C', paddingBottom: 6 }}>:</span>
          <button onClick={() => cambiarModo('m')} aria-label="Elegir los minutos" aria-pressed={!esHora} style={estiloNumeroGrande(!esHora)}>{pad2(m)}</button>
        </div>

        <div
          ref={dial}
          onPointerDown={(e) => {
            arrastrando.current = true
            try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) { /* nada */ }
            desdePunto(e)
          }}
          onPointerMove={(e) => { if (arrastrando.current) desdePunto(e) }}
          onPointerUp={() => {
            if (!arrastrando.current) return
            arrastrando.current = false
            if (modoActual.current === 'h') pasarAMinutos()
          }}
          onPointerCancel={() => { arrastrando.current = false }}
          style={{
            position: 'relative', width: 236, height: 236, margin: '0 auto', flexShrink: 0, borderRadius: '50%', background: '#F0F1F5',
            boxShadow: 'inset 0 2px 10px rgba(21,23,28,0.07)', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer',
          }}
        >
          {/* La aguja */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', left: 117, width: 2, borderRadius: 1, transformOrigin: '50% 100%', background: color,
              transition: 'transform 0.35s cubic-bezier(.34,1.3,.64,1), height 0.3s ease, top 0.3s ease',
              top: C - radio + 19, height: radio - 19, transform: 'rotate(' + angulo + 'deg)',
            }}
          />
          <span aria-hidden="true" style={{ position: 'absolute', left: 114, top: 114, width: 8, height: 8, borderRadius: 4, background: color }} />
          <div key={anim} style={{ position: 'absolute', inset: 0, animation: anim ? 'clkA 0.3s ease-out' : undefined }}>
            {numeros}
          </div>
        </div>

        <span style={{ textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#3B404B' }}>
          {esHora ? 'Tocá o arrastrá para elegir la hora' : 'Ahora elegí los minutos'}
        </span>
        <div className="fila-botones">
          <button className="btn-gris" onClick={onCancelar} style={{ background: '#E9EAEF', minHeight: 50 }}>Cancelar</button>
          <button className="btn-principal" onClick={() => onListo(dia, h, m)} style={{ minHeight: 50, fontWeight: 600 }}>{textoListo}</button>
        </div>
      </div>
    </div>
  )
}
