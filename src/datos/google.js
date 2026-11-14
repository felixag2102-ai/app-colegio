/*
  Iniciar sesión con Google (Google Identity Services).

  Cómo funciona:
  1. Cargamos el script oficial de Google (accounts.google.com/gsi/client).
  2. Al tocar el botón, Google muestra su ventana para elegir la cuenta y dar permiso.
  3. Google nos da un "token" (un pase que dura 1 hora) y con él pedimos
     tu nombre, mail y foto.
  4. Guardamos nombre, mail y foto en el celular. El token NO se guarda:
     queda solo en memoria mientras la app está abierta.

  En la Etapa 5 vamos a pedir también permiso para leer Google Calendar.
*/
import { GOOGLE_CLIENT_ID } from '../config'
import { guardar } from './guardado'

export const googleDisponible = () => !!GOOGLE_CLIENT_ID

const PERMISOS_BASICOS = 'openid email profile'

let cargando = null
function cargarScript() {
  if (window.google && window.google.accounts) return Promise.resolve()
  if (cargando) return cargando
  cargando = new Promise((ok, mal) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = ok
    s.onerror = () => { cargando = null; mal(new Error('sin-conexion')) }
    document.head.appendChild(s)
  })
  return cargando
}

// El pase actual (solo en memoria)
let token = null
let vence = 0
export const tokenActual = () => (token && Date.now() < vence ? token : null)

// Pide un pase a Google. "permisos" se pueden ampliar más adelante (por ejemplo, Calendar).
export async function pedirToken(permisos = PERMISOS_BASICOS, { silencioso = false } = {}) {
  await cargarScript()
  return new Promise((ok, mal) => {
    const cliente = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: permisos,
      callback: (r) => {
        if (r.error) { mal(new Error(r.error)); return }
        token = r.access_token
        vence = Date.now() + (Number(r.expires_in) || 3600) * 1000 - 60000
        ok(token)
      },
      error_callback: (e) => mal(new Error((e && e.type) || 'cancelado')),
    })
    cliente.requestAccessToken({ prompt: silencioso ? '' : 'select_account' })
  })
}

// Inicia sesión y guarda los datos de la cuenta en el celular
export async function iniciarSesion() {
  const t = await pedirToken()
  const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + t } })
  if (!r.ok) throw new Error('perfil')
  const p = await r.json()
  const cuenta = { nombre: p.name || '', nombreCorto: p.given_name || p.name || '', email: p.email || '', foto: p.picture || '' }
  guardar('cuentaGoogle', cuenta)
  return cuenta
}

export async function cerrarSesion() {
  try {
    if (token && window.google && window.google.accounts) window.google.accounts.oauth2.revoke(token, () => {})
  } catch (err) { /* nada */ }
  token = null
  vence = 0
  guardar('cuentaGoogle', null)
  guardar('eventosGoogle', null) // al cerrar sesión también sacamos los eventos de Google
}

// Texto claro para cada problema
export function mensajeDeError(err) {
  const m = (err && err.message) || ''
  if (m === 'sin-conexion') return 'No me pude conectar con Google. Fijate que tengas internet.'
  if (m === 'popup_closed' || m === 'cancelado' || m === 'access_denied') return 'Cerraste la ventana de Google antes de terminar.'
  if (m === 'popup_failed_to_open') return 'El navegador bloqueó la ventana de Google. Probá de nuevo.'
  return 'No se pudo iniciar sesión. Probá de nuevo.'
}
