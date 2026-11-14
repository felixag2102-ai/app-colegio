/*
  Pantalla AGENDA: calendario del mes con puntitos de colores por tipo.
  - Tocá un día para ver sus eventos.
  - "Agregar" abre una hoja: título, detalle, tipo y hora (reloj) o "Todo el día".
  - Tocá un evento para editarlo o borrarlo (también se borra deslizándolo a la izquierda).
  - El lápiz edita las categorías (nombre y color).
*/
import { useEffect, useRef, useState } from 'react'
import { useGuardado } from '../datos/guardado'
import { CATEGORIAS_AGENDA } from '../datos/iniciales'
import { MESES, DIAS, capitalizar, claveDia, difDias, hoy, minutosDe, nuevoId, pad2, relativo } from '../utilidades/fechas'
import HojaDeAbajo from '../componentes/HojaDeAbajo'
import EditorLista from '../componentes/EditorLista'
import RelojElegir from '../componentes/RelojElegir'
import FilaDeslizable from '../componentes/FilaDeslizable'
import * as Icono from '../componentes/Iconos'

const SIN_CATEGORIA = { name: 'Sin categoría', color: '#8E93A0' }

// Ordena por hora ("todo el día" va primero)
export const porHora = (a, b) => minutosDe(a.hora) - minutosDe(b.hora)

const estiloOpcion = (activa) =>
  activa
    ? { border: '1.5px solid #15171C', background: '#15171C', color: '#FFFFFF' }
    : { border: '1.5px solid rgba(21,23,28,0.14)', background: '#FFFFFF', color: '#15171C' }

export default function Agenda({ accion }) {
  const [eventos, setEventos] = useGuardado('eventos', [])
  const [categorias, setCategorias] = useGuardado('categoriasAgenda', CATEGORIAS_AGENDA)
  const h0 = hoy()
  const [mes, setMes] = useState({ a: h0.getFullYear(), m: h0.getMonth() })
  const [dia, setDia] = useState(h0.getDate())
  const [giro, setGiro] = useState({ n: 0, dir: 'R' }) // animación al cambiar de mes
  const [cambioDia, setCambioDia] = useState(0) // animación al cambiar de día
  const [hoja, setHoja] = useState(false)
  const [form, setForm] = useState({ titulo: '', detalle: '', tipo: 'evento', todoElDia: true, h: 17, m: 30, editarId: null })
  const [reloj, setReloj] = useState(false)
  const [editando, setEditando] = useState(false)
  const [recien, setRecien] = useState(null)
  const campoTitulo = useRef(null)
  const lista = useRef(null)

  // Cuando agregás un evento, la pantalla baja sola hasta la lista para que lo veas
  useEffect(() => {
    if (!recien) return
    const t = setTimeout(() => lista.current && lista.current.scrollIntoView({ behavior: 'smooth', block: 'end' }), 450)
    return () => clearTimeout(t)
  }, [recien])

  const categoriaDe = (key) => categorias.find((c) => c.key === key) || { key, ...SIN_CATEGORIA }

  const abrirAgregar = (tipo) => {
    const existe = (k) => categorias.some((c) => c.key === k)
    const t = existe(tipo) ? tipo : existe('evento') ? 'evento' : (categorias[0] || {}).key
    const esPrueba = tipo === 'prueba'
    setForm({ titulo: '', detalle: '', tipo: t, todoElDia: !esPrueba, h: esPrueba ? 8 : 17, m: esPrueba ? 0 : 30, editarId: null })
    setHoja(true)
    setTimeout(() => campoTitulo.current && campoTitulo.current.focus(), 420)
  }

  // Si vinimos desde el "+" del Inicio, abrimos la hoja directamente
  useEffect(() => {
    if (accion === 'evento' || accion === 'prueba') abrirAgregar(accion)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accion])

  const fechaElegida = new Date(mes.a, mes.m, dia)
  const clave = claveDia(fechaElegida)

  // Abre la hoja con los datos de un evento que ya existe
  const abrirEditar = (e) => {
    const [h, m] = e.hora ? e.hora.split(':').map(Number) : [17, 30]
    setForm({ titulo: e.titulo, detalle: e.detalle || '', tipo: e.tipo, todoElDia: !e.hora, h, m, editarId: e.id })
    setHoja(true)
  }

  const borrarEditado = () => {
    setEventos(eventos.filter((x) => x.id !== form.editarId))
    setHoja(false)
  }

  const guardar = () => {
    const titulo = form.titulo.trim()
    if (!titulo) return
    if (form.editarId) {
      // Editar: reemplazamos el evento, conservando su id y su fecha
      setEventos(eventos.map((x) => (x.id === form.editarId
        ? { ...x, titulo, detalle: form.detalle.trim(), tipo: form.tipo, hora: form.todoElDia ? null : form.h + ':' + pad2(form.m) }
        : x)))
      setRecien(form.editarId)
      setHoja(false)
      return
    }
    const nuevo = {
      id: nuevoId(),
      fecha: clave,
      hora: form.todoElDia ? null : form.h + ':' + pad2(form.m),
      titulo,
      detalle: form.detalle.trim(),
      tipo: form.tipo,
    }
    setEventos(eventos.concat([nuevo]))
    setRecien(nuevo.id)
    setHoja(false)
  }

  // Armado de la grilla del mes
  const primerDia = new Date(mes.a, mes.m, 1).getDay()
  const huecos = (primerDia + 6) % 7 // la semana empieza el lunes
  const diasDelMes = new Date(mes.a, mes.m + 1, 0).getDate()
  const delMes = {}
  eventos.forEach((e) => {
    const [a, m] = e.fecha.split('-').map(Number)
    if (a === mes.a && m - 1 === mes.m) (delMes[e.fecha] = delMes[e.fecha] || []).push(e)
  })

  const celdas = []
  for (let b = 0; b < huecos; b++) celdas.push(<span key={'h' + b} style={{ height: 36 }} />)
  for (let d = 1; d <= diasDelMes; d++) {
    const fecha = new Date(mes.a, mes.m, d)
    const evs = delMes[claveDia(fecha)] || []
    const elegido = d === dia
    const esHoy = difDias(h0, fecha) === 0
    const finde = (huecos + d - 1) % 7 >= 5
    let estilo = { background: 'transparent', color: finde ? '#4A4F5A' : '#15171C' }
    if (elegido) estilo = { background: '#15171C', color: '#FFFFFF', boxShadow: '0 6px 14px rgba(21,23,28,0.28)' }
    else if (esHoy) estilo = { background: 'rgba(255,255,255,0.9)', color: '#15171C', boxShadow: 'inset 0 0 0 1.5px #15171C' }
    // un puntito por cada tipo distinto (máximo 3)
    const vistos = {}
    const puntos = []
    evs.forEach((e) => {
      if (vistos[e.tipo] || puntos.length >= 3) return
      vistos[e.tipo] = true
      const c = categoriaDe(e.tipo).color
      puntos.push(elegido && c === '#15171C' ? '#FFFFFF' : c)
    })
    celdas.push(
      <button
        key={d}
        onClick={() => { setDia(d); setCambioDia((n) => n + 1) }}
        aria-label={d + ' de ' + MESES[mes.m] + (evs.length ? ', ' + evs.length + (evs.length === 1 ? ' evento' : ' eventos') : '') + (esHoy ? ', hoy' : '')}
        aria-pressed={elegido}
        style={{
          height: 36, margin: '0 2px', borderRadius: 12, border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 3, cursor: 'pointer', padding: 0, transition: 'background 0.25s, color 0.25s, box-shadow 0.25s', ...estilo,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{d}</span>
        <span style={{ display: 'flex', gap: 2, height: 5 }}>
          {puntos.map((c, k) => <span key={k} style={{ width: 5, height: 5, borderRadius: 3, transition: 'background 0.3s', background: c }} />)}
        </span>
      </button>
    )
  }

  const cambiarMes = (delta) => {
    const nuevo = new Date(mes.a, mes.m + delta, 1)
    const esMesDeHoy = nuevo.getFullYear() === h0.getFullYear() && nuevo.getMonth() === h0.getMonth()
    setMes({ a: nuevo.getFullYear(), m: nuevo.getMonth() })
    setDia(esMesDeHoy ? h0.getDate() : 1)
    setGiro((g) => ({ n: g.n + 1, dir: delta > 0 ? 'R' : 'L' }))
    setCambioDia((n) => n + 1)
  }

  const irAHoy = () => {
    const otroMes = mes.a !== h0.getFullYear() || mes.m !== h0.getMonth()
    if (otroMes) setGiro((g) => ({ n: g.n + 1, dir: new Date(mes.a, mes.m, 1) > h0 ? 'L' : 'R' }))
    setMes({ a: h0.getFullYear(), m: h0.getMonth() })
    setDia(h0.getDate())
    setCambioDia((n) => n + 1)
  }

  const delDia = (delMes[clave] || []).slice().sort(porHora)
  const huerfanos = eventos.some((e) => !categorias.some((c) => c.key === e.tipo))
  const leyenda = categorias.concat(huerfanos ? [{ key: '_', ...SIN_CATEGORIA }] : [])
  const tituloDia = DIAS[fechaElegida.getDay()] + ' ' + dia + ' de ' + MESES[mes.m]
  const cuantos = delDia.length + (delDia.length === 1 ? ' cosa' : ' cosas')

  const botonMes = { width: 38, height: 38, borderRadius: 19, border: 'none', background: 'rgba(21,23,28,0.06)', color: '#15171C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }

  return (
    <>
      <div className="pantalla">
        <div className="entra" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#3B404B', padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.85)' }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: '#8E93A0' }} />Google Calendar · sin conectar
            </span>
            <h1 className="titulo">Agenda</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn-circulo" onClick={() => setEditando(true)} aria-label="Editar nombres y colores de las categorías"><Icono.Lapiz tam={19} /></button>
            <button className="btn-negro" onClick={irAHoy}>Hoy</button>
          </div>
        </div>

        <div className="vidrio entra" style={{ borderRadius: 28, padding: '10px 10px 12px 10px', display: 'flex', flexDirection: 'column', gap: 4, animationDelay: '0.08s', flexShrink: 0, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 16px 36px rgba(30,40,80,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => cambiarMes(-1)} aria-label="Mes anterior" style={botonMes}><Icono.Izquierda tam={18} grosor={2.4} /></button>
            <span aria-live="polite" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{capitalizar(MESES[mes.m])} {mes.a}</span>
            <button onClick={() => cambiarMes(1)} aria-label="Mes siguiente" style={botonMes}><Icono.Derecha tam={18} grosor={2.4} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', fontSize: 11, fontWeight: 700, color: '#3B404B', textAlign: 'center' }}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((l, i) => <span key={i}>{l}</span>)}
          </div>
          <div
            key={giro.n}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', rowGap: 2, animation: giro.n ? 'month' + giro.dir + '1 0.38s cubic-bezier(.22,1,.36,1) both' : undefined }}
          >
            {celdas}
          </div>
          <button
            onClick={() => setEditando(true)}
            aria-label="Editar las categorías de colores"
            style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', whiteSpace: 'nowrap', gap: 12, padding: '10px 4px 0 4px', margin: 0, border: 'none', borderTop: '1px solid rgba(21,23,28,0.08)', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            {leyenda.map((c) => (
              <span key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#3B404B' }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, transition: 'background 0.3s', background: c.color }} />{c.name || 'Sin nombre'}
              </span>
            ))}
          </button>
        </div>

        <div className="entra" style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, animationDelay: '0.16s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '0 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>{tituloDia}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3B404B' }}>{relativo(difDias(h0, fechaElegida))} · {cuantos}</span>
            </div>
            <button
              onClick={() => abrirAgregar('evento')}
              style={{ flexShrink: 0, minHeight: 40, padding: '0 14px 0 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 6px 16px rgba(30,40,80,0.10)', color: '#15171C', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Icono.Mas tam={16} grosor={2.6} />Agregar
            </button>
          </div>
          <div key={cambioDia} ref={lista} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12, animation: 'listA 0.32s ease-out backwards' }}>
            {delDia.length === 0 && (
              <div style={{ borderRadius: 22, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center', border: '2px dashed rgba(21,23,28,0.18)', background: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Nada agendado</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B' }}>Día libre, por ahora</span>
              </div>
            )}
            {delDia.map((e) => {
              const cat = categoriaDe(e.tipo)
              return (
                <FilaDeslizable
                  key={e.id}
                  onBorrar={() => setEventos((lista) => lista.filter((x) => x.id !== e.id))}
                  margenRojo={0}
                  radioRojo={22}
                  estilo={{ borderRadius: 22, animation: e.id === recien ? 'rowNew 0.4s cubic-bezier(.34,1.4,.64,1) both' : undefined }}
                >
                  <button
                    className="vidrio"
                    onClick={() => abrirEditar(e)}
                    aria-label={'Editar ' + e.titulo}
                    style={{ width: '100%', borderRadius: 22, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', color: '#15171C', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 6px 16px rgba(30,40,80,0.08)' }}
                  >
                    <span style={{ width: 44, flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#2B2F38' }}>{e.hora || 'Todo'}</span>
                    <span style={{ width: 4, height: 36, borderRadius: 2, flexShrink: 0, transition: 'background 0.3s', background: cat.color }} />
                    <span style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.titulo}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#3B404B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.detalle || cat.name}</span>
                    </span>
                    <Icono.Lapiz tam={15} estilo={{ flexShrink: 0, color: '#8E93A0' }} />
                  </button>
                </FilaDeslizable>
              )
            })}
            {delDia.length > 0 && (
              <span style={{ textAlign: 'center', fontSize: 11, fontWeight: 500, color: '#4A4F5A', padding: '2px 0 6px 0' }}>Tocá para editar · deslizá a la izquierda para borrar</span>
            )}
          </div>
        </div>
      </div>

      <HojaDeAbajo
        abierta={hoja}
        onCerrar={() => setHoja(false)}
        etiqueta={form.editarId ? 'Editar evento' : 'Nuevo evento'}
        encabezado={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{form.editarId ? 'Editar evento' : 'Nuevo evento'}</h2>
            <span className="subtitulo">{tituloDia}</span>
          </div>
        }
      >
        <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="etiqueta">
            Qué es
            <input
              ref={campoTitulo}
              className="campo"
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') guardar() }}
              placeholder={form.tipo === 'prueba' ? 'Ej: Prueba de Historia' : 'Ej: Entrenamiento de rugby'}
            />
          </label>
          <label className="etiqueta">
            Detalle (opcional)
            <input
              className="campo"
              type="text"
              value={form.detalle}
              onChange={(e) => setForm({ ...form, detalle: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') guardar() }}
              placeholder={form.tipo === 'prueba' ? 'Ej: Revolución de Mayo' : 'Ej: Aula 12'}
            />
          </label>
          <div role="group" aria-label="Tipo" className="etiqueta">
            Tipo
            <div className="chips">
              {categorias.map((c) => {
                const activa = c.key === form.tipo
                return (
                  <button
                    key={c.key}
                    className="chip"
                    aria-pressed={activa}
                    onClick={() => setForm({ ...form, tipo: c.key })}
                    style={{ padding: '0 12px 0 10px', ...(activa ? { borderColor: c.color, background: c.color, color: '#FFFFFF' } : null) }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: 5, background: activa ? '#FFFFFF' : c.color }} />
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div role="group" aria-label="Hora" className="etiqueta">
            Hora
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setReloj(true)}
                aria-pressed={!form.todoElDia}
                style={{ flex: '1 1 0', minHeight: 52, borderRadius: 26, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 0.25s, color 0.25s, border-color 0.25s, transform 0.2s', ...estiloOpcion(!form.todoElDia) }}
              >
                <Icono.Reloj tam={17} />{form.todoElDia ? 'Seleccionar hora' : form.h + ':' + pad2(form.m)}
              </button>
              <button
                onClick={() => setForm({ ...form, todoElDia: true })}
                aria-pressed={form.todoElDia}
                style={{ flex: '1 1 0', minHeight: 52, borderRadius: 26, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 0.25s, color 0.25s, border-color 0.25s, transform 0.2s', ...estiloOpcion(form.todoElDia) }}
              >
                <Icono.Sol tam={17} />Todo el día
              </button>
            </div>
          </div>
        </div>
        <div className="fila-botones">
          {form.editarId
            ? <button className="btn-borrar" onClick={borrarEditado}>Borrar</button>
            : <button className="btn-gris" onClick={() => setHoja(false)} style={{ fontWeight: 700 }}>Cancelar</button>}
          <button className={'btn-principal' + (form.titulo.trim() ? '' : ' apagado')} onClick={guardar}>{form.editarId ? 'Guardar cambios' : 'Guardar evento'}</button>
        </div>
      </HojaDeAbajo>

      <RelojElegir
        abierto={reloj}
        titulo="Elegí la hora"
        inicial={{ h: form.h, m: form.m }}
        onCancelar={() => setReloj(false)}
        onListo={(d, h, m) => { setForm((f) => ({ ...f, h, m, todoElDia: false })); setReloj(false) }}
      />

      <EditorLista
        abierto={editando}
        onCerrar={() => setEditando(false)}
        titulo="Editar categorías"
        nota="Son los colores de los puntitos del calendario. Tocá un color para cambiarlo, escribí el nombre que quieras o borrá la categoría."
        items={categorias}
        onCambiar={setCategorias}
        aviso={(c) => {
          const n = eventos.filter((e) => e.tipo === c.key).length
          return n ? (n === 1 ? 'Su evento queda en gris, sin categoría.' : 'Sus ' + n + ' eventos quedan en gris, sin categoría.') : ''
        }}
      />
    </>
  )
}
