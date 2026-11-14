// Datos generales de la app.
// El nombre de la persona NO va acá: la app lo pregunta la primera vez
// y lo guarda en el celular (ver pantallas/inicio/TuNombre.jsx).

export const CURSO = '3er año · 3er trimestre'

// ID de cliente de Google (sale de Google Cloud → "Clientes"). NO es secreto:
// está pensado para ir en el código de la app. Si está vacío, el botón
// "Iniciar sesión con Google" no aparece.
export const GOOGLE_CLIENT_ID = '898956008730-dfndfqn2jge5t2cvpvvaatov35mh18du.apps.googleusercontent.com'

// Dirección del programa de avisos en Cloudflare (sale al publicarlo; NO es secreta).
// Si está vacía, la opción de notificaciones no aparece.
export const AVISOS_URL = ''
