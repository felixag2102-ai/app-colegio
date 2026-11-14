/*
  Clima real con Open-Meteo (https://open-meteo.com).
  Es gratis y no necesita cuenta ni clave.

  Por defecto usamos Buenos Aires. Si la persona lo elige, usamos su ubicación:
  se redondea (margen de ~1 km), se guarda solo en el celular y solo se le
  manda a Open-Meteo para pedir el clima de ese lugar.
  El último clima se guarda en el celular: si no hay internet, se muestra ese.
  Se vuelve a pedir como mucho cada 30 minutos.
*/
import { useCallback, useEffect, useState } from 'react'
import { useGuardado } from './guardado'

export const CIUDAD = { nombre: 'Buenos Aires', lat: -34.61, lon: -58.38, zona: 'America/Argentina/Buenos_Aires' }

const CLAVE = 'colegio:clima-v2' // v2: cambió el cálculo; así se pide de nuevo
const CADA = 30 * 60 * 1000 // 30 minutos

const urlClima = (lat, lon) =>
  'https://api.open-meteo.com/v1/forecast' +
  '?latitude=' + lat + '&longitude=' + lon +
  '&current=temperature_2m,weather_code,is_day,precipitation,cloud_cover' +
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

/*
  El "código" de Open-Meteo sale de un pronóstico, y a veces dice llovizna
  aunque no esté cayendo agua. Por eso lo comparamos con la lluvia real
  (en milímetros) y, si no llueve, usamos cuánto cielo tapan las nubes.
*/
const LLUEVE = (codigo) => (codigo >= 51 && codigo <= 67) || (codigo >= 80 && codigo <= 82)

function codigoCorregido(c) {
  const agua = typeof c.precipitation === 'number' ? c.precipitation : null
  if (!LLUEVE(c.weather_code) || agua === null || agua >= 0.1) return c.weather_code
  const nubes = typeof c.cloud_cover === 'number' ? c.cloud_cover : 50
  if (nubes < 20) return 0 // despejado
  if (nubes < 50) return 1 // casi despejado
  if (nubes < 85) return 2 // algo nublado
  return 3 // nublado
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
    ...describir(codigoCorregido(c)),
    deDia: c.is_day === 1,
    max: Math.round(datos.daily.temperature_2m_max[0]),
    min: Math.round(datos.daily.temperature_2m_min[0]),
    proximas,
    actualizado: ahora.getTime(),
  }
}

// Redondeamos a 2 decimales (más o menos 1 km): suficiente para el clima, sin dar la ubicación exacta
const redondear = (x) => Math.round(x * 100) / 100

// Le pide al celular la ubicación (Android muestra el cartel de permiso la primera vez)
function pedirPosicion() {
  return new Promise((ok, mal) => {
    if (!navigator.geolocation) { mal({ code: 0 }); return }
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: redondear(p.coords.latitude), lon: redondear(p.coords.longitude) }),
      mal,
      { enableHighAccuracy: false, timeout: 15000, maximumAge: CADA }
    )
  })
}

function leerGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE))
  } catch (err) {
    return null
  }
}

/*
  Hook: devuelve { clima, estado, lugar, usarUbicacion, usarCiudad }
  estado: 'cargando' | 'listo' | 'viejo' (sin internet, mostramos el último) | 'error'
  lugar:  null (todavía no eligió) | { modo: 'ciudad' } | { modo: 'ubicacion', lat, lon }
*/
export function useClima() {
  const [lugar, setLugar] = useGuardado('climaLugar', null)
  const [clima, setClima] = useState(leerGuardado)
  const [estado, setEstado] = useState(() => (leerGuardado() ? 'listo' : 'cargando'))

  const coords = lugar && lugar.modo === 'ubicacion' ? lugar : CIUDAD
  const claveLugar = coords.lat + ',' + coords.lon

  useEffect(() => {
    let cancelado = false
    const pedir = async () => {
      const guardado = leerGuardado()
      const mismoLugar = guardado && guardado.lugar === claveLugar
      if (mismoLugar && Date.now() - guardado.actualizado < CADA) { setClima(guardado); setEstado('listo'); return } // todavía está fresco
      try {
        const respuesta = await fetch(urlClima(coords.lat, coords.lon))
        if (!respuesta.ok) throw new Error('Open-Meteo respondió ' + respuesta.status)
        const nuevo = { ...resumir(await respuesta.json()), lugar: claveLugar }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveLugar])

  // Si usa su ubicación y se movió (por ejemplo, está en otro barrio), la actualizamos sin molestar
  useEffect(() => {
    if (!lugar || lugar.modo !== 'ubicacion') return
    pedirPosicion()
      .then((p) => { if (p.lat !== lugar.lat || p.lon !== lugar.lon) setLugar({ modo: 'ubicacion', ...p }) })
      .catch(() => {}) // si falla, seguimos con la última ubicación guardada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const usarUbicacion = useCallback(async () => {
    try {
      const p = await pedirPosicion()
      setLugar({ modo: 'ubicacion', ...p })
      return { ok: true }
    } catch (err) {
      return {
        ok: false,
        mensaje: err && err.code === 1
          ? 'No diste permiso para usar la ubicación. Si cambiás de idea, activalo en Ajustes → Aplicaciones → Colegio → Permisos → Ubicación.'
          : 'No pude encontrar tu ubicación. Fijate que la ubicación del celular esté prendida y probá de nuevo.',
      }
    }
  }, [setLugar])

  const usarCiudad = useCallback(() => setLugar({ modo: 'ciudad' }), [setLugar])

  return { clima, estado, lugar, usarUbicacion, usarCiudad }
}
