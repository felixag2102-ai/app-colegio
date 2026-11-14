/*
  Hoja "¿Cómo te llamás?".
  Aparece sola la primera vez que se abre la app, y también al tocar
  el saludo "Hola, …" del Inicio para cambiar el nombre.
  El nombre se guarda en el celular (no queda escrito en el código).
*/
import { useEffect, useRef, useState } from 'react'
import HojaDeAbajo from '../../componentes/HojaDeAbajo'

export default function TuNombre({ abierta, nombreActual, onGuardar, onCerrar }) {
  const [texto, setTexto] = useState('')
  const campo = useRef(null)
  const primeraVez = !nombreActual

  useEffect(() => {
    if (!abierta) return
    setTexto(nombreActual || '')
    const t = setTimeout(() => campo.current && campo.current.focus(), 420)
    return () => clearTimeout(t)
  }, [abierta, nombreActual])

  const guardar = () => {
    const limpio = texto.trim().slice(0, 30)
    if (limpio) onGuardar(limpio)
  }

  return (
    <HojaDeAbajo
      abierta={abierta}
      onCerrar={onCerrar}
      etiqueta="Tu nombre"
      encabezado={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {primeraVez ? '¡Hola! ¿Cómo te llamás?' : 'Cambiar tu nombre'}
          </h2>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B', lineHeight: 1.4 }}>
            Lo uso para saludarte. Se guarda solo en este dispositivo.
          </span>
        </div>
      }
    >
      <input
        ref={campo}
        className="campo"
        type="text"
        value={texto}
        maxLength={30}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') guardar() }}
        placeholder="Tu nombre o apodo"
        aria-label="Tu nombre"
        autoComplete="given-name"
      />
      <div className="fila-botones">
        <button className="btn-gris" onClick={onCerrar}>{primeraVez ? 'Ahora no' : 'Cancelar'}</button>
        <button className={'btn-principal' + (texto.trim() ? '' : ' apagado')} onClick={guardar}>Listo</button>
      </div>
    </HojaDeAbajo>
  )
}
