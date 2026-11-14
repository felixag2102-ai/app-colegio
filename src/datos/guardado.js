/*
  Guardado de datos en el celular.

  Usamos "localStorage": un lugar del navegador donde se pueden guardar textos.
  Los datos quedan ahí aunque cierres la app o apagues el celular.
  Como localStorage solo guarda texto, convertimos los datos con JSON.

  Uso en un componente (igual que useState, pero se guarda solo):
    const [ideas, setIdeas] = useGuardado('ideas', [])
*/
import { useCallback, useSyncExternalStore } from 'react'

const PREFIJO = 'colegio:'
const memoria = new Map() // copia en memoria para no leer el disco a cada rato
const oyentes = new Set() // componentes que quieren enterarse de cambios

function leer(clave, inicial) {
  if (memoria.has(clave)) return memoria.get(clave)
  let valor = inicial
  try {
    const texto = localStorage.getItem(PREFIJO + clave)
    if (texto !== null) valor = JSON.parse(texto)
  } catch (err) {
    console.warn('No pude leer', clave, err)
  }
  memoria.set(clave, valor)
  return valor
}

export function guardar(clave, valor) {
  memoria.set(clave, valor)
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor))
  } catch (err) {
    console.warn('No pude guardar', clave, err)
  }
  oyentes.forEach((avisar) => avisar())
}

function suscribir(avisar) {
  oyentes.add(avisar)
  return () => oyentes.delete(avisar)
}

// Si la app está abierta en otra pestaña y cambia algo, nos enteramos
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith(PREFIJO)) return
    memoria.delete(e.key.slice(PREFIJO.length))
    oyentes.forEach((avisar) => avisar())
  })
}

export function useGuardado(clave, inicial) {
  const valor = useSyncExternalStore(suscribir, () => leer(clave, inicial))
  const cambiar = useCallback(
    (nuevo) => {
      const actual = leer(clave, inicial)
      guardar(clave, typeof nuevo === 'function' ? nuevo(actual) : nuevo)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clave]
  )
  return [valor, cambiar]
}

// Le pedimos al navegador que no borre nuestros datos si se queda sin espacio
export function pedirGuardadoPermanente() {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist()
  } catch (err) {
    // no pasa nada si no se puede
  }
}
