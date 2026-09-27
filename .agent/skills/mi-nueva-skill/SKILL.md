SIGEA — Sistema de diseño
Identidad visual del Sistema Integral de Gestión de Eventos Académicos (SIGEA), Programa de Ingeniería de Sistemas, Universidad Francisco de Paula Santander (UFPS) — Cúcuta. Toda pantalla del proyecto (login, paneles por rol, formularios de convocatorias, agenda, inscripciones, certificados, etc.) debe partir de este mismo lenguaje visual, para que no importe qué compañero la construya ni con qué IA: se vean como un solo producto.

Fundamentos
Un solo color de marca, usado con disciplina. brand-600 (el rojo
institucional de la UFPS) es el color de identidad: aparece en el panel de marca, en los botones primarios y en los "kickers" de cada pantalla. No se usa como color de fondo general ni se satura la interfaz con él.

Alertas siempre en la misma pareja de colores. Errores y bloqueos
usan brand-100 de fondo con texto brand-700 — nunca un rojo distinto ni un amarillo/naranja para "advertencia": en SIGEA solo existe ese rojo de alerta.

Dos familias tipográficas, cada una con un trabajo fijo. La serif
(type.families.serif, Source Serif 4) es SOLO para títulos de pantalla (display-lg, display-md). Todo lo demás — cuerpo, labels, botones, notas — usa la sans (type.families.sans, Public Sans). No mezclar.

El sistema es de escritorio. No hay versión móvil planeada (ver
contexto del proyecto). El único ajuste responsivo permitido es ocultar el panel de marca por debajo de ~980px de ancho; el contenido no se reorganiza en columnas para pantallas pequeñas.

El layout compartido: MainLayout
Toda pantalla autenticada o pública de SIGEA se construye sobre el mismo esqueleto de dos columnas — ver el componente MainLayout más abajo:

Panel de marca (izquierda, fijo, brand-600): identifica el sistema.
Es siempre igual; ningún compañero debe rediseñarlo pantalla por pantalla.

Área de contenido (derecha, surface-muted): aquí vive el contenido
propio de cada historia de usuario — un formulario de login, una tabla de convocatorias, un panel de indicadores. Los bloques de contenido (tarjetas) van sobre surface blanco, con radius-lg y borde border.

Cómo pedirle a tu IA que lo use
Si tu compañero no usa Claude, o prefiere trabajar en otra herramienta, puede copiar el bloque siguiente completo y pegarlo al inicio de su conversación con su IA — no necesita este archivo, solo este texto:

Estoy construyendo una pantalla para SIGEA (Sistema Integral de Gestión de
Eventos Académicos, UFPS Cúcuta). Usa exactamente este sistema de diseño:

COLORES
  brand-600 #a6192e   -> color institucional: panel de marca, botones primarios, kickers
  brand-700 #7a0c1e   -> hover de brand-600; texto sobre fondo de alerta
  brand-100 #fdecec   -> fondo de alertas de error/bloqueo (siempre con texto brand-700)
  ink-900   #1f2023   -> texto principal
  ink-600   #5b5f66   -> texto secundario
  ink-300   #9ca0a6   -> placeholders, texto deshabilitado
  border       #e5e7ea  -> bordes de tarjetas
  field-border #d8dadf  -> bordes de inputs
  surface       #ffffff -> fondo de tarjetas
  surface-muted #f7f7f8 -> fondo del área de contenido
  surface-page  #edeeef -> fondo detrás de toda la pantalla

TIPOGRAFÍA (Google Fonts)
  Serif "Source Serif 4" (peso 600) -> SOLO títulos de pantalla (26-40px)
  Sans  "Public Sans" (400/500/600/700) -> todo lo demás: cuerpo, labels, botones

ESPACIADO: 4, 8, 12, 16, 24, 32, 48, 56 px
RADIOS: 8px (inputs/botones), 16px (tarjetas), 999px (pills)

LAYOUT (MainLayout, dos columnas, pantalla completa 1440x900 de escritorio):
- Panel de marca a la izquierda, 552px fijo, fondo brand-600, texto blanco:
  logo/escudo simple, nombre del sistema en serif 40px, descripción en sans
  16px, y al fondo el nombre del programa/universidad en 3 líneas.
- Área de contenido a la derecha, flexible, fondo surface-muted, centrada,
  con una tarjeta blanca (surface, radius-lg=16px, borde border, padding
  48px) que contiene el formulario/contenido propio de la pantalla.
- Por debajo de ~980px de ancho, el panel de marca se oculta y el área de
  contenido ocupa el 100%. No hay otro comportamiento responsivo.

No inventes otros colores, tipografías ni radios distintos a los de arriba.