# Colegio — mi app para organizarme

App web instalable (PWA) hecha con **React** y **Vite**, a partir del diseño de `referencia-diseno/`.

## Cómo probarla en la compu

Necesitás tener instalado **Node.js** (versión 20 o más nueva, gratis desde https://nodejs.org).

```bash
npm install      # descarga las librerías (solo la primera vez)
npm run dev      # abre la app en modo desarrollo
```

Abrí en el navegador la dirección que dice `Local:` (por ejemplo `http://localhost:5173`).
Tip: en Chrome apretá F12 y elegí la vista de celular para verla del tamaño del Samsung.

Cada vez que guardás un archivo del código, la app se actualiza sola en el navegador.

## Cómo verla en el celular (misma red Wi-Fi)

Con `npm run dev` andando, abrí en el Chrome del celular la dirección que dice `Network:`
(por ejemplo `http://192.168.0.15:5173`). La compu y el celular tienen que estar en el mismo Wi-Fi.

Así podés probarla, pero para **instalarla de verdad** (ícono, pantalla completa, sin internet)
hace falta publicarla con HTTPS: eso es la Etapa 2.

## Otros comandos

```bash
npm run build    # arma la versión final en la carpeta dist/
npm run preview  # prueba esa versión final (con el modo sin internet incluido)
```

## Cómo está organizado el código

```
src/
  main.jsx            ← punto de entrada
  App.jsx             ← une el fondo, la pantalla elegida y el menú de abajo
  estilos.css         ← colores, vidrio, botones y todas las animaciones
  config.js           ← tu nombre y el curso
  datos/
    guardado.js       ← guarda datos en el celular (localStorage)
    archivos.js       ← guarda fotos y archivos (IndexedDB)
    iniciales.js      ← categorías, materias y carpetas de arranque
  componentes/        ← piezas que se repiten: menú, hojas, reloj, rueda, etc.
  pantallas/
    inicio/           ← Inicio (tarjetas, recordatorios, menú +, clima)
    Agenda.jsx
    Boletin.jsx
    apuntes/          ← Apuntes (carpetas, subir archivo, asistente)
    Ideas.jsx
public/               ← íconos de la app
referencia-diseno/    ← el diseño original (solo de referencia)
```

## Dónde se guardan mis datos

Todo queda **en el navegador del celular** (no se manda a ningún lado):
- eventos, notas, apuntes, ideas y recordatorios → `localStorage`
- fotos y archivos → `IndexedDB`

Ojo: si borrás los datos de Chrome o desinstalás la app, se borran. Por eso en la Etapa 2
agregamos una copia de seguridad.

## Etapas

1. ✅ Las 5 pantallas funcionando con datos guardados en el celular.
2. ✅ Publicada en GitHub Pages (https://felixag2102-ai.github.io/app-colegio/) + copia de seguridad.
3. ✅ Clima real con Open-Meteo (Buenos Aires o tu ubicación).
4. ✅ Iniciar sesión con Google.
5. ✅ Google Calendar y Google Tasks (solo lectura).
6. ✅ Notificaciones de los recordatorios (Cloudflare Workers, carpeta `notificaciones/`).
7. Asistente de estudio con IA y transcripción de fotos.

## Servicios que usa la app

| Servicio | Para qué | Dónde se configura |
|---|---|---|
| GitHub Pages | Publicar la app | Pestaña Actions → "Publicar la app" |
| Open-Meteo | Clima (gratis, sin clave) | `src/datos/clima.js` |
| Google Cloud (proyecto `app-colegio`) | Iniciar sesión, Calendar y Tasks | `GOOGLE_CLIENT_ID` en `src/config.js` |
| Cloudflare Workers | Mandar las notificaciones | `AVISOS_URL` en `src/config.js`; se publica con Actions → "Publicar los avisos" |

### ⚠️ Para acordarse
- La **clave de API de Cloudflare** (secreto `CLOUDFLARE_API_TOKEN` en GitHub) **vence al año** de crearla
  (noviembre de 2027). Antes de esa fecha hay que crear una nueva en Cloudflare
  (Perfil → API Tokens) y reemplazar el secreto en GitHub (Settings → Secrets and variables → Actions).
  Si vence, las notificaciones siguen funcionando: solo deja de poder publicarse una versión nueva del programa de avisos.
