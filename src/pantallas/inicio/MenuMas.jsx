/*
  Menú "+" del Inicio: atajos para agregar cosas en otras pantallas.
*/
import { usePresencia } from '../../componentes/usePresencia'
import * as Icono from '../../componentes/Iconos'
import { ACENTO } from '../../utilidades/colores'

const OPCIONES = [
  { texto: 'Recordatorio', color: '#E0661A', Icono: Icono.Campana, accion: 'recordatorio' },
  { texto: 'Evento', color: '#15171C', Icono: Icono.Calendario, accion: 'evento' },
  { texto: 'Prueba', color: '#C24E00', Icono: Icono.Hoja, accion: 'prueba' },
  { texto: 'Nota de una prueba', color: '#14A37F', Icono: Icono.Barras, accion: 'nota' },
  { texto: 'Apunte con foto', color: ACENTO, Icono: Icono.Camara, accion: 'foto' },
  { texto: 'Idea', color: '#8A4DE8', Icono: Icono.Lamparita, accion: 'idea' },
]

export default function MenuMas({ abierto, onCerrar, onElegir }) {
  const { visible, saliendo } = usePresencia(abierto, 230)
  if (!visible) return null
  return (
    <div className="capa" style={{ zIndex: 50 }}>
      <button className={'velo' + (saliendo ? ' sale-fade' : '')} onClick={onCerrar} aria-label="Cerrar menú" style={{ background: 'rgba(15,17,22,0.22)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', animation: saliendo ? undefined : 'fadeIn 0.2s ease-out both' }} />
      <div
        className={saliendo ? 'sale-pop' : ''}
        style={{
          position: 'absolute', top: 'calc(var(--arriba) + 58px)', right: 16, width: 240, borderRadius: 26, padding: 8,
          border: '1px solid rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(30px) saturate(170%)',
          WebkitBackdropFilter: 'blur(30px) saturate(170%)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), 0 20px 50px rgba(20,24,40,0.25)',
          transformOrigin: 'top right', animation: saliendo ? undefined : 'popIn 0.28s cubic-bezier(.22,1,.36,1) both',
        }}
      >
        <p className="seccion" style={{ margin: '8px 12px 6px 12px' }}>AGREGAR</p>
        {OPCIONES.map((o) => (
          <button
            key={o.accion}
            onClick={() => onElegir(o.accion)}
            style={{ width: '100%', minHeight: 50, border: 'none', background: 'transparent', borderRadius: 18, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: '#15171C', fontSize: 15, fontWeight: 600, textAlign: 'left' }}
          >
            <span style={{ width: 34, height: 34, borderRadius: 11, background: o.color, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <o.Icono tam={17} />
            </span>
            {o.texto}
          </button>
        ))}
        <p className="seccion" style={{ margin: '10px 12px 6px 12px', paddingTop: 10, borderTop: '1px solid rgba(21,23,28,0.08)' }}>DATOS</p>
        <button
          onClick={() => onElegir('copia')}
          style={{ width: '100%', minHeight: 50, border: 'none', background: 'transparent', borderRadius: 18, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: '#15171C', fontSize: 15, fontWeight: 600, textAlign: 'left' }}
        >
          <span style={{ width: 34, height: 34, borderRadius: 11, background: '#E9EAEF', color: '#15171C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icono.Carpeta tam={17} />
          </span>
          Copia de seguridad
        </button>
      </div>
    </div>
  )
}
