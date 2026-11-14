// Funciones chiquitas para trabajar con fechas en español.

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// 5 → "05"
export const pad2 = (n) => String(n).padStart(2, '0')

// Hoy a las 00:00
export function hoy() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function sumarDias(fecha, n) {
  const d = new Date(fecha)
  d.setDate(d.getDate() + n)
  return d
}

// Fecha → "2026-10-29" (así guardamos los días de los eventos)
export function claveDia(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
}

// "2026-10-29" → Fecha
export function desdeClave(clave) {
  const [a, m, d] = clave.split('-').map(Number)
  return new Date(a, m - 1, d)
}

// Cuántos días hay desde "a" hasta "b" (negativo si "b" es antes)
export function difDias(a, b) {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((b0 - a0) / 86400000)
}

// El lunes de la semana de esa fecha
export function lunesDe(fecha) {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// "Jueves 29 de octubre"
export const fechaLarga = (d) => DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]

// "29 oct"
export const fechaCorta = (d) => d.getDate() + ' ' + MESES_CORTOS[d.getMonth()]

// 0 → "Hoy", 1 → "Mañana", 3 → "En 3 días", -2 → "Hace 2 días"
export function relativo(dias) {
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias === -1) return 'Ayer'
  return dias > 0 ? 'En ' + dias + ' días' : 'Hace ' + -dias + ' días'
}

// "17:30" → 1050 minutos. Sin hora ("todo el día") → -1
export function minutosDe(hora) {
  if (!hora) return -1
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

// Un identificador único para cada cosa que guardamos
export function nuevoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
