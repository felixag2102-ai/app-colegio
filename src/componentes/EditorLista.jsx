/*
  Hoja para editar una lista de categorías, materias o carpetas:
  cambiar el nombre, el color, el orden (opcional), agregar y borrar.
  Antes de borrar pide confirmación y avisa qué más se borra.
*/
import { useEffect, useState } from 'react'
import HojaDeAbajo from './HojaDeAbajo'
import * as Icono from './Iconos'
import { COLORES, NOMBRES_COLORES } from '../utilidades/colores'

const botonChico = { width: 34, height: 40, flexShrink: 0, borderRadius: 12, border: 'none', background: 'rgba(21,23,28,0.06)', color: '#15171C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }

export default function EditorLista({
  abierto,
  onCerrar,
  titulo,
  nota,
  items, // [{ name, color, locked? }]
  onCambiar, // (nuevaLista) => ...
  reordenar = false,
  textoAgregar, // si no hay, no se puede agregar
  crear, // (cantidad) => item nuevo
  agregarAntesDeFija = false,
  minimo = 1, // cuántos tienen que quedar como mínimo
  aviso, // (item) => texto de advertencia al borrar
  onBorrar, // (indice) => ... (si no hay, se saca de la lista)
  resaltar = -1, // índice para resaltar al abrir (por ejemplo, una carpeta nueva)
}) {
  const [paleta, setPaleta] = useState(-1) // a qué fila le mostramos los colores
  const [fresca, setFresca] = useState(-1) // fila recién agregada (para animarla)
  const [confirmando, setConfirmando] = useState(-1)

  useEffect(() => {
    if (!abierto) return
    setPaleta(resaltar)
    setFresca(resaltar)
    setConfirmando(-1)
  }, [abierto, resaltar])

  const fija = (it) => !!it.locked
  const borrables = items.filter((it) => !fija(it)).length

  const cambiarItem = (i, cambios) => onCambiar(items.map((it, k) => (k === i ? { ...it, ...cambios } : it)))

  const mover = (i, j) => {
    if (j < 0 || j >= items.length) return
    const lista = items.slice()
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
    setPaleta(-1)
    setFresca(j)
    setConfirmando(-1)
    onCambiar(lista)
  }

  const agregar = () => {
    const nuevo = crear(items.length)
    const lista = items.concat([nuevo])
    if (agregarAntesDeFija) {
      const posFija = lista.findIndex(fija)
      if (posFija >= 0) {
        lista.pop()
        lista.splice(posFija, 0, nuevo)
      }
    }
    const indice = lista.indexOf(nuevo)
    setFresca(indice)
    setPaleta(indice)
    setConfirmando(-1)
    onCambiar(lista)
  }

  const borrar = (i) => {
    setConfirmando(-1)
    setPaleta(-1)
    setFresca(-1)
    if (onBorrar) onBorrar(i)
    else onCambiar(items.filter((x, k) => k !== i))
  }

  return (
    <HojaDeAbajo
      abierta={abierto}
      onCerrar={onCerrar}
      etiqueta={titulo}
      velo="rgba(15,17,22,0.3)"
      blurVelo={10}
      relleno="10px 16px 22px 16px"
      separacion={8}
      fondo="rgba(255,255,255,0.97)"
      alturaMaxima="calc(100% - 60px)"
      encabezado={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em' }}>{titulo}</h2>
            <button onClick={onCerrar} style={{ minHeight: 40, padding: '0 16px', borderRadius: 20, border: 'none', background: '#15171C', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Listo</button>
          </div>
          <p style={{ margin: '0 0 4px 0', fontSize: 13, fontWeight: 500, color: '#3B404B', lineHeight: 1.4 }}>{nota}</p>
        </>
      }
    >
      <div style={{ flex: '0 1 auto', minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', margin: '0 -8px', padding: '0 8px' }}>
        {items.map((it, i) => {
          const esFija = fija(it)
          const nombre = it.name || 'Sin nombre'
          const textoAviso = aviso ? aviso(it) : ''
          return (
            <div key={it.id || it.key || i} style={{ borderBottom: '1px solid rgba(21,23,28,0.07)', animation: i === fresca ? 'edIn 0.35s ease-out both' : undefined }}>
              {confirmando !== i && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 58 }}>
                    <button
                      onClick={() => { if (!esFija) { setPaleta(paleta === i ? -1 : i); setFresca(-1) } }}
                      aria-label={esFija ? nombre + ', color fijo' : 'Cambiar color de ' + nombre}
                      aria-expanded={!esFija && paleta === i}
                      style={{
                        width: 36, height: 36, borderRadius: 12, flexShrink: 0, border: 'none', padding: 0, cursor: esFija ? 'default' : 'pointer',
                        transition: 'box-shadow 0.2s, background 0.3s', background: it.color,
                        boxShadow: !esFija && paleta === i ? '0 0 0 3px #FFFFFF, 0 0 0 5px ' + it.color : 'inset 0 0 0 1px rgba(255,255,255,0.3)',
                      }}
                    />
                    <input
                      type="text"
                      value={it.name}
                      readOnly={esFija}
                      onChange={(e) => cambiarItem(i, { name: e.target.value })}
                      aria-label="Nombre"
                      style={{
                        flexGrow: 1, minWidth: 0, minHeight: 44, borderRadius: 14, border: '1.5px solid rgba(21,23,28,0.12)', background: '#F7F8FA',
                        padding: '0 12px', fontSize: 15, fontWeight: 600, color: '#15171C', outlineColor: '#15171C',
                        ...(esFija ? { background: 'transparent', borderColor: 'transparent', color: '#3B404B' } : null),
                      }}
                    />
                    {reordenar && (
                      <>
                        <button onClick={() => mover(i, i - 1)} aria-label={'Subir ' + nombre} style={{ ...botonChico, opacity: i === 0 ? 0.3 : 1 }}><Icono.Arriba tam={16} grosor={2.6} /></button>
                        <button onClick={() => mover(i, i + 1)} aria-label={'Bajar ' + nombre} style={{ ...botonChico, opacity: i === items.length - 1 ? 0.3 : 1 }}><Icono.Abajo tam={16} grosor={2.6} /></button>
                      </>
                    )}
                    {!esFija && borrables > minimo && (
                      <button
                        onClick={() => { setConfirmando(i); setPaleta(-1); setFresca(-1) }}
                        aria-label={'Borrar ' + nombre}
                        style={{ ...botonChico, width: 36, background: 'rgba(179,38,30,0.08)', color: '#B3261E' }}
                      >
                        <Icono.Basura tam={17} grosor={2.1} />
                      </button>
                    )}
                    {esFija && (
                      <span role="img" aria-label="Fija, no se puede borrar" style={{ width: 36, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A4F5A' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                      </span>
                    )}
                  </div>
                  {!esFija && paleta === i && (
                    <div role="group" aria-label="Colores" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '6px 6px 14px 44px', animation: 'edIn 0.25s ease-out both' }}>
                      {COLORES.map((col, k) => (
                        <button
                          key={col}
                          onClick={() => cambiarItem(i, { color: col })}
                          aria-label={NOMBRES_COLORES[k]}
                          aria-pressed={col === it.color}
                          style={{
                            width: 28, height: 28, borderRadius: 10, flexShrink: 0, border: 'none', padding: 0, cursor: 'pointer', transition: 'box-shadow 0.2s',
                            background: col, boxShadow: col === it.color ? '0 0 0 2px #FFFFFF, 0 0 0 4px ' + col : undefined,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
              {confirmando === i && (
                <div role="alertdialog" aria-label={'¿Borrar "' + nombre + '"?'} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, margin: '8px 0', borderRadius: 16, background: 'rgba(179,38,30,0.07)', animation: 'edIn 0.25s ease-out both' }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>¿Borrar "{nombre}"?</span>
                  {textoAviso && <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B', lineHeight: 1.35 }}>{textoAviso}</span>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setConfirmando(-1)} style={{ flex: '1 1 0', minHeight: 42, borderRadius: 14, border: 'none', background: '#FFFFFF', color: '#15171C', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={() => borrar(i)} style={{ flex: '1 1 0', minHeight: 42, borderRadius: 14, border: 'none', background: '#B3261E', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Borrar</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {textoAgregar && (
        <button
          onClick={agregar}
          style={{ flexShrink: 0, minHeight: 48, borderRadius: 16, border: '2px dashed rgba(21,23,28,0.2)', background: 'transparent', color: '#15171C', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Icono.Mas tam={16} grosor={2.6} />
          {textoAgregar}
        </button>
      )}
    </HojaDeAbajo>
  )
}
