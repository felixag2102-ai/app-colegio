# App del colegio — diseño de referencia

App personal para organizar el colegio y la vida de Felix (3er año, Buenos Aires).
Esta carpeta tiene el **diseño interactivo** de la app, hecho como maqueta. Se usa como referencia para construir la app de verdad.

## Qué hay en `diseno/`

Son 5 pantallas pensadas para un celular Samsung Galaxy S24 (360 × 780 px). Cada archivo `.dc.html` tiene:
- el HTML y los estilos de la pantalla (estilos en línea);
- marcadores de plantilla como `{{ algo }}`, `<sc-for>` (repetir) y `<sc-if>` (mostrar si…);
- al final, un `<script type="text/x-dc">` con la lógica en JavaScript (una clase `Component` con `renderVals()`, parecida a un componente de React).

Estos archivos **no se abren solos en el navegador**: necesitan el entorno del editor de diseño donde se hicieron. Sirven para copiar el aspecto, los textos, los colores, las animaciones y el comportamiento.

| Archivo | Pantalla |
|---|---|
| `1-Inicio.dc.html` | Inicio: saludo, semana, tarjetas apiladas que se deslizan, clima, recordatorios, menú + |
| `2-Agenda.dc.html` | Agenda: calendario mensual, eventos por día, nuevo evento con reloj, categorías editables |
| `3-Boletin.dc.html` | Boletín: promedios por materia, cargar/editar/borrar notas con rueda tipo iPhone |
| `4-Apuntes.dc.html` | Apuntes: carpetas por materia, escanear foto → texto, subir archivos, asistente de estudio con IA |
| `5-Ideas.dc.html` | Ideas: lista de cosas que quiero hacer, categorías, tachar y deslizar para borrar |

## Estilo visual

- **Estilo "liquid glass":** tarjetas de vidrio translúcido con blur (`backdrop-filter`) sobre un fondo gris claro `#EEF0F7`.
- **Fondo animado:** manchas de color difuminadas y dos haces de líneas onduladas que se mueven despacio.
- **Tipografía:** la del sistema de Apple (`-apple-system`, SF Pro), con **Inter** como alternativa en Android.
- **Colores:** negro `#15171C` para lo principal, naranja `#C24E00` para pruebas, azul `#3D63F0` para entregas y verde/amarillo/rojo para las notas según el valor.
- **Menú de abajo:** una burbuja de vidrio con 5 secciones. La burbuja negra se desliza a la sección elegida, y también se puede arrastrar el dedo por el menú.
- **Animaciones:** todo lo que se abre tiene animación de entrada y de salida. Las hojas de abajo se cierran deslizándolas hacia abajo.

## Funciones por pantalla

**Inicio**
- Semana tocable. Cada día muestra una mini pila de rayitas de colores, una por tarjeta de ese día.
- Tarjetas apiladas (evento, prueba, entregas, ideas) que se pasan al fondo deslizándolas al costado.
- Textos largos que no entran se deslizan solos hacia la izquierda.
- Clima de hoy.
- Recordatorios (campana): elegís día con una semana (hoy + 6 días) y hora con un reloj redondo. Los tachados se borran deslizando a la izquierda.
- Menú +: atajos para agregar evento, prueba, nota, apunte con foto, idea o recordatorio.

**Agenda**
- Calendario de mes con puntitos de colores por tipo de evento.
- Agregar evento: título, tipo, y "Seleccionar hora" (reloj) o "Todo el día".
- Lápiz para renombrar, recolorear o borrar categorías.

**Boletín**
- Promedio general y promedio por materia.
- Cargar nota con una rueda tipo alarma de iPhone (1–10 y ,0/,5).
- Tocar una nota para editarla o borrarla.
- Lápiz para editar o borrar materias.

**Apuntes**
- Carpetas por materia: renombrar, recolorear, ordenar y borrar.
- Escanear un apunte con la cámara y pasarlo a texto.
- Subir archivos (celular, Google Drive, Classroom).
- Botón "✦ Estudiar": asistente de IA que usa mis notas, apuntes y archivos. Por ejemplo, me toma preguntas, arma un plan de estudio o explica métodos.

**Ideas**
- Agregar, tachar y deslizar para borrar.
- Categorías editables, más "Sin categoría", que es fija y no se puede borrar.
- La tarjeta de Ideas del Inicio muestra las mismas ideas.

## Qué está simulado en la maqueta (hay que hacerlo real)

- **Datos:** son de ejemplo y no se guardan.
- **Google Calendar y Classroom:** no están conectados.
- **Clima:** los números son fijos. Se puede sacar gratis de Open-Meteo.
- **Transcripción de fotos:** siempre devuelve el mismo texto.
- **Asistente de IA:** tiene respuestas preparadas.
- **Recordatorios:** no mandan notificaciones.
- **Subida de archivos:** es de mentira.
