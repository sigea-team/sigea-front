import { useEffect, useState } from 'react';
import Topbar from '../components/ui/Topbar';
import HomeHero from '../features/home/components/HomeHero';
import HomeEventosSection from '../features/home/components/HomeEventosSection';
import HomeConvocatoriasSection from '../features/home/components/HomeConvocatoriasSection';
import HomeAboutSection from '../features/home/components/HomeAboutSection';
import HomeRolesSection from '../features/home/components/HomeRolesSection';
import HomeCtaBanner from '../features/home/components/HomeCtaBanner';
import Footer from '../components/ui/Footer';
import { convocatoriaService } from '../api/convocatoriaService';
import { eventoService } from '../api/eventoService';
import { combinarEventosConConvocatorias } from '../features/home/homeUtils';

/**
 * @file HomePage.jsx
 * @description Página de inicio pública oficial (Landing Page / Home) de SIGEA.
 * Diseñada para el Programa de Ingeniería de Sistemas de la Universidad Francisco de Paula Santander (UFPS) en Cúcuta.
 *
 * Consume directamente los endpoints del backend para eventos y convocatorias publicados:
 * - GET /api/v1/publico/eventos
 * - GET /api/v1/publico/convocatorias
 *
 * @module pages/HomePage
 * @param {Object} props
 * @param {{ listarConvocatoriasPublicadas: Function }} [props.api] - Cliente de convocatorias (para compatibilidad con Storybook).
 * @param {{ listarConvocatoriasPublicadas: Function }} [props.apiConvocatorias=convocatoriaService] - Cliente de API de convocatorias.
 * @param {{ listarEventosPublicos: Function }} [props.apiEventos=eventoService] - Cliente de API de eventos.
 * @param {Array<Object>} [props.eventosIniciales=null] - Lista opcional para pruebas/Storybook (si es null, consume el backend).
 * @param {Array<Object>} [props.convocatoriasIniciales=null] - Lista opcional para pruebas/Storybook.
 */
export default function HomePage({
  api,
  apiConvocatorias = convocatoriaService,
  apiEventos = eventoService,
  eventosIniciales = null,
  convocatoriasIniciales = null,
}) {
  const clienteConvocatorias = api || apiConvocatorias;

  const [convocatorias, setConvocatorias] = useState(() => convocatoriasIniciales || []);
  const [cargandoConvocatorias, setCargandoConvocatorias] = useState(() => convocatoriasIniciales === null);

  const [eventosRaw, setEventosRaw] = useState(() => eventosIniciales || []);
  const [cargandoEventos, setCargandoEventos] = useState(() => eventosIniciales === null);

  useEffect(() => {
    let activo = true;

    // Cargar convocatorias en vivo desde el backend si no fueron provistas estáticamente
    if (convocatoriasIniciales === null && clienteConvocatorias?.listarConvocatoriasPublicadas) {
      setCargandoConvocatorias(true);
      clienteConvocatorias
        .listarConvocatoriasPublicadas()
        .then((lista) => {
          if (!activo) return;
          setConvocatorias(Array.isArray(lista) ? lista : []);
        })
        .catch((err) => {
          if (!activo) return;
          console.warn('[HomePage] No se pudieron cargar convocatorias en vivo:', err?.message);
          setConvocatorias([]);
        })
        .finally(() => {
          if (activo) {
            setCargandoConvocatorias(false);
          }
        });
    }

    // Cargar eventos en vivo desde el backend si no fueron provistos estáticamente
    if (eventosIniciales === null && apiEventos?.listarEventosPublicos) {
      setCargandoEventos(true);
      apiEventos
        .listarEventosPublicos()
        .then((lista) => {
          if (!activo) return;
          setEventosRaw(Array.isArray(lista) ? lista : []);
        })
        .catch((err) => {
          if (!activo) return;
          console.warn('[HomePage] No se pudieron cargar eventos en vivo:', err?.message);
          setEventosRaw([]);
        })
        .finally(() => {
          if (activo) {
            setCargandoEventos(false);
          }
        });
    }

    return () => {
      activo = false;
    };
  }, [clienteConvocatorias, apiEventos, convocatoriasIniciales, eventosIniciales]);

  // Se combinan los eventos reales con las convocatorias reales
  const eventos = combinarEventosConConvocatorias(eventosRaw, convocatorias);

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface text-ink-900 font-sans antialiased selection:bg-brand-100 selection:text-brand-700">
      {/* 1. Barra de navegación pública (Topbar unificado con estado de cuenta si hay sesión) */}
      <Topbar variante="publica" />

      <main className="flex-1 w-full">
        {/* 2. Hero Section con métricas reales */}
        <HomeHero
          totalEventos={cargandoEventos ? undefined : eventos.length}
          totalConvocatorias={cargandoConvocatorias ? undefined : convocatorias.length}
        />

        {/* 3. Sección de Eventos y Programación en vivo (Objetivo 1) */}
        <HomeEventosSection
          eventos={eventos}
          cargando={cargandoEventos}
        />

        {/* 4. Sección de Convocatorias Abiertas (Objetivo 3) */}
        <HomeConvocatoriasSection
          convocatorias={convocatorias}
          cargando={cargandoConvocatorias}
        />

        {/* 5. ¿Qué es SIGEA? & Respaldo Institucional UFPS (Objetivo 2) */}
        <HomeAboutSection />

        {/* 6. ¿Por qué registrarte en SIGEA? Beneficios por rol (Objetivo 2 y 3) */}
        <HomeRolesSection />

        {/* 7. Banner CTA de llamada a la acción */}
        <HomeCtaBanner />
      </main>

      {/* 8. Pie de página institucional completo */}
      <Footer />
    </div>
  );
}
