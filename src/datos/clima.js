/*
  Clima real con Open-Meteo (https://open-meteo.com).
  Es gratis y no necesita cuenta ni clave.

  Usamos Buenos Aires fijo para no tener que pedir la ubicación del celular.
  El último clima se guarda en el celular: si no hay internet, se muestra ese.
  Se vuelve a pedir como mucho cada 30 minutos.
*/
import { useEffect, useState } from 'react'

export const CIUDAD = { nombre: 'Buenos Aires', lat: -34.61, lon: -58.38, zona: 'America/Argentina/Buenos_Aires' }

const CLAVE = 'colegio:clima'
const CADA = 30 * 60 * 1000 // 30 minutos

const URL_CLIMA =
  'https://api.open-meteo.com/v1/forecast' +
  '?latitude=' + CIUDAD.lat + '&longitude=' + CIUDAD.lon +
  '&current=temperature_2m,weather_code,is_day' +
  '&hourly=temperature_2m,weather_code,is_day' +
  '&daily=temperature_2m_max,temperature_2m_min' +
  '&timezone=' + encodeURIComponent(CIUDAD.zona) + '&forecast_days=2'

/*
  Open-Meteo describe el cielo con un número (el "código WMO").
  Acá lo traducimos a un texto en español y a un tipo de dibujo.
*/
export function describir(codigo) {
  if (codigo === 0) return { texto: 'Despejado', dibujo: 'sol' }
  if (codigo === 1) return { texto: 'Casi despejado', dibujo: 'sol' }
  if (codigo === 2) return { texto: 'Algo nublado', dibujo: 'parcial' }
  if (codigo === 3) return { texto: 'Nublado', dibujo: 'nubes' }
  if (codigo === 45 || codigo === 48) return { texto: 'Niebla', dibujo: 'niebla' }
  if (codigo >= 51 && codigo <= 57) return { texto: 'Llovizna', dibujo: 'lluvia' }
  if (codigo >= 61 && codigo <= 67) return { texto: codigo >= 65 ? 'Lluvia fuerte' : 'Lluvia', dibujo: 'lluvia' }
  if (codigo >= 71 && codigo <= 77) return { texto: 'Nieve', dibujo: 'nieve' }
  if (codigo >= 80 && codigo <= 82) return { texto: 'Chaparrones', dibujo: 'lluvia' }
  if (codigo === 85 || codigo === 86) return { texto: 'Nieve', dibujo: 'nieve' }
  if (codigo >= 95) return { texto: 'Tormenta', dibujo: 'tormenta' }
  return { texto: 'Variable', dibujo: 'parcial' }
}

// Convierte la respuesta de Open-Meteo en lo que muestra la tarjeta
function resumir(datos, ahora = new Date()) {
  const c = datos.current
  const h = datos.hourly
  // Buscamos la hora actual en la lista de horas ("2026-11-14T17:00")
  const horaActual = c.time.slice(0, 13)
  let i = h.time.findIndex((t) => t.slice(0, 13) === horaActual)
  if (i < 0) i = 0
  // Las próximas dos horas "redondas" de a 3 (por ejemplo, 18 h y 21 h)
  const proximas = []
  for (let k = i + 1; k < h.time.length && proximas.length < 2; k++) {
    const hora = Number(h.time[k].slice(11, 13))
    if (hora % 3 === 0) proximas.push({ hora: hora + ' h', temp: Math.round(h.temperature_2m[k]) })
  }
  return {
    temp: Math.round(c.temperature_2m),
    ...describir(c.weather_code),
    deDia: c.is_day === 1,
    max: Math.round(datos.daily.temperature_2m_max[0]),
    min: Math.round(datos.daily.temperature_2m_min[0]),
    proximas,
    actualizado: ahora.getTime(),
  }
}

function leerGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE))
  } catch (err) {
    return null
  }
}

/*
  Hook: devuelve { clima, estado }
  estado: 'cargando' | 'listo' | 'viejo' (sin internet, mostramos el último) | 'error'
*/
export function useClima() {
  const [clima, setClima] = useState(leerGuardado)
  const [estado, setEstado] = useState(() => (leerGuardado() ? 'listo' : 'cargando'))

  useEffect(() => {
    let cancelado = false
    const pedir = async () => {
      const guardado = leerGuardado()
      if (guardado && Date.now() - guardado.actualizado < CADA) return // todavía está fresco
      try {
        const respuesta = await fetch(URL_CLIMA)
        if (!respuesta.ok) throw new Error('Open-Meteo respondió ' + respuesta.status)
        const nuevo = resumir(await respuesta.json())
        localStorage.setItem(CLAVE, JSON.stringify(nuevo))
        if (!cancelado) { setClima(nuevo); setEstado('listo') }
      } catch (err) {
        if (!cancelado) setEstado(guardado ? 'viejo' : 'error')
      }
    }
    pedir()
    // Si la app queda abierta, se actualiza sola cada 30 minutos
    const t = setInterval(pedir, CADA)
    return () => { cancelado = true; clearInterval(t) }
  }, [])

  return { clima, estado }
}
