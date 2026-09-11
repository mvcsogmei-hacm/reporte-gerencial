# Reporte resumido · Tablero regional

> Contexto completo (diseño aprobado, historial, preferencias y pendientes): `../CONTEXTO-PROYECTO.md`.

Dashboard HTML estático, sin dependencias, basado en la plantilla
`PARA TABLERO SM 10.09.2026 (1).pptx` y con el estilo del tablero
"Obras paralizadas" (`D:\Claude\Paralizadas v2\dashboard`).

## Estructura

```
dashboard/
  index.html                  Sidebar (2 páginas = 2 láminas del PPT), cabecera con filtro de región
  css/styles.css              Tokens claro/oscuro, layout, tarjetas, listas "etiqueta: valor", mapa
  js/data.js                  Datos por región (HOY aleatorios con semilla; MAÑANA Excel)
  js/app.js                   Router, sidebar, tema, filtro, mapa SVG y render de páginas
  map/peru_departamental.js   GeoJSON departamental envuelto en window.PERU_GEO (para abrir con file://)
  map/peru_departamental.geojson  Fuente original del mapa
  propuestas-*.html, css/propuestas*.css, js/propuestas*.js  Pantallas de propuestas de diseño
```

## Páginas (menú lateral)

| Ruta         | Contenido                                                                 |
|--------------|---------------------------------------------------------------------------|
| `#/general`  | Lámina 1: Información general (población, provincias, distritos, mapa de variación de pobreza, índices), Actividades socioeconómicas (%), Infraestructura sectorial y Brechas (agua, saneamiento, vivienda, formalización) |
| `#/gestion`  | Lámina 2: pendiente (obras, presupuesto, vivienda, actores, compromisos, FEN) |

La página 1 usa filas con icono cuadrado azul fuera, banda clara, barra de progreso y cifra;
Infraestructura sectorial en columnas por grupo (columna gris hasta el máximo del grupo y relleno con la proporción real); Brechas en waffle 10×10 con % y cifra.
El mapa se pinta con la variación de pobreza (rojo = aumentó, verde = disminuyó); al hacer clic en un
departamento se cambia el filtro de región y un segundo clic vuelve a Nacional.

Pantallas auxiliares: `propuestas-brechas.html` y `propuestas-infraestructura.html`.

## Uso

Abrir `index.html` en el navegador. Parámetros opcionales en la URL:

- `?region=Piura` fija la región inicial (también se recuerda la última elegida).
- `?theme=dark` fuerza el tema oscuro.

## Conectar el Excel

`js/data.js` expone `window.DATA` con `regiones`, `corte` y `get(region)`.
La forma del objeto que devuelve `get()` está documentada al inicio del archivo.
Para alimentar desde Excel basta con reemplazar `buildRegion()` por una función
que lea la fila de la región (por ejemplo con SheetJS o exportando el Excel a JSON)
y devuelva un objeto con esa misma forma. El resto del tablero no cambia.
