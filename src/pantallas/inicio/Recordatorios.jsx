/*
  Panel de RECORDATORIOS (se abre con la campana del Inicio).
  - Escribís qué recordar y elegís día (hoy + 6 días) y hora con el reloj.
  - Tocás uno para tacharlo. Los tachados se borran deslizando a la izquierda.
  (Las notificaciones de verdad llegan en una etapa posterior.)
*/
import { useEffect, useRef, useState } from 'react'
import { useGuardado } from '../../datos/guardado'
import { DIAS_CORTOS, difDias, fechaCorta, hoy, nuevoId, pad2, sumarDias } from '../../utilidades/fechas'
import { usePresencia } from '../../componentes/usePresencia'
import FilaDeslizable from '../../componentes/FilaDeslizable'
import RelojElegir from '../../componentes/RelojElegir'
import { Tachado } from '../Ideas'
import * as Icono from '../../componentes/Iconos'

// Los próximos 7 días, para elegir en el reloj
export function proximosSieteDias() {
  const h = hoy()
  return [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = sumarDias(h, i)
    return {
      fecha: d,
      corto: i === 0 ? 'Hoy' : DIAS_CORTOS[d.getDay()],
      numero: d.getDate(),
      completo: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DIAS_CORTOS[d.getDay()] + ' ' + d.getDate(),
    }
  })
}

// 1730000000000 → "Hoy 17:00", "Mañana 9:30", "Sáb 31 10:00"...
export function textoCuando(ms) {
  const f = new Date(ms)
  const dias = difDias(hoy(), f)
  const hm = f.getHours() + ':' + pad2(f.getMinutes())
  if (dias === 0) return 'Hoy ' + hm
  if (dias === 1) return 'Mañana ' + hm
  if (dias === -1) return 'Ayer ' + hm
  if (dias > 1 && dias < 7) return DIAS_CORTOS[f.getDay()] + ' ' + f.getDate() + ' ' + hm
  return fechaCorta(f) + ' ' + hm
}

function estiloCuando(r, ahora) {
  if (r.done) return { color: '#4A4F5A', background: 'rgba(21,23,28,0.06)' }
  if (r.cuando < ahora) return { color: '#9E1F17', background: 'rgba(217,58,43,0.12)' } // ya se pasó la hora
  const dias = difDias(hoy(), new Date(r.cuando))
  if (dias === 0) return { color: '#9A3C00', background: 'rgba(224,102,26,0.14)' }
  if (dias === 1) return { color: '#1A3596', background: 'rgba(61,99,240,0.12)' }
  return { color: '#3B404B', background: 'rgba(21,23,28,0.06)' }
}

export default function Recordatorios({ abierto, onCerrar, enfocar }) {
  const { visible, saliendo } = usePresencia(abierto, 250)
  const [lista, setLista] = useGuardado('recordatorios', [])
  const [borrador, setBorrador] = useState('')
  const [cuando, setCuando] = useState({ dia: 0, h: 20, m: 0 })
  const [reloj, setReloj] = useState(false)
  const [recien, setRecien] = useState(null)
  const campo = useRef(null)
  const dias = proximosSieteDias()

  useEffect(() => {
    if (abierto && enfocar) {
      const t = setTimeout(() => campo.current && campo.current.focus(), 380)
      return () => clearTimeout(t)
    }
  }, [abierto, enfocar])

  if (!visible) return null

  const ahora = Date.now()
  const pendientes = lista.filter((r) => !r.done)
  const paraHoy = pendientes.filter((r) => difDias(hoy(), new Date(r.cuando)) === 0).length
  const ordenada = pendientes.slice().sort((a, b) => a.cuando - b.cuando).concat(lista.filter((r) => r.done))

  const agregar = () => {
    const t = borrador.trim()
    if (!t) return
    const fecha = new Date(dias[cuando.dia].fecha)
    fecha.setHours(cuando.h, cuando.m, 0, 0)
    const id = nuevoId()
    setLista([{ id, t, cuando: fecha.getTime(), done: false }].concat(lista))
    setBorrador('')
    setRecien(id)
  }

  const resumen = pendientes.length
    ? (pendientes.length === 1 ? '1 pendiente' : pendientes.length + ' pendientes') + (paraHoy ? ' · ' + paraHoy + ' para hoy' : '')
    : 'Todo al día'

  return (
    <>
      <div className="capa" style={{ zIndex: 50 }}>
        <button className={'velo' + (saliendo ? ' sale-fade' : '')} onClick={onCerrar} aria-label="Cerrar recordatorios" style={{ background: 'rgba(15,17,22,0.34)', backdropFilter: 'blur(18px) saturate(120%)', WebkitBackdropFilter: 'blur(18px) saturate(120%)', animation: saliendo ? undefined : 'fadeIn 0.2s ease-out both' }} />
        <section
          role="dialog"
          aria-label="Recordatorios"
          className={saliendo ? 'sale-pop' : ''}
          style={{
            position: 'absolute', top: 'calc(var(--arriba) + 58px)', left: 14, right: 14, maxHeight: 'calc(100% - var(--arriba) - 90px)', borderRadius: 30, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid rgba(255,255,255,0.95)', background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(44px) saturate(180%)', WebkitBackdropFilter: 'blur(44px) saturate(180%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 24px 60px rgba(20,24,40,0.3)', transformOrigin: 'calc(100% - 82px) -14px',
            animation: saliendo ? undefined : 'remPop 0.4s cubic-bezier(.34,1.3,.64,1) both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 42, height: 42, borderRadius: 14, flexShrink: 0, background: '#E0661A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 18px rgba(224,102,26,0.35)' }}>
              <Icono.Campana tam={21} grosor={2.1} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em' }}>Recordatorios</h2>
              <span className="subtitulo" style={{ fontSize: 12 }}>{resumen}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, borderRadius: 20, background: '#F2F3F7', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={campo}
                type="text"
                aria-label="Nuevo recordatorio"
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') agregar() }}
                placeholder="Recordame…"
                style={{ flexGrow: 1, minWidth: 0, minHeight: 44, borderRadius: 14, border: 'none', background: '#FFFFFF', padding: '0 12px', fontSize: 15, fontWeight: 500, color: '#15171C', outlineColor: '#15171C' }}
              />
              <button
                onClick={agregar}
                aria-label="Agregar recordatorio"
                className={borrador.trim() ? '' : 'apagado'}
                style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 14, border: 'none', background: '#15171C', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity 0.2s' }}
              >
                <Icono.Mas tam={19} grosor={2.6} />
              </button>
            </div>
            <button
              onClick={() => setReloj(true)}
              style={{ minHeight: 50, borderRadius: 14, border: 'none', background: '#FFFFFF', padding: '0 12px 0 8px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#15171C', textAlign: 'left' }}
            >
              <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, background: 'rgba(224,102,26,0.14)', color: '#C24E00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icono.CalendarioReloj tam={18} grosor={2.1} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#3B404B' }}>Seleccioná día y hora</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{dias[cuando.dia].completo + ' ' + cuando.h + ':' + pad2(cuando.m)}</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#9A3C00' }}>Cambiar</span>
            </button>
          </div>

          <div style={{ flex: '0 1 auto', minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {ordenada.map((r, idx) => (
              <FilaDeslizable
                key={r.id}
                habilitada={r.done}
                onBorrar={() => setLista((l) => l.filter((x) => x.id !== r.id))}
                estilo={{ borderTop: idx ? '1px solid rgba(21,23,28,0.07)' : undefined, animation: r.id === recien ? 'rowIn 0.4s cubic-bezier(.22,1,.36,1) both' : undefined }}
                estiloFrente={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <button
                  role="checkbox"
                  aria-checked={r.done}
                  onClick={() => { setLista((l) => l.map((x) => (x.id === r.id ? { ...x, done: !x.done } : x))); setRecien(null) }}
                  style={{ flexGrow: 1, minWidth: 0, minHeight: 54, padding: '8px 0', border: 'none', background: 'transparent', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 24, height: 24, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.25s, border-color 0.25s',
                      ...(r.done ? { background: '#E0661A', border: '2px solid #E0661A' } : { background: '#FFFFFF', border: '2px solid rgba(21,23,28,0.25)' }),
                    }}
                  >
                    {r.done && <span style={{ display: 'flex', color: '#FFFFFF', animation: 'pop 0.3s ease-out' }}><Icono.Tilde tam={13} grosor={3.4} /></span>}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3, transition: 'color 0.25s', color: r.done ? '#4A4F5A' : '#15171C' }}>
                      <Tachado hecho={r.done}>{r.t}</Tachado>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, ...estiloCuando(r, ahora) }}>{textoCuando(r.cuando)}</span>
                  </span>
                </button>
                {r.done && (
                  <span role="img" aria-label="Deslizá a la izquierda para eliminar" style={{ flexShrink: 0, padding: '0 6px', color: '#8E93A0', display: 'flex' }}>
                    <Icono.DobleIzquierda tam={16} />
                  </span>
                )}
              </FilaDeslizable>
            ))}
            {lista.length === 0 && (
              <div style={{ padding: '16px 4px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#3B404B' }}>No tenés recordatorios</div>
            )}
          </div>
        </section>
      </div>

      <RelojElegir
        abierto={reloj}
        titulo="¿Cuándo te lo recuerdo?"
        color="#C24E00"
        dias={dias}
        inicial={cuando}
        onCancelar={() => setReloj(false)}
        onListo={(dia, h, m) => { setCuando({ dia, h, m }); setReloj(false) }}
      />
    </>
  )
}
