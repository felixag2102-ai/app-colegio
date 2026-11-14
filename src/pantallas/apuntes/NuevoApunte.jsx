/*
  Hoja para guardar un APUNTE nuevo (con o sin foto).
  Si hay foto y la IA está configurada, la pasa a texto sola (con Gemini).
  El texto queda en los campos para que lo revises antes de guardar.
*/
import { useEffect, useState } from 'react'
import HojaDeAbajo from '../../componentes/HojaDeAbajo'
import { fotoATexto, iaDisponible, mensajeIA } from '../../datos/ia'

export default function NuevoApunte({ abierto, onCerrar, foto, carpetas, carpetaInicial, onGuardar }) {
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [destino, setDestino] = useState(0)
  const [urlFoto, setUrlFoto] = useState(null)
  const [leyendo, setLeyendo] = useState(false)
  const [errorIA, setErrorIA] = useState('')

  // Pasa la foto a texto con la IA y completa el título y el texto
  const leerFoto = async () => {
    if (!foto || !iaDisponible()) return
    setLeyendo(true)
    setErrorIA('')
    try {
      const r = await fotoATexto(foto)
      setTitulo((t) => t || r.titulo || '')
      setTexto((t) => (t ? t + '\n\n' : '') + (r.texto || ''))
      if (!r.texto) setErrorIA('No encontré texto en la foto. Escribilo vos o probá con otra foto.')
    } catch (err) {
      setErrorIA(mensajeIA(err))
    }
    setLeyendo(false)
  }

  useEffect(() => {
    if (!abierto) return
    setTitulo('')
    setTexto('')
    setErrorIA('')
    setDestino(Math.min(carpetaInicial || 0, carpetas.length - 1))
    if (foto && iaDisponible()) leerFoto()
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
          <span className="subtitulo">{foto ? (iaDisponible() ? 'Revisá el texto antes de guardar' : 'Escribí lo importante de la foto') : 'Escribí lo que quieras guardar'}</span>
        </div>
      }
    >
      <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {urlFoto && (
          <img src={urlFoto} alt="Foto del apunte" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 18, boxShadow: '0 8px 20px rgba(30,40,80,0.12)' }} />
        )}
        {foto && !iaDisponible() && (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#9A3C00', background: 'rgba(224,102,26,0.12)', padding: '8px 12px', borderRadius: 14 }}>
            La foto queda guardada. El texto lo escribís vos (la IA no está configurada).
          </span>
        )}
        {leyendo && (
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A3596', background: 'rgba(61,99,240,0.10)', padding: '10px 12px', borderRadius: 14, animation: 'shimmer 1.2s ease-in-out infinite' }}>
            ✦ Leyendo tu letra con IA…
          </span>
        )}
        {!leyendo && foto && iaDisponible() && !errorIA && texto && (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0B5E48', background: 'rgba(20,163,127,0.10)', padding: '8px 12px', borderRadius: 14 }}>
            ✓ Lo pasé a texto. Revisalo por si la IA se equivocó en alguna palabra.
          </span>
        )}
        {errorIA && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#9E1F17', background: 'rgba(217,58,43,0.10)', padding: '8px 12px', borderRadius: 14 }}>
            <span style={{ flexGrow: 1 }}>{errorIA}</span>
            <button onClick={leerFoto} style={{ flexShrink: 0, minHeight: 30, padding: '0 10px', borderRadius: 15, border: 'none', background: '#FFFFFF', color: '#15171C', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Reintentar</button>
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
        className={'btn-principal' + (listo && !leyendo ? '' : ' apagado')}
        style={{ flex: '0 0 auto' }}
        onClick={() => { if (listo && !leyendo) onGuardar({ titulo: titulo.trim() || 'Apunte sin título', texto: texto.trim(), destino }) }}
      >
        Guardar en {carpeta ? carpeta.name : ''}
      </button>
    </HojaDeAbajo>
  )
}
