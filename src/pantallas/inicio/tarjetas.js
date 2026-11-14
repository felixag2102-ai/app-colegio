/*
  Arma las tarjetas apiladas del Inicio a partir de los eventos guardados.

  Hoy:          LO PRÓXIMO (eventos de hoy), PRÓXIMA PRUEBA, PARA ENTREGAR, IDEAS
  Otro día:     una tarjeta por evento, una por prueba y una con las entregas
*/
import { DIAS, claveDia, desdeClave, difDias, fechaLarga, MESES_CORTOS, minutosDe, relativo } from '../../utilidades/fechas'

const porFechaYHora = (a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : minutosDe(a.hora) - minutosDe(b.hora))

// Qué dice el chip de arriba a la derecha de un evento
function chipEvento(e, dias, ahora) {
  if (dias !== 0) return dias < 0 ? 'Ya pasó' : relativo(dias)
  if (!e.hora) return 'Hoy'
  const faltan = minutosDe(e.hora) - (ahora.getHours() * 60 + ahora.getMinutes())
  if (faltan > 90) return 'en ' + Math.round(faltan / 60) + ' h'
  if (faltan > 0) return 'en ' + faltan + ' min'
  if (faltan > -60) return 'Ahora'
  return 'Ya pasó'
}

function tarjetaEvento(e, etiqueta, hoyD, ahora, categorias) {
  const fecha = desdeClave(e.fecha)
  const dias = difDias(hoyD, fecha)
  const cat = categorias.find((c) => c.key === e.tipo)
  return {
    id: 'ev-' + e.id,
    tipo: 'evento',
    etiqueta,
    chip: chipEvento(e, dias, ahora),
    titulo: e.titulo,
    sub: (e.hora || 'Todo el día') + (e.detalle ? ' · ' + e.detalle : ''),
    pie: cat ? cat.name : 'Agenda',
  }
}

function tarjetaPrueba(e, etiqueta, hoyD) {
  const fecha = desdeClave(e.fecha)
  const dias = difDias(hoyD, fecha)
  let numero
  let unidad
  if (dias > 0) { numero = String(dias); unidad = dias === 1 ? 'día' : 'días' }
  else if (dias === 0) { numero = String(fecha.getDate()); unidad = 'hoy' }
  else { numero = String(fecha.getDate()); unidad = MESES_CORTOS[fecha.getMonth()] }
  return {
    id: 'pr-' + e.id,
    tipo: 'prueba',
    etiqueta,
    chip: dias < 0 ? 'Rendida' : relativo(dias),
    numero,
    unidad,
    titulo: e.titulo,
    sub: e.detalle || 'Sin tema anotado',
    pie: fechaLarga(fecha) + (e.hora ? ' · ' + e.hora : ''),
  }
}

function tarjetaEntregas(lista, etiqueta, hoyD) {
  return {
    id: 'en-' + lista.map((e) => e.id).join('-'),
    tipo: 'entrega',
    etiqueta,
    chip: lista.length === 1 ? '1 entrega' : lista.length + ' entregas',
    items: lista.slice(0, 2).map((e, i) => {
      const fecha = desdeClave(e.fecha)
      const dias = difDias(hoyD, fecha)
      let s
      if (dias < 0) s = 'Ya pasó'
      else if (dias <= 1) s = relativo(dias) + (e.hora ? ', ' + e.hora : '')
      else s = DIAS[fecha.getDay()] + ' ' + fecha.getDate() + (e.hora ? ', ' + e.hora : '')
      return { id: e.id, t: e.titulo, s, primero: i === 0 && dias >= 0 }
    }),
  }
}

export function armarTarjetas(fecha, hoyD, ahora, eventos, categorias) {
  const k = claveDia(fecha)
  const esHoy = difDias(hoyD, fecha) === 0
  const delDia = eventos.filter((e) => e.fecha === k).sort(porFechaYHora)
  const esComun = (e) => e.tipo !== 'prueba' && e.tipo !== 'entrega'
  const tarjetas = []

  if (esHoy) {
    const minutos = ahora.getHours() * 60 + ahora.getMinutes()
    const comunes = delDia.filter(esComun)
    const proximo = comunes.find((e) => !e.hora || minutosDe(e.hora) > minutos - 60)
    if (proximo) tarjetas.push(tarjetaEvento(proximo, 'LO PRÓXIMO', hoyD, ahora, categorias))

    const prueba = eventos.filter((e) => e.tipo === 'prueba' && e.fecha >= k).sort(porFechaYHora)[0]
    if (prueba) tarjetas.push(tarjetaPrueba(prueba, 'PRÓXIMA PRUEBA', hoyD))

    const entregas = eventos
      .filter((e) => e.tipo === 'entrega' && e.fecha >= k && difDias(hoyD, desdeClave(e.fecha)) <= 7)
      .sort(porFechaYHora)
    if (entregas.length) tarjetas.push(tarjetaEntregas(entregas, 'PARA ENTREGAR', hoyD))

    comunes.filter((e) => e !== proximo).forEach((e) => tarjetas.push(tarjetaEvento(e, 'EVENTO', hoyD, ahora, categorias)))
    tarjetas.push({ id: 'ideas', tipo: 'ideas', etiqueta: 'IDEAS' })
  } else {
    delDia.filter(esComun).forEach((e) => tarjetas.push(tarjetaEvento(e, 'EVENTO', hoyD, ahora, categorias)))
    delDia.filter((e) => e.tipo === 'prueba').forEach((e) => tarjetas.push(tarjetaPrueba(e, 'PRUEBA', hoyD)))
    const entregas = delDia.filter((e) => e.tipo === 'entrega')
    if (entregas.length) tarjetas.push(tarjetaEntregas(entregas, 'ENTREGAS', hoyD))
    if (!tarjetas.length) tarjetas.push({ id: 'vacio', tipo: 'vacio', etiqueta: 'DÍA LIBRE', chip: relativo(difDias(hoyD, fecha)) })
  }
  return { tarjetas, cantidad: delDia.length }
}
