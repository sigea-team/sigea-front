import { useEffect, useState } from 'react';
import HomeNavbar from '../features/home/components/HomeNavbar';
import HomeHero from '../features/home/components/HomeHero';
import HomeEventosSection from '../features/home/components/HomeEventosSection';
import HomeConvocatoriasSection from '../features/home/components/HomeConvocatoriasSection';
import HomeAboutSection from '../features/home/components/HomeAboutSection';
import HomeRolesSection from '../features/home/components/HomeRolesSection';
import HomeCtaBanner from '../features/home/components/HomeCtaBanner';
import HomeFooter from '../features/home/components/HomeFooter';
import { convocatoriaService } from '../api/convocatoriaService';
import {
  EVENTOS_BASE_INSTITUCIONALES,
  combinarEventosConConvocatorias,
} from '../features/home/homeUtils';

/**
 * @file HomePage.jsx
 * @description Página de inicio pública oficial (Landing Page / Home) de SIGEA.
 * Diseñada para el Programa de Ingeniería de Sistemas de la Universidad Francisco de Paula Santander (UFPS) en Cúcuta.
 *
 * Cumple con los 3 objetivos clave:
 * 1. Consulta pública de eventos y programación sin necesidad de iniciar sesión.
 * 2. Explicación institucional de SIGEA, del Programa y de la UFPS.
 * 3. Puerta de entrada amigable hacia registro, inicio de sesión y convocatorias abiertas (Call for Papers).
 *
 * @module pages/HomePage
 * @param {Object} props
 * @param {{ listarConvocatoriasPublicadas: Function }} [props.api=convocatoriaService] - Cliente API inyectable para pruebas y Storybook.
 * @param {Array<Object>} [props.eventosIniciales] - Lista opcional de eventos para testing/Storybook.
 */
export default function HomePage({
  api = convocatoriaService,
  eventosIniciales = EVENTOS_BASE_INSTITUCIONALES,
}) {
  const [convocatorias, setConvocatorias] = useState([]);
  const [cargandoConvocatorias, setCargandoConvocatorias] = useState(true);
  const [eventos, setEventos] = useState(() =>
    combinarEventosConConvocatorias(eventosIniciales, [])
  );

  useEffect(() => {
    let activo = true;

    api
      .listarConvocatoriasPublicadas()
      .then((lista) => {
        if (!activo) return;
        const listaValida = Array.isArray(lista) ? lista : [];
        setConvocatorias(listaValida);
        setEventos(combinarEventosConConvocatorias(eventosIniciales, listaValida));
      })
      .catch((err) => {
        if (!activo) return;
        console.warn('[HomePage] No se pudieron cargar convocatorias en vivo:', err?.message);
        // Mantiene los eventos base institucionales en caso de desconexión
        setEventos(combinarEventosConConvocatorias(eventosIniciales, []));
      })
      .finally(() => {
        if (activo) {
          setCargandoConvocatorias(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [api, eventosIniciales]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface text-ink-900 font-sans antialiased selection:bg-brand-100 selection:text-brand-700">
      {/* 1. Barra de navegación pública con accesos y estado de autenticación */}
      <HomeNavbar />

      <main className="flex-1 w-full">
        {/* 2. Hero Section de alto impacto con métricas institucionales */}
        <HomeHero />

        {/* 3. Sección de Eventos y Programación en vivo (Objetivo 1) */}
        <HomeEventosSection eventos={eventos} />

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
      <HomeFooter />
    </div>
  );
}
