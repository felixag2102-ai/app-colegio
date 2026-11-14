/*
  "Hoja de abajo": el panel que sube desde abajo (para agregar un evento,
  cargar una nota, etc.). Se cierra:
    - tocando afuera,
    - con un botón que llame a onCerrar,
    - o deslizándola hacia abajo desde la parte de arriba (la "manija").

  Uso:
    <HojaDeAbajo abierta={abierta} onCerrar={() => setAbierta(false)}
      encabezado={<h2>Título</h2>}>
      ...contenido...
    </HojaDeAbajo>
*/
import { useEffect, useRef, useState } from 'react'
import { usePresencia } from './usePresencia'

export default function HojaDeAbajo({
  abierta,
  onCerrar,
  encabezado,
  children,
  etiqueta,
  z = 90,
  velo = 'rgba(15,17,22,0.28)',
  blurVelo = 8,
  alturaMaxima,
  relleno = '10px 18px 24px 18px',
  separacion = 14,
  fondo = 'rgba(255,255,255,0.95)',
  bloqueada = false, // true = no se puede cerrar (por ejemplo, mientras sube un archivo)
}) {
  const { visible, saliendo } = usePresencia(abierta, 270)
  const [y, setY] = useState(0) // cuánto la bajaste con el dedo
  const [arrastrando, setArrastrando] = useState(false)
  const a = useRef({ activo: false })

  useEffect(() => {
    if (abierta) setY(0)
  }, [abierta])

  // En la compu: la tecla Escape también la cierra
  useEffect(() => {
    if (!abierta || bloqueada) return
    const tecla = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [abierta, bloqueada, onCerrar])

  if (!visible) return null

  const alApoyar = (e) => {
    if (bloqueada) return
    a.current = { activo: true, capturado: false, y0: e.clientY, id: e.pointerId, el: e.currentTarget, y: 0 }
  }
  const alMover = (e) => {
    const s = a.current
    if (!s.activo) return
    const dy = e.clientY - s.y0
    if (!s.capturado) {
      if (dy < 6) return
      s.capturado = true
      setArrastrando(true)
      try { s.el.setPointerCapture(s.id) } catch (err) { /* nada */ }
    }
    s.y = Math.max(0, dy)
    setY(s.y)
  }
  const alSoltar = () => {
    const s = a.current
    if (!s.activo) return
    s.activo = false
    if (!s.capturado) return
    setArrastrando(false)
    if (s.y > 90) onCerrar() // la bajaste bastante: se cierra
    else setY(0) // poquito: vuelve a su lugar
  }

  const estiloPanel = saliendo
    ? { transform: 'translateY(105%)', transition: 'transform 0.26s cubic-bezier(.4,0,1,1)' }
    : { transform: 'translateY(' + y + 'px)', transition: arrastrando ? 'none' : 'transform 0.35s cubic-bezier(.22,1,.36,1)' }

  const estiloVelo = saliendo
    ? { opacity: 0, transition: 'opacity 0.26s ease-in' }
    : y
      ? { opacity: Math.max(0.35, 1 - y / 420), transition: 'none' }
      : { transition: 'opacity 0.3s' }

  return (
    <div className="capa" style={{ zIndex: z }}>
      <button
        className="velo"
        onClick={() => { if (!bloqueada) onCerrar() }}
        aria-label="Cerrar"
        style={{ background: velo, backdropFilter: 'blur(' + blurVelo + 'px)', WebkitBackdropFilter: 'blur(' + blurVelo + 'px)', animation: 'aiFade 0.2s ease-out backwards', ...estiloVelo }}
      />
      <div
        role="dialog"
        aria-label={etiqueta}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: alturaMaxima || 'calc(100% - 40px)',
          padding: relleno, paddingBottom: 'calc(24px + var(--abajo))', borderRadius: '32px 32px 0 0', background: fondo,
          backdropFilter: 'blur(30px) saturate(170%)', WebkitBackdropFilter: 'blur(30px) saturate(170%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 -20px 50px rgba(20,24,40,0.24)',
          display: 'flex', flexDirection: 'column', gap: separacion,
          animation: 'edUp 0.4s cubic-bezier(.22,1,.36,1) backwards', ...estiloPanel,
        }}
      >
        {/* Zona de arriba: desde acá se arrastra para cerrar */}
        <div
          onPointerDown={alApoyar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '-10px 0 0 0', paddingTop: 10, touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none', flexShrink: 0 }}
        >
          <span aria-hidden="true" className="manija" />
          {encabezado}
        </div>
        {children}
      </div>
    </div>
  )
}
