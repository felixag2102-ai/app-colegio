/*
  Hoja para SUBIR UN ARCHIVO.
  Paso 1: ¿de dónde? (celular funciona; Drive y Classroom llegan más adelante)
  Paso 2: elegís la carpeta y tocás "Subir".
  Paso 3: barra de progreso mientras se guarda.
*/
import { useEffect, useRef, useState } from 'react'
import HojaDeAbajo from '../../componentes/HojaDeAbajo'
import { tamanioLegible } from '../../datos/archivos'
import * as Icono from '../../componentes/Iconos'

export const TIPOS = {
  pdf: { insignia: 'PDF', color: '#C7362B' },
  doc: { insignia: 'DOC', color: '#2B5BD7' },
  img: { insignia: 'IMG', color: '#0F7B5F' },
  otro: { insignia: 'ARCH', color: '#4A4F5A' },
}

export function tipoDeArchivo(archivo) {
  const nombre = (archivo.name || '').toLowerCase()
  if ((archivo.type || '').startsWith('image/')) return 'img'
  if (nombre.endsWith('.pdf')) return 'pdf'
  if (/\.(docx?|odt|rtf|txt)$/.test(nombre)) return 'doc'
  return 'otro'
}

const FUENTES = [
  { key: 'phone', nombre: 'Desde el celular', desc: 'Archivos y fotos de tu galería', color: '#15171C', tinte: 'rgba(21,23,28,0.08)', Icono: Icono.Celular },
  { key: 'drive', nombre: 'Google Drive', desc: 'Próximamente', color: '#0F7B5F', tinte: 'rgba(20,163,127,0.14)', Icono: Icono.Drive, apagada: true },
  { key: 'class', nombre: 'Google Classroom', desc: 'Próximamente', color: '#B26A00', tinte: 'rgba(230,160,0,0.18)', Icono: Icono.Classroom, apagada: true },
]

const LIMITE = 50 * 1024 * 1024 // 50 MB

export default function SubirArchivo({ abierto, onCerrar, carpetas, carpetaInicial, onSubir }) {
  const [paso, setPaso] = useState('fuente') // 'fuente' | 'elegido' | 'subiendo'
  const [archivo, setArchivo] = useState(null)
  const [destino, setDestino] = useState(0)
  const [error, setError] = useState('')
  const selector = useRef(null)

  useEffect(() => {
    if (!abierto) return
    setPaso('fuente')
    setArchivo(null)
    setError('')
    setDestino(Math.min(carpetaInicial || 0, carpetas.length - 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  const alElegir = (e) => {
    const a = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!a) return
    if (a.size > LIMITE) { setError('Ese archivo pesa más de 50 MB. Probá con uno más liviano.'); return }
    setError('')
    setArchivo(a)
    setPaso('elegido')
  }

  const subir = async () => {
    setPaso('subiendo')
    const inicio = Date.now()
    await onSubir(archivo, destino)
    // que la barrita se vea al menos un ratito
    const espera = Math.max(0, 900 - (Date.now() - inicio))
    setTimeout(onCerrar, espera)
  }

  const tipo = archivo ? TIPOS[tipoDeArchivo(archivo)] : TIPOS.otro
  const carpeta = carpetas[destino] || carpetas[0]

  return (
    <HojaDeAbajo abierta={abierto} onCerrar={onCerrar} etiqueta="Subir archivo" separacion={12} bloqueada={paso === 'subiendo'}>
      <input ref={selector} type="file" hidden onChange={alElegir} accept="image/*,application/pdf,.pdf,.doc,.docx,.odt,.txt,.ppt,.pptx,.xls,.xlsx" />

      {paso === 'fuente' && (
        <>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Subir archivo</h2>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B' }}>¿De dónde lo sacás?</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FUENTES.map((f) => (
              <button
                key={f.key}
                disabled={f.apagada}
                onClick={() => selector.current.click()}
                style={{ width: '100%', minHeight: 62, borderRadius: 20, border: '1.5px solid rgba(21,23,28,0.08)', background: '#FFFFFF', padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: f.apagada ? 'default' : 'pointer', textAlign: 'left', color: '#15171C', opacity: f.apagada ? 0.55 : 1 }}
              >
                <span style={{ width: 40, height: 40, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: f.tinte, color: f.color }}><f.Icono tam={20} /></span>
                <span style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{f.nombre}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#3B404B' }}>{f.desc}</span>
                </span>
                {!f.apagada && <Icono.Derecha tam={16} grosor={2.4} estilo={{ color: '#3B404B' }} />}
              </button>
            ))}
          </div>
          {error && <span style={{ fontSize: 13, fontWeight: 600, color: '#9E1F17' }}>{error}</span>}
        </>
      )}

      {paso === 'elegido' && archivo && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setPaso('fuente')} aria-label="Volver" style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: '#F2F3F7', color: '#15171C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icono.Izquierda tam={18} grosor={2.4} />
            </button>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Desde el celular</h2>
          </div>
          <FilaArchivo nombre={archivo.name} detalle={tamanioLegible(archivo.size)} tipo={tipo} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#3B404B' }}>Guardar en</span>
          <div className="chips">
            {carpetas.map((c, i) => (
              <button key={c.id} className="chip" aria-pressed={i === destino} onClick={() => setDestino(i)} style={{ padding: '0 14px', ...(i === destino ? { borderColor: c.color, background: c.color, color: '#FFFFFF' } : null) }}>
                {c.name || 'Sin nombre'}
              </button>
            ))}
          </div>
          <button className="btn-principal" style={{ flex: '0 0 auto' }} onClick={subir}>Subir a {carpeta ? carpeta.name : ''}</button>
        </>
      )}

      {paso === 'subiendo' && archivo && (
        <>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Subiendo…</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, background: '#F2F3F7' }}>
            <Insignia tipo={tipo} />
            <span style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{archivo.name}</span>
              <span style={{ height: 6, borderRadius: 3, background: 'rgba(21,23,28,0.1)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: 6, borderRadius: 3, background: '#15171C', animation: 'fill 0.9s cubic-bezier(.4,0,.2,1) both' }} />
              </span>
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B' }}>Se guarda en {carpeta ? carpeta.name : ''}</span>
        </>
      )}
    </HojaDeAbajo>
  )
}

export function Insignia({ tipo, grande = false }) {
  return (
    <span
      style={{
        width: grande ? 40 : 34, height: grande ? 46 : 40, borderRadius: grande ? 10 : 9, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingBottom: grande ? 6 : 5, color: '#FFFFFF', fontSize: grande ? 10 : 9, fontWeight: 700, letterSpacing: '0.04em', background: tipo.color,
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35)',
      }}
    >
      {tipo.insignia}
    </span>
  )
}

function FilaArchivo({ nombre, detalle, tipo }) {
  return (
    <div style={{ width: '100%', minHeight: 58, borderRadius: 18, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid #15171C', background: '#FFFFFF' }}>
      <Insignia tipo={tipo} />
      <span style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#3B404B' }}>{detalle}</span>
      </span>
    </div>
  )
}
