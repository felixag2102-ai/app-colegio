/*
  Pantalla BOLETÍN: promedios por materia.
  - "Cargar nota" abre una hoja con una rueda tipo alarma de iPhone (1–10 y ,0/,5).
  - Tocar una nota para editarla o borrarla.
  - Lápiz para editar, agregar o borrar materias.
*/
import { useEffect, useState } from 'react'
import { useGuardado } from '../datos/guardado'
import { MATERIAS } from '../datos/iniciales'
import { COLORES } from '../utilidades/colores'
import { nuevoId } from '../utilidades/fechas'
import { CURSO } from '../config'
import HojaDeAbajo from '../componentes/HojaDeAbajo'
import EditorLista from '../componentes/EditorLista'
import Rueda from '../componentes/Rueda'
import Aviso, { useAviso } from '../componentes/Aviso'
import * as Icono from '../componentes/Iconos'

// 8.5 → "8,5"   9 → "9"
export function formatoNota(x) {
  const r = Math.round(x * 10) / 10
  return (r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)).replace('.', ',')
}
export function promedio(notas) {
  if (!notas.length) return 0
  return notas.reduce((suma, g) => suma + g.n, 0) / notas.length
}
// Verde si es 8 o más, amarillo de 6 a 8, rojo si es menos de 6
export function estiloNota(x) {
  if (x >= 8) return { color: '#0B5E48', background: 'rgba(20,163,127,0.16)' }
  if (x >= 6) return { color: '#6E4700', background: 'rgba(230,160,0,0.20)' }
  return { color: '#9E1F17', background: 'rgba(217,58,43,0.14)' }
}

const ENTEROS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const DECIMALES = [',0', ',5']

export default function Boletin({ accion }) {
  const [materias, setMaterias] = useGuardado('materias', MATERIAS)
  const [abierta, setAbierta] = useState(0) // materia desplegada (-1 = ninguna)
  const [cerrandoMateria, setCerrandoMateria] = useState(false)
  const [hoja, setHoja] = useState(false)
  const [form, setForm] = useState({ materia: 0, nota: 8, tema: '', editar: null })
  const [guardadas, setGuardadas] = useState(0) // para la animación del promedio
  const [editando, setEditando] = useState(false)
  const { aviso, mostrarAviso } = useAviso()

  const abrirHoja = (cambios) => {
    setForm({ materia: 0, nota: 8, tema: '', editar: null, ...cambios })
    setHoja(true)
  }

  useEffect(() => {
    if (accion === 'nota') abrirHoja({})
  }, [accion])

  // Cálculos de promedios
  let total = 0
  let suma = 0
  let conNotas = 0
  let mejor = null
  materias.forEach((m) => {
    total += m.grades.length
    if (m.grades.length) {
      const p = promedio(m.grades)
      suma += p
      conNotas++
      if (!mejor || p > mejor.p) mejor = { name: m.name, p }
    }
  })
  const general = conNotas ? suma / conNotas : 0

  const tocarMateria = (i) => {
    if (abierta === i) {
      setCerrandoMateria(true)
      setTimeout(() => { setAbierta(-1); setCerrandoMateria(false) }, 200)
    } else setAbierta(i)
  }

  const indiceForm = Math.min(form.materia, materias.length - 1)

  const guardar = () => {
    const idx = indiceForm
    const nota = { id: form.editar ? form.editar.id : nuevoId(), n: form.nota, t: form.tema.trim() || 'Prueba' }
    const nuevas = materias.map((m, i) => {
      let notas = m.grades
      if (form.editar && m.id === form.editar.materiaId) {
        notas = i === idx ? notas.map((x) => (x.id === form.editar.id ? nota : x)) : notas.filter((x) => x.id !== form.editar.id)
      }
      if (i === idx && !(form.editar && m.id === form.editar.materiaId)) notas = notas.concat([nota])
      return notas === m.grades ? m : { ...m, grades: notas }
    })
    setMaterias(nuevas)
    setHoja(false)
    setAbierta(idx)
    setGuardadas((n) => n + 1)
    mostrarAviso((form.editar ? 'Cambiada · ' : 'Guardada · ') + nuevas[idx].name + ' ahora tiene ' + formatoNota(promedio(nuevas[idx].grades)))
  }

  const borrarNota = () => {
    if (!form.editar) return
    const m = materias.find((x) => x.id === form.editar.materiaId)
    setMaterias(materias.map((x) => (x.id === form.editar.materiaId ? { ...x, grades: x.grades.filter((g) => g.id !== form.editar.id) } : x)))
    setHoja(false)
    setGuardadas((n) => n + 1)
    mostrarAviso('Borraste la nota de ' + (m ? m.name : 'la materia'))
  }

  const n = form.nota
  const entero = Math.floor(n)

  return (
    <>
      <div className="pantalla">
        <div className="entra" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <p className="subtitulo">{CURSO}</p>
            <h1 className="titulo">Boletín</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn-circulo" onClick={() => setEditando(true)} aria-label="Editar nombres y colores de las materias"><Icono.Lapiz tam={19} /></button>
            <button className="btn-negro" onClick={() => abrirHoja({ materia: Math.max(0, abierta) })}><Icono.Mas tam={16} grosor={2.6} />Cargar nota</button>
          </div>
        </div>

        <div className="vidrio-oscuro entra" style={{ borderRadius: 28, padding: 18, display: 'flex', alignItems: 'center', gap: 16, animationDelay: '0.06s', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
            <span className="seccion" style={{ color: '#C9CCD4' }}>PROMEDIO GENERAL</span>
            <span key={guardadas} style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, alignSelf: 'flex-start', animation: guardadas ? 'bumpA 0.45s ease-out' : undefined }}>
              {conNotas ? formatoNota(general) : '–'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#D5D8DF' }}>{total} {total === 1 ? 'nota' : 'notas'} en {materias.length} materias</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#C9CCD4' }}>Mejor materia</span>
            <span style={{ fontSize: 14, fontWeight: 700, background: 'rgba(255,255,255,0.14)', padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {mejor ? mejor.name + ' ' + formatoNota(mejor.p) : '–'}
            </span>
          </div>
        </div>

        <div className="vidrio entra" style={{ flex: '0 1 auto', minHeight: 0, overflowY: 'auto', marginBottom: 4, borderRadius: 28, padding: 6, animationDelay: '0.12s' }}>
          {materias.map((m, i) => {
            const tiene = m.grades.length > 0
            const p = promedio(m.grades)
            const estaAbierta = abierta === i
            return (
              <div key={m.id} style={{ borderRadius: 22, transition: 'background 0.3s', background: estaAbierta ? 'rgba(21,23,28,0.05)' : undefined }}>
                <button
                  onClick={() => tocarMateria(i)}
                  aria-expanded={estaAbierta}
                  style={{ width: '100%', minHeight: 56, border: 'none', background: 'transparent', borderRadius: 22, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: '#15171C', textAlign: 'left' }}
                >
                  <span style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#FFFFFF', transition: 'background 0.3s', background: m.color }}>
                    {(m.name || '?').charAt(0).toUpperCase()}
                  </span>
                  <span style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name || 'Sin nombre'}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#3B404B' }}>{m.grades.length} {m.grades.length === 1 ? 'nota' : 'notas'}</span>
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, padding: '6px 12px', borderRadius: 999, ...(tiene ? estiloNota(p) : { color: '#3B404B', background: 'rgba(21,23,28,0.06)' }) }}>
                    {tiene ? formatoNota(p) : '–'}
                  </span>
                  <Icono.Abajo tam={16} grosor={2.4} estilo={{ flexShrink: 0, color: '#3B404B', transition: 'transform 0.3s', transform: estaAbierta ? 'rotate(180deg)' : undefined }} />
                </button>
                {estaAbierta && (
                  <div style={{ padding: '0 12px 12px 60px', display: 'flex', flexDirection: 'column', gap: 6, animation: cerrandoMateria ? 'exUp 0.2s ease-in forwards' : 'expand 0.3s ease-out both' }}>
                    {m.grades.slice().reverse().map((g) => (
                      <button
                        key={g.id}
                        onClick={() => abrirHoja({ editar: { materiaId: m.id, id: g.id }, materia: i, nota: g.n, tema: g.t })}
                        aria-label={'Editar nota ' + formatoNota(g.n) + ' de ' + g.t}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, minHeight: 40, margin: '0 -8px', padding: '0 8px', border: 'none', borderRadius: 12, background: 'transparent', fontSize: 14, fontWeight: 500, color: '#2B2F38', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <span style={{ flexGrow: 1, minWidth: 0 }}>{g.t}</span>
                        <span style={{ fontWeight: 700, padding: '3px 10px', borderRadius: 999, ...estiloNota(g.n) }}>{formatoNota(g.n)}</span>
                        <Icono.Lapiz tam={14} estilo={{ color: '#4A4F5A' }} />
                      </button>
                    ))}
                    {!tiene && <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B' }}>Todavía no cargaste notas acá</span>}
                    <button
                      onClick={() => abrirHoja({ materia: i })}
                      style={{ alignSelf: 'flex-start', minHeight: 36, padding: '0 12px', marginTop: 2, borderRadius: 18, border: '1.5px solid rgba(21,23,28,0.14)', background: '#FFFFFF', color: '#15171C', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <Icono.Mas tam={14} grosor={2.6} />Cargar nota de {m.name || 'esta materia'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Aviso {...aviso} />

      <HojaDeAbajo
        abierta={hoja}
        onCerrar={() => setHoja(false)}
        etiqueta={form.editar ? 'Editar nota' : 'Cargar nota'}
        relleno="10px 20px 28px 20px"
        separacion={16}
        encabezado={<h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{form.editar ? 'Editar nota' : 'Cargar nota'}</h2>}
      >
        <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div role="group" aria-label="Materia" className="etiqueta">
            Materia
            <div className="chips">
              {materias.map((m, i) => (
                <button
                  key={m.id}
                  className="chip"
                  aria-pressed={i === indiceForm}
                  onClick={() => setForm({ ...form, materia: i })}
                  style={i === indiceForm ? { borderColor: m.color, background: m.color, color: '#FFFFFF' } : undefined}
                >
                  {m.name || 'Sin nombre'}
                </button>
              ))}
            </div>
          </div>

          <div className="etiqueta">
            Nota
            <div style={{ position: 'relative', height: 200, borderRadius: 22, background: '#F2F3F7', overflow: 'hidden', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingLeft: 36 }}>
              <div aria-hidden="true" style={{ position: 'absolute', left: 10, right: 10, top: 80, height: 40, borderRadius: 12, transition: 'background 0.3s', background: estiloNota(n).background }} />
              <Rueda
                etiquetas={ENTEROS}
                indice={entero - 1}
                etiquetaAria="Nota, número entero"
                onElegir={(i) => setForm((f) => ({ ...f, nota: i === 9 ? 10 : i + 1 + (f.nota % 1) }))}
              />
              <Rueda
                etiquetas={DECIMALES}
                indice={n % 1 ? 1 : 0}
                ancho={64}
                alinear="flex-start"
                etiquetaAria="Nota, decimal"
                onElegir={(i) => setForm((f) => { const e = Math.floor(f.nota); return { ...f, nota: e === 10 ? 10 : e + (i ? 0.5 : 0) } })}
              />
              <span aria-live="polite" style={{ position: 'absolute', right: 18, top: 89, fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 999, transition: 'background 0.3s, color 0.3s', ...estiloNota(n) }}>
                {n >= 8 ? 'Muy bien' : n >= 6 ? 'Aprobado' : 'Desaprobado'}
              </span>
            </div>
          </div>

          <label className="etiqueta">
            Tema de la prueba
            <input className="campo" type="text" value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value })} placeholder="Ej: Revolución de Mayo" />
          </label>
        </div>

        <div className="fila-botones">
          {form.editar
            ? <button className="btn-borrar" onClick={borrarNota}>Borrar</button>
            : <button className="btn-gris" onClick={() => setHoja(false)}>Cancelar</button>}
          <button className="btn-principal" onClick={guardar}>{form.editar ? 'Guardar cambios' : 'Guardar nota'}</button>
        </div>
      </HojaDeAbajo>

      <EditorLista
        abierto={editando}
        onCerrar={() => setEditando(false)}
        titulo="Editar materias"
        nota="Tocá el color de cada materia para cambiarlo, escribí el nombre que quieras o borrala."
        items={materias}
        onCambiar={setMaterias}
        textoAgregar="Agregar materia"
        crear={(cant) => ({ id: nuevoId(), name: 'Nueva materia', color: COLORES[cant % COLORES.length], grades: [] })}
        aviso={(m) => (m.grades.length ? 'También se borran sus ' + (m.grades.length === 1 ? 'nota.' : m.grades.length + ' notas.') : '')}
        onBorrar={(i) => { setMaterias(materias.filter((x, j) => j !== i)); setAbierta(-1) }}
      />
    </>
  )
}

