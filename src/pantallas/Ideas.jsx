/*
  Pantalla IDEAS: lista de cosas que quiero hacer.
  - Agregar una idea (va a la categoría del filtro elegido).
  - Tocarla para tacharla. Las tachadas se borran deslizando a la izquierda.
  - Filtrar por categoría y editar categorías con el lápiz.
*/
import { useEffect, useRef, useState } from 'react'
import { useGuardado } from '../datos/guardado'
import { CATEGORIAS_IDEAS } from '../datos/iniciales'
import { COLORES } from '../utilidades/colores'
import { nuevoId } from '../utilidades/fechas'
import FilaDeslizable from '../componentes/FilaDeslizable'
import EditorLista from '../componentes/EditorLista'
import * as Icono from '../componentes/Iconos'

const SIN_CATEGORIA = { id: 'none', name: 'Sin categoría', color: '#8E93A0' }

export default function Ideas({ accion }) {
  const [ideas, setIdeas] = useGuardado('ideas', [])
  const [categorias, setCategorias] = useGuardado('categoriasIdeas', CATEGORIAS_IDEAS)
  const [filtro, setFiltro] = useState('all')
  const [borrador, setBorrador] = useState('')
  const [recien, setRecien] = useState(null)
  const [editando, setEditando] = useState(false)
  const campo = useRef(null)

  // Si vinimos desde el menú "+" del Inicio, enfocamos el campo para escribir
  useEffect(() => {
    if (accion === 'idea') setTimeout(() => campo.current && campo.current.focus(), 300)
  }, [accion])

  const categoriaDe = (id) => categorias.find((c) => c.id === id) || SIN_CATEGORIA
  const filtroOk = filtro === 'all' || categorias.some((c) => c.id === filtro) ? filtro : 'all'

  const agregar = () => {
    const t = borrador.trim()
    if (!t) return
    const id = nuevoId()
    setIdeas([{ id, t, c: filtroOk === 'all' ? 'none' : filtroOk, done: false }].concat(ideas))
    setBorrador('')
    setRecien(id)
  }

  let visibles = ideas.filter((it) => filtroOk === 'all' || it.c === filtroOk)
  visibles = visibles.filter((it) => !it.done).concat(visibles.filter((it) => it.done)) // primero las pendientes
  const hechas = ideas.filter((it) => it.done).length

  const filtros = [{ id: 'all', name: 'Todas', color: null }].concat(categorias)

  return (
    <>
      <div className="pantalla">
        <div className="entra" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <p className="subtitulo">{hechas} de {ideas.length} hechas</p>
            <h1 className="titulo">Ideas</h1>
          </div>
          <button className="btn-circulo" onClick={() => setEditando(true)} aria-label="Editar nombres y colores de las categorías">
            <Icono.Lapiz tam={19} />
          </button>
        </div>

        <div className="vidrio entra" style={{ display: 'flex', gap: 8, padding: 5, borderRadius: 22, animationDelay: '0.06s', flexShrink: 0 }}>
          <input
            ref={campo}
            type="text"
            aria-label="Nueva idea"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') agregar() }}
            placeholder="Anotá una idea…"
            style={{ flexGrow: 1, minWidth: 0, minHeight: 44, border: 'none', background: 'transparent', padding: '0 10px', fontSize: 16, fontWeight: 500, color: '#15171C', outline: 'none' }}
          />
          <button
            onClick={agregar}
            aria-label="Agregar idea"
            className={borrador.trim() ? '' : 'apagado'}
            style={{ width: 44, height: 44, borderRadius: 16, border: 'none', background: '#15171C', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.2s' }}
          >
            <Icono.Mas tam={20} grosor={2.6} />
          </button>
        </div>

        <div role="group" aria-label="Filtrar por categoría" className="entra" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, animationDelay: '0.1s' }}>
          {filtros.map((c) => {
            const elegido = filtroOk === c.id
            return (
              <button
                key={c.id}
                onClick={() => setFiltro(c.id)}
                aria-pressed={elegido}
                style={{
                  minHeight: 36, padding: '0 14px', borderRadius: 18, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: 6, whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.25s, color 0.25s',
                  ...(elegido
                    ? { border: '1.5px solid #15171C', background: '#15171C', color: '#FFFFFF' }
                    : { border: '1.5px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.78)', color: '#15171C' }),
                }}
              >
                {c.color && <span style={{ width: 8, height: 8, borderRadius: 4, background: c.color, transition: 'background 0.3s' }} />}
                {c.name || 'Sin nombre'}
              </button>
            )
          })}
        </div>

        <div className="vidrio entra" style={{ flex: '0 1 auto', minHeight: 0, overflowY: 'auto', marginBottom: 4, borderRadius: 24, padding: '2px 12px', animationDelay: '0.14s' }}>
          {visibles.map((it, idx) => {
            const cat = categoriaDe(it.c)
            return (
              <FilaDeslizable
                key={it.id}
                habilitada={it.done}
                onBorrar={() => setIdeas((lista) => lista.filter((x) => x.id !== it.id))}
                estilo={{ borderTop: idx ? '1px solid rgba(21,23,28,0.07)' : undefined, animation: it.id === recien ? 'rowIn 0.4s cubic-bezier(.22,1,.36,1) both' : undefined }}
                estiloFrente={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <CasillaIdea idea={it} onTocar={() => setIdeas((lista) => lista.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))} />
                <span role="img" aria-label={cat.name} style={{ width: 9, height: 9, borderRadius: 5, flexShrink: 0, background: cat.color, transition: 'background 0.3s' }} />
                {it.done && (
                  <span role="img" aria-label="Deslizá a la izquierda para eliminar" style={{ flexShrink: 0, color: '#8E93A0', display: 'flex' }}>
                    <Icono.DobleIzquierda tam={15} />
                  </span>
                )}
              </FilaDeslizable>
            )
          })}
          {visibles.length === 0 && (
            <div style={{ padding: '18px 4px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#3B404B' }}>Todavía no hay ideas acá</div>
          )}
        </div>
      </div>

      <EditorLista
        abierto={editando}
        onCerrar={() => setEditando(false)}
        titulo="Editar categorías"
        nota="Cambiá el nombre y el color de la categoría de tus ideas."
        items={categorias}
        onCambiar={setCategorias}
        textoAgregar="Agregar categoría"
        agregarAntesDeFija
        minimo={0}
        crear={(n) => ({ id: 'cat-' + nuevoId(), name: 'Nueva categoría', color: COLORES[(n + 3) % COLORES.length] })}
        aviso={(cat) => {
          const n = ideas.filter((x) => x.c === cat.id).length
          return n ? (n === 1 ? 'Su idea pasa a Sin categoría.' : 'Sus ' + n + ' ideas pasan a Sin categoría.') : ''
        }}
        onBorrar={(i) => {
          const ida = categorias[i]
          setCategorias(categorias.filter((x, j) => j !== i))
          setIdeas(ideas.map((x) => (x.c === ida.id ? { ...x, c: 'none' } : x)))
          if (filtro === ida.id) setFiltro('all')
        }}
      />
    </>
  )
}

// La casilla + el texto de una idea (también se usa en la tarjeta del Inicio)
export function CasillaIdea({ idea, onTocar, enTarjeta = false, children }) {
  const hecha = !!idea.done
  return (
    <button
      role="checkbox"
      aria-checked={hecha}
      onClick={onTocar}
      style={{
        flexGrow: 1, minWidth: 0, minHeight: enTarjeta ? 38 : 48, padding: enTarjeta ? 0 : '9px 0', border: 'none', background: 'transparent',
        display: 'flex', gap: enTarjeta ? 12 : 11, alignItems: 'center', cursor: 'pointer', textAlign: 'left', color: 'inherit', width: enTarjeta ? '100%' : undefined,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: enTarjeta ? 26 : 24, height: enTarjeta ? 26 : 24, borderRadius: enTarjeta ? 9 : 8, flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
          ...(hecha
            ? { background: '#1A3596', border: '2px solid #1A3596', boxShadow: '0 4px 12px rgba(26,53,150,0.35)' }
            : { background: 'rgba(255,255,255,0.8)', border: '2px solid rgba(16,36,107,0.32)', boxShadow: 'inset 0 1px 2px rgba(16,36,107,0.08)' }),
        }}
      >
        {hecha && (
          <span style={{ display: 'flex', color: '#FFFFFF', animation: 'pop 0.3s ease-out' }}>
            <Icono.Tilde tam={enTarjeta ? 15 : 14} grosor={3.2} />
          </span>
        )}
      </span>
      {children || (
        <span
          style={{
            flexGrow: 1, minWidth: 0, fontSize: 15, fontWeight: 500, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', transition: 'color 0.25s', color: hecha ? '#4A4F5A' : '#15171C',
          }}
        >
          <Tachado hecho={hecha}>{idea.t}</Tachado>
        </span>
      )}
    </button>
  )
}

// Texto que se tacha con una animación (la línea "crece" de izquierda a derecha)
export function Tachado({ hecho, children }) {
  return (
    <span
      style={{
        backgroundImage: 'linear-gradient(currentColor, currentColor)', backgroundRepeat: 'no-repeat', backgroundPosition: '0 58%',
        transition: 'background-size 0.4s cubic-bezier(.22,1,.36,1)', backgroundSize: hecho ? '100% 2px' : '0% 2px',
      }}
    >
      {children}
    </span>
  )
}
