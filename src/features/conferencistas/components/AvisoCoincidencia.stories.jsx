import AvisoCoincidencia from './AvisoCoincidencia';

export default {
  title: 'Features/Conferencistas/AvisoCoincidencia',
  component: AvisoCoincidencia,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-3xl p-6 bg-white"><Story /></div>],
};

const base = {
  personaId: 15, nombreCompleto: 'Carlos Andrés Rojas Duarte', tipoDocumento: 'CC', numeroDocumento: '88234567',
  correo: 'carlos.rojas@uis.edu.co', coincidePor: 'documento', tienePerfil: true, eventosPrevios: 1,
};

/** Criterio 3: existe y se puede asociar al evento actual. */
export const PuedeAsociarse = { args: { coincidencia: { ...base, yaAsociadoAlEvento: false }, onAsociar: () => {} } };

/** Ya es conferencista de este evento: no se ofrece asociarlo otra vez. */
export const YaAsociado = { args: { coincidencia: { ...base, yaAsociadoAlEvento: true }, onAsociar: () => {} } };
