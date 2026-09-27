---
name: sigea-design-system
description: Sistema de diseño oficial de SIGEA (UFPS Cúcuta). Aplica estas reglas de diseño, layout (MainLayout con Sidebar y Footer), paleta de colores, tipografía y Storybook al crear o modificar componentes, layouts, páginas o estilos.
---

# SIGEA — Sistema de Diseño
Identidad visual del Sistema Integral de Gestión de Eventos Académicos (SIGEA), Programa de Ingeniería de Sistemas, Universidad Francisco de Paula Santander (UFPS) — Cúcuta. Toda pantalla del proyecto (login, paneles por rol, formularios de convocatorias, agenda, inscripciones, certificados, etc.) debe partir de este mismo lenguaje visual, para que no importe qué compañero la construya ni con qué IA: se vean como un solo producto.

## Fundamentos
- **Un solo color de marca, usado con disciplina.** `brand-600` (el rojo institucional de la UFPS) es el color de identidad: aparece en la marca, en los botones primarios, enlaces activos y en los "kickers" de cada pantalla. No se usa como color de fondo general ni se satura la interfaz con él.
- **Alertas siempre en la misma pareja de colores.** Errores y bloqueos usan `brand-100` de fondo con texto `brand-700` — nunca un rojo distinto ni un amarillo/naranja para "advertencia": en SIGEA solo existe ese rojo de alerta.
- **Dos familias tipográficas, cada una con un trabajo fijo.** La serif (`type.families.serif`, Source Serif 4) es SOLO para títulos de pantalla (`display-lg`, `display-md`). Todo lo demás — cuerpo, labels, botones, notas — usa la sans (`type.families.sans`, Public Sans). No mezclar.
- **El sistema es de escritorio.** No hay versión móvil planeada. El único ajuste responsivo permitido para el dashboard/app es colapsar o replegar el sidebar por debajo de ~980px de ancho; el contenido no se reorganiza en columnas para pantallas pequeñas.

---

## Sistema de Tokens

### COLORES
  brand-600 #a6192e   -> color institucional: marca, botones primarios, ítems activos, kickers
  brand-700 #7a0c1e   -> hover de brand-600; texto sobre fondo de alerta
  brand-100 #fdecec   -> fondo de alertas de error/bloqueo (siempre con texto brand-700)
  ink-900   #1f2023   -> texto principal
  ink-600   #5b5f66   -> texto secundario
  ink-300   #9ca0a6   -> placeholders, texto deshabilitado
  border       #e5e7ea  -> bordes de tarjetas y divisores
  field-border #d8dadf  -> bordes de inputs
  surface       #ffffff -> fondo de tarjetas, header y footer
  surface-muted #f7f7f8 -> fondo del área de contenido del dashboard
  surface-page  #edeeef -> fondo detrás de toda la pantalla

### TIPOGRAFÍA (Google Fonts)
  Serif "Source Serif 4" (peso 600) -> SOLO títulos de pantalla (26-40px)
  Sans  "Public Sans" (400/500/600/700) -> todo lo demás: cuerpo, labels, botones, menús

### ESPACIADO: 4, 8, 12, 16, 24, 32, 48, 56 px
### RADIOS: 8px (inputs/botones), 16px (tarjetas), 999px (pills)

No inventes otros colores, tipografías ni radios distintos a los de arriba.

---

## El Layout Compartido de Aplicación: MainLayout

Toda pantalla interna/autenticada de SIGEA se construye sobre un esqueleto de aplicación funcional compuesto por `Sidebar`, `Topbar/Header`, `Contenido Central` y `Footer`:

1. **Sidebar de Navegación (Izquierda):**
   - Ancho fijo de `260px` - `280px`, altura `100vh`. Fondo `surface` con borde derecho `border`.
   - **Header del Sidebar:** Isotipo/Escudo UFPS + Nombre del sistema "SIGEA" en `brand-600`.
   - **Cuerpo del Sidebar:** Menú principal de opciones (`Dashboard`, `Convocatorias`, `Eventos`, `Certificados`, etc.) con estados hover (`surface-muted`) y activo (`brand-100` de fondo con texto e icono `brand-600`).
   - **Footer del Sidebar:** Información reducida del usuario autenticado y botón para **Cerrar Sesión**.

2. **Área Principal de Contenido (Derecha):**
   - **Barra Superior (Topbar):** Altura `64px`, fondo `surface`, borde inferior `border`. Muestra el título de la vista actual (en `Public Sans` 600) y controles rápidos de perfil/notificaciones.
   - **Área Central (`<main>`):** Fondo `surface-muted`, padding de `32px`. Contiene las tarjetas blancas (`surface`, `radius-lg` 16px, borde `border`, padding `24px` a `48px`) propias de la historia de usuario.
   - **Footer Global de Aplicación:** Ubicado en la parte inferior del área de contenido. Fondo `surface`, borde superior `border`, padding `16px 32px`. Texto en `ink-600` (`Public Sans` 14px): "Programa de Ingeniería de Sistemas — Universidad Francisco de Paula Santander (UFPS) Cúcuta ©".

3. **Comportamiento Responsivo:**
   - Por debajo de ~980px de ancho, el Sidebar se puede colapsar o convertir en menú lateral oculto (drawer). No hay otra reorganización fluida de columnas.

---

## Convención de Estructura de Proyecto

Cuando se creen o modifiquen componentes, organizar los archivos siguiendo esta estructura:

- **Layouts base o globales:** `src/components/ui/MainLayout.jsx` (y `MainLayout.stories.jsx`).
- **Componentes atomizados de UI:** `src/components/ui/` (`Sidebar.jsx`, `Footer.jsx`, `Button.jsx`, `Input.jsx`) acompañados de sus historias `.stories.jsx`.
- **Layout de Autenticación de 2 Columnas (Login/Registro):** `src/features/auth/components/AuthLayout.jsx` (y `AuthLayout.stories.jsx`).
- **Páginas completas:** `src/pages/` (`DashboardPage.jsx`, `LoginPage.jsx`) acompañados de sus historias `.stories.jsx`.

> **Regla de Storybook:** Todo nuevo componente o página DEBE incluir obligatoriamente su respectivo archivo `.stories.jsx` en la misma carpeta del componente.