import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Lock, RefreshCw, AlertTriangle, X, ShieldOff } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import AuditoriaFiltros from '../features/auditoria/components/AuditoriaFiltros';
import AuditoriaTabla from '../features/auditoria/components/AuditoriaTabla';
import AuditoriaDetalleModal from '../features/auditoria/components/AuditoriaDetalleModal';
import {
  servicioAuditoria,
  mensajeErrorAuditoria,
  esErrorSinPermiso,
  puedeVerAuditoria,
} from '../api/auditoriaService';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/authStore';
import { hoyIso } from '../features/auditoria/auditoriaUtils';

/**
 * @file AuditoriaPage.jsx
 * @description Vista del log de auditoría de operaciones críticas para el administrador (HU-03, RF56).
 * - Criterio 1: muestra usuario, fecha y hora, acción y datos afectados de cada operación crítica.
 * - Criterio 2: filtros por usuario, tipo de operación y rango de fechas, con paginación.
 * - Criterio 3: vista de solo lectura, sin acciones de edición ni eliminación.
 *
 * Control de acceso en tres capas:
 * 1. El menú solo muestra "Auditoría" a administradores (Sidebar).
 * 2. La ruta /auditoria está envuelta en AdminRoute: un usuario no administrador que escriba
 *    la URL es enviado al dashboard.
 * 3. El backend valida el permiso AUDITORIA_VER o el rol ADMIN en cada petición; si responde
 *    403, esta página oculta los datos y muestra un aviso de "sin permisos".
 * Además, la página no hace ninguna petición si el usuario de la sesión no es administrador.
 *
 * @module pages/AuditoriaPage
 */

/** Registros por página. */
const TAMANO_PAGINA = 10;

/** Filtros vacíos. */
const FILTROS_VACIOS = { correo: '', accion: '', desde: '', hasta: '' };

const MENSAJE_RANGO_INVALIDO = 'La fecha "Hasta" no puede ser anterior a la fecha "Desde".';

/** Indica si hay al menos un filtro con valor. */
const tieneFiltros = (f) => Boolean(f.correo || f.accion || f.desde || f.hasta);

/**
 * @param {Object} props
 * @param {Object} [props.usuarioProp] - Usuario a mostrar en el layout (Storybook).
 * @param {{ buscar: Function, tiposOperacion: Function }} [props.servicio] - Permite inyectar datos simulados.
 * @param {function(string): void} [props.onSelectNav]
 */
export default function AuditoriaPage({ usuarioProp, servicio = servicioAuditoria, onSelectNav }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const storeUser = useAuthStore((state) => state.usuario);
  const usuario = usuarioProp || auth?.usuario || storeUser;
  const autorizado = puedeVerAuditoria(usuario);

  // Filtros que el usuario está escribiendo vs. filtros ya aplicados a la consulta
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);
  const [consulta, setConsulta] = useState({ filtros: FILTROS_VACIOS, pagina: 0 });

  const [resultado, setResultado] = useState({ cargando: true, datos: null, error: null });
  const [sinPermiso, setSinPermiso] = useState(false);
  const [tiposOperacion, setTiposOperacion] = useState([]);
  const [avisoTipos, setAvisoTipos] = useState(null);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // Validación en vivo del rango: el botón "Aplicar" se deshabilita mientras sea inválido.
  const errorFechas =
    borrador.desde && borrador.hasta && borrador.desde > borrador.hasta ? MENSAJE_RANGO_INVALIDO : null;

  // Catálogo de tipos de operación (una sola vez, y solo para administradores)
  useEffect(() => {
    if (!autorizado) return undefined;
    let activo = true;
    servicio
      .tiposOperacion()
      .then((tipos) => {
        if (activo) setTiposOperacion(Array.isArray(tipos) ? tipos : []);
      })
      .catch((error) => {
        if (!activo) return;
        if (esErrorSinPermiso(error)) {
          setSinPermiso(true);
        } else {
          setAvisoTipos(
            'No se pudo cargar el catálogo de tipos de operación. Puedes seguir filtrando por correo y fechas.'
          );
        }
      });
    return () => {
      activo = false;
    };
  }, [servicio, autorizado]);

  // Consulta del log cada vez que cambian los filtros aplicados o la página
  useEffect(() => {
    if (!autorizado) return undefined;
    let activo = true;
    servicio
      .buscar({ ...consulta.filtros, pagina: consulta.pagina, tamano: TAMANO_PAGINA })
      .then((datos) => {
        if (!activo) return;
        // Si la página pedida ya no existe (p. ej. quedó fuera de rango), se va a la última.
        const totalPaginas = Number(datos?.totalPaginas) || 0;
        const vacia = !Array.isArray(datos?.contenido) || datos.contenido.length === 0;
        if (vacia && consulta.pagina > 0 && totalPaginas > 0 && consulta.pagina >= totalPaginas) {
          setConsulta((prev) => ({ ...prev, pagina: totalPaginas - 1 }));
          return;
        }
        setResultado({ cargando: false, datos, error: null });
      })
      .catch((error) => {
        if (!activo) return;
        if (esErrorSinPermiso(error)) {
          setSinPermiso(true);
          setResultado({ cargando: false, datos: null, error: null });
          return;
        }
        // Se conserva la última página cargada y los filtros, para no dejar la vista vacía.
        setResultado((prev) => ({ ...prev, cargando: false, error: mensajeErrorAuditoria(error) }));
      });
    return () => {
      activo = false;
    };
  }, [consulta, servicio, autorizado]);

  /** Lanza una nueva consulta mostrando el estado de carga. */
  const consultar = useCallback((nuevaConsulta) => {
    setResultado((prev) => ({ ...prev, cargando: true, error: null }));
    setConsulta(nuevaConsulta);
  }, []);

  const handleCambiarFiltro = (campo, valor) => {
    setBorrador((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleAplicar = () => {
    if (errorFechas) return;
    consultar({ filtros: { ...borrador, correo: borrador.correo.trim() }, pagina: 0 });
  };

  const handleLimpiar = () => {
    setBorrador(FILTROS_VACIOS);
    consultar({ filtros: FILTROS_VACIOS, pagina: 0 });
  };

  const handleCambiarPagina = (pagina) => consultar({ ...consulta, pagina });

  const handleActualizar = () => consultar({ ...consulta });

  const datos = resultado.datos;

  // Sin permisos: no se muestra ningún dato, aunque el usuario haya llegado por URL.
  if (!autorizado || sinPermiso) {
    return (
      <MainLayout title="Auditoría del Sistema" activeNav="auditoria" onSelectNav={onSelectNav} usuario={usuarioProp}>
        <div className="max-w-lg mx-auto mt-12 text-center rounded-[16px] border border-[#e5e7ea] bg-white p-10 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center">
            <ShieldOff className="w-7 h-7" />
          </div>
          <h2 className="font-serif-title text-2xl text-[#1f2023] mt-5">
            No tienes permisos para consultar la auditoría
          </h2>
          <p className="text-sm text-[#5b5f66] mt-2">
            Esta sección es exclusiva para administradores. Si crees que deberías tener acceso, solicita al
            administrador del sistema el permiso <span className="font-mono text-xs">AUDITORIA_VER</span>.
          </p>
          <Button type="button" variant="primary" onClick={() => navigate('/dashboard')} className="h-10 px-5 mt-6">
            Volver al inicio
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Auditoría del Sistema"
      activeNav="auditoria"
      onSelectNav={onSelectNav}
      usuario={usuarioProp}
    >
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#e5e7ea]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              SIGEA — Trazabilidad
            </span>
            <h2 className="font-serif-title text-3xl text-[#1f2023] mt-1 tracking-tight">
              Auditoría de Operaciones Críticas
            </h2>
            <p className="text-sm text-[#5b5f66] mt-1">
              Consulta quién realizó cada operación crítica, cuándo la hizo y qué datos afectó.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f7f7f8] text-[#5b5f66] border border-[#e5e7ea]"
              title="Los registros de auditoría no pueden modificarse ni eliminarse"
            >
              <Lock className="w-3.5 h-3.5 text-[#a6192e]" />
              Solo lectura
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={handleActualizar}
              disabled={resultado.cargando}
              className="h-10 px-4"
            >
              <RefreshCw className={`w-4 h-4 ${resultado.cargando ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>

        <AuditoriaFiltros
          valores={borrador}
          tiposOperacion={tiposOperacion}
          onCambiar={handleCambiarFiltro}
          onAplicar={handleAplicar}
          onLimpiar={handleLimpiar}
          errorFechas={errorFechas}
          avisoTipos={avisoTipos}
          fechaMaxima={hoyIso()}
          cargando={resultado.cargando}
        />

        {resultado.error && (
          <div
            role="alert"
            className="p-4 rounded-[12px] border border-[#a6192e]/30 bg-[#fdecec] text-[#7a0c1e] text-sm font-medium flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#a6192e] shrink-0" />
              <span>{resultado.error}</span>
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <button
                type="button"
                onClick={handleActualizar}
                className="px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-white border border-[#a6192e]/30 hover:bg-[#fdecec] cursor-pointer"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={() => setResultado((prev) => ({ ...prev, error: null }))}
                className="p-1 hover:opacity-75 cursor-pointer"
                title="Cerrar mensaje"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <AuditoriaTabla
          registros={datos?.contenido || []}
          cargando={resultado.cargando}
          pagina={datos?.pagina ?? consulta.pagina}
          tamano={datos?.tamano ?? TAMANO_PAGINA}
          totalElementos={datos?.totalElementos ?? 0}
          totalPaginas={datos?.totalPaginas ?? 1}
          onCambiarPagina={handleCambiarPagina}
          onVerDetalle={setRegistroSeleccionado}
          hayFiltros={tieneFiltros(consulta.filtros)}
        />
      </div>

      <AuditoriaDetalleModal
        isOpen={Boolean(registroSeleccionado)}
        registro={registroSeleccionado}
        onClose={() => setRegistroSeleccionado(null)}
      />
    </MainLayout>
  );
}
