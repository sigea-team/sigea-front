import { useEffect, useMemo, useState } from 'react';
import { Tags } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from './ModalShell';
import CatalogoParametros from './CatalogoParametros';
import { ESTADOS_EVENTO, extraerError } from '../eventoUtils';
import { CATALOGOS, esCatalogoModificable } from '../parametroUtils';
import { parametroEventoService } from '../../../api/parametroEventoService';

/**
 * @file ParametrosEventoModal.jsx
 * @description Configuración de los parámetros de un evento (HU-05: RF06 + RF07):
 * tipos de actividad y líneas temáticas, cada uno en su pestaña.
 * Carga los dos catálogos al abrir, para mostrar cuántos elementos tiene cada uno.
 * Con el evento en ejecución o cerrado queda en solo lectura (misma regla del backend).
 * El padre debe montarlo con una `key` distinta por evento.
 * @module features/eventos/components/ParametrosEventoModal
 */

const PESTANAS = [CATALOGOS.tipos, CATALOGOS.lineas];

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.evento - Evento cuyos parámetros se configuran.
 * @param {typeof parametroEventoService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {'tipos'|'lineas'} [props.pestanaInicial='tipos']
 * @param {function(): void} props.onClose
 */
export default function ParametrosEventoModal({
  isOpen,
  evento,
  api = parametroEventoService,
  pestanaInicial = 'tipos',
  onClose,
}) {
  const [pestana, setPestana] = useState(pestanaInicial);
  const [catalogos, setCatalogos] = useState({ tipos: null, lineas: null });
  const [errorCarga, setErrorCarga] = useState(null);
  const [version, setVersion] = useState(0);
  const eventoId = evento?.id;

  useEffect(() => {
    if (!isOpen || !eventoId) return undefined;
    let activo = true;
    Promise.all([api.listar('tipos', eventoId), api.listar('lineas', eventoId)])
      .then(([tipos, lineas]) => {
        if (!activo) return;
        setCatalogos({ tipos: tipos || [], lineas: lineas || [] });
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(extraerError(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, api, version]);

  /** Llamadas a la API ligadas al evento, una por catálogo. */
  const acciones = useMemo(() => {
    const ligar = (catalogo) => ({
      crear: (datos) => api.crear(catalogo, eventoId, datos),
      actualizar: (id, datos) => api.actualizar(catalogo, eventoId, id, datos),
      consultarUso: (id) => api.consultarUso(catalogo, eventoId, id),
      eliminar: (id) => api.eliminar(catalogo, eventoId, id),
    });
    return { tipos: ligar('tipos'), lineas: ligar('lineas') };
  }, [api, eventoId]);

  if (!isOpen || !evento) return null;

  const modificable = esCatalogoModificable(evento);
  const estado = ESTADOS_EVENTO[evento.estado] || evento.estado;
  const motivoBloqueo = `El evento está «${estado}». Los tipos de actividad y las líneas temáticas solo se pueden modificar mientras está en configuración o habilitado.`;
  const cargado = catalogos.tipos !== null && catalogos.lineas !== null;
  const config = CATALOGOS[pestana];

  const reintentar = () => {
    setErrorCarga(null);
    setVersion((v) => v + 1);
  };

  /** Flechas izquierda/derecha para moverse entre pestañas (patrón de accesibilidad de tabs). */
  const moverConTeclado = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const indice = PESTANAS.findIndex((p) => p.clave === pestana);
    const siguiente = PESTANAS[(indice + (e.key === 'ArrowRight' ? 1 : PESTANAS.length - 1)) % PESTANAS.length];
    setPestana(siguiente.clave);
    document.getElementById(`pestana-${siguiente.clave}`)?.focus();
  };

  return (
    <ModalShell
      titulo="Tipos de actividad y líneas temáticas"
      subtitulo={evento.semestre ? `${evento.nombre} (${evento.semestre})` : evento.nombre}
      icono={Tags}
      onClose={onClose}
      ancho="max-w-3xl"
      tituloId="parametros-evento-titulo"
      pie={
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div role="tablist" aria-label="Parámetros del evento" className="flex gap-6 border-b border-[#e5e7ea] -mt-1 mb-5" onKeyDown={moverConTeclado}>
        {PESTANAS.map((p) => {
          const activa = p.clave === pestana;
          const total = catalogos[p.clave]?.length;
          return (
            <button
              key={p.clave}
              id={`pestana-${p.clave}`}
              type="button"
              role="tab"
              aria-selected={activa}
              aria-controls={`panel-${p.clave}`}
              tabIndex={activa ? 0 : -1}
              onClick={() => setPestana(p.clave)}
              className={`-mb-px pb-3 pt-1 text-sm font-semibold border-b-2 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e] rounded-t-[4px] ${
                activa ? 'border-[#a6192e] text-[#a6192e]' : 'border-transparent text-[#5b5f66] hover:text-[#1f2023]'
              }`}
            >
              {p.titulo}
              {total !== undefined && (
                <span
                  className={`min-w-6 px-1.5 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                    activa ? 'bg-[#fdecec] text-[#a6192e]' : 'bg-[#edeeef] text-[#5b5f66]'
                  }`}
                >
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div id={`panel-${pestana}`} role="tabpanel" aria-labelledby={`pestana-${pestana}`}>
        {errorCarga && (
          <div className="py-10 text-center">
            <p className="font-semibold text-[#1f2023]">No se pudieron cargar los parámetros del evento</p>
            <p className="text-sm text-[#5b5f66] mt-1">{errorCarga}</p>
            <button
              type="button"
              onClick={reintentar}
              className="text-xs mt-2 text-[#a6192e] font-semibold underline cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {!errorCarga && !cargado && (
          <p className="text-sm text-[#5b5f66] py-10 text-center" role="status">
            Cargando parámetros...
          </p>
        )}

        {!errorCarga && cargado && (
          <CatalogoParametros
            key={pestana}
            config={config}
            items={catalogos[pestana]}
            modificable={modificable}
            motivoBloqueo={motivoBloqueo}
            acciones={acciones[pestana]}
            onCambio={(items) => setCatalogos((c) => ({ ...c, [pestana]: items }))}
          />
        )}
      </div>
    </ModalShell>
  );
}
