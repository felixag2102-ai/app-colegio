/*
  Pantalla APUNTES.
  - Carpetas por materia (renombrar, recolorear, ordenar y borrar con el lápiz).
  - "Escanear": sacás una foto con la cámara y la guardás con el texto que escribas.
  - "Subir archivo": guarda PDFs, documentos o fotos del celular en una carpeta.
  - Dentro de un apunte podés editar el título y el texto (se guarda solo).
  - "Estudiar": el asistente con IA (todavía sin conectar).
*/
import { useEffect, useRef, useState } from 'react'
import { useGuardado } from '../../datos/guardado'
import { CARPETAS, MATERIAS } from '../../datos/iniciales'
import { abrirArchivo, achicarFoto, borrarArchivo, guardarArchivo, tamanioLegible, useUrlArchivo } from '../../datos/archivos'
import { COLORES, conAlfa } from '../../utilidades/colores'
import { claveDia, desdeClave, fechaCorta, hoy, nuevoId } from '../../utilidades/fechas'
import EditorLista from '../../componentes/EditorLista'
import Aviso, { useAviso } from '../../componentes/Aviso'
import Asistente, { BotonEstudiar } from './Asistente'
import NuevoApunte from './NuevoApunte'
import SubirArchivo, { Insignia, TIPOS, tipoDeArchivo } from './SubirArchivo'
import * as Icono from '../../componentes/Iconos'

const tarjeta = { border: '1px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.84)', backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)' }

function cuentaDe(c) {
  const a = c.notes.length + (c.notes.length === 1 ? ' apunte' : ' apuntes')
  return c.files.length ? a + ' · ' + c.files.length + (c.files.length === 1 ? ' archivo' : ' archivos') : a
}

export default function Apuntes({ accion }) {
  const [carpetas, setCarpetas] = useGuardado('carpetas', CARPETAS)
  const [materias] = useGuardado('materias', MATERIAS)
  const [vista, setVista] = useState({ tipo: 'carpetas', carpetaId: null, apunteId: null })
  const [nuevo, setNuevo] = useState({ abierto: false, foto: null, carpeta: 0 })
  const [subir, setSubir] = useState({ abierto: false, carpeta: 0 })
  const [asistente, setAsistente] = useState({ abierto: false, pregunta: null })
  const [editor, setEditor] = useState({ abierto: false, resaltar: -1 })
  const [menuArchivo, setMenuArchivo] = useState(null)
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const [recien, setRecien] = useState(null)
  const camara = useRef(null)
  const { aviso, mostrarAviso } = useAviso()

  // Si vinimos desde "Apunte con foto" del Inicio, abrimos la cámara
  useEffect(() => {
    if (accion === 'foto') setTimeout(() => camara.current && camara.current.click(), 300)
  }, [accion])

  const indiceCarpeta = Math.max(0, carpetas.findIndex((c) => c.id === vista.carpetaId))
  const carpeta = carpetas[indiceCarpeta]
  const apunte = carpeta && carpeta.notes.find((n) => n.id === vista.apunteId)
  // Si la carpeta o el apunte ya no existen (por ejemplo, los borraste), volvemos atrás
  const tipoVista = vista.tipo === 'apunte' && !apunte ? (carpeta ? 'carpeta' : 'carpetas') : vista.tipo === 'carpeta' && !carpeta ? 'carpetas' : vista.tipo

  const cambiarCarpeta = (id, cambios) => setCarpetas((lista) => lista.map((c) => (c.id === id ? { ...c, ...(typeof cambios === 'function' ? cambios(c) : cambios) } : c)))

  const alSacarFoto = async (e) => {
    const archivo = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!archivo) return
    const foto = await achicarFoto(archivo)
    setNuevo({ abierto: true, foto, carpeta: tipoVista === 'carpetas' ? 0 : indiceCarpeta })
  }

  const guardarApunte = async ({ titulo, texto, destino }) => {
    const c = carpetas[destino]
    const nota = { id: nuevoId(), t: titulo, fecha: claveDia(hoy()), body: texto }
    if (nuevo.foto) {
      nota.fotoId = nuevoId()
      await guardarArchivo(nota.fotoId, nuevo.foto)
    }
    cambiarCarpeta(c.id, (x) => ({ notes: [nota].concat(x.notes) }))
    setNuevo({ abierto: false, foto: nuevo.foto, carpeta: destino })
    setVista({ tipo: 'carpeta', carpetaId: c.id, apunteId: null })
    setRecien(nota.id)
    mostrarAviso('Guardado en ' + c.name)
  }

  const subirArchivo = async (archivo, destino) => {
    const c = carpetas[destino]
    const id = nuevoId()
    const tipo = tipoDeArchivo(archivo)
    const blob = tipo === 'img' ? await achicarFoto(archivo, 2400, 0.86) : archivo
    await guardarArchivo(id, blob)
    const datos = { id, n: archivo.name, size: blob.size, fecha: claveDia(hoy()), type: tipo }
    cambiarCarpeta(c.id, (x) => ({ files: [datos].concat(x.files) }))
    setTimeout(() => {
      setVista({ tipo: 'carpeta', carpetaId: c.id, apunteId: null })
      setRecien(id)
      mostrarAviso('Archivo subido a ' + c.name)
    }, 600)
  }

  const borrarApunte = () => {
    const titulo = apunte.t
    if (apunte.fotoId) borrarArchivo(apunte.fotoId)
    cambiarCarpeta(carpeta.id, (x) => ({ notes: x.notes.filter((n) => n.id !== apunte.id) }))
    setConfirmarBorrar(false)
    setVista({ tipo: 'carpeta', carpetaId: carpeta.id, apunteId: null })
    mostrarAviso('Borraste ' + titulo)
  }

  const totalApuntes = carpetas.reduce((s, c) => s + c.notes.length, 0)
  const totalArchivos = carpetas.reduce((s, c) => s + c.files.length, 0)
  const fuentesIA = ['Boletín · ' + materias.length + ' materias', 'Apuntes · ' + totalApuntes, 'Archivos · ' + totalArchivos]
  const estudiar = (pregunta) => setAsistente({ abierto: true, pregunta: pregunta || null })

  return (
    <>
      <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={alSacarFoto} />

      <div className="pantalla">
        {tipoVista === 'carpetas' && (
          <VistaCarpetas
            carpetas={carpetas}
            total={totalApuntes}
            asistenteAbierto={asistente.abierto}
            onEstudiar={() => (asistente.abierto ? setAsistente({ abierto: false, pregunta: null }) : estudiar())}
            onEditar={() => setEditor({ abierto: true, resaltar: -1 })}
            onEscanear={() => camara.current.click()}
            onSubir={() => setSubir({ abierto: true, carpeta: 0 })}
            onAbrir={(c) => { setVista({ tipo: 'carpeta', carpetaId: c.id, apunteId: null }); setRecien(null); setMenuArchivo(null) }}
            onNuevaCarpeta={() => {
              setCarpetas(carpetas.concat([{ id: nuevoId(), name: 'Nueva carpeta', color: COLORES[(carpetas.length + 5) % COLORES.length], notes: [], files: [] }]))
              setEditor({ abierto: true, resaltar: carpetas.length })
            }}
          />
        )}

        {tipoVista === 'carpeta' && carpeta && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flexGrow: 1, minHeight: 0, animation: 'slideIn 0.4s cubic-bezier(.22,1,.36,1) backwards' }}>
            <button className="btn-volver" onClick={() => { setVista({ tipo: 'carpetas', carpetaId: null, apunteId: null }); setMenuArchivo(null) }}>
              <Icono.Izquierda tam={18} grosor={2.4} />Apuntes
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: conAlfa(carpeta.color, 0.15), color: carpeta.color, flexShrink: 0 }}>
                <Icono.Carpeta tam={26} />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{carpeta.name || 'Sin nombre'}</h1>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B' }}>{cuentaDe(carpeta)}</span>
              </div>
            </div>
            <div style={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span className="seccion">APUNTES</span>
                <button onClick={() => setNuevo({ abierto: true, foto: null, carpeta: indiceCarpeta })} style={botonChicoNegro}>
                  <Icono.Escribir tam={13} grosor={2.6} />Escribir
                </button>
              </div>
              {carpeta.notes.length === 0 && <Vacio texto="Todavía no guardaste apuntes acá" />}
              {carpeta.notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { setVista({ tipo: 'apunte', carpetaId: carpeta.id, apunteId: n.id }); setConfirmarBorrar(false) }}
                  style={{
                    width: '100%', borderRadius: 24, padding: 16, display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', cursor: 'pointer', color: '#15171C', flexShrink: 0, ...tarjeta,
                    boxShadow: n.id === recien ? '0 0 0 2px ' + carpeta.color + ', 0 12px 28px rgba(30,40,80,0.12)' : 'inset 0 1px 1px rgba(255,255,255,0.95), 0 12px 28px rgba(30,40,80,0.12)',
                  }}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, width: '100%' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {n.fotoId && <span style={{ color: '#3B404B', display: 'flex', flexShrink: 0 }}><Icono.Camara tam={15} /></span>}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.t}</span>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#3B404B', flexShrink: 0 }}>{fechaCorta(desdeClave(n.fecha))}</span>
                  </span>
                  {n.body && <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</span>}
                </button>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px 0 4px' }}>
                <span className="seccion">ARCHIVOS</span>
                <button onClick={() => setSubir({ abierto: true, carpeta: indiceCarpeta })} style={botonChicoNegro}>
                  <Icono.Subir tam={13} grosor={2.8} />Subir
                </button>
              </div>
              {carpeta.files.length === 0 && <Vacio texto="Todavía no subiste archivos acá" />}
              {carpeta.files.map((f) => {
                const tipo = TIPOS[f.type] || TIPOS.otro
                const abierto = menuArchivo === f.id
                return (
                  <div
                    key={f.id}
                    style={{
                      borderRadius: 20, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, ...tarjeta,
                      boxShadow: f.id === recien ? '0 0 0 2px ' + carpeta.color + ', 0 8px 20px rgba(30,40,80,0.08)' : 'inset 0 1px 1px rgba(255,255,255,0.95), 0 8px 20px rgba(30,40,80,0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        onClick={async () => { if (!(await abrirArchivo(f.id, f.n))) mostrarAviso('No encontré el archivo') }}
                        style={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer', color: '#15171C' }}
                      >
                        <Insignia tipo={tipo} grande />
                        <span style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.n}</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#3B404B' }}>{tamanioLegible(f.size)} · {fechaCorta(desdeClave(f.fecha))}</span>
                        </span>
                      </button>
                      <button
                        onClick={() => setMenuArchivo(abierto ? null : f.id)}
                        aria-label="Más opciones"
                        aria-expanded={abierto}
                        style={{ width: 40, height: 40, borderRadius: 20, border: 'none', color: '#3B404B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s', background: abierto ? 'rgba(21,23,28,0.08)' : 'transparent' }}
                      >
                        <Icono.Puntos />
                      </button>
                    </div>
                    {abierto && (
                      <div style={{ display: 'flex', gap: 8, animation: 'expand 0.25s ease-out both' }}>
                        <button
                          onClick={() => { setMenuArchivo(null); estudiar('Repasemos "' + f.n + '"') }}
                          style={{ flex: '2 1 0', minHeight: 40, borderRadius: 14, border: 'none', background: '#15171C', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        >
                          <Icono.ChispaLinea tam={15} />Estudiar con IA
                        </button>
                        <button
                          onClick={() => {
                            borrarArchivo(f.id)
                            cambiarCarpeta(carpeta.id, (x) => ({ files: x.files.filter((y) => y.id !== f.id) }))
                            setMenuArchivo(null)
                            mostrarAviso('Eliminaste ' + f.n)
                          }}
                          style={{ flex: '1 1 0', minHeight: 40, borderRadius: 14, border: '1.5px solid rgba(179,38,30,0.25)', background: 'rgba(179,38,30,0.06)', color: '#9E1F17', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tipoVista === 'apunte' && apunte && (
          <VistaApunte
            carpeta={carpeta}
            apunte={apunte}
            confirmar={confirmarBorrar}
            onVolver={() => setVista({ tipo: 'carpeta', carpetaId: carpeta.id, apunteId: null })}
            onPedirBorrar={() => setConfirmarBorrar(true)}
            onCancelarBorrar={() => setConfirmarBorrar(false)}
            onBorrar={borrarApunte}
            onCambiar={(cambios) => cambiarCarpeta(carpeta.id, (x) => ({ notes: x.notes.map((n) => (n.id === apunte.id ? { ...n, ...cambios } : n)) }))}
            onRepasar={() => estudiar('Repasemos "' + apunte.t + '"')}
          />
        )}
      </div>

      <Aviso {...aviso} />

      <NuevoApunte
        abierto={nuevo.abierto}
        foto={nuevo.foto}
        carpetas={carpetas}
        carpetaInicial={nuevo.carpeta}
        onCerrar={() => setNuevo({ ...nuevo, abierto: false })}
        onGuardar={guardarApunte}
      />

      <SubirArchivo
        abierto={subir.abierto}
        carpetas={carpetas}
        carpetaInicial={subir.carpeta}
        onCerrar={() => setSubir({ ...subir, abierto: false })}
        onSubir={subirArchivo}
      />

      <Asistente abierto={asistente.abierto} pregunta={asistente.pregunta} fuentes={fuentesIA} onCerrar={() => setAsistente({ abierto: false, pregunta: null })} />

      <EditorLista
        abierto={editor.abierto}
        resaltar={editor.resaltar}
        onCerrar={() => setEditor({ abierto: false, resaltar: -1 })}
        titulo="Editar carpetas"
        nota="Cambiá el nombre y el color, usá las flechas para ordenarlas o borrá una carpeta."
        items={carpetas}
        onCambiar={setCarpetas}
        reordenar
        textoAgregar="Nueva carpeta"
        crear={(n) => ({ id: nuevoId(), name: 'Nueva carpeta', color: COLORES[(n + 5) % COLORES.length], notes: [], files: [] })}
        aviso={(c) => {
          const partes = []
          if (c.notes.length) partes.push(c.notes.length === 1 ? '1 apunte' : c.notes.length + ' apuntes')
          if (c.files.length) partes.push(c.files.length === 1 ? '1 archivo' : c.files.length + ' archivos')
          return partes.length ? 'También se borran ' + partes.join(' y ') + '.' : ''
        }}
        onBorrar={(i) => {
          const c = carpetas[i]
          // borramos también las fotos y archivos guardados de esa carpeta
          c.files.forEach((f) => borrarArchivo(f.id))
          c.notes.forEach((n) => n.fotoId && borrarArchivo(n.fotoId))
          setCarpetas(carpetas.filter((x, j) => j !== i))
          setVista({ tipo: 'carpetas', carpetaId: null, apunteId: null })
        }}
      />
    </>
  )
}

const botonChicoNegro = { minHeight: 34, padding: '0 12px', borderRadius: 17, border: 'none', background: '#15171C', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }

function Vacio({ texto }) {
  return (
    <div style={{ borderRadius: 20, padding: 16, textAlign: 'center', border: '2px dashed rgba(21,23,28,0.18)', background: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, color: '#3B404B', flexShrink: 0 }}>
      {texto}
    </div>
  )
}

function VistaCarpetas({ carpetas, total, asistenteAbierto, onEstudiar, onEditar, onEscanear, onSubir, onAbrir, onNuevaCarpeta }) {
  const botonGrande = { minHeight: 116, borderRadius: 26, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', textAlign: 'left', cursor: 'pointer' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flexGrow: 1, minHeight: 0, animation: 'fadeUp 0.5s cubic-bezier(.22,1,.36,1) backwards' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <p className="subtitulo">{total} {total === 1 ? 'apunte guardado' : 'apuntes guardados'}</p>
          <h1 className="titulo">Apuntes</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <BotonEstudiar onClick={onEstudiar} abierto={asistenteAbierto} />
          <button className="btn-circulo" onClick={onEditar} aria-label="Editar nombres, colores y orden de las carpetas"><Icono.Lapiz tam={19} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, flexShrink: 0 }}>
        <button className="vidrio-oscuro" onClick={onEscanear} style={botonGrande}>
          <span style={{ width: 44, height: 44, borderRadius: 15, background: '#3D63F0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 8px 18px rgba(30,50,140,0.35)' }}>
            <Icono.Camara tam={23} grosor={2} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Escanear</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#D5D8DF' }}>Foto de tu cuaderno</span>
          </span>
        </button>
        <button className="vidrio" onClick={onSubir} style={{ ...botonGrande, color: '#15171C', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 16px 36px rgba(30,40,80,0.12)' }}>
          <span style={{ width: 44, height: 44, borderRadius: 15, background: '#15171C', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icono.Subir tam={22} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Subir archivo</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#3B404B' }}>PDF, Word o fotos</span>
          </span>
        </button>
      </div>

      <div style={{ padding: '0 4px' }}><span className="seccion">CARPETAS</span></div>

      <div style={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, alignContent: 'start', paddingBottom: 4 }}>
        {carpetas.map((c, i) => (
          <button
            key={c.id}
            className="vidrio"
            onClick={() => onAbrir(c)}
            style={{ minHeight: 112, borderRadius: 24, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', textAlign: 'left', cursor: 'pointer', color: '#15171C', animation: 'fadeUp 0.45s cubic-bezier(.22,1,.36,1) backwards', animationDelay: i * 0.05 + 's' }}
          >
            <span style={{ width: 40, height: 40, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: conAlfa(c.color, 0.15), color: c.color }}>
              <Icono.Carpeta tam={22} />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, maxWidth: '100%' }}>
              <span style={{ fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || 'Sin nombre'}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#3B404B' }}>{cuentaDe(c)}</span>
            </span>
          </button>
        ))}
        <button
          onClick={onNuevaCarpeta}
          style={{ minHeight: 112, borderRadius: 24, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#2B2F38', border: '2px dashed rgba(21,23,28,0.22)', background: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 700 }}
        >
          <Icono.Mas tam={22} grosor={2.4} />Nueva carpeta
        </button>
      </div>
    </div>
  )
}

function VistaApunte({ carpeta, apunte, confirmar, onVolver, onPedirBorrar, onCancelarBorrar, onBorrar, onCambiar, onRepasar }) {
  const urlFoto = useUrlArchivo(apunte.fotoId)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexGrow: 1, minHeight: 0, animation: 'slideIn 0.4s cubic-bezier(.22,1,.36,1) backwards' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-volver" onClick={onVolver}><Icono.Izquierda tam={18} grosor={2.4} />{carpeta.name || 'Sin nombre'}</button>
        <button className="btn-circulo" onClick={onPedirBorrar} aria-label="Borrar este apunte" style={{ width: 40, height: 40, color: '#B3261E' }}>
          <Icono.Basura tam={17} grosor={2.1} />
        </button>
      </div>
      {confirmar && (
        <div role="alertdialog" aria-label="¿Borrar este apunte?" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 10px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(179,38,30,0.25)', animation: 'edIn 0.25s ease-out both' }}>
          <span style={{ flexGrow: 1, fontSize: 14, fontWeight: 600 }}>¿Borrar este apunte?</span>
          <button onClick={onCancelarBorrar} style={{ minHeight: 38, padding: '0 12px', borderRadius: 14, border: 'none', background: '#E9EAEF', color: '#15171C', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onBorrar} style={{ minHeight: 38, padding: '0 12px', borderRadius: 14, border: 'none', background: '#B3261E', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Borrar</button>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flexGrow: 1 }}>
          <input
            value={apunte.t}
            onChange={(e) => onCambiar({ t: e.target.value })}
            aria-label="Título del apunte"
            style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#15171C', width: '100%', outline: 'none' }}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#3B404B' }}>{fechaCorta(desdeClave(apunte.fecha))}{apunte.fotoId ? ' · Con foto' : ''}</span>
        </div>
        <button onClick={onRepasar} style={{ flexShrink: 0, minHeight: 40, padding: '0 12px', borderRadius: 20, border: 'none', background: '#15171C', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 8px 18px rgba(21,23,28,0.25)' }}>
          <Icono.ChispaLinea tam={15} />Repasar
        </button>
      </div>
      {apunte.fotoId && (
        <button
          onClick={() => abrirArchivo(apunte.fotoId, apunte.t + '.jpg')}
          aria-label="Ver la foto original"
          style={{ height: 110, flexShrink: 0, borderRadius: 20, overflow: 'hidden', position: 'relative', padding: 0, border: '1px solid rgba(21,23,28,0.08)', background: '#FBF8F0', boxShadow: '0 8px 20px rgba(30,40,80,0.10)', cursor: 'pointer' }}
        >
          {urlFoto && <img src={urlFoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          <span style={{ position: 'absolute', right: 10, bottom: 8, fontSize: 11, fontWeight: 700, color: '#3B404B', background: 'rgba(255,255,255,0.9)', padding: '4px 9px', borderRadius: 999 }}>Foto original</span>
        </button>
      )}
      <div className="vidrio" style={{ flexGrow: 1, minHeight: 120, borderRadius: 24, padding: 16, display: 'flex', marginBottom: 4 }}>
        <textarea
          value={apunte.body}
          onChange={(e) => onCambiar({ body: e.target.value })}
          aria-label="Texto del apunte"
          placeholder="Escribí acá tu apunte…"
          style={{ flexGrow: 1, border: 'none', background: 'transparent', resize: 'none', fontSize: 15, fontWeight: 500, lineHeight: 1.55, color: '#15171C', outline: 'none', padding: 0 }}
        />
      </div>
    </div>
  )
}
