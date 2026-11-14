/*
  Texto que se desliza solo hacia la izquierda cuando no entra
  (como los títulos largos de las tarjetas del Inicio).
  Si el texto entra, se muestra quieto.
*/
import { useLayoutEffect, useRef, useState } from 'react'

const MASCARA = {
  WebkitMaskImage: 'linear-gradient(90deg,#000 0,#000 86%,transparent)',
  maskImage: 'linear-gradient(90deg,#000 0,#000 86%,transparent)',
}

export default function TextoQueCorre({ texto, children }) {
  const caja = useRef(null)
  const medida = useRef(null)
  const [largo, setLargo] = useState(false)

  useLayoutEffect(() => {
    const medir = () => {
      const c = caja.current
      const m = medida.current
      if (!c || !m || !c.clientWidth) return
      setLargo(m.offsetWidth > c.clientWidth + 1)
    }
    medir()
    let observador
    if (window.ResizeObserver) {
      observador = new ResizeObserver(medir)
      observador.observe(caja.current)
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir)
    return () => observador && observador.disconnect()
  }, [texto])

  const contenido = children || texto
  const duracion = Math.max(7, String(texto || '').length * 0.32).toFixed(1)

  return (
    <span ref={caja} style={{ display: 'block', overflow: 'hidden', whiteSpace: 'nowrap', ...(largo ? MASCARA : null) }}>
      <span style={{ display: 'inline-flex', whiteSpace: 'nowrap', animation: largo ? 'marquee ' + duracion + 's linear infinite' : undefined }}>
        <span style={{ paddingRight: largo ? 48 : 0 }}>
          <span ref={medida}>{contenido}</span>
        </span>
        {largo && <span aria-hidden="true" style={{ paddingRight: 48 }}>{contenido}</span>}
      </span>
    </span>
  )
}
