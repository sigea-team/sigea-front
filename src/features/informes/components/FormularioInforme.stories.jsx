import { useState } from 'react';
import FormularioInforme from './FormularioInforme';
import tiposInforme from '../mocks/tiposInforme.json';
import { EVENTOS_MOCK } from '../mocks/informesMock';
import { FILTROS_INICIALES } from '../informeUtils';

export default {
  title: 'Informes/FormularioInforme',
  component: FormularioInforme,
  tags: ['autodocs'],
};

/** El formulario guarda su estado en la historia para poder probarlo. */
function ConEstado({ filtrosIniciales, errores, generando }) {
  const [filtros, setFiltros] = useState(filtrosIniciales);
  return (
    <div className="max-w-7xl p-6">
      <FormularioInforme
        tipos={tiposInforme}
        eventos={EVENTOS_MOCK}
        semestres={['2026-2', '2026-1']}
        tiposEvento={[{ id: 1, nombre: 'Congreso' }, { id: 2, nombre: 'Seminario' }]}
        filtros={filtros}
        onCambiar={setFiltros}
        onGenerar={() => {}}
        onLimpiar={() => setFiltros({ ...FILTROS_INICIALES, tipo: filtros.tipo })}
        generando={generando}
        errores={errores}
      />
    </div>
  );
}

/** Criterio 1: sin tipo elegido. */
export const SinTipo = {
  render: () => <ConEstado filtrosIniciales={FILTROS_INICIALES} />,
};

/** Actividades: admite el filtro por tipo de actividad; el rango se aplica a la fecha de la actividad. */
export const ActividadesConFiltros = {
  render: () => (
    <ConEstado
      filtrosIniciales={{ ...FILTROS_INICIALES, tipo: 'ACTIVIDADES', eventoId: '7', fechaDesde: '2026-11-10', fechaHasta: '2026-11-12', tipoActividad: 'Taller' }}
    />
  ),
};

/** Columnas elegidas (3 de 10). */
export const ColumnasElegidas = {
  render: () => (
    <ConEstado filtrosIniciales={{ ...FILTROS_INICIALES, tipo: 'INSCRIPCIONES', columnas: ['participante', 'correo', 'categoria'] }} />
  ),
};

/** Errores de validación: sin tipo y rango invertido. */
export const ConErrores = {
  render: () => (
    <ConEstado
      filtrosIniciales={{ ...FILTROS_INICIALES, fechaDesde: '2026-12-01', fechaHasta: '2026-11-01' }}
      errores={{ tipo: 'Seleccione el tipo de información del informe.', fechas: 'La fecha inicial no puede ser posterior a la fecha final.' }}
    />
  ),
};

/** Mientras el backend construye el informe. */
export const Generando = {
  render: () => <ConEstado filtrosIniciales={{ ...FILTROS_INICIALES, tipo: 'GASTOS' }} generando />,
};
