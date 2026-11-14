/*
  Hook para animar cuando algo se CIERRA.

  Si borramos algo de la pantalla de golpe, no se ve la animación de salida.
  Este hook lo deja "vivo" unos milisegundos más mientras se anima.

    const { visible, saliendo } = usePresencia(abierto, 250)
    if (!visible) return null
    ... className={saliendo ? 'sale-pop' : ''}
*/
import { useEffect, useState } from 'react'

export function usePresencia(abierto, ms = 250) {
  const [montado, setMontado] = useState(abierto)

  useEffect(() => {
    if (abierto) {
      setMontado(true)
      return
    }
    if (!montado) return
    const t = setTimeout(() => setMontado(false), ms)
    return () => clearTimeout(t)
  }, [abierto, montado, ms])

  return { visible: abierto || montado, saliendo: !abierto && montado }
}
