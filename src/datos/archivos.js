/*
  Guardado de archivos (fotos de apuntes, PDFs, etc.).

  Los archivos son muy grandes para localStorage, así que van a IndexedDB,
  otra "base de datos" del navegador pensada para cosas pesadas.
  Usamos la librería idb-keyval, que la hace tan fácil como guardar/leer por nombre.
*/
import { get, set, del } from 'idb-keyval'
import { useEffect, useState } from 'react'

const clave = (id) => 'archivo:' + id

export const guardarArchivo = (id, blob) => set(clave(id), blob)
export const leerArchivo = (id) => get(clave(id))
export const borrarArchivo = (id) => del(clave(id)).catch(() => {})

// Hook: da una dirección (URL) para mostrar un archivo guardado, por ejemplo en un <img>
export function useUrlArchivo(id) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!id) return
    let cancelado = false
    let creada = null
    leerArchivo(id).then((blob) => {
      if (cancelado || !blob) return
      creada = URL.createObjectURL(blob)
      setUrl(creada)
    })
    return () => {
      cancelado = true
      if (creada) URL.revokeObjectURL(creada)
      setUrl(null)
    }
  }, [id])
  return url
}

// Abre un archivo guardado (en otra pestaña o con la app que corresponda del celular)
export async function abrirArchivo(id, nombre) {
  const blob = await leerArchivo(id)
  if (!blob) return false
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener'
  if (!(blob.type || '').startsWith('image/')) a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  return true
}

// Achica una foto antes de guardarla (las fotos del celular pesan mucho)
export async function achicarFoto(archivo, maximo = 1600, calidad = 0.82) {
  try {
    const imagen = await createImageBitmap(archivo)
    const escala = Math.min(1, maximo / Math.max(imagen.width, imagen.height))
    const lienzo = document.createElement('canvas')
    lienzo.width = Math.round(imagen.width * escala)
    lienzo.height = Math.round(imagen.height * escala)
    lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
    const blob = await new Promise((ok) => lienzo.toBlob(ok, 'image/jpeg', calidad))
    return blob || archivo
  } catch (err) {
    return archivo
  }
}

// 1234567 → "1,2 MB"
export function tamanioLegible(bytes) {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB'
}
