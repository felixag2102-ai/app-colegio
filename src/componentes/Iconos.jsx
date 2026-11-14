// Íconos dibujados con SVG (copiados del diseño).
// Uso: <Icono.Mas tam={18} grosor={2.6} />

function Svg({ tam = 20, grosor = 2.2, children, relleno = 'none', estilo, ...resto }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill={relleno}
      stroke={relleno === 'none' ? 'currentColor' : 'none'}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={estilo}
      {...resto}
    >
      {children}
    </svg>
  )
}

export const Mas = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const Lapiz = (p) => <Svg {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></Svg>
export const Basura = (p) => <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Svg>
export const Tilde = (p) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
export const Cerrar = (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const Izquierda = (p) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>
export const Derecha = (p) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>
export const Abajo = (p) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>
export const Arriba = (p) => <Svg {...p}><path d="M6 15l6-6 6 6" /></Svg>
export const DobleIzquierda = (p) => <Svg {...p}><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></Svg>
export const Calendario = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>
export const Campana = (p) => <Svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" /><path d="M10 20a2 2 0 0 0 4 0" /></Svg>
export const Hoja = (p) => <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></Svg>
export const Barras = (p) => <Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>
export const Camara = (p) => <Svg {...p}><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.5" /></Svg>
export const Lamparita = (p) => <Svg {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" /></Svg>
export const Casa = (p) => <Svg {...p}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Svg>
export const Carpeta = (p) => <Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>
export const Subir = (p) => <Svg {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></Svg>
export const Reloj = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
export const Sol = (p) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></Svg>
export const CalendarioReloj = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4M12 13.5v2.5l1.6 1" /></Svg>
export const Celular = (p) => <Svg {...p}><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></Svg>
export const Drive = (p) => <Svg {...p}><path d="M8 3h8l6 11-4 7H6l-4-7z" /><path d="M8 3l6 11H2M16 3l-6 11 4 7" /></Svg>
export const Classroom = (p) => <Svg {...p}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /></Svg>
export const Enviar = (p) => <Svg {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Svg>
export const Escribir = (p) => <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Svg>
export const Puntos = ({ tam = 18 }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
  </svg>
)
export const Chispa = ({ tam = 16, estilo }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true" style={estilo}>
    <path d="M12 2.5l2.2 6.1 6.3 2.4-6.3 2.4L12 19.5l-2.2-6.1L3.5 11l6.3-2.4z" />
    <path d="M19 15.5l.8 2.2 2.2.8-2.2.8L19 21.5l-.8-2.2-2.2-.8 2.2-.8z" />
  </svg>
)
export const ChispaLinea = (p) => <Svg {...p}><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /></Svg>
