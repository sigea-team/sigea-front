import { useEffect, useState } from 'react';
import { Info, Lock, ShieldCheck, TrendingUp } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import ModalShell from '../../eventos/components/ModalShell';
import EstadoEventoBadge from '../../eventos/components/EstadoEventoBadge';
import { extraerError } from '../../eventos/eventoUtils';
import { ejecucionPresupuestalService } from '../../../api/ejecucionPresupuestalService';
import { formatearPesos } from '../presupuestoUtils';
import { formatearPorcentaje, motivoSinRegistro } from '../ejecucionUtils';
import BarraEjecucion from './BarraEjecucion';
import GastoForm from './GastoForm';
import EjecucionRubrosTabla from './EjecucionRubrosTabla';
import GastosTabla from './GastosTabla';

/**
 * @file EjecucionPresupuestalModal.jsx
 * @description Gastos ejecutados y ejecución presupuestal de un evento (HU-09: RF11 + RF12).
 * - Criterio 1: registra un gasto contra un rubro y muestra el acumulado del rubro y el porcentaje
 *   de ejecución del evento recalculados (ejecutado / presupuesto aprobado).
 * - Un gasto que supera el disponible del rubro se registra igual; se informa y el rubro queda «Excedido».
 * - Criterio 3: sin valor o con valor negativo se rechaza; el valor 0 se acepta y el soporte es opcional.
 * - Criterio 4: sin gastos la ejecución se muestra en 0 % sin error.
 * Requiere un presupuesto aprobado (HU-08); con el evento cerrado queda en solo lectura.
 * El padre debe montarlo con una `key` distinta por evento.
 * @module features/presupuesto/components/EjecucionPresupuestalModal
 */

const PESTANAS = [
  { clave: 'rubros', titulo: 'Ejecución por rubro' },
  { clave: 'gastos', titulo: 'Gastos registrados' },
];

const TODOS = 'todos';

/** Tarjeta pequeña de una cifra del resumen. */
function Cifra({ titulo, valor, detalle, resaltada = false, alerta = false }) {
  return (
    <div className="p-4 rounded-[12px] border border-[#e5e7ea] bg-white">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#5b5f66]">{titulo}</p>
      <p
        className={`font-serif-title text-2xl tabular-nums leading-tight mt-1 ${
          alerta ? 'text-[#7a0c1e]' : resaltada ? 'text-[#a6192e]' : 'text-[#1f2023]'
        }`}
      >
        {valor}
      </p>
      {detalle && <p className="text-xs text-[#5b5f66] mt-1">{detalle}</p>}
    </div>
  );
}

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.evento - { id, nombre, semestre, estado }
 * @param {typeof ejecucionPresupuestalService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {'rubros'|'gastos'} [props.pestanaInicial='rubros']
 * @param {function(): void} props.onClose
 * @param {function(): void} [props.onAbrirPresupuestoAprobado] - Lleva al presupuesto aprobado cuando falta.
 */
export default function EjecucionPresupuestalModal({
  isOpen,
  evento,
  api = ejecucionPresupuestalService,
  pestanaInicial = 'rubros',
  onClose,
  onAbrirPresupuestoAprobado,
}) {
  const [pestana, setPestana] = useState(pestanaInicial);
  const [ejecucion, setEjecucion] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [gastos, setGastos] = useState(null);
  const [errorGastos, setErrorGastos] = useState(null);
  const [filtroRubro, setFiltroRubro] = useState(TODOS);
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState(null);
  // El formulario se vuelve a montar (nueva key) cuando se elige un rubro desde la tabla.
  const [formulario, setFormulario] = useState({ key: 0, rubroId: undefined });

  const eventoId = evento?.id;

  // Ejecución: se recarga después de cada gasto registrado (version).
  useEffect(() => {
    if (!isOpen || !eventoId) return undefined;
    let activo = true;
    api
      .consultarEjecucion(eventoId)
      .then((data) => {
        if (!activo) return;
        setEjecucion(data);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(extraerError(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, version, api]);

  // Gastos: solo se piden cuando se abre su pestaña o cambia el filtro.
  useEffect(() => {
    if (!isOpen || !eventoId || pestana !== 'gastos') return undefined;
    let activo = true;
    api
      .listarGastos(eventoId, filtroRubro === TODOS ? undefined : Number(filtroRubro))
      .then((data) => {
        if (!activo) return;
        setGastos(Array.isArray(data) ? data : []);
        setErrorGastos(null);
      })
      .catch((err) => {
        if (activo) setErrorGastos(extraerError(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, pestana, filtroRubro, version, api]);

  if (!isOpen || !evento) return null;

  const recargar = () => setVersion((v) => v + 1);

  const reintentar = () => {
    setErrorCarga(null);
    setErrorGastos(null);
    recargar();
  };

  const motivoBloqueo = ejecucion ? motivoSinRegistro(ejecucion, evento.estado) : null;
  const puedeRegistrar = Boolean(ejecucion) && !motivoBloqueo;
  const rubros = ejecucion?.rubros || [];

  // ---------------- Operaciones ----------------

  /** Criterio 1. Si falla, el formulario muestra el error. */
  const registrar = async (peticion) => {
    setAviso(null);
    const r = await api.registrarGasto(evento.id, peticion);
    setAviso({
      texto:
        `Se registró el gasto de ${formatearPesos(r.gasto.valor)} en «${r.rubro.nombre}». ` +
        `El rubro lleva ${formatearPorcentaje(r.rubro.porcentajeEjecucion)} y el evento ${formatearPorcentaje(r.porcentajeEjecucion)} de ejecución.`,
      advertencia: r.excedioDisponible ? r.advertencia : null,
    });
    setGastos(null);
    recargar();
  };

  const registrarEn = (rubro) => {
    setAviso(null);
    setFormulario((f) => ({ key: f.key + 1, rubroId: rubro.rubroId }));
    setPestana('rubros');
  };

  const verGastosDe = (rubro) => {
    setFiltroRubro(String(rubro.rubroId));
    setGastos(null);
    setPestana('gastos');
  };

  const cambiarFiltro = (e) => {
    setFiltroRubro(e.target.value);
    setGastos(null);
  };

  /** Flechas izquierda/derecha para moverse entre pestañas (patrón de accesibilidad de tabs). */
  const moverConTeclado = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const indice = PESTANAS.findIndex((p) => p.clave === pestana);
    const siguiente = PESTANAS[(indice + 1) % PESTANAS.length];
    setPestana(siguiente.clave);
    document.getElementById(`ejecucion-pestana-${siguiente.clave}`)?.focus();
  };

  const saldo = Number(ejecucion?.saldoDisponible ?? 0);
  const porcentaje = Number(ejecucion?.porcentajeEjecucion ?? 0);
  const opcionesFiltro = [
    { value: TODOS, label: 'Todos los rubros' },
    ...rubros.map((r) => ({ value: String(r.rubroId), label: r.nombre })),
  ];

  return (
    <ModalShell
      titulo="Ejecución presupuestal"
      subtitulo={evento.semestre ? `${evento.nombre} (${evento.semestre})` : evento.nombre}
      icono={TrendingUp}
      onClose={onClose}
      ancho="max-w-5xl"
      tituloId="ejecucion-titulo"
      pie={
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Carga inicial y error */}
        {!ejecucion && !errorCarga && (
          <p className="text-sm text-[#5b5f66] py-12 text-center" role="status">
            Cargando la ejecución presupuestal...
          </p>
        )}

        {!ejecucion && errorCarga && (
          <div className="py-10 text-center">
            <p className="font-semibold text-[#1f2023]">No se pudo cargar la ejecución presupuestal</p>
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

        {ejecucion && (
          <>
            {/* Resumen del evento (RF12, Criterio 4: 0 % sin gastos) */}
            <div className="p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8] space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <EstadoEventoBadge estado={evento.estado} />
                  {ejecucion.tienePresupuestoAprobado ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f3ec] text-[#1e6b3a] border border-[#1e6b3a]/20">
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      Presupuesto aprobado
                    </span>
                  ) : (
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fdecec] text-[#a6192e] border border-[#a6192e]/20">
                      Sin presupuesto aprobado
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5b5f66]">
                  {ejecucion.cantidadGastos} {ejecucion.cantidadGastos === 1 ? 'gasto registrado' : 'gastos registrados'}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <Cifra
                  titulo="Presupuesto aprobado"
                  valor={ejecucion.tienePresupuestoAprobado ? formatearPesos(ejecucion.valorTotalAprobado) : '—'}
                  detalle="Base del porcentaje"
                />
                <Cifra titulo="Total ejecutado" valor={formatearPesos(ejecucion.totalEjecutado)} detalle="Suma de los gastos" />
                <Cifra
                  titulo="Saldo disponible"
                  valor={formatearPesos(saldo)}
                  detalle={saldo < 0 ? 'Se superó el presupuesto aprobado' : 'Aprobado − ejecutado'}
                  alerta={saldo < 0}
                />
                <Cifra
                  titulo="Ejecución"
                  valor={formatearPorcentaje(porcentaje)}
                  detalle="Ejecutado / aprobado"
                  resaltada
                  alerta={porcentaje > 100}
                />
              </div>

              <BarraEjecucion
                porcentaje={porcentaje}
                excedido={porcentaje > 100}
                etiqueta="Ejecución presupuestal del evento"
                tamano="lg"
                mostrarValor={false}
              />
            </div>

            {/* Pestañas */}
            <div
              role="tablist"
              aria-label="Ejecución presupuestal"
              className="flex gap-6 border-b border-[#e5e7ea]"
              onKeyDown={moverConTeclado}
            >
              {PESTANAS.map((p) => {
                const activa = p.clave === pestana;
                return (
                  <button
                    key={p.clave}
                    id={`ejecucion-pestana-${p.clave}`}
                    type="button"
                    role="tab"
                    aria-selected={activa}
                    aria-controls={`ejecucion-panel-${p.clave}`}
                    tabIndex={activa ? 0 : -1}
                    onClick={() => setPestana(p.clave)}
                    className={`-mb-px pb-3 pt-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e] rounded-t-[4px] ${
                      activa ? 'border-[#a6192e] text-[#a6192e]' : 'border-transparent text-[#5b5f66] hover:text-[#1f2023]'
                    }`}
                  >
                    {p.titulo}
                    {p.clave === 'gastos' && ejecucion.cantidadGastos > 0 && (
                      <span className="ml-2 text-xs py-0.5 px-2 rounded-full bg-[#f7f7f8] text-[#5b5f66] border border-[#e5e7ea]">
                        {ejecucion.cantidadGastos}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div id={`ejecucion-panel-${pestana}`} role="tabpanel" aria-labelledby={`ejecucion-pestana-${pestana}`}>
              {pestana === 'rubros' && (
                <div className="space-y-5">
                  {puedeRegistrar ? (
                    <GastoForm
                      key={formulario.key}
                      rubros={rubros}
                      onRegistrar={registrar}
                      rubroInicial={formulario.rubroId}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-4 p-4 rounded-[12px] bg-[#fdecec] text-[#7a0c1e]" role="note">
                      <div className="flex items-start gap-3">
                        <Lock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <p className="text-sm leading-relaxed">{motivoBloqueo}</p>
                      </div>
                      {!ejecucion.tienePresupuestoAprobado && evento.estado !== 'cerrado' && onAbrirPresupuestoAprobado && (
                        <Button type="button" variant="primary" onClick={onAbrirPresupuestoAprobado} className="shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Ir al presupuesto aprobado</span>
                        </Button>
                      )}
                    </div>
                  )}

                  {aviso && (
                    <div className="space-y-2" role="status" aria-live="polite">
                      <p className="text-sm text-[#1f2023]">{aviso.texto}</p>
                      {aviso.advertencia && (
                        <p className="flex items-start gap-2 text-sm text-[#1f2023] bg-white border border-[#e5e7ea] rounded-[8px] px-3 py-2">
                          <Info className="w-4 h-4 mt-0.5 shrink-0 text-[#5b5f66]" aria-hidden="true" />
                          <span>{aviso.advertencia} El rubro quedó marcado como excedido.</span>
                        </p>
                      )}
                    </div>
                  )}

                  <EjecucionRubrosTabla
                    rubros={rubros}
                    totalPresupuestado={ejecucion.totalPresupuestadoRubros}
                    totalEjecutado={ejecucion.totalEjecutado}
                    onRegistrarGasto={puedeRegistrar ? registrarEn : undefined}
                    onVerGastos={verGastosDe}
                  />
                </div>
              )}

              {pestana === 'gastos' && (
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div className="w-72">
                      <Select
                        id="ejecucion-filtro-rubro"
                        label="Rubro"
                        value={filtroRubro}
                        onChange={cambiarFiltro}
                        options={opcionesFiltro}
                      />
                    </div>
                  </div>

                  {errorGastos && !gastos && (
                    <div className="py-10 text-center">
                      <p className="font-semibold text-[#1f2023]">No se pudieron cargar los gastos</p>
                      <p className="text-sm text-[#5b5f66] mt-1">{errorGastos}</p>
                      <button
                        type="button"
                        onClick={reintentar}
                        className="text-xs mt-2 text-[#a6192e] font-semibold underline cursor-pointer"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

                  {!errorGastos && !gastos && (
                    <p className="text-sm text-[#5b5f66] py-10 text-center" role="status">
                      Cargando gastos...
                    </p>
                  )}

                  {gastos && <GastosTabla gastos={gastos} mostrarRubro={filtroRubro === TODOS} />}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
