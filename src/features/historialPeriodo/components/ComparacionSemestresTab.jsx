import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  AlertCircle,
  Info,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { periodoAcademicoService } from '../../../api/periodoAcademicoService';
import { tipoEventoService } from '../../../api/tipoEventoService';
import {
  configuracionTendencia,
  formatearDiferencia,
  formatearNumero,
  formatearPorcentaje,
  interpretarError,
  validarSemestresComparacion,
} from '../historialPeriodoUtils';

/**
 * @file ComparacionSemestresTab.jsx
 * @description Pestaña de comparación de indicadores entre dos semestres académicos (HU-27, Criterio 5).
 * Permite seleccionar dos periodos, aplicar filtros complementarios, confirmar la comparación
 * y visualizar la evolución cuantitativa, porcentual y tendencial de cada indicador.
 * @module features/historialPeriodo/components/ComparacionSemestresTab
 */

export default function ComparacionSemestresTab({ api = periodoAcademicoService }) {
  const [semestres, setSemestres] = useState([]);
  const [tiposEvento, setTiposEvento] = useState([]);

  const [semestreA, setSemestreA] = useState('');
  const [semestreB, setSemestreB] = useState('');
  const [tipoEventoId, setTipoEventoId] = useState('');
  const [tipoActividad, setTipoActividad] = useState('');

  const [cargando, setCargando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState(null);
  const [errorApi, setErrorApi] = useState(null);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([api.listarSemestres(), tipoEventoService.listar()])
      .then(([listaSemestres, listaTipos]) => {
        if (!activo) return;
        if (Array.isArray(listaSemestres)) {
          setSemestres(listaSemestres);
          if (listaSemestres.length >= 2) {
            setSemestreA(listaSemestres[1]); // Semestre anterior
            setSemestreB(listaSemestres[0]); // Semestre más reciente
          } else if (listaSemestres.length === 1) {
            setSemestreA(listaSemestres[0]);
          }
        }
        if (Array.isArray(listaTipos)) {
          setTiposEvento(listaTipos);
        }
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  const handleComparar = async (e) => {
    if (e) e.preventDefault();
    const errorVal = validarSemestresComparacion(semestreA, semestreB);
    if (errorVal) {
      setErrorValidacion(errorVal);
      return;
    }
    setErrorValidacion(null);
    setErrorApi(null);
    setCargando(true);

    try {
      const data = await api.compararSemestres(semestreA, semestreB, {
        tipoEventoId: tipoEventoId ? Number(tipoEventoId) : undefined,
        tipoActividad: tipoActividad.trim() || undefined,
      });
      setResultado(data);
    } catch (err) {
      const { mensaje } = interpretarError(err);
      setErrorApi(mensaje || 'No fue posible realizar la comparación entre los semestres seleccionados.');
      setResultado(null);
    } finally {
      setCargando(false);
    }
  };

  const opcionesSemestre = [
    { value: '', label: 'Seleccione un semestre' },
    ...semestres.map((s) => ({ value: s, label: s })),
  ];

  const opcionesTipoEvento = [
    { value: '', label: 'Todos los tipos de evento' },
    ...tiposEvento.map((t) => ({ value: String(t.id), label: t.nombre })),
  ];

  const renderIconoTendencia = (iconoNombre) => {
    switch (iconoNombre) {
      case 'TrendingUp':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
      case 'TrendingDown':
        return <TrendingDown className="w-3.5 h-3.5 text-rose-600" />;
      case 'Minus':
        return <Minus className="w-3.5 h-3.5 text-ink-600" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario de selección y confirmación de comparación (Criterio 5) */}
      <form
        onSubmit={handleComparar}
        className="bg-surface border border-border rounded-xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <GitCompare className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-ink-900 uppercase tracking-wider">
            Comparar dos semestres académicos (Criterio 5)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Select
              id="semestre-base-a"
              label="Semestre Base (A)"
              value={semestreA}
              onChange={(e) => setSemestreA(e.target.value)}
              options={opcionesSemestre}
              required
            />
          </div>

          <div>
            <Select
              id="semestre-comparar-b"
              label="Semestre a Comparar (B)"
              value={semestreB}
              onChange={(e) => setSemestreB(e.target.value)}
              options={opcionesSemestre}
              required
            />
          </div>

          <div>
            <Select
              id="filtro-comp-tipo-evento"
              label="Tipo de evento (opcional)"
              value={tipoEventoId}
              onChange={(e) => setTipoEventoId(e.target.value)}
              options={opcionesTipoEvento}
            />
          </div>

          <div>
            <Input
              id="filtro-comp-tipo-actividad"
              label="Tipo de actividad (opcional)"
              placeholder="Ej: Taller, Conferencia..."
              value={tipoActividad}
              onChange={(e) => setTipoActividad(e.target.value)}
            />
          </div>
        </div>

        {errorValidacion && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorValidacion}</span>
          </div>
        )}

        {errorApi && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg bg-brand-100/50 border border-brand-600/20 text-brand-700 text-xs"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorApi}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" loading={cargando} className="text-xs h-10 px-5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar comparación</span>
          </Button>
        </div>
      </form>

      {/* Resultados de la comparación */}
      {resultado && (
        <div className="space-y-6">
          {/* Encabezado comparativo */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Resultado de comparación
              </span>
              <h3 className="text-xl font-serif-title font-semibold text-ink-900 mt-0.5">
                Semestre {resultado.semestreA} <span className="text-ink-300 font-sans mx-1">vs</span> Semestre{' '}
                {resultado.semestreB}
              </h3>
              <p className="text-xs text-ink-600 mt-1">
                La variación y diferencia reflejan el cambio del Semestre {resultado.semestreA} respecto al
                Semestre {resultado.semestreB}.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-brand-100/60 text-brand-700 text-xs font-semibold">
                Base: {resultado.semestreA}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-100/60 text-emerald-800 text-xs font-semibold">
                Comparado: {resultado.semestreB}
              </span>
            </div>
          </div>

          {/* Mensaje informativo si alguno de los semestres no tiene información */}
          {resultado.mensaje && (
            <div
              className="flex items-start gap-2.5 p-4 rounded-xl bg-surface-muted border border-border text-ink-900 text-xs"
              role="status"
            >
              <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span>{resultado.mensaje}</span>
            </div>
          )}

          {/* Tabla Comparativa de Indicadores */}
          {resultado.comparativo && resultado.comparativo.length > 0 && (
            <div className="bg-surface border border-border rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h4 className="text-sm font-semibold text-ink-900 uppercase tracking-wider">
                  Matriz comparativa de indicadores
                </h4>
                <span className="text-xs text-ink-600">
                  {resultado.comparativo.length} indicadores analizados
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted text-ink-600 border-b border-border uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="p-3">Indicador</th>
                      <th className="p-3 text-right">Semestre {resultado.semestreA}</th>
                      <th className="p-3 text-right">Semestre {resultado.semestreB}</th>
                      <th className="p-3 text-right">Diferencia (B - A)</th>
                      <th className="p-3 text-right">Variación %</th>
                      <th className="p-3 text-center">Tendencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {resultado.comparativo.map((item) => {
                      const tendenciaConf = configuracionTendencia(item.tendencia);
                      const esPorcentaje = item.codigo === 'tasaAprobacionPropuestas';
                      return (
                        <tr key={item.codigo} className="hover:bg-surface-muted/50 transition-colors">
                          <td className="p-3 font-semibold text-ink-900">{item.nombre}</td>
                          <td className="p-3 text-right text-ink-600 font-mono">
                            {esPorcentaje
                              ? formatearPorcentaje(item.valorA)
                              : formatearNumero(item.valorA)}
                          </td>
                          <td className="p-3 text-right font-bold text-ink-900 font-mono">
                            {esPorcentaje
                              ? formatearPorcentaje(item.valorB)
                              : formatearNumero(item.valorB)}
                          </td>
                          <td className="p-3 text-right font-semibold font-mono">
                            <span
                              className={
                                item.diferencia > 0
                                  ? 'text-emerald-700'
                                  : item.diferencia < 0
                                  ? 'text-rose-700'
                                  : 'text-ink-600'
                              }
                            >
                              {formatearDiferencia(item.diferencia)}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono">
                            <span
                              className={
                                item.variacionPorcentual > 0
                                  ? 'text-emerald-700 font-semibold'
                                  : item.variacionPorcentual < 0
                                  ? 'text-rose-700 font-semibold'
                                  : 'text-ink-600'
                              }
                            >
                              {item.variacionPorcentual !== null && item.variacionPorcentual !== undefined
                                ? `${item.variacionPorcentual > 0 ? '+' : ''}${formatearNumero(
                                    item.variacionPorcentual,
                                    2
                                  )}%`
                                : '—'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${tendenciaConf.badgeClass}`}
                            >
                              {renderIconoTendencia(tendenciaConf.icono)}
                              <span>{tendenciaConf.label}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tarjetas comparativas lado a lado */}
          {resultado.periodoA && resultado.periodoB && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tarjeta Semestre A */}
              <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h5 className="font-serif-title font-semibold text-base text-ink-900">
                    Semestre {resultado.semestreA} (Base)
                  </h5>
                  <span className="text-xs text-ink-600 font-medium">
                    {resultado.periodoA.hayInformacion ? 'Con información' : 'Sin datos'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-muted border border-border">
                    <span className="text-ink-600 block text-[11px]">Eventos</span>
                    <strong className="text-lg text-ink-900 block font-serif-title">
                      {formatearNumero(resultado.periodoA.totalEventos)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-muted border border-border">
                    <span className="text-ink-600 block text-[11px]">Actividades</span>
                    <strong className="text-lg text-ink-900 block font-serif-title">
                      {formatearNumero(resultado.periodoA.totalActividades)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-muted border border-border">
                    <span className="text-ink-600 block text-[11px]">Inscripciones</span>
                    <strong className="text-lg text-ink-900 block font-serif-title">
                      {formatearNumero(resultado.periodoA.totalInscripciones)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-muted border border-border">
                    <span className="text-ink-600 block text-[11px]">Participantes Únicos</span>
                    <strong className="text-lg text-ink-900 block font-serif-title">
                      {formatearNumero(resultado.periodoA.participantesUnicos)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Tarjeta Semestre B */}
              <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h5 className="font-serif-title font-semibold text-base text-ink-900">
                    Semestre {resultado.semestreB} (Comparado)
                  </h5>
                  <span className="text-xs text-ink-600 font-medium">
                    {resultado.periodoB.hayInformacion ? 'Con información' : 'Sin datos'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-muted border border-border">
                    <span className="text-ink-600 block text-[11px]">Eventos</span>
                    <strong className="text-lg text-ink-900 block font-serif-title">
                      {formatearNumero(resultado.periodoB.totalEventos)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-muted border border-border">
                    <span className="text-ink-600 block text-[11px]">Actividades</span>
                    <strong className="text-lg text-ink-900 block font-serif-title">
                      {formatearNumero(resultado.periodoB.totalActividades)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-muted border border-border">
                    <span className="text-ink-600 block text-[11px]">Inscripciones</span>
                    <strong className="text-lg text-ink-900 block font-serif-title">
                      {formatearNumero(resultado.periodoB.totalInscripciones)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-muted border border-border">
                    <span className="text-ink-600 block text-[11px]">Participantes Únicos</span>
                    <strong className="text-lg text-ink-900 block font-serif-title">
                      {formatearNumero(resultado.periodoB.participantesUnicos)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
