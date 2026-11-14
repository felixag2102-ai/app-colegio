/*
  Menú de abajo con 5 secciones.
  La burbuja negra se desliza a la sección elegida.
  También se puede arrastrar el dedo por el menú: la burbuja sigue al dedo
  y al soltar te lleva a esa sección.
*/
import { useRef, useState } from 'react'
import * as Icono from './Iconos'

const SECCIONES = [
  { nombre: 'Inicio', Icono: Icono.Casa },
  { nombre: 'Agenda', Icono: Icono.Calendario },
  { nombre: 'Boletín', Icono: Icono.Barras },
  { nombre: 'Apuntes', Icono: Icono.Carpeta },
  { nombre: 'Ideas', Icono: Icono.Lamparita },
]

export default function MenuAbajo({ actual, onIr }) {
  const menu = useRef(null)
  const arrastre = useRef({ activo: false })
  const bloquearClic = useRef(false)
  const [encima, setEncima] = useState(null) // sección bajo el dedo mientras arrastrás

  // ¿Qué sección hay en la posición x de la pantalla?
  const seccionEn = (x) => {
    const r = menu.current.getBoundingClientRect()
    const ancho = (r.width - 14) / 5
    return Math.max(0, Math.min(4, Math.floor((x - r.left - 7) / ancho)))
  }

  const alApoyar = (e) => {
    arrastre.current = { activo: true, movido: false, x0: e.clientX, id: e.pointerId, el: e.currentTarget, encima: null }
  }
  const alMover = (e) => {
    const a = arrastre.current
    if (!a.activo) return
    if (!a.movido) {
      if (Math.abs(e.clientX - a.x0) < 10) return
      a.movido = true
      try { a.el.setPointerCapture(a.id) } catch (err) { /* nada */ }
    }
    const i = seccionEn(e.clientX)
    if (i !== a.encima) {
      a.encima = i
      setEncima(i)
    }
  }
  const alSoltar = () => {
    const a = arrastre.current
    if (!a.activo) return
    a.activo = false
    if (!a.movido) return
    const i = a.encima === null ? actual : a.encima
    setEncima(null)
    bloquearClic.current = true
    setTimeout(() => { bloquearClic.current = false }, 0)
    onIr(i)
  }
  const alCancelar = () => {
    arrastre.current.activo = false
    setEncima(null)
  }

  const arrastrando = encima !== null
  const marcada = arrastrando ? encima : actual

  return (
    <nav
      ref={menu}
      aria-label="Secciones"
      onPointerDown={alApoyar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alCancelar}
      style={{
        position: 'relative', flexShrink: 0, margin: '12px 14px calc(16px + var(--abajo)) 14px', borderRadius: 32, padding: 7,
        display: 'flex', justifyContent: 'space-between', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
        border: '1px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(16px) saturate(170%)', WebkitBackdropFilter: 'blur(16px) saturate(170%)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), inset 0 -1px 1px rgba(255,255,255,0.35), 0 14px 34px rgba(30,40,80,0.16)',
      }}
    >
      {/* La burbuja negra */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', zIndex: 0, top: 7, bottom: 7, left: 7, width: 'calc((100% - 14px) / 5)', borderRadius: 25,
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 6px 16px rgba(21,23,28,0.3)', pointerEvents: 'none',
          transform: 'translateX(' + marcada * 100 + '%)' + (arrastrando ? ' scale(1.06, 1.1)' : ''),
          transition: arrastrando
            ? 'transform 0.3s cubic-bezier(.22,1,.36,1), background 0.3s'
            : 'transform 0.5s cubic-bezier(.34,1.35,.64,1), background 0.3s',
          background: arrastrando ? 'rgba(21,23,28,0.78)' : '#15171C',
        }}
      />
      {SECCIONES.map((s, i) => (
        <button
          key={s.nombre}
          onClick={() => { if (!bloquearClic.current && i !== actual) onIr(i) }}
          aria-current={i === actual ? 'page' : undefined}
          style={{
            position: 'relative', zIndex: 1, flex: '1 1 0', minHeight: 56, borderRadius: 25, border: 'none', background: 'transparent',
            padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'color 0.3s',
            color: i === marcada ? '#FFFFFF' : '#2B2F38',
          }}
        >
          <s.Icono
            tam={21}
            grosor={2}
            estilo={{
              transition: 'transform 0.4s cubic-bezier(.34,1.45,.64,1)',
              transform: i === marcada ? 'scale(1.12) translateY(-1px)' : 'scale(1)',
            }}
          />
          {s.nombre}
        </button>
      ))}
    </nav>
  )
}
