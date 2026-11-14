/*
  Panel del ASISTENTE DE ESTUDIO.
  En esta etapa todavía no está conectado a una IA: muestra el diseño y
  explica que llega más adelante (necesita una clave de API, que se hace con tus papás).
*/
import { useEffect, useRef, useState } from 'react'
import { usePresencia } from '../../componentes/usePresencia'
import { useGuardado } from '../../datos/guardado'
import * as Icono from '../../componentes/Iconos'

const SUGERENCIAS = ['Tomame preguntas', 'Plan para hoy', 'Métodos de estudio', '¿Cómo subo una nota?']
const ARCOIRIS = 'conic-gradient(from 0deg, #3D63F0, #8A4DE8, #E0567A, #F2A93B, #14A37F, #3D63F0)'
const RESPUESTA = 'Todavía no estoy conectado a la inteligencia artificial, así que no puedo responderte de verdad. Eso llega en la última etapa de la app. Mientras tanto, seguí guardando notas y apuntes: los voy a usar para ayudarte.'

export function BotonEstudiar({ onClick, abierto }) {
  return (
    <button
      onClick={onClick}
      aria-label="Estudiar con el asistente de IA"
      aria-expanded={abierto}
      style={{ position: 'relative', isolation: 'isolate', overflow: 'hidden', height: 44, padding: '0 16px 0 13px', borderRadius: 22, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, color: '#FFFFFF', fontSize: 14, fontWeight: 600, background: '#15171C', boxShadow: '0 8px 22px rgba(90,60,190,0.32)' }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', zIndex: -2, left: '-30%', top: '-150%', width: '160%', height: '400%', background: ARCOIRIS, animation: 'aiSpin 5s linear infinite' }} />
      <span aria-hidden="true" style={{ position: 'absolute', zIndex: -1, inset: 2, borderRadius: 20, background: '#15171C' }} />
      <Icono.Chispa tam={16} estilo={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'aiTwinkle 3.2s ease-in-out infinite' }} />
      Estudiar
    </button>
  )
}

export default function Asistente({ abierto, onCerrar, fuentes, pregunta }) {
  const { visible, saliendo } = usePresencia(abierto, 260)
  const [mensajes, setMensajes] = useState([])
  const [borrador, setBorrador] = useState('')
  const [nombre] = useGuardado('nombre', null)
  const [escribiendo, setEscribiendo] = useState(false)
  const lista = useRef(null)
  const temporizador = useRef(null)

  const bajar = () => setTimeout(() => { if (lista.current) lista.current.scrollTop = lista.current.scrollHeight }, 40)

  const preguntar = (texto) => {
    const t = (texto || '').trim()
    if (!t || escribiendo) return
    setMensajes((m) => m.concat([{ yo: true, t }]))
    setBorrador('')
    setEscribiendo(true)
    bajar()
    temporizador.current = setTimeout(() => {
      setMensajes((m) => m.concat([{ yo: false, t: RESPUESTA }]))
      setEscribiendo(false)
      bajar()
    }, 950)
  }

  useEffect(() => {
    if (!abierto) return
    setMensajes([{ yo: false, t: '¡Hola' + (nombre ? ', ' + nombre : '') + '! Soy tu asistente de estudio. Cuando esté conectado voy a poder tomarte preguntas, armarte un plan y explicarte temas usando tus notas, apuntes y archivos.' }])
    setEscribiendo(false)
    if (pregunta) setTimeout(() => preguntar(pregunta), 400)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  useEffect(() => () => clearTimeout(temporizador.current), [])

  if (!visible) return null

  return (
    <>
      <div className="capa" style={{ zIndex: 35 }}>
        <button className={'velo' + (saliendo ? ' sale-fade' : '')} onClick={onCerrar} aria-label="Cerrar asistente" style={{ background: 'rgba(15,17,22,0.2)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', animation: saliendo ? undefined : 'aiFade 0.25s ease-out both' }} />
      </div>
      <section
        role="dialog"
        aria-label="Asistente de estudio"
        className={saliendo ? 'sale-pop' : ''}
        style={{
          position: 'absolute', zIndex: 38, left: 12, right: 12, top: 'calc(var(--arriba) + 54px)', bottom: 'calc(104px + var(--abajo))', borderRadius: 32,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(30px) saturate(170%)', WebkitBackdropFilter: 'blur(30px) saturate(170%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 24px 60px rgba(20,24,40,0.3)', transformOrigin: 'calc(100% - 100px) -30px',
          animation: saliendo ? undefined : 'aiPop 0.5s cubic-bezier(.34,1.25,.64,1) both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 8px 16px' }}>
          <span aria-hidden="true" style={{ position: 'relative', width: 40, height: 40, flexShrink: 0, borderRadius: '50%' }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ARCOIRIS, animation: 'aiSpin 6s linear infinite' }} />
            <span style={{ position: 'absolute', inset: 2, borderRadius: '50%', background: '#15171C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icono.Chispa tam={18} /></span>
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>Asistente de estudio</h2>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#9A3C00' }}>Todavía sin conectar · llega en la Etapa 7</span>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar asistente" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 20, border: 'none', background: 'rgba(21,23,28,0.06)', color: '#15171C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icono.Cerrar tam={16} grosor={2.6} />
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 16px 10px 16px' }}>
          {fuentes.map((f) => (
            <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '5px 9px', borderRadius: 999, background: 'rgba(21,23,28,0.06)', color: '#2B2F38' }}>
              <span style={{ color: '#0F7B5F', display: 'flex' }}><Icono.Tilde tam={11} grosor={3.4} /></span>{f}
            </span>
          ))}
        </div>
        <div ref={lista} role="log" aria-live="polite" style={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(21,23,28,0.07)' }}>
          {mensajes.map((m, i) => (
            <div
              key={i}
              style={{
                maxWidth: '88%', padding: '9px 12px', fontSize: 14, fontWeight: 500, lineHeight: 1.45, whiteSpace: 'pre-line', animation: 'aiMsg 0.3s ease-out both',
                ...(m.yo
                  ? { alignSelf: 'flex-end', background: '#15171C', color: '#FFFFFF', borderRadius: '18px 18px 6px 18px' }
                  : { alignSelf: 'flex-start', background: '#F2F3F7', color: '#15171C', borderRadius: '18px 18px 18px 6px' }),
              }}
            >
              {m.t}
            </div>
          ))}
          {escribiendo && (
            <div aria-label="El asistente está escribiendo" style={{ alignSelf: 'flex-start', padding: '12px 14px', borderRadius: '18px 18px 18px 6px', background: '#F2F3F7', display: 'flex', gap: 4 }}>
              {[0, 0.15, 0.3].map((d) => <span key={d} style={{ width: 7, height: 7, borderRadius: 4, background: '#3B404B', animation: 'aiDot 1.1s ease-in-out ' + d + 's infinite' }} />)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 12px', flexShrink: 0 }}>
          {SUGERENCIAS.map((s) => (
            <button key={s} onClick={() => preguntar(s)} style={{ flexShrink: 0, minHeight: 36, padding: '0 12px', borderRadius: 18, border: '1.5px solid rgba(21,23,28,0.12)', background: '#FFFFFF', color: '#15171C', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '0 10px 10px 10px', flexShrink: 0 }}>
          <input
            type="text"
            aria-label="Escribile al asistente"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') preguntar(borrador) }}
            placeholder="Preguntá sobre tu prueba…"
            style={{ flexGrow: 1, minWidth: 0, minHeight: 46, borderRadius: 18, border: '1.5px solid rgba(21,23,28,0.10)', background: '#F2F3F7', padding: '0 14px', fontSize: 15, fontWeight: 500, color: '#15171C', outlineColor: '#15171C' }}
          />
          <button
            onClick={() => preguntar(borrador)}
            aria-label="Enviar"
            className={borrador.trim() ? '' : 'apagado'}
            style={{ width: 46, height: 46, borderRadius: 18, border: 'none', background: '#15171C', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.2s' }}
          >
            <Icono.Enviar tam={18} grosor={2.4} />
          </button>
        </div>
      </section>
    </>
  )
}
