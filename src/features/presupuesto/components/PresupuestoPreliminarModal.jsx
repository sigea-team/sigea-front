import { useEffect, useState } from 'react';
import { Lock, Wallet } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import EstadoEventoBadge from '../../eventos/components/EstadoEventoBadge';
import { extraerError } from '../../eventos/eventoUtils';
import { presupuestoService } from '../../../api/presupuestoService';
import RubroForm from './RubroForm';
import RubrosTabla from './RubrosTabla';
import HistorialPresupuesto from './HistorialPresupuesto';
import { formatearPesos, motivoPresupuestoBloqueado } from '../presupuestoUtils';

/**
 * @file PresupuestoPreliminarModal.jsx
 * @description Presupuesto preliminar de un evento (HU-07: RF06).
 * - Criterio 1: agrega rubros con su valor estimado y muestra el total del presupuesto.
 * - Criterio 2: edita o elimina rubros; el total se actualiza y cada cambio queda en la
 *   pestaña «Historial» con los valores antes y después.
 * - Criterio 3: el formulario rechaza nombre vacío, valor vacío o negativo e indica el error.
 * Con el evento en ejecución o cerrado, o con presupuesto aprobado (HU-08), queda en solo lectura.
 * El padre debe montarlo con una `key` distinta por evento.
 * @module features/presupuesto/components/PresupuestoPreliminarModal
 */

const PESTANAS = [
  { clave: 'rubros', titulo: 'Rubros' },
  { clave: 'historial', titulo: 'Historial de cambios' },
];

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.evento - { id, nombre, semestre, estado }
 * @param {typeof presupuestoService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {'rubros'|'historial'} [props.pestanaInicial='rubros']
 * @param {function(): void} props.onClose
 */
export default function PresupuestoPreliminarModal({
  isOpen,
  evento,
  api = presupuestoService,
  pestanaInicial = 'rubros',
  onClose,
}) {
  const [pestana, setPestana] = useState(pestanaInicial);
  const [presupuesto, setPresupuesto] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [incluirEliminados, setIncluirEliminados] = useState(false);
  const [historial, setHistorial] = useState(null);
  const [errorHistorial, setErrorHistorial] = useState(null);
  const [filtroRubro, setFiltroRubro] = useState(null);
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState('');

  const eventoId = evento?.id;

  // Presupuesto: se recarga después de cada cambio (version) o al mostrar/ocultar eliminados.
  useEffect(() => {
    if (!isOpen || !eventoId) return undefined;
    let activo = true;
    api
      .consultarPresupuesto(eventoId, incluirEliminados)
      .then((data) => {
        if (!activo) return;
        setPresupuesto(data);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(extraerError(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, incluirEliminados, version, api]);

  // Historial: solo se pide cuando se abre su pestaña, y se refresca después de cada cambio.
  useEffect(() => {
    if (!isOpen || !eventoId || pestana !== 'historial') return undefined;
    let activo = true;
    api
      .historialPresupuesto(eventoId)
      .then((data) => {
        if (!activo) return;
        setHistorial(Array.isArray(data) ? data : []);
        setErrorHistorial(null);
      })
      .catch((err) => {
        if (activo) setErrorHistorial(extraerError(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, pestana, version, api]);

  if (!isOpen || !evento) return null;

  const recargar = () => setVersion((v) => v + 1);

  const reintentar = () => {
    setErrorCarga(null);
    setErrorHistorial(null);
    recargar();
  };

  const editable = Boolean(presupuesto?.editable);
  const rubros = presupuesto?.rubros || [];

  // ---------------- Operaciones (los errores los muestra el formulario o la fila) ----------------

  const agregar = async (datos) => {
    setAviso('');
    const { rubro, totalPresupuesto } = await api.agregarRubro(evento.id, datos);
    setAviso(`Se agregó «${rubro.nombre}» por ${formatearPesos(rubro.subtotal)}. Nuevo total: ${formatearPesos(totalPresupuesto)}.`);
    recargar();
  };

  const actualizar = async (rubroId, datos) => {
    setAviso('');
    const { rubro, totalPresupuesto } = await api.actualizarRubro(evento.id, rubroId, datos);
    setAviso(`Se guardaron los cambios de «${rubro.nombre}». Nuevo total: ${formatearPesos(totalPresupuesto)}.`);
    recargar();
  };

  const eliminar = async (rubroId, motivo) => {
    setAviso('');
    const { rubro, totalPresupuesto } = await api.eliminarRubro(evento.id, rubroId, motivo);
    setAviso(`Se eliminó «${rubro.nombre}». Nuevo total: ${formatearPesos(totalPresupuesto)}. Queda registrado en el historial.`);
    recargar();
  };

  const verHistorialDe = (rubro) => {
    setFiltroRubro({ id: rubro.id, nombre: rubro.nombre });
    setPestana('historial');
  };

  /** Flechas izquierda/derecha para moverse entre pestañas (patrón de accesibilidad de tabs). */
  const moverConTeclado = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const indice = PESTANAS.findIndex((p) => p.clave === pestana);
    const siguiente = PESTANAS[(indice + 1) % PESTANAS.length];
    setPestana(siguiente.clave);
    document.getElementById(`presupuesto-pestana-${siguiente.clave}`)?.focus();
  };

  const cantidad = presupuesto?.cantidadRubros ?? 0;

  return (
    <ModalShell
      titulo="Presupuesto preliminar"
      subtitulo={evento.semestre ? `${evento.nombre} (${evento.semestre})` : evento.nombre}
      icono={Wallet}
      onClose={onClose}
      ancho="max-w-4xl"
      tituloId="presupuesto-titulo"
      pie={
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Resumen: total del presupuesto (Criterio 1) */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-[12px] border border-[#e5e7ea] bg-white">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <EstadoEventoBadge estado={presupuesto?.estadoEvento || evento.estado} />
              {presupuesto?.presupuestoAprobado && (
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f3ec] text-[#1e6b3a] border border-[#1e6b3a]/20">
                  Presupuesto aprobado
                </span>
              )}
            </div>
            <p className="text-xs text-[#5b5f66]">
              {presupuesto ? `${cantidad} ${cantidad === 1 ? 'rubro vigente' : 'rubros vigentes'}` : 'Cargando presupuesto...'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-[#5b5f66]">Total estimado</p>
            <p className="font-serif-title text-2xl sm:text-3xl text-[#a6192e] tabular-nums leading-tight" aria-live="polite">
              {presupuesto ? formatearPesos(presupuesto.total) : '—'}
            </p>
          </div>
        </div>

        {/* Pestañas */}
        <div
          role="tablist"
          aria-label="Presupuesto preliminar"
          className="flex gap-6 border-b border-[#e5e7ea]"
          onKeyDown={moverConTeclado}
        >
          {PESTANAS.map((p) => {
            const activa = p.clave === pestana;
            return (
              <button
                key={p.clave}
                id={`presupuesto-pestana-${p.clave}`}
                type="button"
                role="tab"
                aria-selected={activa}
                aria-controls={`presupuesto-panel-${p.clave}`}
                tabIndex={activa ? 0 : -1}
                onClick={() => setPestana(p.clave)}
                className={`-mb-px pb-3 pt-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e] rounded-t-[4px] ${
                  activa ? 'border-[#a6192e] text-[#a6192e]' : 'border-transparent text-[#5b5f66] hover:text-[#1f2023]'
                }`}
              >
                {p.titulo}
              </button>
            );
          })}
        </div>

        <div id={`presupuesto-panel-${pestana}`} role="tabpanel" aria-labelledby={`presupuesto-pestana-${pestana}`}>
          {pestana === 'rubros' && (
            <div className="space-y-5">
              {errorCarga && !presupuesto && (
                <div className="py-10 text-center">
                  <p className="font-semibold text-[#1f2023]">No se pudo cargar el presupuesto</p>
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

              {!errorCarga && !presupuesto && (
                <p className="text-sm text-[#5b5f66] py-10 text-center" role="status">
                  Cargando presupuesto...
                </p>
              )}

              {presupuesto && (
                <>
                  {editable ? (
                    <RubroForm onAgregar={agregar} rubros={rubros} />
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-[12px] bg-[#fdecec] text-[#7a0c1e]" role="note">
                      <Lock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                      <p className="text-sm leading-relaxed">{motivoPresupuestoBloqueado(presupuesto)}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-[#1f2023] min-h-5" role="status" aria-live="polite">
                      {aviso}
                    </p>
                    <label className="flex items-center gap-2 text-sm text-[#1f2023] cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        checked={incluirEliminados}
                        onChange={(e) => setIncluirEliminados(e.target.checked)}
                        className="w-4 h-4 accent-[#a6192e] cursor-pointer"
                      />
                      Mostrar eliminados
                    </label>
                  </div>

                  <RubrosTabla
                    rubros={rubros}
                    total={presupuesto.total}
                    editable={editable}
                    onActualizar={actualizar}
                    onEliminar={eliminar}
                    onVerHistorial={verHistorialDe}
                  />
                </>
              )}
            </div>
          )}

          {pestana === 'historial' && (
            <HistorialPresupuesto
              registros={historial}
              error={errorHistorial}
              onReintentar={reintentar}
              filtroRubro={filtroRubro}
              onQuitarFiltro={() => setFiltroRubro(null)}
            />
          )}
        </div>
      </div>
    </ModalShell>
  );
}
