/*
  Pantalla INICIO.
  - Saludo y cuántas cosas tenés hoy.
  - Semana tocable: cada día muestra rayitas de colores (una por tarjeta).
  - Tarjetas apiladas: deslizá la de adelante al costado para pasarla al fondo.
  - Clima (por ahora de ejemplo), recordatorios (campana) y menú +.
*/
import { useEffect, useRef, useState } from 'react'
import { useGuardado } from '../../datos/guardado'
import { CATEGORIAS_AGENDA } from '../../datos/iniciales'
import { ACENTO } from '../../utilidades/colores'
import { DIAS, DIAS_CORTOS, difDias, fechaLarga, hoy, lunesDe, relativo, sumarDias } from '../../utilidades/fechas'
import TuNombre from './TuNombre'
import TextoQueCorre from '../../componentes/TextoQueCorre'
import { CasillaIdea, Tachado } from '../Ideas'
import { armarTarjetas } from './tarjetas'
import Recordatorios from './Recordatorios'
import MenuMas from './MenuMas'
import CopiaSeguridad from './CopiaSeguridad'
import Clima from './Clima'
import * as Icono from '../../componentes/Iconos'

// Cómo se ve cada tipo de tarjeta (copiado del diseño)
const ASPECTO = {
  evento: { caja: { color: '#FFFFFF', background: 'rgba(22,24,32,0.86)', border: '1px solid rgba(255,255,255,0.16)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.22), 0 16px 36px rgba(20,24,40,0.26)' }, etiqueta: '#C9CCD4', chip: { background: 'rgba(255,255,255,0.14)', color: '#FFFFFF' } },
  prueba: { caja: { color: '#15171C', background: 'rgba(255,233,216,0.86)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 16px 36px rgba(120,60,20,0.16)' }, etiqueta: '#7A3000', chip: { background: 'rgba(194,78,0,0.12)', color: '#7A3000' } },
  entrega: { caja: { color: '#15171C', background: 'rgba(255,255,255,0.86)', border: '1px solid rgba(255,255,255,0.85)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 16px 36px rgba(30,40,80,0.14)' }, etiqueta: '#3B404B', chip: { background: 'rgba(21,23,28,0.06)', color: '#3B404B' } },
  ideas: { caja: { color: '#15171C', background: 'rgba(226,232,255,0.86)', border: '1px solid rgba(255,255,255,0.85)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 16px 36px rgba(30,50,140,0.16)' }, etiqueta: '#10246B', chip: { background: 'rgba(26,53,150,0.10)', color: '#10246B' } },
}
ASPECTO.vacio = ASPECTO.entrega

// Color de la rayita de cada tipo en la semana
const colorRayita = (tipo, elegido) =>
  tipo === 'evento' ? (elegido ? '#FFFFFF' : '#15171C') : tipo === 'prueba' ? '#E0661A' : tipo === 'entrega' ? ACENTO : '#8A4DE8'

// Hace que la pantalla se actualice sola cada 30 segundos (para "en 45 min", etc.)
function useAhora() {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000)
    return () => clearInterval(t)
  }, [])
  return ahora
}

export default function Inicio({ irA }) {
  const [eventos] = useGuardado('eventos', [])
  const [categorias] = useGuardado('categoriasAgenda', CATEGORIAS_AGENDA)
  const [ideas, setIdeas] = useGuardado('ideas', [])
  const [recordatorios] = useGuardado('recordatorios', [])
  const ahora = useAhora()

  const hoyD = hoy()
  const lunes = lunesDe(hoyD)
  const indiceHoy = difDias(lunes, hoyD)

  const [dia, setDia] = useState(indiceHoy)
  const [orden, setOrden] = useState([])
  const [dx, setDx] = useState(0)
  const [capturado, setCapturado] = useState(false)
  const [vuelo, setVuelo] = useState(0) // -1 o 1 mientras la tarjeta sale volando
  const [entrando, setEntrando] = useState(false)
  const [menu, setMenu] = useState(false)
  const [panelRec, setPanelRec] = useState({ abierto: false, enfocar: false })
  const [campanazos, setCampanazos] = useState(0)
  const [copia, setCopia] = useState(false)
  // El nombre se guarda en el celular. null = todavía no lo preguntamos
  const [nombre, setNombre] = useGuardado('nombre', null)
  const [pidiendoNombre, setPidiendoNombre] = useState(false)
  useEffect(() => {
    if (nombre === null) {
      const t = setTimeout(() => setPidiendoNombre(true), 700)
      return () => clearTimeout(t)
    }
  }, [nombre])

  const arrastre = useRef({ activo: false })
  const ocupado = useRef(false)
  const movido = useRef(false)
  const temporizadores = useRef([])
  useEffect(() => () => temporizadores.current.forEach(clearTimeout), [])
  const despues = (fn, ms) => temporizadores.current.push(setTimeout(fn, ms))

  // La semana (lunes a domingo) con las tarjetas de cada día
  const semana = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const fecha = sumarDias(lunes, i)
    return { fecha, ...armarTarjetas(fecha, hoyD, ahora, eventos, categorias) }
  })
  const elegido = semana[dia]
  const tarjetas = elegido.tarjetas
  const n = tarjetas.length
  const ordenActual = orden.length === n ? orden : tarjetas.map((t, i) => i)

  const elegirDia = (i) => {
    if (i === dia) return
    ocupado.current = false
    setDia(i)
    setOrden([])
    setDx(0)
    setVuelo(0)
    setEntrando(true)
    despues(() => setEntrando(false), 40)
  }

  // Pasa la tarjeta de adelante al fondo
  const mandarAlFondo = (direccion) => {
    if (ocupado.current) return
    if (n < 2) { setDx(0); return }
    ocupado.current = true
    setVuelo(direccion)
    despues(() => {
      setOrden(ordenActual.slice(1).concat(ordenActual[0]))
      setVuelo(0)
      setDx(0)
      ocupado.current = false
    }, 280)
  }

  const alApoyar = (e) => {
    if (ocupado.current) return
    arrastre.current = { activo: true, x0: e.clientX, id: e.pointerId, el: e.currentTarget, capturado: false, dx: 0 }
    movido.current = false
  }
  const alMover = (e) => {
    const a = arrastre.current
    if (!a.activo) return
    const d = e.clientX - a.x0
    if (!a.capturado) {
      if (Math.abs(d) < 8) return
      a.capturado = true
      movido.current = true
      setCapturado(true)
      try { a.el.setPointerCapture(a.id) } catch (err) { /* nada */ }
    }
    a.dx = d
    setDx(d)
  }
  const alSoltar = () => {
    const a = arrastre.current
    if (!a.activo) return
    a.activo = false
    const d = a.capturado ? a.dx : 0
    setCapturado(false)
    if (Math.abs(d) > 80) mandarAlFondo(d > 0 ? 1 : -1)
    else setDx(0)
  }

  // Ideas para la tarjeta (primero las pendientes, máximo 3)
  const ideasOrdenadas = ideas.filter((x) => !x.done).concat(ideas.filter((x) => x.done))
  const ideasPendientes = ideas.filter((x) => !x.done).length
  const tocarIdea = (id) => {
    if (movido.current) { movido.current = false; return }
    setIdeas(ideas.map((x) => (x.id === id ? { ...x, done: !x.done } : x)))
  }

  // Recordatorios
  const recPendientes = recordatorios.filter((r) => !r.done)
  const recHoy = recPendientes.filter((r) => difDias(hoyD, new Date(r.cuando)) === 0).length
  const abrirRecordatorios = (enfocar) => {
    setMenu(false)
    setPanelRec({ abierto: true, enfocar })
    setCampanazos((c) => c + 1)
  }

  // Textos de arriba
  const cosasHoy = semana[indiceHoy].cantidad + recHoy
  const saludoSub = cosasHoy === 0 ? 'Hoy no tenés nada en agenda' : 'Hoy tenés ' + cosasHoy + (cosasHoy === 1 ? ' cosa' : ' cosas') + ' en agenda'
  const esHoy = dia === indiceHoy
  const tituloDia = esHoy ? 'Hoy' : DIAS[elegido.fecha.getDay()] + ' ' + elegido.fecha.getDate()
  const rel = esHoy ? '' : relativo(dia - indiceHoy)
  const cuenta = elegido.cantidad + (elegido.cantidad === 1 ? ' cosa' : ' cosas')

  const ease = 'cubic-bezier(.22,1,.36,1)'

  return (
    <>
      <div className="pantalla">
        {/* Saludo + campana + botón "+" */}
        <div className="entra" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <p className="subtitulo">{fechaLarga(hoyD)}</p>
            <h1 className="titulo">
              <button
                onClick={() => setPidiendoNombre(true)}
                aria-label="Cambiar tu nombre"
                style={{ all: 'unset', cursor: 'pointer' }}
              >
                {nombre ? 'Hola, ' + nombre : 'Hola'}
              </button>
            </h1>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#2B2F38' }}>{saludoSub}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn-circulo"
              onClick={() => (panelRec.abierto ? setPanelRec({ abierto: false, enfocar: false }) : abrirRecordatorios(false))}
              aria-label={recPendientes.length ? 'Recordatorios, ' + recPendientes.length + ' pendientes' : 'Recordatorios'}
              aria-expanded={panelRec.abierto}
              style={{ position: 'relative', zIndex: 60, width: 48, height: 48, borderRadius: 24, background: 'rgba(255,255,255,0.78)' }}
            >
              <Icono.Campana
                key={campanazos}
                tam={21}
                grosor={2.1}
                estilo={{ transformOrigin: '50% 10%', animation: campanazos ? 'ringA 0.7s ease-in-out' : undefined }}
              />
              {recPendientes.length > 0 && (
                <span aria-hidden="true" style={{ position: 'absolute', top: -3, right: -3, minWidth: 20, height: 20, padding: '0 5px', borderRadius: 10, background: '#D93A2B', color: '#FFFFFF', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #EEF0F7' }}>
                  {recPendientes.length}
                </span>
              )}
            </button>
            <button
              className="btn-circulo"
              onClick={() => setMenu(!menu)}
              aria-label="Agregar algo nuevo"
              aria-expanded={menu}
              style={{ position: 'relative', zIndex: 60, width: 48, height: 48, borderRadius: 24, background: 'rgba(255,255,255,0.78)' }}
            >
              <Icono.Mas tam={22} estilo={{ transition: 'transform 0.3s cubic-bezier(.22,1,.36,1)', transform: menu ? 'rotate(45deg)' : undefined }} />
            </button>
          </div>
        </div>

        {/* Semana */}
        <div
          className="entra"
          style={{
            borderRadius: 24, padding: '8px 4px', display: 'flex', justifyContent: 'space-between', flexShrink: 0, animationDelay: '0.08s',
            border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(30px) saturate(160%)',
            WebkitBackdropFilter: 'blur(30px) saturate(160%)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 10px 30px rgba(30,40,80,0.10)',
          }}
        >
          {semana.map((d, i) => {
            const sel = i === dia
            const esDiaHoy = i === indiceHoy
            let estilo = { border: '1.5px solid transparent', background: 'transparent', color: '#15171C' }
            if (sel) estilo = { border: '1.5px solid #15171C', background: '#15171C', color: '#FFFFFF', boxShadow: '0 6px 16px rgba(21,23,28,0.3)' }
            else if (esDiaHoy) estilo = { border: '1.5px solid #15171C', background: 'rgba(255,255,255,0.6)', color: '#15171C' }
            else if (i < indiceHoy) estilo = { border: '1.5px solid transparent', background: 'transparent', color: '#4A4F5A' }
            // Rayitas: una por tarjeta (en el día elegido siguen el orden de la pila)
            let indices = d.tarjetas.map((t, k) => k).filter((k) => d.tarjetas[k].tipo !== 'vacio')
            if (sel && d.tarjetas[0].tipo !== 'vacio') indices = ordenActual.slice()
            indices = indices.slice(0, 4)
            const anillo = sel ? '#15171C' : esDiaHoy ? '#F4F5F9' : '#F6F7FA'
            return (
              <button
                key={i}
                onClick={() => elegirDia(i)}
                aria-label={DIAS[d.fecha.getDay()] + ' ' + d.fecha.getDate() + (esDiaHoy ? ', hoy' : '')}
                aria-pressed={sel}
                style={{ width: 44, padding: '8px 0', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', transition: 'background 0.3s, color 0.3s, box-shadow 0.3s, transform 0.2s', ...estilo }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: sel ? '#FFFFFF' : '#3B404B' }}>{DIAS_CORTOS[d.fecha.getDay()]}</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{d.fecha.getDate()}</span>
                <span aria-hidden="true" style={{ position: 'relative', display: 'block', width: 22, height: 14 }}>
                  {indices.map((k, p) => {
                    const ancho = 20 - p * 4
                    return (
                      <span
                        key={d.tarjetas[k].id}
                        style={{
                          position: 'absolute', height: 5, borderRadius: 3, top: p * 3, left: (22 - ancho) / 2, width: ancho, zIndex: 10 - p,
                          background: colorRayita(d.tarjetas[k].tipo, sel), boxShadow: '0 0 0 1.5px ' + anillo, opacity: 1 - p * 0.18,
                          transition: 'top 0.35s ' + ease + ', left 0.35s ' + ease + ', width 0.35s ' + ease + ', background 0.3s, opacity 0.3s',
                        }}
                      />
                    )
                  })}
                </span>
              </button>
            )
          })}
        </div>

        {/* Título del día + tarjetas apiladas */}
        <div className="entra" style={{ display: 'flex', flexDirection: 'column', gap: 8, animationDelay: '0.16s', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 4px' }}>
            <div key={dia} style={{ display: 'flex', gap: 9, alignItems: 'baseline', minWidth: 0, whiteSpace: 'nowrap', animation: 'titleIn 0.35s ease-out both' }}>
              <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', flexShrink: 0 }}>{tituloDia}</span>
              <span className="subtitulo" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{(rel ? rel + ' · ' : '') + cuenta}</span>
            </div>
            {!esHoy && (
              <button
                onClick={() => elegirDia(indiceHoy)}
                style={{ flexShrink: 0, whiteSpace: 'nowrap', minHeight: 40, padding: '0 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', color: '#15171C', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Volver a hoy
              </button>
            )}
          </div>

          <div style={{ position: 'relative', height: 248 }}>
            {tarjetas.map((t, i) => {
              const pos = ordenActual.indexOf(i)
              let transformar
              let opacidad = 1
              let transicion
              if (entrando) {
                transformar = 'translate3d(0,' + (pos * 25 + 40) + 'px,0) scale(' + (1 - pos * 0.06) + ')'
                opacidad = 0
                transicion = 'none'
              } else if (pos === 0) {
                const x = vuelo ? vuelo * 440 : dx
                transformar = 'translate3d(' + x + 'px,0,0) rotate(' + x / 16 + 'deg)'
                transicion = capturado ? 'none' : 'transform 0.42s ' + ease + ', opacity 0.3s'
              } else {
                transformar = 'translate3d(0,' + pos * 25 + 'px,0) scale(' + (1 - pos * 0.06) + ')'
                opacidad = pos >= 3 ? 0 : 1
                transicion = 'transform 0.5s ' + ease + ' ' + pos * 0.05 + 's, opacity 0.4s ' + pos * 0.05 + 's'
              }
              const A = ASPECTO[t.tipo]
              const adelante = pos === 0
              return (
                <div
                  key={t.id}
                  onPointerDown={adelante ? alApoyar : undefined}
                  onPointerMove={alMover}
                  onPointerUp={alSoltar}
                  onPointerCancel={alSoltar}
                  aria-hidden={!adelante}
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 220, borderRadius: 28, padding: 18, display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', transformOrigin: '50% 0', touchAction: 'pan-y', userSelect: 'none', WebkitUserSelect: 'none',
                    cursor: adelante ? 'grab' : 'default', backdropFilter: 'blur(30px) saturate(160%)', WebkitBackdropFilter: 'blur(30px) saturate(160%)',
                    ...A.caja, zIndex: 10 - pos, opacity: opacidad, transform: transformar, transition: transicion,
                    pointerEvents: adelante ? 'auto' : 'none',
                  }}
                >
                  {/* El contenido de las tarjetas de atrás se esconde para que no se transparente */}
                  <div style={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: adelante || entrando ? 1 : 0, transition: 'opacity 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="seccion" style={{ color: A.etiqueta }}>{t.etiqueta}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 11px', borderRadius: 999, ...A.chip }}>
                      {t.tipo === 'ideas' ? ideasPendientes + (ideasPendientes === 1 ? ' pendiente' : ' pendientes') : t.chip}
                    </span>
                  </div>
                  <ContenidoTarjeta
                    t={t}
                    ideas={ideasOrdenadas.slice(0, 3)}
                    totalIdeas={ideas.length}
                    tocarIdea={tocarIdea}
                    verIdeas={() => irA(4)}
                  />
                  </div>
                </div>
              )
            })}
          </div>

          {n > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {tarjetas.map((t, i) => (
                <span
                  key={t.id}
                  style={{ height: 7, borderRadius: 4, transition: 'width 0.35s ' + ease + ', background 0.35s', ...(i === ordenActual[0] ? { width: 22, background: '#15171C' } : { width: 7, background: 'rgba(21,23,28,0.25)' }) }}
                />
              ))}
            </div>
          )}
        </div>

        <Clima />
        <div style={{ minHeight: 2, flexShrink: 0 }} />
      </div>

      <MenuMas
        abierto={menu}
        onCerrar={() => setMenu(false)}
        onElegir={(accion) => {
          if (accion === 'recordatorio') { abrirRecordatorios(true); return }
          if (accion === 'copia') { setMenu(false); setCopia(true); return }
          setMenu(false)
          const destino = { evento: 1, prueba: 1, nota: 2, foto: 3, idea: 4 }[accion]
          irA(destino, accion)
        }}
      />
      <TuNombre
        abierta={pidiendoNombre}
        nombreActual={nombre}
        onGuardar={(n) => { setNombre(n); setPidiendoNombre(false) }}
        onCerrar={() => { if (nombre === null) setNombre(''); setPidiendoNombre(false) }}
      />
      <CopiaSeguridad abierta={copia} onCerrar={() => setCopia(false)} />
      <Recordatorios abierto={panelRec.abierto} enfocar={panelRec.enfocar} onCerrar={() => setPanelRec({ abierto: false, enfocar: false })} />
    </>
  )
}

// Lo de adentro de cada tarjeta, según su tipo
function ContenidoTarjeta({ t, ideas, totalIdeas, tocarIdea, verIdeas }) {
  if (t.tipo === 'evento') {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em' }}><TextoQueCorre texto={t.titulo} /></div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#D5D8DF' }}><TextoQueCorre texto={t.sub} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, fontWeight: 500, color: '#C9CCD4' }}>
          <Icono.Calendario tam={15} grosor={2} />
          <span>{t.pie}</span>
        </div>
      </>
    )
  }
  if (t.tipo === 'prueba') {
    return (
      <>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: '#C24E00', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 18px rgba(194,78,0,0.35)' }}>
            <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{t.numero}</span>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{t.unidad}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flexGrow: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}><TextoQueCorre texto={t.titulo} /></div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#4A2408' }}><TextoQueCorre texto={t.sub} /></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, fontWeight: 600, color: '#4A2408' }}>
          <Icono.Calendario tam={15} grosor={2} />
          <span>{t.pie}</span>
        </div>
      </>
    )
  }
  if (t.tipo === 'entrega') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1, justifyContent: 'center', paddingTop: 6 }}>
        {t.items.map((it) => (
          <div key={it.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ width: 8, height: 42, borderRadius: 4, flexShrink: 0, background: it.primero ? ACENTO : '#8E93A0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}><TextoQueCorre texto={it.t} /></div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B' }}>{it.s}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (t.tipo === 'vacio') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 19, fontWeight: 700 }}>Nada agendado</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B' }}>Tocá + para agregar algo a este día</span>
      </div>
    )
  }
  // Ideas
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'flex-start', marginTop: 4 }}>
      {ideas.map((g) => (
        <CasillaIdea key={g.id} idea={g} onTocar={() => tocarIdea(g.id)} enTarjeta>
          <span style={{ display: 'block', flexGrow: 1, minWidth: 0, fontSize: 15, fontWeight: 500, transition: 'color 0.25s', color: g.done ? '#4A4F5A' : '#15171C' }}>
            <TextoQueCorre texto={g.t}>
              <Tachado hecho={g.done}>{g.t}</Tachado>
            </TextoQueCorre>
          </span>
        </CasillaIdea>
      ))}
      {totalIdeas === 0 && <span style={{ fontSize: 14, fontWeight: 500, color: '#3B404B', padding: '8px 0' }}>No tenés ideas anotadas</span>}
      {(totalIdeas > 3 || totalIdeas === 0) && (
        <button
          onClick={verIdeas}
          style={{ alignSelf: 'flex-start', marginTop: 4, minHeight: 34, padding: '0 12px 0 14px', borderRadius: 17, border: 'none', background: 'rgba(26,53,150,0.10)', color: '#10246B', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
        >
          {totalIdeas === 0 ? 'Anotar una idea' : 'Ver todas las ideas (' + totalIdeas + ')'}
          <Icono.Derecha tam={14} grosor={2.4} />
        </button>
      )}
    </div>
  )
}
