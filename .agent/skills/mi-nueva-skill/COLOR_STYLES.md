---
name: sigea-colores
description: Reglas obligatorias de color y estilo visual para TODA la interfaz de SIGEA (Sistema Integral de Gestión de Eventos Académicos, UFPS). Úsala siempre que crees, modifiques, revises o estilices cualquier pantalla, componente, página, layout, formulario, tabla, modal, alerta, badge, botón, icono, sidebar, header, footer, gráfico o correo HTML del proyecto, aunque el usuario no mencione colores. También aplica al agregar CSS, Tailwind, variables de tema o estilos inline. Define los únicos 11 colores permitidos y qué elemento usa cuál. No inventes colores fuera de esta paleta.
---

# SIGEA — Uso correcto de colores

Estas reglas aplican a **todo el sitio**, no a una pantalla en particular. Cualquier elemento nuevo debe salir de esta paleta.

## Regla de oro

1. Usa **únicamente** los 11 tokens de abajo.
2. **Prohibido** introducir colores nuevos: nada de verdes, ámbares, azules, naranjas, ni grises sueltos (`#ccc`, `gray-500`, etc.).
3. **Prohibido** usar transparencias o `rgba()`/`opacity` para derivar tonos nuevos de un token (por ejemplo, "blanco al 70%"). Si necesitas un tono intermedio, elige el token más cercano.
4. **Prohibido** escribir valores hex directamente en componentes. Siempre referencia el token (variable CSS o clase Tailwind). Los hex solo existen en la definición de tokens.
5. Si un diseño parece exigir un color que no está en la paleta, resuélvelo con **jerarquía, peso tipográfico, borde o fondo** usando los tokens existentes, y avisa al usuario en vez de inventar el color.

## Tokens

| Token | Hex | Rol |
|---|---|---|
| `brand-600` | `#a6192e` | Color institucional: marca, botones primarios, ítems activos, kickers, links, iconos de acento |
| `brand-700` | `#7a0c1e` | Hover de `brand-600`; fondo del sidebar; texto sobre fondo de alerta |
| `brand-100` | `#fdecec` | Fondo de alertas de error/bloqueo (siempre con texto `brand-700`); fondo de contenedores de iconos |
| `ink-900` | `#1f2023` | Texto principal |
| `ink-600` | `#5b5f66` | Texto secundario |
| `ink-300` | `#9ca0a6` | Placeholders, texto deshabilitado, iconos decorativos |
| `border` | `#e5e7ea` | Bordes de tarjetas y divisores |
| `field-border` | `#d8dadf` | Bordes de inputs y botones secundarios |
| `surface` | `#ffffff` | Fondo de tarjetas, header y footer |
| `surface-muted` | `#f7f7f8` | Fondo del área de contenido |
| `surface-page` | `#edeeef` | Fondo detrás de toda la pantalla |

## Definición de tokens

**Variables CSS** (fuente única de verdad):

```css
:root {
  --brand-600: #a6192e;
  --brand-700: #7a0c1e;
  --brand-100: #fdecec;
  --ink-900: #1f2023;
  --ink-600: #5b5f66;
  --ink-300: #9ca0a6;
  --border: #e5e7ea;
  --field-border: #d8dadf;
  --surface: #ffffff;
  --surface-muted: #f7f7f8;
  --surface-page: #edeeef;
}
```

**Tailwind** (`theme.extend.colors`), reemplazando por completo la paleta por defecto en las clases de color:

```js
colors: {
  brand: { 100: '#fdecec', 600: '#a6192e', 700: '#7a0c1e' },
  ink: { 300: '#9ca0a6', 600: '#5b5f66', 900: '#1f2023' },
  border: '#e5e7ea',
  'field-border': '#d8dadf',
  surface: { DEFAULT: '#ffffff', muted: '#f7f7f8', page: '#edeeef' },
  transparent: 'transparent',
  current: 'currentColor',
}
```

Si el proyecto ya tiene otra forma de definir tema, adáptala, pero los nombres y valores no cambian.

## Capas de fondo (de atrás hacia adelante)

1. Fondo de la pantalla completa: `surface-page`
2. Área de contenido del dashboard: `surface-muted`
3. Tarjetas, header, footer, modales, dropdowns: `surface` con borde `border`
4. Sidebar: `brand-700`

Si una tarjeta queda dentro de un contenedor que ya es `surface-muted`, la tarjeta es `surface`. Nunca pongas `surface-muted` sobre `surface-muted`.

## Reglas por tipo de elemento

### Texto
- Títulos, encabezados, etiquetas importantes, valores de datos: `ink-900`
- Subtítulos, descripciones, metadatos, etiquetas de campo, texto de tabla secundario: `ink-600`
- Placeholders y texto deshabilitado: `ink-300`
- Kickers (texto pequeño en mayúsculas sobre un título) y links: `brand-600`; hover de link: `brand-700`
- Texto sobre fondo `brand-600` o `brand-700`: `surface`
- Texto sobre `brand-100`: `brand-700`

> `ink-300` tiene contraste bajo sobre blanco. Úsalo solo para placeholders, texto deshabilitado e iconos decorativos, **nunca** para información que el usuario necesita leer.

### Botones
| Tipo | Fondo | Texto | Borde | Hover |
|---|---|---|---|---|
| Primario | `brand-600` | `surface` | ninguno | fondo `brand-700` |
| Secundario | `surface` | `ink-900` | `field-border` | fondo `surface-muted` |
| Deshabilitado | `surface-muted` | `ink-300` | `border` | sin cambio |
| Destructivo | `brand-600` | `surface` | ninguno | fondo `brand-700` (se diferencia por texto/icono y confirmación, no por otro color) |

Foco de teclado: anillo de 2px en `brand-600` con offset de 2px.

### Inputs y formularios
- Fondo `surface`, borde `field-border`, texto `ink-900`, placeholder `ink-300`
- Etiqueta del campo: `ink-600` (o `ink-900` si es el rótulo principal)
- Foco: borde `brand-600` + anillo `brand-600`
- Error: borde `brand-600`, mensaje de error en `brand-700` sobre fondo `brand-100`
- Deshabilitado: fondo `surface-muted`, texto `ink-300`

### Tarjetas
- Fondo `surface`, borde 1px `border`
- Divisores internos: `border`
- Etiqueta superior de la tarjeta: `ink-600`; valor destacado: `brand-600` o `ink-900`

### Alertas y mensajes
Solo existe un tipo de alerta con color propio: **error / bloqueo / advertencia grave** = fondo `brand-100`, texto `brand-700`.
Para mensajes informativos o de éxito usa tarjeta neutra: fondo `surface-muted`, borde `border`, texto `ink-900`/`ink-600`. Diferencia el tipo por el **icono y el texto**, no por un color nuevo.

### Badges de estado
| Significado | Fondo | Texto | Borde |
|---|---|---|---|
| Activo / publicado / aprobado | `brand-600` | `surface` | ninguno |
| Pendiente / en configuración / borrador | `surface-muted` | `ink-600` | `border` |
| Error / cerrado / rechazado / vencido | `brand-100` | `brand-700` | ninguno |

No uses puntos de color (•) como indicador de estado; el rojo se lee como error. Un mismo estado debe verse igual en toda la app.

### Iconos
- Icono en contenedor (tarjetas de métricas, encabezados de sección): contenedor `brand-100`, icono `brand-600`. **Todos iguales**; no uses un color distinto por tarjeta.
- Icono junto a título de sección: `brand-600`
- Icono dentro de texto o metadato (reloj, ubicación): `ink-300`
- Icono dentro de botón: hereda el color del texto del botón
- Icono en sidebar: ver sección siguiente

### Sidebar (fondo `brand-700`)
- Logo/nombre "SIGEA" y texto de ítems inactivos: `surface`
- Iconos de ítems inactivos: `surface`
- Subtítulos y kickers ("NAVEGACIÓN", "EVENTOS ACADÉMICOS"): `brand-100`
- Ítem activo: fondo `surface`, texto e icono `brand-600`
- Hover de ítem: fondo `brand-600`, texto `surface`
- Divisores: `brand-600`
- Botón "Cerrar sesión": borde, texto e icono `brand-100`; hover fondo `brand-600`

Nunca uses `brand-600` o `brand-700` como color de texto sobre el sidebar: es guinda sobre guinda y no se lee.

### Header
- Fondo `surface`, borde inferior `border`
- Título de página, nombre de usuario: `ink-900`
- Rol, campana, iconos de acción: `ink-600`
- Flecha de menú: `ink-300`
- Avatar: fondo `brand-100`, icono `brand-600`

### Footer
Fondo `surface`, borde superior `border`, texto `ink-600`.

### Tablas
- Encabezado: fondo `surface-muted`, texto `ink-600` (mayúsculas pequeñas), borde inferior `border`
- Filas: fondo `surface`, divisores `border`, texto `ink-900`; texto secundario `ink-600`
- Hover de fila: fondo `surface-muted`
- Fila seleccionada: fondo `brand-100`, texto `ink-900`

### Modales, dropdowns, tooltips
Fondo `surface`, borde `border`, texto `ink-900`/`ink-600`. El fondo oscurecido detrás del modal usa `ink-900` con la opacidad de overlay estándar (única excepción permitida a la regla de transparencias).

### Gráficos y visualización de datos
Máximo dos series distinguibles con la paleta: `brand-600` (principal) y `ink-600` (secundaria). Para más series, diferencia con patrón, trazo, etiquetas directas o formas de marcador, no con colores nuevos. Ejes y rejilla en `border`, texto de ejes en `ink-600`.

### Correos y documentos HTML/PDF
Usan la misma paleta. Encabezado `brand-600` con texto `surface`, cuerpo sobre `surface`, texto `ink-900`, secundario `ink-600`, pie con `ink-600`.

## Tipografía y color
- Un solo color de texto principal (`ink-900`) y uno secundario (`ink-600`). La jerarquía se logra con **tamaño y peso**, no con más colores.
- No pongas texto largo en `brand-600`; es para acentos (kickers, links, cifras, botones).
- Mantén el color de marca escaso: si todo es guinda, nada destaca.

## Accesibilidad
- Texto sobre `brand-600`/`brand-700`: solo `surface`.
- Texto sobre `brand-100`: solo `brand-700`.
- Texto sobre `surface`/`surface-muted`: `ink-900` o `ink-600`; `brand-600` solo para acentos.
- Nunca comuniques un estado **solo** con color: acompáñalo de texto o icono.

## Checklist antes de entregar cualquier UI

1. ¿Todos los colores son tokens? No hay hex sueltos ni clases de color fuera de la paleta (`red-500`, `gray-200`, `green-600`…).
2. ¿No hay `rgba()`, `opacity` ni `/50` de Tailwind para fabricar tonos?
3. ¿Texto sobre cada fondo cumple la tabla de accesibilidad?
4. ¿Los iconos de un mismo grupo comparten color?
5. ¿Los estados (badges, alertas) usan exactamente las combinaciones definidas arriba?
6. ¿`brand-600` se usa solo para marca, acciones, estados activos, links y acentos?
7. ¿Hay un caso nuevo que la paleta no cubre? No inventes un color: resuélvelo con los tokens y menciónalo al usuario.