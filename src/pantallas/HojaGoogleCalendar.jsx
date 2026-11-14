/*
  Hoja de GOOGLE CALENDAR (se abre tocando el cartelito de arriba de la Agenda).
  - Sin conectar: botón "Conectar Google Calendar".
  - Conectado: cuántos eventos trajo, cuándo, "Actualizar" y "Desconectar".
  La app SOLO LEE el calendario: no puede cambiar ni borrar nada en Google.
*/
import { useEffect, useState } from 'react'
import HojaDeAbajo from '../componentes/HojaDeAbajo'
import { desconectarCalendar, mensajeCalendar, sincronizarCalendar } from '../datos/calendario'
import { googleDisponible } from '../datos/google'
import { pad2 } from '../utilidades/fechas'

function haceCuanto(ms) {
  const min = Math.round((Date.now() - ms) / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return 'hace ' + min + ' min'
  const d = new Date(ms)
  return 'el ' + d.getDate() + '/' + (d.getMonth() + 1) + ' a las ' + d.getHours() + ':' + pad2(d.getMinutes())
}

export default function HojaGoogleCalendar({ abierta, onCerrar, google, onListo }) {
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (abierta) setError('') }, [abierta])

  const sincronizar = async () => {
    setOcupado(true)
    setError('')
    try {
      const r = await sincronizarCalendar()
      onCerrar()
      onListo(r.eventos.length === 1 ? 'Traje 1 evento de Google Calendar' : 'Traje ' + r.eventos.length + ' eventos de Google Calendar')
    } catch (err) {
      setError(mensajeCalendar(err))
    }
    setOcupado(false)
  }

  const boton = (principal) => ({
    minHeight: 52, borderRadius: 18, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: ocupado ? 0.6 : 1,
    ...(principal ? { border: 'none', background: '#15171C', color: '#FFFFFF' } : { border: '1.5px solid rgba(21,23,28,0.14)', background: '#FFFFFF', color: '#15171C' }),
  })

  return (
    <HojaDeAbajo
      abierta={abierta}
      onCerrar={onCerrar}
      etiqueta="Google Calendar"
      separacion={12}
      encabezado={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Google Calendar</h2>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B', lineHeight: 1.4 }}>
            {google
              ? 'Tus eventos de Google aparecen en la Agenda y en el Inicio con una "G". La app solo los lee: para cambiarlos, usá Google Calendar.'
              : 'Mostrá en la app los eventos de tu Google Calendar (de un mes atrás a tres meses adelante). La app solo los lee: no puede cambiar ni borrar nada.'}
          </span>
        </div>
      }
    >
      {!googleDisponible() && (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#9A3C00' }}>Falta configurar el inicio de sesión con Google.</span>
      )}

      {google && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, background: 'rgba(20,163,127,0.10)' }}>
          <span style={{ width: 9, height: 9, borderRadius: 5, background: '#14A37F', flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0B5E48' }}>
            {google.eventos.length} {google.eventos.length === 1 ? 'evento' : 'eventos'} · actualizado {haceCuanto(google.actualizado)}
          </span>
        </div>
      )}

      {googleDisponible() && (
        <button style={boton(true)} onClick={sincronizar} disabled={ocupado}>
          {ocupado ? 'Conectando con Google…' : google ? 'Actualizar ahora' : 'Conectar Google Calendar'}
        </button>
      )}

      {google && (
        <button style={boton(false)} disabled={ocupado} onClick={() => { desconectarCalendar(); onCerrar(); onListo('Desconectaste Google Calendar') }}>
          Desconectar
        </button>
      )}

      {error && <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, padding: '10px 12px', borderRadius: 14, color: '#9E1F17', background: 'rgba(217,58,43,0.12)' }}>{error}</span>}
    </HojaDeAbajo>
  )
}
