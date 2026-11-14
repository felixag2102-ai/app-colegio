/*
  Programa de AVISOS de la app Colegio (corre en Cloudflare Workers).

  - Cada celular tiene su propio "Durable Object" (como una cajita con memoria propia),
    donde se guardan su suscripción de push y sus recordatorios PENDIENTES.
  - La cajita pone una "alarma" a la hora del próximo recordatorio. Cuando suena,
    manda la notificación y pone la alarma para el siguiente.
  - Los recordatorios ya avisados se borran.

  Rutas:
    GET    /clave                      → clave pública para suscribirse a las notificaciones
    PUT    /dispositivo/:id            → guarda suscripción + recordatorios pendientes
    POST   /dispositivo/:id/prueba     → manda una notificación de prueba ya mismo
    DELETE /dispositivo/:id            → borra todo lo de ese celular
    POST   /ia/chat  y  /ia/foto       → inteligencia artificial (ver ia.js)
*/
import { DurableObject } from 'cloudflare:workers'
import { crearClavesVapid, endpointValido, enviarPush } from './webpush.js'
import { manejarIA } from './ia.js'

const CONTACTO = 'https://felixag2102-ai.github.io/app-colegio/'
const ORIGENES = ['https://felixag2102-ai.github.io', 'http://localhost:5173', 'http://localhost:4173']
const MAX_RECORDATORIOS = 200
const DIA = 24 * 3600 * 1000

export class Dispositivo extends DurableObject {
  // Solo la usa la cajita especial "__claves__": crea las claves VAPID una vez y las guarda
  async claves() {
    let c = await this.ctx.storage.get('claves')
    if (!c) {
      c = await crearClavesVapid()
      await this.ctx.storage.put('claves', c)
    }
    return c
  }

  // Solo la usa la cajita especial "__uso__": cuenta cuántos usos de IA hubo hoy
  async sumarUso(limite) {
    const hoy = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10) // día en Argentina (UTC-3)
    const datos = (await this.ctx.storage.get('uso')) || { dia: hoy, usados: 0 }
    if (datos.dia !== hoy) { datos.dia = hoy; datos.usados = 0 }
    if (datos.usados >= limite) return { ok: false, usados: datos.usados }
    datos.usados++
    await this.ctx.storage.put('uso', datos)
    return { ok: true, usados: datos.usados }
  }

  async guardar(suscripcion, recordatorios) {
    await this.ctx.storage.put('suscripcion', suscripcion)
    await this.ctx.storage.put('recordatorios', recordatorios)
    await this.programar(recordatorios)
  }

  async programar(lista) {
    if (!lista.length) { await this.ctx.storage.deleteAlarm(); return }
    const proximo = Math.min(...lista.map((r) => r.cuando))
    await this.ctx.storage.setAlarm(Math.max(Date.now() + 1000, proximo))
  }

  async borrarTodo() {
    await this.ctx.storage.deleteAlarm()
    await this.ctx.storage.deleteAll()
  }

  async mandar(datos) {
    const suscripcion = await this.ctx.storage.get('suscripcion')
    if (!suscripcion) return 0
    const claves = await this.env.DISPOSITIVO.get(this.env.DISPOSITIVO.idFromName('__claves__')).claves()
    const estado = await enviarPush(suscripcion, datos, claves, CONTACTO)
    if (estado === 404 || estado === 410) await this.borrarTodo() // el celular ya no acepta avisos
    return estado
  }

  async probar() {
    return this.mandar({ titulo: 'Colegio', cuerpo: '¡Las notificaciones funcionan! 🎉', id: 'prueba' })
  }

  // Suena la alarma: mandamos los recordatorios que llegaron a su hora
  async alarm() {
    const lista = (await this.ctx.storage.get('recordatorios')) || []
    const ahora = Date.now()
    const vencidos = lista.filter((r) => r.cuando <= ahora + 2000)
    const resto = lista.filter((r) => r.cuando > ahora + 2000)
    for (const r of vencidos) {
      try {
        const estado = await this.mandar({ titulo: 'Recordatorio', cuerpo: r.t, id: r.id })
        if (estado === 404 || estado === 410) return // se borró todo
      } catch (err) {
        console.log('No se pudo mandar', r.id, String(err))
      }
    }
    await this.ctx.storage.put('recordatorios', resto)
    await this.programar(resto)
  }
}

// ---------- Ayudas ----------

function cors(origen) {
  const permitido = ORIGENES.includes(origen) ? origen : ORIGENES[0]
  return {
    'Access-Control-Allow-Origin': permitido,
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(datos, estado, origen) {
  return new Response(JSON.stringify(datos), { status: estado, headers: { 'Content-Type': 'application/json', ...cors(origen) } })
}

// Revisa que lo que manda la app tenga sentido (y lo achica si hace falta)
function validar(cuerpo, env) {
  const s = cuerpo && cuerpo.suscripcion
  const modoPrueba = env.MODO_PRUEBA === '1'
  if (!s || typeof s.endpoint !== 'string' || !s.keys || typeof s.keys.p256dh !== 'string' || typeof s.keys.auth !== 'string') return null
  if (!endpointValido(s.endpoint) && !(modoPrueba && s.endpoint.startsWith('http://127.0.0.1'))) return null
  if (!Array.isArray(cuerpo.recordatorios)) return null
  const ahora = Date.now()
  const recordatorios = cuerpo.recordatorios
    .filter((r) => r && typeof r.id === 'string' && typeof r.t === 'string' && typeof r.cuando === 'number')
    .filter((r) => r.cuando > ahora - 60000 && r.cuando < ahora + 400 * DIA)
    .slice(0, MAX_RECORDATORIOS)
    .map((r) => ({ id: r.id.slice(0, 40), t: r.t.slice(0, 200), cuando: r.cuando }))
  return {
    suscripcion: { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh.slice(0, 200), auth: s.keys.auth.slice(0, 100) } },
    recordatorios,
  }
}

export default {
  async fetch(pedido, env) {
    const origen = pedido.headers.get('Origin') || ''
    if (origen && !ORIGENES.includes(origen)) return new Response('Origen no permitido', { status: 403 })
    if (pedido.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origen) })

    const url = new URL(pedido.url)
    const partes = url.pathname.split('/').filter(Boolean)

    if (pedido.method === 'GET' && url.pathname === '/clave') {
      const claves = await env.DISPOSITIVO.get(env.DISPOSITIVO.idFromName('__claves__')).claves()
      return json({ clave: claves.publica }, 200, origen)
    }

    if (partes[0] === 'ia' && partes.length === 2) {
      const contador = env.DISPOSITIVO.get(env.DISPOSITIVO.idFromName('__uso__'))
      const { estado, datos } = await manejarIA(pedido, env, partes[1], (limite) => contador.sumarUso(limite))
      return json(datos, estado, origen)
    }

    if (partes[0] === 'dispositivo' && /^[a-z0-9]{20,40}$/.test(partes[1] || '')) {
      const cajita = env.DISPOSITIVO.get(env.DISPOSITIVO.idFromName('d-' + partes[1]))

      if (pedido.method === 'PUT' && partes.length === 2) {
        const texto = await pedido.text()
        if (texto.length > 64000) return json({ error: 'muy grande' }, 413, origen)
        let cuerpo
        try { cuerpo = JSON.parse(texto) } catch (err) { return json({ error: 'json' }, 400, origen) }
        const datos = validar(cuerpo, env)
        if (!datos) return json({ error: 'datos' }, 400, origen)
        await cajita.guardar(datos.suscripcion, datos.recordatorios)
        return json({ ok: true, programados: datos.recordatorios.length }, 200, origen)
      }
      if (pedido.method === 'POST' && partes[2] === 'prueba') {
        const estado = await cajita.probar()
        return json({ ok: estado >= 200 && estado < 300, estado }, 200, origen)
      }
      if (pedido.method === 'DELETE' && partes.length === 2) {
        await cajita.borrarTodo()
        return json({ ok: true }, 200, origen)
      }
    }

    return json({ error: 'no existe' }, 404, origen)
  },
}
