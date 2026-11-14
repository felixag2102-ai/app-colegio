/*
  Hoja para guardar un APUNTE nuevo (con o sin foto).
  En esta etapa el texto lo escribís vos; la transcripción automática
  de la foto con IA llega en la Etapa 7.
*/
import { useEffect, useState } from 'react'
import HojaDeAbajo from '../../componentes/HojaDeAbajo'

export default function NuevoApunte({ abierto, onCerrar, foto, carpetas, carpetaInicial, onGuardar }) {
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [destino, setDestino] = useState(0)
  const [urlFoto, setUrlFoto] = useState(null)

  useEffect(() => {
    if (!abierto) return
    setTitulo('')
    setTexto('')
    setDestino(Math.min(carpetaInicial || 0, carpetas.length - 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  // Para mostrar la foto antes de guardarla
  useEffect(() => {
    if (!foto) { setUrlFoto(null); return }
    const url = URL.createObjectURL(foto)
    setUrlFoto(url)
    return () => URL.revokeObjectURL(url)
  }, [foto])

  const listo = titulo.trim() || texto.trim()
  const carpeta = carpetas[destino] || carpetas[0]

  return (
    <HojaDeAbajo
      abierta={abierto}
      onCerrar={onCerrar}
      etiqueta="Nuevo apunte"
      separacion={12}
      encabezado={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{foto ? 'Apunte con foto' : 'Nuevo apunte'}</h2>
          <span className="subtitulo">{foto ? 'Escribí lo importante de la foto' : 'Escribí lo que quieras guardar'}</span>
        </div>
      }
    >
      <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {urlFoto && (
          <img src={urlFoto} alt="Foto del apunte" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 18, boxShadow: '0 8px 20px rgba(30,40,80,0.12)' }} />
        )}
        {foto && (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#9A3C00', background: 'rgba(224,102,26,0.12)', padding: '8px 12px', borderRadius: 14 }}>
            Más adelante la app va a pasar la foto a texto sola. Por ahora, la foto queda guardada y el texto lo escribís vos.
          </span>
        )}
        <label className="etiqueta">
          Título
          <input className="campo" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Revolución de Mayo" />
        </label>
        <label className="etiqueta">
          Texto
          <textarea className="campo" rows={5} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Lo importante de la clase…" />
        </label>
        <div className="etiqueta">
          Guardar en
          <div className="chips">
            {carpetas.map((c, i) => (
              <button
                key={c.id}
                className="chip"
                aria-pressed={i === destino}
                onClick={() => setDestino(i)}
                style={{ minHeight: 40, padding: '0 14px', fontSize: 14, ...(i === destino ? { borderColor: c.color, background: c.color, color: '#FFFFFF' } : null) }}
              >
                {c.name || 'Sin nombre'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        className={'btn-principal' + (listo ? '' : ' apagado')}
        style={{ flex: '0 0 auto' }}
        onClick={() => { if (listo) onGuardar({ titulo: titulo.trim() || 'Apunte sin título', texto: texto.trim(), destino }) }}
      >
        Guardar en {carpeta ? carpeta.name : ''}
      </button>
    </HojaDeAbajo>
  )
}
