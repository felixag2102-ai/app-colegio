/*
  Hoja de COPIA DE SEGURIDAD (se abre desde el menú + del Inicio).
*/
import { useEffect, useRef, useState } from 'react'
import HojaDeAbajo from '../../componentes/HojaDeAbajo'
import { guardarCopia, recuperarCopia } from '../../datos/copia'
import * as Icono from '../../componentes/Iconos'

export default function CopiaSeguridad({ abierta, onCerrar }) {
  const [estado, setEstado] = useState({ tipo: 'nada', texto: '' }) // nada | ok | error | trabajando
  const [archivo, setArchivo] = useState(null) // copia elegida, esperando confirmación
  const selector = useRef(null)

  useEffect(() => {
    if (abierta) { setEstado({ tipo: 'nada', texto: '' }); setArchivo(null) }
  }, [abierta])

  const guardar = async () => {
    setEstado({ tipo: 'trabajando', texto: 'Armando la copia…' })
    try {
      const r = await guardarCopia()
      setEstado({ tipo: 'ok', texto: 'Listo: se descargó "' + r.nombre + '". Guardalo en un lugar seguro (por ejemplo, Google Drive).' })
    } catch (err) {
      setEstado({ tipo: 'error', texto: 'No se pudo armar la copia.' })
    }
  }

  const recuperar = async () => {
    setEstado({ tipo: 'trabajando', texto: 'Recuperando…' })
    try {
      await recuperarCopia(archivo)
      window.location.reload() // recargamos para que la app lea los datos nuevos
    } catch (err) {
      setArchivo(null)
      setEstado({ tipo: 'error', texto: err.message || 'No se pudo recuperar la copia.' })
    }
  }

  const colores = { ok: ['#0B5E48', 'rgba(20,163,127,0.14)'], error: ['#9E1F17', 'rgba(217,58,43,0.12)'], trabajando: ['#3B404B', 'rgba(21,23,28,0.06)'] }
  const boton = { width: '100%', minHeight: 62, borderRadius: 20, border: '1.5px solid rgba(21,23,28,0.08)', background: '#FFFFFF', padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', color: '#15171C' }
  const icono = (fondo) => ({ width: 40, height: 40, borderRadius: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: fondo, color: '#FFFFFF' })

  return (
    <HojaDeAbajo
      abierta={abierta}
      onCerrar={onCerrar}
      etiqueta="Copia de seguridad"
      separacion={12}
      bloqueada={estado.tipo === 'trabajando'}
      encabezado={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Copia de seguridad</h2>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B', lineHeight: 1.4 }}>
            Tus datos están guardados solo en este dispositivo. Hacé una copia de vez en cuando para no perderlos.
          </span>
        </div>
      }
    >
      <input ref={selector} type="file" accept=".json,application/json" hidden onChange={(e) => { const a = e.target.files && e.target.files[0]; e.target.value = ''; if (a) setArchivo(a) }} />

      {!archivo && (
        <>
          <button style={boton} onClick={guardar} disabled={estado.tipo === 'trabajando'}>
            <span style={icono('#15171C')}><Icono.Abajo tam={20} grosor={2.6} /></span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Guardar copia</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#3B404B' }}>Descarga un archivo con todo</span>
            </span>
          </button>
          <button style={boton} onClick={() => selector.current.click()} disabled={estado.tipo === 'trabajando'}>
            <span style={icono('#3D63F0')}><Icono.Subir tam={20} /></span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Recuperar copia</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#3B404B' }}>Elegí un archivo que guardaste antes</span>
            </span>
          </button>
        </>
      )}

      {archivo && (
        <div role="alertdialog" aria-label="¿Recuperar esta copia?" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 16, background: 'rgba(179,38,30,0.07)', animation: 'edIn 0.25s ease-out both' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>¿Recuperar "{archivo.name}"?</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B', lineHeight: 1.35 }}>Lo que tenés ahora en la app se reemplaza por lo de la copia.</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setArchivo(null)} style={{ flex: '1 1 0', minHeight: 42, borderRadius: 14, border: 'none', background: '#FFFFFF', color: '#15171C', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={recuperar} style={{ flex: '1 1 0', minHeight: 42, borderRadius: 14, border: 'none', background: '#B3261E', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Recuperar</button>
          </div>
        </div>
      )}

      {estado.tipo !== 'nada' && (
        <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, padding: '10px 12px', borderRadius: 14, color: colores[estado.tipo][0], background: colores[estado.tipo][1] }}>{estado.texto}</span>
      )}
    </HojaDeAbajo>
  )
}
