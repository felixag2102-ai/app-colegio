/*
  App: el "esqueleto" que une todo.
  Muestra el fondo animado, la pantalla elegida y el menú de abajo.

  irA(numero, accion) cambia de pantalla. La "accion" sirve para que la otra
  pantalla haga algo apenas abre (por ejemplo, abrir "Nuevo evento").
*/
import { useCallback, useEffect, useState } from 'react'
import Fondo from './componentes/Fondo'
import MenuAbajo from './componentes/MenuAbajo'
import Inicio from './pantallas/inicio/Inicio'
import Agenda from './pantallas/Agenda'
import Boletin from './pantallas/Boletin'
import Apuntes from './pantallas/apuntes/Apuntes'
import Ideas from './pantallas/Ideas'

const PANTALLAS = [Inicio, Agenda, Boletin, Apuntes, Ideas]

export default function App() {
  const [nav, setNav] = useState({ pantalla: 0, accion: null, vez: 0 })

  const irA = useCallback((pantalla, accion = null) => {
    setNav((v) => ({ pantalla, accion, vez: v.vez + 1 }))
    // Guardamos el paso en el historial: así el botón "Atrás" del celular vuelve a la pantalla anterior
    window.history.pushState({ pantalla }, '')
  }, [])

  useEffect(() => {
    window.history.replaceState({ pantalla: 0 }, '')
    const alVolver = (e) => {
      const pantalla = (e.state && e.state.pantalla) || 0
      setNav((v) => ({ pantalla, accion: null, vez: v.vez + 1 }))
    }
    window.addEventListener('popstate', alVolver)
    return () => window.removeEventListener('popstate', alVolver)
  }, [])

  const Pantalla = PANTALLAS[nav.pantalla]

  return (
    <div className="app">
      <Fondo pantalla={nav.pantalla} />
      {/* key: cada vez que cambiás de pantalla se "arma de nuevo" y se ven las animaciones de entrada */}
      <Pantalla key={nav.vez} accion={nav.accion} irA={irA} />
      <MenuAbajo actual={nav.pantalla} onIr={(i) => irA(i)} />
    </div>
  )
}
