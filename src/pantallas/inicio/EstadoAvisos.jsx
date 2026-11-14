/*
  Renglón de NOTIFICACIONES dentro del panel de Recordatorios.
  - Apagadas: botón "Avisarme con notificaciones".
  - Prendidas: "Notificaciones activadas", con "Probar" y "Apagar".
*/
import { useState } from 'react'
import { useGuardado } from '../../datos/guardado'
import { activarAvisos, avisosDisponibles, desactivarAvisos, mensajeAvisos, probarAviso } from '../../datos/avisos'
import * as Icono from '../../componentes/Iconos'

export default function EstadoAvisos() {
  const [avisos] = useGuardado('avisos', { activos: false })
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState(null) // { tipo: 'ok' | 'error', texto }

  if (!avisosDisponibles()) return null
  const activos = avisos && avisos.activos

  const hacer = async (accion, textoOk) => {
    setOcupado(true)
    setMensaje(null)
    try {
      await accion()
      if (textoOk) setMensaje({ tipo: 'ok', texto: textoOk })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeAvisos(err) })
    }
    setOcupado(false)
  }

  const chico = { minHeight: 32, padding: '0 10px', borderRadius: 16, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
      {!activos ? (
        <button
          onClick={() => hacer(activarAvisos, 'Listo: te voy a avisar a la hora de cada recordatorio.')}
          disabled={ocupado}
          style={{ minHeight: 44, borderRadius: 14, border: 'none', background: 'rgba(61,99,240,0.10)', color: '#1A3596', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: ocupado ? 0.6 : 1 }}
        >
          <Icono.Campana tam={17} grosor={2.2} />
          {ocupado ? 'Activando…' : 'Avisarme con notificaciones'}
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px 6px 12px', borderRadius: 14, background: 'rgba(20,163,127,0.10)' }}>
          <span style={{ color: '#0B5E48', display: 'flex' }}><Icono.Tilde tam={15} grosor={3} /></span>
          <span style={{ flexGrow: 1, fontSize: 13, fontWeight: 700, color: '#0B5E48' }}>Notificaciones activadas</span>
          <button onClick={() => hacer(probarAviso, 'Te mandé una notificación de prueba.')} disabled={ocupado} style={{ ...chico, background: '#FFFFFF', color: '#15171C' }}>Probar</button>
          <button onClick={() => hacer(desactivarAvisos, 'Apagaste las notificaciones.')} disabled={ocupado} style={{ ...chico, background: 'transparent', color: '#3B404B' }}>Apagar</button>
        </div>
      )}
      {mensaje && (
        <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, padding: '8px 10px', borderRadius: 12, color: mensaje.tipo === 'ok' ? '#0B5E48' : '#9E1F17', background: mensaje.tipo === 'ok' ? 'rgba(20,163,127,0.10)' : 'rgba(217,58,43,0.12)' }}>
          {mensaje.texto}
        </span>
      )}
    </div>
  )
}
