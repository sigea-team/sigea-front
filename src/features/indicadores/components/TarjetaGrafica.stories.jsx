import TarjetaGrafica from './TarjetaGrafica';
import { crearIndicadoresApiMock } from '../mocks/indicadoresMock';

const api = crearIndicadoresApiMock({ ms: 0 });

/** Carga las series del evento simulado antes de renderizar la historia. */
const conSerie = (eventoId, codigo) => async () => {
  const datos = await api.generarIndicadores(eventoId);
  return { serie: datos.series.find((s) => s.codigo === codigo) };
};

export default {
  title: 'Features/Indicadores/TarjetaGrafica',
  component: TarjetaGrafica,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-3xl p-6 bg-surface-page"><Story /></div>],
  render: (args, { loaded }) => <TarjetaGrafica {...args} serie={loaded.serie} />,
};

/** Barras agrupadas: inscritos y asistentes por actividad, con la tasa en el detalle. */
export const AsistenciaPorActividad = { loaders: [conSerie(7, 'ASISTENCIA_POR_ACTIVIDAD')] };

/** Línea del total acumulado de inscripciones. */
export const EvolucionInscripciones = { loaders: [conSerie(7, 'INSCRIPCIONES_POR_FECHA')] };

/** Un todo dividido en partes: inscritos por categoría. */
export const InscritosPorCategoria = { loaders: [conSerie(7, 'INSCRIPCIONES_POR_CATEGORIA')] };

/** Propuestas por estado. */
export const PropuestasPorEstado = { loaders: [conSerie(7, 'PROPUESTAS_POR_ESTADO')] };

/** Satisfacción por encuesta (escala fija de 0 a 100 %); una encuesta sin respuestas muestra «Sin dato». */
export const SatisfaccionPorEncuesta = { loaders: [conSerie(7, 'SATISFACCION_POR_ENCUESTA')] };

/** Presupuesto proyectado y ejecutado por rubro. */
export const PresupuestoPorRubro = { loaders: [conSerie(7, 'PRESUPUESTO_POR_RUBRO')] };

/** Criterio 2: serie sin datos, con el aviso del backend. */
export const SinDatos = { loaders: [conSerie(8, 'ASISTENCIA_POR_ACTIVIDAD')] };
