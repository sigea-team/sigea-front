import { Search, RotateCcw } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

/** Valor interno del selector para "sin filtro por tipo de operación". */
const TODOS = 'TODOS';

/**
 * @file AuditoriaFiltros.jsx
 * @description Barra de filtros del log de auditoría (HU-03, Criterio 2).
 * Permite filtrar por usuario (correo), tipo de operación y rango de fechas.
 * Es un componente controlado: el estado de los filtros vive en la página.
 * @module features/auditoria/components/AuditoriaFiltros
 */

/**
 * @typedef {Object} ValoresFiltro
 * @property {string} correo
 * @property {string} accion - Código del tipo de operación, o '' para todos.
 * @property {string} desde  - yyyy-MM-dd o ''.
 * @property {string} hasta  - yyyy-MM-dd o ''.
 */

/**
 * @param {Object} props
 * @param {ValoresFiltro} props.valores
 * @param {Array<{codigo: string, descripcion: string}>} [props.tiposOperacion=[]]
 * @param {function(string, string): void} props.onCambiar - (campo, valor)
 * @param {function(): void} props.onAplicar
 * @param {function(): void} props.onLimpiar
 * @param {string|null} [props.errorFechas] - Error de validación del rango de fechas.
 * @param {boolean} [props.cargando=false]
 */
export default function AuditoriaFiltros({
  valores,
  tiposOperacion = [],
  onCambiar,
  onAplicar,
  onLimpiar,
  errorFechas = null,
  cargando = false,
}) {
  const opcionesTipo = [
    { value: TODOS, label: 'Todos los tipos de operación' },
    ...tiposOperacion.map((t) => ({ value: t.codigo, label: t.descripcion })),
  ];

  const hayFiltros = Boolean(valores.correo || valores.accion || valores.desde || valores.hasta);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAplicar();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8] p-5 space-y-4"
      aria-label="Filtros del log de auditoría"
    >
      <div className="grid grid-cols-4 gap-4 items-start">
        <Input
          id="filtro-correo"
          label="Usuario"
          value={valores.correo}
          onChange={(e) => onCambiar('correo', e.target.value)}
          placeholder="Correo o parte del correo"
          rightElement={<Search className="w-4 h-4" />}
        />
        <Select
          id="filtro-accion"
          label="Tipo de operación"
          value={valores.accion || TODOS}
          onChange={(e) => onCambiar('accion', e.target.value === TODOS ? '' : e.target.value)}
          options={opcionesTipo}
          placeholder="Tipo de operación"
        />
        <Input
          id="filtro-desde"
          label="Desde"
          type="date"
          value={valores.desde}
          onChange={(e) => onCambiar('desde', e.target.value)}
          max={valores.hasta || undefined}
        />
        <Input
          id="filtro-hasta"
          label="Hasta"
          type="date"
          value={valores.hasta}
          onChange={(e) => onCambiar('hasta', e.target.value)}
          min={valores.desde || undefined}
          error={errorFechas}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onLimpiar}
          disabled={!hayFiltros || cargando}
          className="h-10 px-4"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Limpiar filtros</span>
        </Button>
        <Button type="submit" variant="primary" disabled={cargando} className="h-10 px-5">
          <Search className="w-4 h-4" />
          <span>Aplicar filtros</span>
        </Button>
      </div>
    </form>
  );
}
