/*
  Google Calendar (solo lectura).

  - Pedimos permiso para VER los eventos de tu calendario principal
    (no los podemos cambiar ni borrar).
  - Traemos desde 1 mes atrás hasta 3 meses adelante.
  - Los guardamos en el celular para verlos sin internet.
  - Los convertimos al mismo formato que los eventos de la app, con google: true.
*/
import { useGuardado, guardar } from './guardado'
import { pedirToken, tokenActual } from './google'
import { claveDia, pad2, sumarDias, hoy } from '../utilidades/fechas'

export const PERMISO_CALENDAR = 'https://www.googleapis.com/auth/calendar.events.readonly'
const PERMISOS = 'openid email profile ' + PERMISO_CALENDAR
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
  let url =
    'https://www.googleapis.com/calendar/v3/calendars/primary/events' +
    '?singleEvents=true&orderBy=startTime&maxResults=250' +
    '&timeMin=' + encodeURIComponent(desde) + '&timeMax=' + encodeURIComponent(hasta)
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } })
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
  return (datos.items || []).filter((e) => e.status !== 'cancelled').map(convertir).filter(Boolean)
}

// Conecta (o actualiza). Necesita que la persona toque un botón (Google lo exige).
export async function sincronizarCalendar() {
  let token = tokenActual()
  if (!token || !tieneTokenConCalendar) {
    token = await pedirToken(PERMISOS, { silencioso: !!leer() })
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
  const datos = { eventos, actualizado: Date.now() }
  guardar(CLAVE, datos)
  return datos
}
let tieneTokenConCalendar = false

export function desconectarCalendar() {
  guardar(CLAVE, null)
  tieneTokenConCalendar = false
}

function leer() {
  try { return JSON.parse(localStorage.getItem('colegio:' + CLAVE)) } catch (err) { return null }
}

// Hook: los eventos de la app + los de Google Calendar, juntos
export function useEventosConGoogle() {
  const [locales, setLocales] = useGuardado('eventos', [])
  const [deGoogle] = useGuardado(CLAVE, null)
  const todos = deGoogle && deGoogle.eventos ? locales.concat(deGoogle.eventos) : locales
  return { todos, locales, setLocales, google: deGoogle }
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
