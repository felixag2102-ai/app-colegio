/*
  Lo que tiene la app la primera vez que la abrís.
  No hay datos de ejemplo: solo categorías, materias y carpetas para empezar.
  Todo se puede cambiar desde la app con el botón del lápiz.
*/

export const CATEGORIAS_AGENDA = [
  { key: 'prueba', name: 'Pruebas', color: '#C24E00' },
  { key: 'entrega', name: 'Entregas', color: '#3D63F0' },
  { key: 'evento', name: 'Eventos', color: '#15171C' },
  { key: 'cumple', name: 'Cumpleaños', color: '#C2185B' },
  { key: 'feriado', name: 'Feriados', color: '#0F7B5F' },
]

const MATERIAS_BASE = [
  { id: 'matematica', name: 'Matemática', color: '#3D63F0' },
  { id: 'historia', name: 'Historia', color: '#C24E00' },
  { id: 'ingles', name: 'Inglés', color: '#0F7B5F' },
  { id: 'fisica', name: 'Física', color: '#7A3BD1' },
  { id: 'biologia', name: 'Biología', color: '#2E8540' },
  { id: 'lengua', name: 'Lengua', color: '#B3261E' },
]

export const MATERIAS = MATERIAS_BASE.map((m) => ({ ...m, grades: [] }))

export const CARPETAS = MATERIAS_BASE.map((m) => ({ ...m, notes: [], files: [] }))

export const CATEGORIAS_IDEAS = [
  { id: 'planes', name: 'Planes', color: '#C2185B' },
  { id: 'lugares', name: 'Lugares', color: '#0F7B5F' },
  { id: 'aprender', name: 'Aprender', color: '#3D63F0' },
  { id: 'none', name: 'Sin categoría', color: '#8E93A0', locked: true },
]
