/**
 * @file DashboardPage.jsx
 * @description Panel principal al que se redirige tras un login exitoso.
 * Consume endpoints reales para mostrar estadísticas y actividad del sistema SIGEA.
 * Integrado con MainLayout y Sidebar siguiendo el sistema de diseño SIGEA.
 * @module pages/DashboardPage
 */

import { useEffect, useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Calendar,
  FileText,
  Building,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { RUTA_MI_PERFIL_CONFERENCISTA, esModoConferencista, useAuthStore } from '../store/authStore';
import { eventoService } from '../api/eventoService';
import { convocatoriaService } from '../api/convocatoriaService';
import { propuestaService } from '../api/propuestaService';
import BannerModoEvaluador from '../features/evaluaciones/components/BannerModoEvaluador';
import { esAdministrador, puedeEvaluar } from '../utils/permisos';
import EstadoEventoBadge from '../features/eventos/components/EstadoEventoBadge';

export default function DashboardPage({
  apiEventos = eventoService,
  apiConvocatorias = convocatoriaService,
  apiPropuestas = propuestaService,
}) {
  const { usuario: contextUser } = useAuth();
  const storeUser = useAuthStore((state) => state.usuario);
  const usuario = contextUser || storeUser;

  const isAdmin = esAdministrador(usuario);
  const esPonente =
    usuario?.modoIngreso === 'PONENTE' ||
    usuario?.roles?.includes('PONENTE') ||
    usuario?.roles?.includes('AUTOR');
  const esConferencista = esModoConferencista(usuario);
  const esEvaluador = usuario?.modoIngreso === 'EVALUADOR' && puedeEvaluar(usuario);

  const nombreCompleto = usuario?.nombreCompleto || 'Usuario SIGEA';
  const email = usuario?.email || usuario?.correo || 'No especificado';
  const rol = usuario?.rol || (Array.isArray(usuario?.roles) ? usuario.roles.join(', ') : 'No especificado');
  const afiliacion = typeof usuario?.afiliacion === 'object' ? usuario.afiliacion?.nombreAfiliacion : usuario?.afiliacion;

  // Estados de datos reales
  const [eventos, setEventos] = useState([]);
  const [convocatorias, setConvocatorias] = useState([]);
  const [propuestas, setPropuestas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [version, setVersion] = useState(0);

  const recargar = () => setVersion((v) => v + 1);

  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => {
      if (activo) {
        setCargando(true);
        setErrorCarga(null);
      }
    });

    Promise.allSettled([
      apiEventos.listarEventos(),
      apiConvocatorias.listarConvocatorias(isAdmin),
      apiPropuestas.listarMisPropuestas().catch(() => []),
    ]).then(([resEventos, resConvocatorias, resPropuestas]) => {
      if (!activo) return;

      if (resEventos.status === 'fulfilled' && Array.isArray(resEventos.value)) {
        setEventos(resEventos.value);
      } else {
        setEventos([]);
      }

      if (resConvocatorias.status === 'fulfilled' && Array.isArray(resConvocatorias.value)) {
        setConvocatorias(resConvocatorias.value);
      } else {
        setConvocatorias([]);
      }

      if (resPropuestas.status === 'fulfilled' && Array.isArray(resPropuestas.value)) {
        setPropuestas(resPropuestas.value);
      } else {
        setPropuestas([]);
      }

      setCargando(false);
    }).catch((err) => {
      if (!activo) return;
      setErrorCarga(err.message || 'Error al conectar con los servicios del sistema.');
      setCargando(false);
    });

    return () => {
      activo = false;
    };
  }, [apiEventos, apiConvocatorias, apiPropuestas, isAdmin, version]);

  // Métricas calculadas sobre datos reales
  const totalEventos = eventos.length;
  const eventosHabilitados = useMemo(
    () => eventos.filter((e) => e.estado === 'habilitado' || e.estado === 'publicado').length,
    [eventos]
  );

  const totalConvocatorias = convocatorias.length;
  const convocatoriasAbiertas = useMemo(
    () => convocatorias.filter((c) => c.estado === 'PUBLICADA' || c.estado === 'ABIERTA').length,
    [convocatorias]
  );

  const totalPropuestas = propuestas.length;

  // Redirección inmediata para la persona que entra como ponente: solo gestiona y envía propuestas
  if (esPonente && !isAdmin) {
    return <Navigate to="/mis-propuestas" replace />;
  }

  return (
    <MainLayout title="Dashboard Principal" activeNav="dashboard">
      <div className="space-y-6">
        {/* Cabecera con bienvenida y botón para refrescar datos */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#e5e7ea]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              SIGEA — Panel General en Tiempo Real
            </span>
            <h1 className="font-serif-title text-2xl sm:text-3xl text-[#1f2023] mt-1 tracking-tight">
              Bienvenido, {nombreCompleto}
            </h1>
            <p className="text-sm text-[#5b5f66] mt-1 max-w-2xl">
              Sistema Integral de Gestión de Eventos Académicos — Universidad Francisco de Paula Santander (UFPS).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={recargar}
              disabled={cargando}
              title="Actualizar datos desde el servidor"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              <span>Actualizar datos</span>
            </Button>
          </div>
        </div>

        {/* Banner para Evaluador */}
        {esEvaluador && <BannerModoEvaluador enlaceEvaluaciones="/evaluaciones" />}

        {/* Banner para Conferencista */}
        {esConferencista && (
          <div className="bg-[#fdecec] border border-[#a6192e]/30 rounded-[16px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#a6192e] text-white rounded-full mb-1">
                Modo Conferencista Activo
              </span>
              <h2 className="text-base font-bold text-[#1f2023]">Tu trayectoria académica y profesional</h2>
              <p className="text-xs text-[#5b5f66] mt-1 max-w-xl">
                Revisa y actualiza tu biografía, estudios y publicaciones. Los cambios se ven de inmediato en la
                página pública de los eventos en los que participas.
              </p>
            </div>
            <Link
              to={RUTA_MI_PERFIL_CONFERENCISTA}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-[#a6192e] hover:bg-[#7a0c1e] text-white text-xs font-semibold rounded-[8px] transition-colors shrink-0 shadow-xs"
            >
              Ir a mi perfil de conferencista
            </Link>
          </div>
        )}

        {errorCarga && (
          <div className="p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e] text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#a6192e] shrink-0" aria-hidden="true" />
              <span>{errorCarga}</span>
            </div>
            <button
              type="button"
              onClick={recargar}
              className="inline-flex items-center gap-1 font-semibold underline cursor-pointer text-xs"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tarjetas de Métricas Reales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tarjeta 1: Convocatorias */}
          <Link
            to="/convocatorias"
            className="group block p-5 rounded-[16px] bg-white border border-[#e5e7ea] hover:border-[#a6192e]/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5b5f66]">
                Convocatorias Abiertas
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#fdecec] text-[#a6192e] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </span>
            </div>
            <p className="font-serif-title text-3xl font-bold text-[#a6192e] mt-3">
              {cargando ? '—' : convocatoriasAbiertas}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-[#5b5f66]">
              <span>{cargando ? 'Cargando...' : `${totalConvocatorias} registradas en total`}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#a6192e] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>

          {/* Tarjeta 2: Eventos */}
          <Link
            to="/eventos"
            className="group block p-5 rounded-[16px] bg-white border border-[#e5e7ea] hover:border-[#a6192e]/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5b5f66]">
                Eventos Académicos
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#f7f7f8] text-[#1f2023] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
            <p className="font-serif-title text-3xl font-bold text-[#1f2023] mt-3">
              {cargando ? '—' : totalEventos}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-[#5b5f66]">
              <span>
                {cargando ? 'Cargando...' : `${eventosHabilitados} evento(s) publicados`}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#a6192e] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>

          {/* Tarjeta 3: Salas e Infraestructura */}
          <Link
            to="/salas"
            className="group block p-5 rounded-[16px] bg-white border border-[#e5e7ea] hover:border-[#a6192e]/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5b5f66]">
                Salas y Espacios
              </span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </span>
            </div>
            <p className="font-serif-title text-3xl font-bold text-[#1f2023] mt-3">
              Infraestructura
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-[#5b5f66]">
              <span>Auditorios y aulas institucionales</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#a6192e] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        </div>

        {/* Sección de Resúmenes en Tiempo Real */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bloque Eventos Recientes */}
          <div className="rounded-[16px] border border-[#e5e7ea] bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#e5e7ea]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#a6192e]" />
                  <h2 className="font-serif-title text-lg font-semibold text-[#1f2023]">Eventos Recientes</h2>
                </div>
                <Link
                  to="/eventos"
                  className="text-xs font-semibold text-[#a6192e] hover:text-[#7a0c1e] hover:underline"
                >
                  Ver todos →
                </Link>
              </div>

              <div className="mt-3 divide-y divide-[#e5e7ea]">
                {cargando ? (
                  <p className="text-xs text-[#5b5f66] py-6 text-center">Cargando eventos desde el servidor...</p>
                ) : eventos.length === 0 ? (
                  <p className="text-xs text-[#5b5f66] py-6 text-center">No hay eventos registrados en el sistema.</p>
                ) : (
                  eventos.slice(0, 4).map((ev) => (
                    <div key={ev.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1f2023] truncate">{ev.nombre}</p>
                        <p className="text-xs text-[#5b5f66] mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[#9ca0a6]" />
                          <span>{ev.fechaInicio} al {ev.fechaFin}</span>
                          <span className="capitalize">• {ev.modalidad || 'Presencial'}</span>
                        </p>
                      </div>
                      <EstadoEventoBadge estado={ev.estado} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bloque Convocatorias Abiertas */}
          <div className="rounded-[16px] border border-[#e5e7ea] bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#e5e7ea]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#a6192e]" />
                  <h2 className="font-serif-title text-lg font-semibold text-[#1f2023]">Convocatorias Vigentes</h2>
                </div>
                <Link
                  to="/convocatorias"
                  className="text-xs font-semibold text-[#a6192e] hover:text-[#7a0c1e] hover:underline"
                >
                  Ver todas →
                </Link>
              </div>

              <div className="mt-3 divide-y divide-[#e5e7ea]">
                {cargando ? (
                  <p className="text-xs text-[#5b5f66] py-6 text-center">Cargando convocatorias desde el servidor...</p>
                ) : convocatorias.length === 0 ? (
                  <p className="text-xs text-[#5b5f66] py-6 text-center">No hay convocatorias registradas.</p>
                ) : (
                  convocatorias.slice(0, 4).map((c) => (
                    <div key={c.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1f2023] truncate">{c.titulo}</p>
                        <p className="text-xs text-[#5b5f66] mt-0.5">
                          {c.eventoNombre ? `Evento: ${c.eventoNombre} • ` : ''}
                          Cierre: {c.fechaFin || c.fechaCierre || 'No definida'}
                        </p>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                        c.estado === 'PUBLICADA' || c.estado === 'ABIERTA'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}>
                        {c.estado}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información de la Sesión Actual */}
        <div className="text-sm text-[#5b5f66] bg-[#f7f7f8] border border-[#e5e7ea] rounded-[16px] p-5 space-y-2">
          <h3 className="font-semibold text-[#1f2023] text-base mb-2">Información de la Sesión Actual</h3>
          <p><strong className="text-[#1f2023]">Nombre Completo:</strong> {nombreCompleto}</p>
          <p><strong className="text-[#1f2023]">Correo Electrónico:</strong> {email}</p>
          <p><strong className="text-[#1f2023]">Perfil de Ingreso:</strong> {esConferencista ? 'Conferencista invitado' : esEvaluador ? 'Evaluador de Propuestas' : isAdmin ? 'Administrador del Sistema' : 'Asistente General'}</p>
          <p><strong className="text-[#1f2023]">Rol del Sistema:</strong> {rol}</p>
          {afiliacion && <p><strong className="text-[#1f2023]">Afiliación Institucional:</strong> {afiliacion}</p>}
        </div>
      </div>
    </MainLayout>
  );
}
