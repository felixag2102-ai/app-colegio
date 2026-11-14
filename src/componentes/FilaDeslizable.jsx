/*
  Fila que se borra deslizándola hacia la izquierda.
  Mientras la deslizás aparece un fondo rojo que dice "Eliminar".
  Si la soltás después de 90 px, se va y se llama a onBorrar.
*/
import { useRef, useState } from 'react'
import * as Icono from './Iconos'

export default function FilaDeslizable({
  habilitada = true,
  onBorrar,
  children,
  estilo,
  estiloFrente,
  margenRojo = 5, // espacio arriba y abajo del fondo rojo
  radioRojo = 14,
}) {
  const [dx, setDx] = useState(0)
  const [capturado, setCapturado] = useState(false)
  const [ida, setIda] = useState(false)
  const a = useRef({ activo: false })
  const recienMovida = useRef(false)

  const alApoyar = (e) => {
    if (!habilitada || ida) return
    a.current = { activo: true, x0: e.clientX, y0: e.clientY, id: e.pointerId, el: e.currentTarget, capturado: false, dx: 0 }
  }
  const alMover = (e) => {
    const s = a.current
    if (!s.activo) return
    const d = e.clientX - s.x0
    if (!s.capturado) {
      if (Math.abs(e.clientY - s.y0) > 12 && Math.abs(e.clientY - s.y0) > Math.abs(d)) { s.activo = false; return }
      if (d > -10) return
      s.capturado = true
      setCapturado(true)
      try { s.el.setPointerCapture(s.id) } catch (err) { /* nada */ }
    }
    s.dx = Math.min(0, d)
    setDx(s.dx)
  }
  const alSoltar = () => {
    const s = a.current
    if (!s.activo) return
    s.activo = false
    if (!s.capturado) return
    setCapturado(false)
    recienMovida.current = true
    setTimeout(() => { recienMovida.current = false }, 0)
    if (s.dx < -90) {
      setIda(true)
      setTimeout(onBorrar, 280)
    } else {
      setDx(0)
    }
  }

  const sinTransicion = capturado
  const frente = ida
    ? { transform: 'translateX(-105%)', opacity: 0, transition: 'transform 0.28s ease-in, opacity 0.28s ease-in' }
    : { transform: 'translateX(' + dx + 'px)', transition: sinTransicion ? 'none' : 'transform 0.32s cubic-bezier(.22,1,.36,1)' }
  const anchoRojo = ida ? '100%' : Math.max(0, -dx) + 'px'

  return (
    <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, ...estilo }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: margenRojo, bottom: margenRojo, right: 0, borderRadius: radioRojo, background: '#D93A2B', color: '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden', whiteSpace: 'nowrap',
          fontSize: 13, fontWeight: 600, width: anchoRojo, transition: sinTransicion ? 'none' : 'width 0.32s cubic-bezier(.22,1,.36,1)',
        }}
      >
        {(-dx > 70 || ida) && (
          <>
            <Icono.Basura tam={16} />
            Eliminar
          </>
        )}
      </div>
      <div
        onPointerDown={alApoyar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onClickCapture={(e) => {
          // Si recién deslizaste, no cuenta como un toque
          if (recienMovida.current) { e.stopPropagation(); e.preventDefault() }
        }}
        style={{ position: 'relative', touchAction: 'pan-y', ...estiloFrente, ...frente }}
      >
        {children}
      </div>
    </div>
  )
}
