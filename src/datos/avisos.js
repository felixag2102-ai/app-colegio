/*
  Notificaciones de los recordatorios.

  1. Pedimos permiso para mostrar notificaciones.
  2. Le pedimos al navegador una "suscripción de push": una dirección a la que
     se le pueden mandar mensajes a ESTE celular.
  3. Le mandamos al programa de avisos (Cloudflare) la suscripción y los
     recordatorios pendientes. Él avisa a la hora justa, aunque la app esté cerrada.
  4. Cada vez que cambian los recordatorios, le mandamos la lista nueva.
*/
import { useEffect } from 'react'
import { AVISOS_URL } from '../config'
import { guardar, useGuardado } from './guardado'

export const avisosDisponibles = () =>
  !!AVISOS_URL && typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

// Un código al azar que identifica a este celular ante el programa de avisos
function idDispositivo() {
  let id = localStorage.getItem('colegio:dispositivo')
  if (!id) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 32)
    localStorage.setItem('colegio:dispositivo', id)
  }
  return id
}

function aBytes(b64u) {
  const s = b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4)
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

async function suscripcion() {
  const reg = await navigator.serviceWorker.ready
  let sus = await reg.pushManager.getSubscription()
  if (!sus) {
    const r = await fetch(AVISOS_URL + '/clave')
    if (!r.ok) throw new Error('servidor')
    const { clave } = await r.json()
    sus = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(clave) })
  }
  return sus.toJSON()
}

// Solo mandamos los pendientes que todavía no llegaron a su hora
function pendientes(recordatorios) {
  const ahora = Date.now()
  return (recordatorios || []).filter((r) => !r.done && r.cuando > ahora).map((r) => ({ id: String(r.id), t: r.t, cuando: r.cuando }))
}

async function enviarLista(recordatorios) {
  const r = await fetch(AVISOS_URL + '/dispositivo/' + idDispositivo(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suscripcion: await suscripcion(), recordatorios: pendientes(recordatorios) }),
  })
  if (!r.ok) throw new Error('servidor')
}

function leerRecordatorios() {
  try { return JSON.parse(localStorage.getItem('colegio:recordatorios')) || [] } catch (err) { return [] }
}

// Activar: pide permiso, se suscribe y manda la lista
export async function activarAvisos() {
  if (!avisosDisponibles()) throw new Error('no-soportado')
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') throw new Error('sin-permiso')
  await enviarLista(leerRecordatorios())
  guardar('avisos', { activos: true, ultimo: Date.now() })
}

export async function desactivarAvisos() {
  guardar('avisos', { activos: false })
  try {
    await fetch(AVISOS_URL + '/dispositivo/' + idDispositivo(), { method: 'DELETE' })
    const reg = await navigator.serviceWorker.ready
    const sus = await reg.pushManager.getSubscription()
    if (sus) await sus.unsubscribe()
  } catch (err) { /* si no hay internet, igual quedan desactivados en la app */ }
}

export async function probarAviso() {
  await enviarLista(leerRecordatorios()) // por si la suscripción cambió
  const r = await fetch(AVISOS_URL + '/dispositivo/' + idDispositivo() + '/prueba', { method: 'POST' })
  const datos = await r.json()
  if (!datos.ok) throw new Error('servidor')
}

export function mensajeAvisos(err) {
  const m = (err && err.message) || ''
  if (m === 'sin-permiso') return 'No diste permiso para las notificaciones. Activalo en Ajustes → Aplicaciones → Colegio → Notificaciones, y probá de nuevo.'
  if (m === 'no-soportado') return 'Este navegador no puede recibir notificaciones. Usá la app instalada en el celular.'
  if (m === 'servidor') return 'El programa de avisos no respondió. Probá de nuevo en un rato.'
  return 'No me pude conectar. Fijate que tengas internet.'
}

/*
  Componente invisible: cada vez que cambian los recordatorios (y los avisos están
  activados), le manda la lista nueva al programa de avisos.
  Si falla (sin internet), lo intenta de nuevo la próxima vez que se abre la app.
*/
export function SincronizarAvisos() {
  const [recordatorios] = useGuardado('recordatorios', [])
  const [avisos] = useGuardado('avisos', { activos: false })
  const activos = avisos && avisos.activos
  useEffect(() => {
    if (!activos || !avisosDisponibles()) return
    const t = setTimeout(() => {
      enviarLista(recordatorios).catch(() => {})
    }, 800) // esperamos un poquito por si hay varios cambios seguidos
    return () => clearTimeout(t)
  }, [recordatorios, activos])
  return null
}
