/*
  Esto corre dentro del "service worker" (la parte de la app que sigue viva
  aunque la cierres). Recibe las notificaciones y las muestra.
*/
self.addEventListener('push', (evento) => {
  let datos = {}
  try { datos = evento.data ? evento.data.json() : {} } catch (err) { datos = { cuerpo: evento.data && evento.data.text() } }
  const icono = new URL('icono-192.png', self.registration.scope).href
  evento.waitUntil(
    self.registration.showNotification(datos.titulo || 'Recordatorio', {
      body: datos.cuerpo || '',
      icon: icono,
      tag: datos.id || undefined,
      vibrate: [120, 60, 120],
      data: { url: self.registration.scope },
    })
  )
})

// Al tocar la notificación, abrimos la app (o la traemos al frente si ya estaba abierta)
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (ventanas) => {
      const url = (evento.notification.data && evento.notification.data.url) || self.registration.scope
      for (const v of ventanas) {
        try { if ('focus' in v) return await v.focus() } catch (err) { /* si no se puede, abrimos una nueva */ }
      }
      return self.clients.openWindow(url)
    })
  )
})
