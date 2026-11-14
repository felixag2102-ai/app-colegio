/*
  Fondo animado: dos manchas de color difuminadas y dos "haces" de líneas
  onduladas que se mueven despacio. Cada pantalla tiene sus propios colores
  y las manchas se deslizan suavemente al cambiar de pantalla.
*/
import { memo } from 'react'
import { ACENTO } from '../utilidades/colores'

// Dibuja un haz de "n" líneas onduladas (fórmula copiada del diseño)
function haz(y0, A, n, separacion, fase, giro) {
  let d = ''
  for (let i = 0; i < n; i++) {
    const u = (i - (n - 1) / 2) / ((n - 1) / 2)
    for (let x = 0; x <= 1080; x += 12) {
      const t = (2 * Math.PI * x) / 360
      const y =
        y0 + A * Math.sin(t + fase) + 0.35 * A * Math.sin(2 * t - fase * 1.3) +
        u * separacion * Math.cos(t + giro) + u * separacion * 0.35 * Math.sin(2 * t + giro * 0.7)
      d += (x === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(1) + ' '
    }
  }
  return d
}

// Tres "fotos" del haz para que la animación cambie de forma
function cuadros(y0, A, n, separacion, fase, giro) {
  const f = []
  for (let k = 0; k < 3; k++) f.push(haz(y0, A, n, separacion, fase + k * 2.1, giro + k * 2.1))
  return { d: f[0], valores: f.concat([f[0]]).join(';') }
}

const OLA_A = cuadros(220, 42, 18, 36, 0, 0.6)
const OLA_B = cuadros(570, 48, 18, 40, 2.4, 2.0)

// Posición y color de las 2 manchas en cada pantalla (0 = Inicio ... 4 = Ideas)
const MANCHAS = [
  [{ x: '-80px', y: 150, t: 260, c: ACENTO, o: 0.3 }, { x: 'calc(100% - 150px)', y: 470, t: 240, c: '#FF9A5C', o: 0.32 }],
  [{ x: '-80px', y: 160, t: 260, c: ACENTO, o: 0.3 }, { x: 'calc(100% - 150px)', y: 520, t: 240, c: '#E0567A', o: 0.26 }],
  [{ x: 'calc(100% - 170px)', y: 120, t: 260, c: '#FF9A5C', o: 0.3 }, { x: '-90px', y: 500, t: 240, c: ACENTO, o: 0.3 }],
  [{ x: '-80px', y: 110, t: 260, c: '#6FD6C0', o: 0.34 }, { x: 'calc(100% - 150px)', y: 480, t: 240, c: ACENTO, o: 0.3 }],
  [{ x: '-80px', y: 140, t: 260, c: '#8A4DE8', o: 0.26 }, { x: 'calc(100% - 150px)', y: 500, t: 240, c: '#E0567A', o: 0.26 }],
]

const ANIM = { attributeName: 'd', repeatCount: 'indefinite', calcMode: 'spline', keyTimes: '0;0.333;0.667;1', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1' }

function Fondo({ pantalla }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
      {MANCHAS[pantalla].map((m, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', left: m.x, top: m.y, width: m.t, height: m.t, borderRadius: '50%',
            background: m.c, opacity: m.o, filter: 'blur(70px)',
            transition: 'left 1.2s cubic-bezier(.22,1,.36,1), top 1.2s cubic-bezier(.22,1,.36,1), background 1.2s, opacity 1.2s',
          }}
        />
      ))}
      <svg width="1080" height="780" viewBox="0 0 1080 780" style={{ position: 'absolute', left: 0, top: 0, filter: 'blur(1.1px)', animation: 'drift 70s linear infinite' }}>
        <path d={OLA_A.d} fill="none" stroke="#15171C" strokeWidth="1.1" strokeOpacity="0.5">
          <animate {...ANIM} dur="18s" values={OLA_A.valores} />
        </path>
        <path d={OLA_B.d} fill="none" stroke="#15171C" strokeWidth="1.1" strokeOpacity="0.42">
          <animate {...ANIM} dur="22s" values={OLA_B.valores} />
        </path>
      </svg>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(238,240,247,0.30)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />
    </div>
  )
}

// memo: el fondo solo se vuelve a dibujar si cambia la pantalla
export default memo(Fondo)
