/*
  Google Calendar (solo lectura).

  - Pedimos permiso para VER los eventos de tu calendario principal
    (no los podemos cambiar ni borrar).
  - Traemos desde 1 mes atrás hasta 3 meses adelante.
  - Los guardamos en el celular para verlos sin internet.
  - Los convertimos al mismo formato que los eventos de la app, con google: true.
*/
import { useGuardado, guardar } from './guardado'
import { pedirToken, tienePermiso, tokenActual } from './google'
import { claveDia, pad2, sumarDias, hoy } from '../utilidades/fechas'

export const PERMISO_CALENDAR = 'https://www.googleapis.com/auth/calendar.events.readonly'
export const PERMISO_TAREAS = 'https://www.googleapis.com/auth/tasks.readonly'
const PERMISOS = 'openid email profile ' + PERMISO_CALENDAR + ' ' + PERMISO_TAREAS
const CLAVE = 'eventosGoogle' // { eventos: [...], actualizado: número }

// Adivina el tipo de evento según el título
function tipoSegunTitulo(t) {
  const s = (t || '').toLowerCase()
  if (/prueba|examen|evaluaci|parcial|oral\b|lecci[oó]n/.test(s)) return 'prueba'
  if (/entrega|\btp\b|trabajo pr[aá]ctico|presentar|monograf/.test(s)) return 'entrega'
  if (/cumple/.test(s)) return 'cumple'
  if (/feriado/.test(s)) return 'feriado'
  return 'evento'
}

// Un evento de Google → un evento de la app
function convertir(g) {
  let fecha
  let hora = null
  if (g.start && g.start.dateTime) {
    const d = new Date(g.start.dateTime)
    fecha = claveDia(d)
    hora = d.getHours() + ':' + pad2(d.getMinutes())
  } else if (g.start && g.start.date) {
    fecha = g.start.date // evento de "todo el día"
  } else return null
  return {
    id: 'g-' + g.id,
    fecha,
    hora,
    titulo: g.summary || '(Sin título)',
    detalle: g.location || '',
    tipo: tipoSegunTitulo(g.summary),
    google: true,
  }
}

async function traerEventos(token) {
  const desde = sumarDias(hoy(), -31).toISOString()
  const hasta = sumarDias(hoy(), 92).toISOString()
  const base =
    'https://www.googleapis.com/calendar/v3/calendars/primary/events' +
    '?singleEvents=true&orderBy=startTime&maxResults=250' +
    '&timeMin=' + encodeURIComponent(desde) + '&timeMax=' + encodeURIComponent(hasta)

  // Google manda los eventos de a "páginas" de hasta 250.
  // Pedimos página por página hasta tenerlos todos (máximo 20 páginas).
  const todos = []
  let pagina = ''
  for (let vuelta = 0; vuelta < 20; vuelta++) {
    const url = base + (pagina ? '&pageToken=' + encodeURIComponent(pagina) : '')
    // cache: 'no-store' → siempre la respuesta nueva, nunca una copia vieja del navegador
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' })
    if (r.status === 401) throw new Error('permiso')
    if (r.status === 403) {
      // 403 puede ser "falta permiso" o "la API de Calendar no está activada en Google Cloud"
      let razon = ''
      try { const e = await r.json(); razon = JSON.stringify(e.error || '') } catch (err) { /* nada */ }
      if (/accessNotConfigured|SERVICE_DISABLED|has not been used|is disabled/i.test(razon)) throw new Error('api-apagada')
      throw new Error('permiso')
    }
    if (!r.ok) throw new Error('google-' + r.status)
    const datos = await r.json()
    todos.push(...(datos.items || []))
    pagina = datos.nextPageToken
    if (!pagina) break
  }
  return todos.filter((e) => e.status !== 'cancelled').map(convertir).filter(Boolean)
}

/*
  Google Tasks: traemos las tareas CON FECHA y SIN COMPLETAR de todas tus listas.
  Google guarda la fecha de una tarea como "2026-11-20T00:00:00.000Z":
  usamos solo la parte de la fecha (si la convertimos a la hora de Argentina, se correría un día).
*/
async function pedirGoogle(url, token) {
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' })
  if (r.status === 401) throw new Error('permiso')
  if (r.status === 403) {
    let razon = ''
    try { const e = await r.json(); razon = JSON.stringify(e.error || '') } catch (err) { /* nada */ }
    if (/accessNotConfigured|SERVICE_DISABLED|has not been used|is disabled/i.test(razon)) throw new Error('api-apagada')
    throw new Error('permiso')
  }
  if (!r.ok) throw new Error('google-' + r.status)
  return r.json()
}

async function traerTareas(token) {
  const desde = sumarDias(hoy(), -31).toISOString()
  const hasta = sumarDias(hoy(), 92).toISOString()
  const listas = await pedirGoogle('https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100', token)
  const tareas = []
  for (const lista of (listas.items || []).slice(0, 20)) {
    let pagina = ''
    for (let vuelta = 0; vuelta < 10; vuelta++) {
      const url =
        'https://tasks.googleapis.com/tasks/v1/lists/' + encodeURIComponent(lista.id) + '/tasks' +
        '?showCompleted=false&maxResults=100&dueMin=' + encodeURIComponent(desde) + '&dueMax=' + encodeURIComponent(hasta) +
        (pagina ? '&pageToken=' + encodeURIComponent(pagina) : '')
      const datos = await pedirGoogle(url, token)
      ;(datos.items || []).forEach((t) => {
        if (!t.due || t.status === 'completed' || t.deleted || !t.title) return
        tareas.push({
          id: 't-' + t.id,
          fecha: t.due.slice(0, 10),
          hora: null,
          titulo: t.title,
          detalle: lista.title && lista.title !== 'Mis tareas' && lista.title !== 'My Tasks' ? 'Tarea · ' + lista.title : 'Tarea',
          tipo: tipoSegunTitulo(t.title),
          google: true,
          tarea: true,
        })
      })
      pagina = datos.nextPageToken
      if (!pagina) break
    }
  }
  return tareas
}

// Conecta (o actualiza). Necesita que la persona toque un botón (Google lo exige).
export async function sincronizarCalendar() {
  let token = tokenActual()
  // Si no hay pase, o al pase le falta algún permiso (por ejemplo, el de Tareas, que es nuevo), pedimos uno
  if (!token || !tieneTokenConCalendar || !tienePermiso(PERMISO_TAREAS)) {
    token = await pedirToken(PERMISOS, { silencioso: false })
    tieneTokenConCalendar = true
  }
  let eventos
  try {
    eventos = await traerEventos(token)
  } catch (err) {
    if (err.message !== 'permiso') throw err
    // El pase venció o le faltaba el permiso: pedimos uno nuevo y probamos otra vez
    token = await pedirToken(PERMISOS)
    eventos = await traerEventos(token)
  }
  // Las tareas van aparte: si fallan, el calendario igual se muestra
  let tareas = []
  let problemaTareas = ''
  if (!tienePermiso(PERMISO_TAREAS)) problemaTareas = 'permiso'
  else {
    try { tareas = await traerTareas(token) } catch (err) { problemaTareas = err.message || 'error' }
  }
  const datos = { eventos: eventos.concat(tareas), tareas: tareas.length, problemaTareas, actualizado: Date.now() }
  guardar(CLAVE, datos)
  return datos
}
let tieneTokenConCalendar = false

// Actualiza sin molestar SOLO si ya hay un pase vigente (no abre ventanas de Google)
export async function actualizarSiSePuede() {
  const token = tokenActual()
  if (!token || !tieneTokenConCalendar || !leer()) return null
  const eventos = await traerEventos(token)
  let tareas = []
  let problemaTareas = ''
  if (!tienePermiso(PERMISO_TAREAS)) problemaTareas = 'permiso'
  else {
    try { tareas = await traerTareas(token) } catch (err) { problemaTareas = err.message || 'error' }
  }
  const datos = { eventos: eventos.concat(tareas), tareas: tareas.length, problemaTareas, actualizado: Date.now() }
  guardar(CLAVE, datos)
  return datos
}

export function desconectarCalendar() {
  guardar(CLAVE, null)
  tieneTokenConCalendar = false
}

function leer() {
  try { return JSON.parse(localStorage.getItem('colegio:' + CLAVE)) } catch (err) { return null }
}

/*
  Hook: los eventos de la app + los de Google Calendar, juntos.
  Los eventos de Google que sacaste de la app ("ocultos") no se muestran,
  aunque sigan existiendo en Google Calendar.
*/
export function useEventosConGoogle() {
  const [locales, setLocales] = useGuardado('eventos', [])
  const [deGoogle] = useGuardado(CLAVE, null)
  const [ocultos, setOcultos] = useGuardado('eventosGoogleOcultos', [])
  const visiblesDeGoogle = deGoogle && deGoogle.eventos ? deGoogle.eventos.filter((e) => !ocultos.includes(e.id)) : []
  const todos = locales.concat(visiblesDeGoogle)
  const ocultar = (id) => setOcultos((lista) => (lista.includes(id) ? lista : lista.concat([id])))
  const mostrarOcultos = () => setOcultos([])
  return { todos, locales, setLocales, google: deGoogle, ocultos, ocultar, mostrarOcultos }
}

// Mensajes claros para cada problema
export function mensajeCalendar(err) {
  const m = (err && err.message) || ''
  if (m === 'sin-conexion' || m === 'Failed to fetch') return 'No me pude conectar con Google. Fijate que tengas internet.'
  if (m === 'popup_closed' || m === 'cancelado' || m === 'access_denied') return 'Cerraste la ventana de Google antes de terminar.'
  if (m === 'permiso') return 'Google no dio permiso para leer el calendario. Probá de nuevo y aceptá el permiso del calendario.'
  if (m === 'api-apagada') return 'Falta activar la API de Google Calendar en el proyecto de Google Cloud (es un paso que hacen ustedes).'
  return 'No pude traer tus eventos. Probá de nuevo en un rato.'
}
