/*
  Aviso (o "toast"): el cartelito oscuro que aparece arriba unos segundos,
  por ejemplo "Guardada · Historia ahora tiene 8".

  Uso:
    const { aviso, mostrarAviso } = useAviso()
    mostrarAviso('Listo!')
    ...
    <Aviso {...aviso} />
*/
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePresencia } from './usePresencia'
import * as Icono from './Iconos'

export function useAviso() {
  const [estado, setEstado] = useState({ texto: '', abierto: false, n: 0 })
  const temporizador = useRef(null)

  const mostrarAviso = useCallback((texto) => {
    setEstado((e) => ({ texto, abierto: true, n: e.n + 1 }))
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setEstado((e) => ({ ...e, abierto: false })), 2600)
  }, [])

  useEffect(() => () => clearTimeout(temporizador.current), [])
  return { aviso: estado, mostrarAviso }
}

export default function Aviso({ texto, abierto, n }) {
  const { visible, saliendo } = usePresencia(abierto, 260)
  if (!visible) return null
  return (
    <div
      key={n}
      role="status"
      style={{
        position: 'absolute', top: 'var(--arriba)', left: '50%', zIndex: 130, width: 300, maxWidth: 'calc(100% - 32px)', padding: '12px 16px',
        borderRadius: 20, background: 'rgba(22,24,32,0.9)', color: '#FFFFFF', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 14px 30px rgba(20,24,40,0.3)', display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, fontWeight: 600,
        animation: saliendo ? 'toastOut 0.26s ease-in forwards' : 'toastIn 0.35s cubic-bezier(.22,1,.36,1) both',
      }}
    >
      <span style={{ color: '#6FD6C0', display: 'flex', flexShrink: 0 }}><Icono.Tilde tam={18} grosor={2.6} /></span>
      <span>{texto}</span>
    </div>
  )
}
