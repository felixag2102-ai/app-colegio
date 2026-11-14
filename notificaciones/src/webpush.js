/*
  Web Push: mandar una notificación a un celular.

  Usa solo WebCrypto (funciona en Cloudflare Workers y en Node).
  Sigue dos estándares:
  - RFC 8291: el mensaje va CIFRADO, solo el celular lo puede leer.
  - RFC 8292 (VAPID): firmamos el pedido para que el servicio de push
    (por ejemplo, el de Google para Chrome) sepa que somos nosotros.
*/

const enc = new TextEncoder()

export function aB64u(buf) {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function deB64u(texto) {
  const s = texto.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((texto.length + 3) % 4)
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function unir(...partes) {
  const total = partes.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const p of partes) { out.set(p, pos); pos += p.length }
  return out
}

async function hmac(clave, datos) {
  const k = await crypto.subtle.importKey('raw', clave, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, datos))
}

// Crea las claves VAPID (una sola vez; después se guardan)
export async function crearClavesVapid() {
  const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const publica = new Uint8Array(await crypto.subtle.exportKey('raw', par.publicKey))
  const privada = await crypto.subtle.exportKey('jwk', par.privateKey)
  return { publica: aB64u(publica), privada }
}

// Firma VAPID (un "JWT" firmado con ES256)
async function firmaVapid(endpoint, claves, contacto) {
  const cabecera = aB64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const datos = aB64u(enc.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: contacto,
  })))
  const privada = await crypto.subtle.importKey('jwk', claves.privada, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const firma = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privada, enc.encode(cabecera + '.' + datos))
  return 'vapid t=' + cabecera + '.' + datos + '.' + aB64u(firma) + ', k=' + claves.publica
}

// Cifra el mensaje para ese celular (RFC 8291, "aes128gcm")
export async function cifrar(mensaje, p256dh, auth, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const clavePublicaCelular = deB64u(p256dh)
  const secretoAuth = deB64u(auth)

  const efimero = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const publicaNuestra = new Uint8Array(await crypto.subtle.exportKey('raw', efimero.publicKey))
  const celular = await crypto.subtle.importKey('raw', clavePublicaCelular, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const compartido = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: celular }, efimero.privateKey, 256))

  const prkClave = await hmac(secretoAuth, compartido)
  const ikm = await hmac(prkClave, unir(enc.encode('WebPush: info\0'), clavePublicaCelular, publicaNuestra, new Uint8Array([1])))
  const prk = await hmac(salt, ikm)
  const cek = (await hmac(prk, unir(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16)
  const nonce = (await hmac(prk, unir(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12)

  const claveAes = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt'])
  const texto = unir(enc.encode(mensaje), new Uint8Array([2])) // 2 = último bloque
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, claveAes, texto))

  const tamanioBloque = new Uint8Array([0, 0, 16, 0]) // 4096
  return unir(salt, tamanioBloque, new Uint8Array([publicaNuestra.length]), publicaNuestra, cifrado)
}

/*
  Manda la notificación. Devuelve el código de respuesta del servicio de push:
  201 = enviada. 404 o 410 = ese celular ya no acepta avisos (hay que olvidarlo).
*/
export async function enviarPush(suscripcion, datos, claves, contacto) {
  const cuerpo = await cifrar(JSON.stringify(datos), suscripcion.keys.p256dh, suscripcion.keys.auth)
  const r = await fetch(suscripcion.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await firmaVapid(suscripcion.endpoint, claves, contacto),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
      Urgency: 'high',
    },
    body: cuerpo,
  })
  return r.status
}

// Solo aceptamos los servicios de push conocidos (así nadie usa el programa para pedir otras páginas)
const SERVICIOS_PUSH = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/, /^web\.push\.apple\.com$/]
export function endpointValido(endpoint) {
  try {
    const u = new URL(endpoint)
    return u.protocol === 'https:' && SERVICIOS_PUSH.some((r) => r.test(u.hostname))
  } catch (err) {
    return false
  }
}
