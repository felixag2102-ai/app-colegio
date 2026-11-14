/*
  Copia de seguridad.

  Tus datos viven solo en el navegador del celular. Si se borran (por ejemplo,
  al desinstalar la app), se pierden. Con esto guardás TODO en un archivo
  (.json) y lo podés recuperar después, incluso en otro celular o en la compu.
*/
import { entries, set, del, keys } from 'idb-keyval'

const PREFIJO = 'colegio:'

// Blob (archivo) → texto en base64, para poder meterlo adentro del .json
function blobATexto(blob) {
  return new Promise((ok, mal) => {
    const lector = new FileReader()
    lector.onload = () => ok(lector.result) // "data:image/jpeg;base64,...."
    lector.onerror = mal
    lector.readAsDataURL(blob)
  })
}

async function textoABlob(dataUrl) {
  const respuesta = await fetch(dataUrl)
  return respuesta.blob()
}

export async function guardarCopia() {
  const datos = {}
  for (let i = 0; i < localStorage.length; i++) {
    const clave = localStorage.key(i)
    if (clave.startsWith(PREFIJO)) datos[clave] = localStorage.getItem(clave)
  }
  const archivos = {}
  for (const [clave, blob] of await entries()) {
    if (String(clave).startsWith('archivo:') && blob instanceof Blob) archivos[clave] = await blobATexto(blob)
  }
  const copia = { app: 'colegio', version: 1, fecha: new Date().toISOString(), datos, archivos }

  const hoy = new Date()
  const nombre = 'colegio-copia-' + hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0') + '.json'
  const url = URL.createObjectURL(new Blob([JSON.stringify(copia)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  return { nombre, cantidadArchivos: Object.keys(archivos).length }
}

// Reemplaza todos los datos actuales por los de la copia
export async function recuperarCopia(archivo) {
  let copia
  try {
    copia = JSON.parse(await archivo.text())
  } catch (err) {
    throw new Error('Ese archivo no es una copia de la app.')
  }
  if (!copia || copia.app !== 'colegio' || typeof copia.datos !== 'object') {
    throw new Error('Ese archivo no es una copia de la app.')
  }

  // 1) Borramos lo que hay ahora
  Object.keys(localStorage).filter((c) => c.startsWith(PREFIJO)).forEach((c) => localStorage.removeItem(c))
  for (const clave of await keys()) {
    if (String(clave).startsWith('archivo:')) await del(clave)
  }

  // 2) Ponemos lo de la copia
  Object.entries(copia.datos).forEach(([clave, valor]) => {
    if (clave.startsWith(PREFIJO)) localStorage.setItem(clave, valor)
  })
  for (const [clave, texto] of Object.entries(copia.archivos || {})) {
    if (clave.startsWith('archivo:')) await set(clave, await textoABlob(texto))
  }
}
