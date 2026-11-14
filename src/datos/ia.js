/*
  Inteligencia artificial (Gemini) desde la app.

  La app NO habla directo con Gemini: le pide al programa de Cloudflare
  (el mismo de las notificaciones), que tiene la clave guardada en secreto.
  Para que solo vos puedas usarlo, cada pedido lleva tu "pase" de Google.
*/
import { AVISOS_URL } from '../config'
import { googleDisponible, pedirToken, tokenActual } from './google'
import { DIAS, MESES, desdeClave, difDias, hoy } from '../utilidades/fechas'

export const iaDisponible = () => !!AVISOS_URL && googleDisponible()

async function conseguirPase(nuevo = false) {
  const t = nuevo ? null : tokenActual()
  return t || pedirToken('openid email profile')
}

async function pedirIA(ruta, cuerpo) {
  let pase = await conseguirPase()
  for (let intento = 0; intento < 2; intento++) {
    let r
    try {
      r = await fetch(AVISOS_URL + '/ia/' + ruta, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + pase },
        body: JSON.stringify(cuerpo),
      })
    } catch (err) {
      throw new Error('sin-conexion')
    }
    const datos = await r.json().catch(() => ({}))
    if (r.ok) return datos
    // El pase venció: pedimos uno nuevo y probamos una vez más
    if (r.status === 401 && datos.error === 'sin-sesion' && intento === 0) { pase = await conseguirPase(true); continue }
    throw new Error(datos.error || 'error')
  }
  throw new Error('sin-sesion')
}

export function mensajeIA(err) {
  const m = (err && err.message) || ''
  const textos = {
    'sin-conexion': 'No me pude conectar. Fijate que tengas internet.',
    'sin-sesion': 'Tenés que iniciar sesión con Google para usar la IA.',
    'cuenta-no-permitida': 'Esta cuenta de Google no tiene permiso para usar la IA de la app.',
    'limite-diario': 'Llegaste al límite de usos de la IA por hoy. Mañana se renueva.',
    'limite-gemini': 'Gemini está recibiendo muchos pedidos. Esperá un minuto y probá de nuevo.',
    bloqueado: 'Gemini no quiso responder eso. Probá preguntarlo de otra forma.',
    'ia-sin-configurar': 'Falta configurar la clave de Gemini en Cloudflare.',
    popup_closed: 'Cerraste la ventana de Google antes de terminar.',
    cancelado: 'Cerraste la ventana de Google antes de terminar.',
  }
  return textos[m] || 'Algo falló con la IA. Probá de nuevo en un rato.'
}

function leer(clave, porDefecto) {
  try { const v = JSON.parse(localStorage.getItem('colegio:' + clave)); return v === null ? porDefecto : v } catch (err) { return porDefecto }
}

const formatoNota = (x) => String(Math.round(x * 10) / 10).replace('.', ',')

/*
  Arma el "contexto": un resumen en texto de tus datos de la app,
  para que la IA sepa tus notas, tus próximas pruebas y tus apuntes.
*/
export function armarContexto() {
  const h = hoy()
  const partes = ['Hoy es ' + DIAS[h.getDay()].toLowerCase() + ' ' + h.getDate() + ' de ' + MESES[h.getMonth()] + ' de ' + h.getFullYear() + '.']

  const materias = leer('materias', [])
  if (materias.length) {
    partes.push('\nBOLETÍN (notas del 1 al 10):')
    materias.forEach((m) => {
      if (!m.grades || !m.grades.length) { partes.push('- ' + m.name + ': sin notas todavía'); return }
      const prom = m.grades.reduce((s, g) => s + g.n, 0) / m.grades.length
      partes.push('- ' + m.name + ' (promedio ' + formatoNota(prom) + '): ' + m.grades.map((g) => g.t + ' ' + formatoNota(g.n)).join('; '))
    })
  }

  const google = leer('eventosGoogle', null)
  const eventos = leer('eventos', []).concat(google && google.eventos ? google.eventos : [])
  const proximos = eventos
    .filter((e) => { const d = difDias(h, desdeClave(e.fecha)); return d >= 0 && d <= 30 })
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))
    .slice(0, 40)
  if (proximos.length) {
    partes.push('\nPRÓXIMOS 30 DÍAS (pruebas, entregas y eventos):')
    proximos.forEach((e) => {
      const d = desdeClave(e.fecha)
      const tipo = e.tipo === 'prueba' ? 'PRUEBA' : e.tipo === 'entrega' ? 'ENTREGA' : 'evento'
      partes.push('- ' + DIAS[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1) + (e.hora ? ' ' + e.hora : '') + ' · ' + tipo + ': ' + e.titulo + (e.detalle ? ' (' + e.detalle + ')' : ''))
    })
  }

  const carpetas = leer('carpetas', [])
  const apuntes = []
  carpetas.forEach((c) => (c.notes || []).forEach((n) => apuntes.push({ carpeta: c.name, ...n })))
  apuntes.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)) // los más nuevos primero
  if (apuntes.length) {
    partes.push('\nAPUNTES:')
    let usado = 0
    for (const a of apuntes) {
      const bloque = '## ' + a.carpeta + ' — ' + a.t + ' (' + a.fecha + ')\n' + (a.body || '(sin texto)')
      if (usado + bloque.length > 25000) { partes.push('(hay más apuntes que no entraron)'); break }
      partes.push(bloque)
      usado += bloque.length
    }
  }
  const archivos = carpetas.flatMap((c) => (c.files || []).map((f) => c.name + ': ' + f.n))
  if (archivos.length) partes.push('\nARCHIVOS SUBIDOS (la IA todavía no puede leer su contenido, solo el nombre):\n- ' + archivos.join('\n- '))

  return partes.join('\n')
}

// Chat: "mensajes" = [{ yo: true|false, t: texto }]
export async function preguntarIA(mensajes) {
  const datos = await pedirIA('chat', {
    mensajes: mensajes.map((m) => ({ rol: m.yo ? 'user' : 'model', texto: m.t })),
    contexto: armarContexto(),
  })
  return datos.texto
}

// Foto → texto. "foto" es un Blob (la foto ya achicada)
export async function fotoATexto(foto) {
  const dataUrl = await new Promise((ok, mal) => {
    const lector = new FileReader()
    lector.onload = () => ok(lector.result)
    lector.onerror = mal
    lector.readAsDataURL(foto)
  })
  const [cabecera, imagen] = String(dataUrl).split(',')
  const tipo = (cabecera.match(/data:([^;]+)/) || [])[1] || 'image/jpeg'
  return pedirIA('foto', { imagen, tipo })
}

