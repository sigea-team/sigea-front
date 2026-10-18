import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Info, LogIn, LayoutDashboard, RotateCw, Search } from 'lucide-react';
import Input from '../components/ui/Input';
import Footer from '../components/ui/Footer';
import { convocatoriaService } from '../api/convocatoriaService';
import { useAuthStore } from '../store/authStore';
import ConvocatoriaPublicaCard from '../features/convocatorias/components/ConvocatoriaPublicaCard';
import { estadoRecepcion, mensajeErrorApi } from '../features/convocatorias/convocatoriaUtils';

/**
 * @file ConvocatoriasPublicasPage.jsx
 * @description Vista pública de convocatorias publicadas (HU-11, Criterio 1).
 * No requiere sesión: es lo que ven los autores y usuarios externos. Solo lista convocatorias en
 * estado 'publicada' (las abiertas primero). Si se llega desde una notificación
 * (`?convocatoria=ID`), resalta esa convocatoria y se desplaza hasta ella.
 * @module pages/ConvocatoriasPublicasPage
 */

const ORDEN_RECEPCION = { abierta: 0, proxima: 1, cerrada: 2 };

/**
 * @param {Object} props
 * @param {{ listarConvocatoriasPublicadas: Function }} [props.api] - Cliente de API (inyectable para Storybook).
 * @param {number|string} [props.destacadaId] - Convocatoria a resaltar; por defecto se toma de `?convocatoria=ID`.
 */
export default function ConvocatoriasPublicasPage({ api = convocatoriaService, destacadaId: destacadaIdProp }) {
  const [searchParams] = useSearchParams();
  const destacadaId = destacadaIdProp ?? searchParams.get('convocatoria');
  const conSesion = Boolean(useAuthStore((state) => state.token));

  const [convocatorias, setConvocatorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    api
      .listarConvocatoriasPublicadas()
      .then((lista) => {
        if (!activo) return;
        setConvocatorias(Array.isArray(lista) ? lista : []);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(mensajeErrorApi(err, 'No se pudieron cargar las convocatorias.'));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [api, version]);

  // Al llegar desde una notificación, se desplaza hasta la convocatoria indicada.
  useEffect(() => {
    if (!destacadaId || cargando) return;
    const elemento = document.getElementById(`convocatoria-${destacadaId}`);
    if (elemento?.scrollIntoView) elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [destacadaId, cargando]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return convocatorias
      .filter((c) =>
        !texto ? true : [c.titulo, c.eventoNombre, c.descripcion].some((v) => (v || '').toLowerCase().includes(texto))
      )
      .sort((a, b) => ORDEN_RECEPCION[estadoRecepcion(a)] - ORDEN_RECEPCION[estadoRecepcion(b)]);
  }, [convocatorias, busqueda]);

  const abiertas = convocatorias.filter((c) => estadoRecepcion(c) === 'abierta').length;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f7f7f8] text-[#1f2023] font-sans antialiased">
      {/* Encabezado público */}
      <header className="h-16 px-8 bg-white border-b border-[#e5e7ea] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#a6192e] flex items-center justify-center">
            <span className="text-white font-bold text-[11px] tracking-tight">UFPS</span>
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-[#a6192e]">SIGEA</p>
            <p className="text-[11px] text-[#5b5f66]">Sistema Integral de Gestión de Eventos Académicos</p>
          </div>
        </div>
        <Link
          to={conSesion ? '/dashboard' : '/login'}
          className="h-10 px-4 rounded-[8px] border border-[#d8dadf] text-sm font-medium text-[#1f2023] hover:bg-[#f7f7f8] inline-flex items-center gap-2 transition-colors"
        >
          {conSesion ? <LayoutDashboard className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {conSesion ? 'Ir a mi panel' : 'Iniciar sesión'}
        </Link>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-8 py-10 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Convocatorias abiertas a la comunidad
          </span>
          <h1 className="font-serif-title text-3xl text-[#1f2023] mt-1 tracking-tight">Convocatorias académicas</h1>
          <p className="text-sm text-[#5b5f66] mt-1 max-w-2xl">
            Consulta las convocatorias publicadas por el Programa de Ingeniería de Sistemas, sus requisitos y
            fechas límite para el envío de ponencias, pósters y artículos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-full sm:max-w-sm">
            <Input
              id="buscar-convocatoria-publica"
              label="Buscar convocatoria"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Título, evento o descripción..."
              rightElement={<Search className="w-4 h-4 text-[#5b5f66]" />}
            />
          </div>
          <p className="sm:ml-auto text-xs text-[#5b5f66] sm:pb-3">
            {cargando
              ? 'Cargando...'
              : `${abiertas} ${abiertas === 1 ? 'convocatoria recibiendo' : 'convocatorias recibiendo'} propuestas`}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e] text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#a6192e] shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setVersion((v) => v + 1)}
              className="inline-flex items-center gap-1 font-semibold underline cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {cargando && convocatorias.length === 0 && (
          <p className="py-12 text-center text-sm text-[#5b5f66]" role="status">
            Cargando convocatorias...
          </p>
        )}

        {!cargando && !error && visibles.length === 0 && (
          <div className="py-12 text-center bg-white rounded-[16px] border border-[#e5e7ea]">
            <p className="font-semibold text-base text-[#1f2023]">
              {busqueda.trim() ? 'Ninguna convocatoria coincide con la búsqueda' : 'No hay convocatorias publicadas'}
            </p>
            <p className="text-xs mt-1 text-[#5b5f66]">
              {busqueda.trim() ? 'Prueba con otros términos.' : 'Vuelve pronto: aquí aparecerán las nuevas convocatorias.'}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {visibles.map((c) => (
            <ConvocatoriaPublicaCard
              key={c.id}
              convocatoria={c}
              destacada={String(c.id) === String(destacadaId)}
              conSesion={conSesion}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
