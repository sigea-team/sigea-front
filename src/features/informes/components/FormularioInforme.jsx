import { ChevronDown, Filter, LayoutList, RotateCcw, Search } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import {
  TODOS,
  buscarTipo,
  cambiarTipo,
  columnasElegidas,
  etiquetaEvento,
  ordenarEventos,
} from '../informeUtils';

/**
 * @file FormularioInforme.jsx
 * @description Parámetros del informe (HU-30, Criterio 1): tipo de información, filtros (evento, semestre, tipo de
 * evento, rango de fechas y tipo de actividad) y columnas. El rango de fechas indica a qué fecha se aplica en el tipo
 * elegido (por ejemplo, la fecha de inscripción o la del gasto).
 * @module features/informes/components/FormularioInforme
 */

/**
 * @param {Object} props
 * @param {Array} props.tipos - Catálogo de `GET /informes/tipos`.
 * @param {Array} [props.eventos] - Eventos para la lista (id, nombre, semestre).
 * @param {string[]} [props.semestres]
 * @param {Array<{ id: number, nombre: string }>} [props.tiposEvento]
 * @param {Object} props.filtros - Valores del formulario (ver `FILTROS_INICIALES`).
 * @param {function(Object): void} props.onCambiar
 * @param {function(): void} props.onGenerar
 * @param {function(): void} props.onLimpiar
 * @param {boolean} [props.generando]
 * @param {Object<string, string>} [props.errores]
 */
export default function FormularioInforme({
  tipos,
  eventos = [],
  semestres = [],
  tiposEvento = [],
  filtros,
  onCambiar,
  onGenerar,
  onLimpiar,
  generando = false,
  errores = {},
}) {
  const tipo = buscarTipo(tipos, filtros.tipo);
  const elegidas = columnasElegidas(filtros, tipo);
  const cambiar = (campo, valor) => onCambiar({ ...filtros, [campo]: valor });
  const desdeSelect = (valor) => (valor === TODOS ? '' : valor);

  const alternarColumna = (clave) => {
    const nuevas = elegidas.includes(clave) ? elegidas.filter((c) => c !== clave) : [...elegidas, clave];
    // Si quedan todas, se vuelve a «todas» (null) para no enviar la lista.
    cambiar('columnas', tipo && nuevas.length === tipo.columnas.length ? null : nuevas);
  };

  const enviar = (evento) => {
    evento.preventDefault();
    onGenerar();
  };

  return (
    <form onSubmit={enviar} className="space-y-5" aria-label="Parámetros del informe" noValidate>
      <fieldset className="space-y-3">
        <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">1</span>
          Tipo de información
        </legend>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5" role="radiogroup" aria-label="Tipo de información" aria-describedby={errores.tipo ? 'error-tipo' : undefined}>
          {tipos.map((t) => {
            const elegido = filtros.tipo === t.codigo;
            return (
              <label
                key={t.codigo}
                className={`flex cursor-pointer flex-col gap-1 rounded-[12px] border p-3 transition-colors focus-within:ring-2 focus-within:ring-brand-600 ${
                  elegido ? 'border-brand-600 bg-brand-100/50' : 'border-border bg-surface hover:bg-surface-muted'
                }`}
              >
                <span className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="tipo-informe"
                    value={t.codigo}
                    checked={elegido}
                    onChange={() => onCambiar(cambiarTipo(filtros, t))}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                  />
                  <span className={`text-sm font-semibold ${elegido ? 'text-brand-700' : 'text-ink-900'}`}>{t.titulo}</span>
                </span>
                <span className="pl-6 text-xs leading-relaxed text-ink-600">{t.descripcion}</span>
              </label>
            );
          })}
        </div>
        {errores.tipo && <p id="error-tipo" className="text-xs font-medium text-brand-700">{errores.tipo}</p>}
      </fieldset>

      <fieldset className="space-y-3 rounded-[16px] border border-border bg-surface p-4">
        <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-ink-900">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">2</span>
          <Filter className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Filtros
        </legend>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2">
            <Select
              id="informe-evento"
              label="Evento"
              value={filtros.eventoId ? String(filtros.eventoId) : TODOS}
              onChange={(e) => cambiar('eventoId', desdeSelect(e.target.value))}
              options={[
                { value: TODOS, label: 'Todos los eventos' },
                ...ordenarEventos(eventos).map((ev) => ({ value: String(ev.id), label: etiquetaEvento(ev) })),
              ]}
              placeholder="Seleccione un evento"
            />
          </div>
          <Select
            id="informe-semestre"
            label="Semestre"
            value={filtros.semestre || TODOS}
            onChange={(e) => cambiar('semestre', desdeSelect(e.target.value))}
            options={[{ value: TODOS, label: 'Todos los semestres' }, ...semestres.map((s) => ({ value: s, label: s }))]}
            placeholder="Seleccione un semestre"
          />
          <Select
            id="informe-tipo-evento"
            label="Tipo de evento"
            value={filtros.tipoEventoId ? String(filtros.tipoEventoId) : TODOS}
            onChange={(e) => cambiar('tipoEventoId', desdeSelect(e.target.value))}
            options={[
              { value: TODOS, label: 'Todos los tipos' },
              ...tiposEvento.map((t) => ({ value: String(t.id), label: t.nombre })),
            ]}
            placeholder="Seleccione un tipo"
          />
          <Input
            id="informe-fecha-desde"
            label="Fecha desde"
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => cambiar('fechaDesde', e.target.value)}
            max={filtros.fechaHasta || undefined}
            error={errores.fechas ? ' ' : undefined}
            aria-describedby="ayuda-fechas"
          />
          <Input
            id="informe-fecha-hasta"
            label="Fecha hasta"
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => cambiar('fechaHasta', e.target.value)}
            min={filtros.fechaDesde || undefined}
            error={errores.fechas ? ' ' : undefined}
            aria-describedby="ayuda-fechas"
          />
          <div className="md:col-span-2">
            {tipo?.admiteTipoActividad ? (
              <Input
                id="informe-tipo-actividad"
                label="Tipo de actividad"
                placeholder="Ej.: Taller, Conferencia"
                value={filtros.tipoActividad}
                onChange={(e) => cambiar('tipoActividad', e.target.value)}
                helperText="Nombre exacto del tipo; no distingue mayúsculas."
                maxLength={100}
              />
            ) : (
              <div className="flex h-full items-end pb-1">
                <p className="text-xs text-ink-600">
                  {tipo ? 'Este tipo de información no se filtra por tipo de actividad.' : 'Elija un tipo de información para ver todos los filtros.'}
                </p>
              </div>
            )}
          </div>
        </div>
        <p id="ayuda-fechas" className={`text-xs ${errores.fechas ? 'font-medium text-brand-700' : 'text-ink-600'}`}>
          {errores.fechas
            || (tipo
              ? `El rango de fechas se aplica a: ${tipo.campoFecha.charAt(0).toLowerCase()}${tipo.campoFecha.slice(1)}. Ambas fechas se incluyen.`
              : 'El rango de fechas es opcional; ambas fechas se incluyen.')}
        </p>
      </fieldset>

      {tipo && (
        <details className="group rounded-[16px] border border-border bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-[16px]">
            <span className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">3</span>
              <LayoutList className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Columnas del informe
              <span className="font-normal text-ink-600">({elegidas.length} de {tipo.columnas.length})</span>
            </span>
            <ChevronDown className="h-4 w-4 text-ink-600 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="space-y-3 border-t border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-ink-600">Las columnas elegidas salen en la vista previa, el PDF y el Excel, en este orden.</p>
              <button
                type="button"
                onClick={() => cambiar('columnas', null)}
                disabled={elegidas.length === tipo.columnas.length}
                className="text-xs font-semibold text-brand-600 hover:underline disabled:cursor-default disabled:text-ink-300 disabled:no-underline cursor-pointer"
              >
                Elegir todas
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {tipo.columnas.map((col) => (
                <label key={col.clave} className="flex cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-sm text-ink-900 hover:bg-surface-muted">
                  <input
                    type="checkbox"
                    checked={elegidas.includes(col.clave)}
                    onChange={() => alternarColumna(col.clave)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {col.titulo}
                </label>
              ))}
            </div>
            {errores.columnas && <p className="text-xs font-medium text-brand-700" role="alert">{errores.columnas}</p>}
          </div>
        </details>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={generando}>
          <Search className="h-4 w-4" aria-hidden="true" />
          Generar informe
        </Button>
        <Button variant="outline" onClick={onLimpiar} disabled={generando}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Limpiar filtros
        </Button>
      </div>
    </form>
  );
}
