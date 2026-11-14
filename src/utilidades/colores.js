// Colores que se usan en varias pantallas.

export const ACENTO = '#3D63F0'

// Los 8 colores que se pueden elegir para categorías, materias y carpetas
export const COLORES = ['#3D63F0', '#0F7B5F', '#C24E00', '#7A3BD1', '#C2185B', '#2E8540', '#B3261E', '#15171C']
export const NOMBRES_COLORES = ['Azul', 'Verde', 'Naranja', 'Violeta', 'Rosa', 'Verde hoja', 'Rojo', 'Negro']

// "#3D63F0" + 0.15 → "rgba(61,99,240,0.15)" (el mismo color pero transparente)
export function conAlfa(hex, alfa) {
  const h = (hex || '#8E93A0').replace('#', '')
  return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + alfa + ')'
}
