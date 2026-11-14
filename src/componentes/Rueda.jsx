/*
  Rueda para elegir un valor, como la de las alarmas del iPhone.
  Se arrastra con el dedo, con la ruedita del mouse o con las flechas.
*/
import { useEffect, useRef, useState } from 'react'

const ALTO = 40 // alto de cada renglón

export default function Rueda({ etiquetas, indice, onElegir, ancho = 76, alinear = 'flex-end', etiquetaAria }) {
  const [desplazamiento, setDesplazamiento] = useState(indice * ALTO)
  const [arrastrando, setArrastrando] = useState(false)
  const r = useRef({ arrastrando: false, desp: indice * ALTO })
  const n = etiquetas.length
  const maximo = (n - 1) * ALTO

  // Si cambia el valor desde afuera, la rueda se acomoda
  useEffect(() => {
    if (r.current.arrastrando) return
    r.current.desp = indice * ALTO
    setDesplazamiento(indice * ALTO)
  }, [indice])

  const mover = (valor) => {
    r.current.desp = valor
    setDesplazamiento(valor)
  }

  // Al soltar, se acomoda en el renglón más cercano
  const acomodar = (objetivo) => {
    const i = Math.max(0, Math.min(n - 1, Math.round(objetivo / ALTO)))
    r.current.arrastrando = false
    setArrastrando(false)
    mover(i * ALTO)
    onElegir(i)
  }

  const alApoyar = (e) => {
    const caja = e.currentTarget.getBoundingClientRect()
    Object.assign(r.current, {
      k: caja.height / 200 || 1, arriba: caja.top, arrastrando: true, movido: false,
      y0: e.clientY, d0: r.current.desp, v: 0, ultimaY: e.clientY, ultimoT: Date.now(),
    })
    setArrastrando(true)
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) { /* nada */ }
  }
  const alMover = (e) => {
    const s = r.current
    if (!s.arrastrando) return
    const dy = (e.clientY - s.y0) / s.k
    if (Math.abs(dy) > 3) s.movido = true
    let d = s.d0 - dy
    if (d < 0) d = d / 3 // se pone "dura" al pasarse del borde
    if (d > maximo) d = maximo + (d - maximo) / 3
    const ahora = Date.now()
    const dt = ahora - s.ultimoT
    if (dt > 0) s.v = (s.ultimaY - e.clientY) / s.k / dt
    s.ultimaY = e.clientY
    s.ultimoT = ahora
    mover(d)
  }
  const alSoltar = (e) => {
    const s = r.current
    if (!s.arrastrando) return
    if (!s.movido) {
      // un toque: elige el renglón tocado
      acomodar(s.desp + ((e.clientY - s.arriba) / s.k - 100))
      return
    }
    const v = Date.now() - s.ultimoT > 90 ? 0 : s.v
    acomodar(s.desp + Math.max(-120, Math.min(120, v * 90)))
  }
  const alRuedita = (e) => {
    const ahora = Date.now()
    if (r.current.ultimaRuedita && ahora - r.current.ultimaRuedita < 110) return
    r.current.ultimaRuedita = ahora
    acomodar(Math.round(r.current.desp / ALTO) * ALTO + (e.deltaY > 0 ? ALTO : -ALTO))
  }
  const alTecla = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); acomodar(r.current.desp + ALTO) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); acomodar(r.current.desp - ALTO) }
  }

  const transicion = arrastrando ? 'none' : 'transform 0.4s cubic-bezier(.22,1,.36,1), opacity 0.4s, color 0.4s'

  return (
    <div
      onPointerDown={alApoyar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      onWheel={alRuedita}
      onKeyDown={alTecla}
      tabIndex={0}
      role="slider"
      aria-label={etiquetaAria}
      aria-valuetext={etiquetas[indice]}
      style={{
        position: 'relative', zIndex: 1, width: ancho, height: 200, overflow: 'hidden', touchAction: 'none', userSelect: 'none',
        WebkitUserSelect: 'none', cursor: 'grab', outlineOffset: -3, borderRadius: 14,
        WebkitMaskImage: 'linear-gradient(transparent, #000 32%, #000 68%, transparent)',
        maskImage: 'linear-gradient(transparent, #000 32%, #000 68%, transparent)',
      }}
    >
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: 'translateY(' + (80 - desplazamiento).toFixed(1) + 'px)', transition: arrastrando ? 'none' : 'transform 0.4s cubic-bezier(.22,1,.36,1)' }}>
        {etiquetas.map((t, i) => {
          const d = i - desplazamiento / ALTO
          const ad = Math.min(Math.abs(d), 3)
          return (
            <div
              key={t}
              style={{
                height: ALTO, display: 'flex', alignItems: 'center', justifyContent: alinear, padding: '0 6px', fontSize: 27, fontWeight: 600,
                fontVariantNumeric: 'tabular-nums', pointerEvents: 'none', transition: transicion,
                transform: 'perspective(320px) rotateX(' + (-d * 24).toFixed(1) + 'deg) scale(' + (1 - ad * 0.06).toFixed(3) + ')',
                opacity: Math.max(0.2, 1 - ad * 0.34).toFixed(2), color: ad < 0.5 ? '#15171C' : '#4A4F5A',
              }}
            >
              {t}
            </div>
          )
        })}
      </div>
    </div>
  )
}
