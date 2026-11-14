/*
  Hoja "Tu cuenta" / "¿Cómo te llamás?".
  Aparece sola la primera vez que se abre la app, y también al tocar
  el saludo "Hola, …" del Inicio.
  - Podés escribir tu nombre a mano, o
  - iniciar sesión con Google (toma tu nombre y tu foto de la cuenta).
  Todo se guarda solo en el celular.
*/
import { useEffect, useRef, useState } from 'react'
import HojaDeAbajo from '../../componentes/HojaDeAbajo'
import { useGuardado } from '../../datos/guardado'
import { cerrarSesion, googleDisponible, iniciarSesion, mensajeDeError } from '../../datos/google'

export default function TuNombre({ abierta, nombreActual, onGuardar, onCerrar }) {
  const [cuenta] = useGuardado('cuentaGoogle', null)
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const campo = useRef(null)
  const primeraVez = !nombreActual

  useEffect(() => {
    if (!abierta) return
    setTexto(nombreActual || '')
    setError('')
    // En la compu enfocamos el campo; si ya hay cuenta de Google no hace falta
    if (!cuenta) {
      const t = setTimeout(() => campo.current && campo.current.focus(), 420)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, nombreActual])

  const guardar = () => {
    const limpio = texto.trim().slice(0, 30)
    if (limpio) onGuardar(limpio)
  }

  const entrarConGoogle = async () => {
    setOcupado(true)
    setError('')
    try {
      const c = await iniciarSesion()
      onGuardar((c.nombreCorto || texto.trim() || 'Hola').slice(0, 30))
    } catch (err) {
      setError(mensajeDeError(err))
    }
    setOcupado(false)
  }

  const salir = async () => {
    await cerrarSesion()
  }

  return (
    <HojaDeAbajo
      abierta={abierta}
      onCerrar={onCerrar}
      etiqueta="Tu cuenta"
      encabezado={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {cuenta ? 'Tu cuenta' : primeraVez ? '¡Hola! ¿Cómo te llamás?' : 'Cambiar tu nombre'}
          </h2>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B', lineHeight: 1.4 }}>
            {cuenta
              ? 'Iniciaste sesión con Google. Tus datos de la app siguen guardados solo en este celular.'
              : 'Lo uso para saludarte. Se guarda solo en este dispositivo.'}
          </span>
        </div>
      }
    >
      {cuenta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, background: '#F2F3F7' }}>
          {cuenta.foto
            ? <img src={cuenta.foto} alt="" referrerPolicy="no-referrer" style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover', flexShrink: 0 }} />
            : <span style={{ width: 44, height: 44, borderRadius: 22, background: '#3D63F0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{(cuenta.nombre || '?').charAt(0)}</span>}
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flexGrow: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cuenta.nombre}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#3B404B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cuenta.email}</span>
          </span>
          <button onClick={salir} style={{ flexShrink: 0, minHeight: 36, padding: '0 12px', borderRadius: 18, border: '1.5px solid rgba(21,23,28,0.14)', background: '#FFFFFF', color: '#15171C', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Cerrar sesión
          </button>
        </div>
      )}

      {!cuenta && googleDisponible() && (
        <>
          <button
            onClick={entrarConGoogle}
            disabled={ocupado}
            style={{ minHeight: 52, borderRadius: 18, border: '1.5px solid rgba(21,23,28,0.14)', background: '#FFFFFF', color: '#15171C', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: ocupado ? 0.6 : 1 }}
          >
            <LogoGoogle />
            {ocupado ? 'Conectando con Google…' : 'Iniciar sesión con Google'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8E93A0', fontSize: 12, fontWeight: 600 }}>
            <span style={{ flexGrow: 1, height: 1, background: 'rgba(21,23,28,0.1)' }} />o escribilo vos<span style={{ flexGrow: 1, height: 1, background: 'rgba(21,23,28,0.1)' }} />
          </div>
        </>
      )}

      {error && <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, padding: '10px 12px', borderRadius: 14, color: '#9E1F17', background: 'rgba(217,58,43,0.12)' }}>{error}</span>}

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

// La "G" de colores de Google
function LogoGoogle() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
