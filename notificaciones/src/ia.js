/*
  INTELIGENCIA ARTIFICIAL (Gemini, de Google) para la app Colegio.

  - Solo responde si el pedido trae un "pase" de Google de la cuenta permitida
    (secreto EMAIL_PERMITIDO). Así nadie más puede usar el saldo/los usos.
  - Máximo LIMITE_DIARIO usos por día (se cuentan en una cajita especial).
  - La clave de Gemini (secreto GEMINI_API_KEY) nunca sale de acá.

  Rutas:
    POST /ia/chat  { mensajes: [{ rol: 'user'|'model', texto }], contexto }  → { texto }
    POST /ia/foto  { imagen (base64), tipo }                                → { titulo, texto }
*/

const INSTRUCCIONES_CHAT = `Sos el asistente de estudio de un estudiante de 3er año de secundaria de Buenos Aires.
Hablás en español rioplatense (usás "vos"), con un tono cercano, claro y alentador.

Cómo ayudás:
- Usá la información de su Boletín, sus apuntes y sus próximas pruebas que aparece en "CONTEXTO". Si algo no está ahí, decilo y respondé con lo que sabés en general.
- Tu objetivo es que aprenda, no hacerle la tarea: explicá paso a paso, poné ejemplos y, cuando sirva, hacé preguntas para que piense.
- Si te pide que le tomes preguntas: hacé UNA pregunta por vez, esperá la respuesta, decile si está bien o qué le faltó, y seguí con la próxima.
- Si te pide un plan de estudio: armalo con horarios concretos y cortos, teniendo en cuenta sus próximas pruebas.
- Respuestas cortas y fáciles de leer en un celular: párrafos breves o listas. Sin tablas.
- No uses formato Markdown con asteriscos ni numerales: escribí texto común.
- Si te pregunta algo que no tiene que ver con el estudio, respondé brevemente y amable, y si es algo peligroso o inapropiado para su edad, no ayudes y sugerile hablar con un adulto de confianza.`

const INSTRUCCIONES_FOTO = `Esta es una foto de un apunte de clase (puede ser letra a mano, una fotocopia o el pizarrón).
Pasá a texto TODO lo que está escrito, respetando el orden y los renglones. No resumas ni agregues nada.
Si una palabra no se entiende, poné [?]. Si no hay texto, devolvé texto vacío.
Además, proponé un título corto (máximo 6 palabras) para el apunte.`

const pasesVerificados = new Map() // pase → { email, hasta }

// Revisa con Google que el pase sea válido y de la cuenta permitida
async function verificarPase(pedido, env) {
  const auth = pedido.headers.get('Authorization') || ''
  const pase = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!pase || pase.length > 4000) return 'sin-sesion'
  const guardado = pasesVerificados.get(pase)
  let email
  if (guardado && guardado.hasta > Date.now()) email = guardado.email
  else {
    const url = (env.MODO_PRUEBA === '1' && env.PRUEBA_USERINFO) || 'https://www.googleapis.com/oauth2/v3/userinfo'
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + pase } })
    if (!r.ok) return 'sin-sesion'
    const datos = await r.json()
    if (!datos.email || datos.email_verified === false) return 'sin-sesion'
    email = String(datos.email).toLowerCase()
    pasesVerificados.set(pase, { email, hasta: Date.now() + 10 * 60 * 1000 })
    if (pasesVerificados.size > 50) pasesVerificados.delete(pasesVerificados.keys().next().value)
  }
  const permitido = String(env.EMAIL_PERMITIDO || '').trim().toLowerCase()
  if (!permitido || email !== permitido) return 'cuenta-no-permitida'
  return 'ok'
}

async function llamarGemini(env, cuerpo) {
  const modelo = env.GEMINI_MODELO || 'gemini-flash-latest'
  const base = (env.MODO_PRUEBA === '1' && env.PRUEBA_GEMINI) || 'https://generativelanguage.googleapis.com'
  const r = await fetch(base + '/v1beta/models/' + encodeURIComponent(modelo) + ':generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify(cuerpo),
  })
  if (r.status === 429) throw new Error('limite-gemini')
  if (!r.ok) {
    console.log('Gemini respondió', r.status, (await r.text()).slice(0, 500))
    throw new Error('gemini')
  }
  const datos = await r.json()
  if (datos.promptFeedback && datos.promptFeedback.blockReason) throw new Error('bloqueado')
  const candidato = datos.candidates && datos.candidates[0]
  if (!candidato || candidato.finishReason === 'SAFETY') throw new Error('bloqueado')
  const texto = ((candidato.content && candidato.content.parts) || []).map((p) => p.text || '').join('').trim()
  if (!texto) throw new Error('vacio')
  return texto
}

export async function chat(cuerpo, env) {
  const mensajes = Array.isArray(cuerpo.mensajes) ? cuerpo.mensajes.slice(-16) : []
  const contents = mensajes
    .filter((m) => m && (m.rol === 'user' || m.rol === 'model') && typeof m.texto === 'string' && m.texto.trim())
    .map((m) => ({ role: m.rol, parts: [{ text: m.texto.slice(0, 4000) }] }))
  if (!contents.length || contents[contents.length - 1].role !== 'user') throw new Error('datos')
  const contexto = typeof cuerpo.contexto === 'string' ? cuerpo.contexto.slice(0, 40000) : ''
  return llamarGemini(env, {
    systemInstruction: { parts: [{ text: INSTRUCCIONES_CHAT + '\n\nCONTEXTO (datos de la app del estudiante):\n' + (contexto || '(sin datos)') }] },
    contents,
    generationConfig: { maxOutputTokens: 2000 },
  })
}

export async function foto(cuerpo, env) {
  const tipo = ['image/jpeg', 'image/png', 'image/webp'].includes(cuerpo.tipo) ? cuerpo.tipo : 'image/jpeg'
  if (typeof cuerpo.imagen !== 'string' || cuerpo.imagen.length < 100) throw new Error('datos')
  const texto = await llamarGemini(env, {
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType: tipo, data: cuerpo.imagen } }, { text: INSTRUCCIONES_FOTO }] }],
    generationConfig: {
      maxOutputTokens: 4000,
      responseMimeType: 'application/json',
      responseSchema: { type: 'OBJECT', properties: { titulo: { type: 'STRING' }, texto: { type: 'STRING' } }, required: ['titulo', 'texto'] },
    },
  })
  let res
  try { res = JSON.parse(texto) } catch (err) { res = { titulo: '', texto } }
  return { titulo: String(res.titulo || '').slice(0, 80), texto: String(res.texto || '').slice(0, 20000) }
}

// Maneja /ia/... ; devuelve { estado, datos }
export async function manejarIA(pedido, env, ruta, sumarUso) {
  if (pedido.method !== 'POST') return { estado: 404, datos: { error: 'no existe' } }
  if (!env.GEMINI_API_KEY) return { estado: 503, datos: { error: 'ia-sin-configurar' } }
  const pase = await verificarPase(pedido, env)
  if (pase !== 'ok') return { estado: 401, datos: { error: pase } }
  const texto = await pedido.text()
  if (texto.length > 12 * 1024 * 1024) return { estado: 413, datos: { error: 'muy grande' } }
  let cuerpo
  try { cuerpo = JSON.parse(texto) } catch (err) { return { estado: 400, datos: { error: 'datos' } } }
  const limite = Number(env.LIMITE_DIARIO) || 60
  const uso = await sumarUso(limite)
  if (!uso.ok) return { estado: 429, datos: { error: 'limite-diario', limite } }
  try {
    if (ruta === 'chat') return { estado: 200, datos: { texto: await chat(cuerpo, env), quedan: limite - uso.usados } }
    if (ruta === 'foto') return { estado: 200, datos: { ...(await foto(cuerpo, env)), quedan: limite - uso.usados } }
    return { estado: 404, datos: { error: 'no existe' } }
  } catch (err) {
    const m = err.message
    return { estado: m === 'datos' ? 400 : 502, datos: { error: ['limite-gemini', 'bloqueado', 'vacio', 'datos'].includes(m) ? m : 'gemini' } }
  }
}
