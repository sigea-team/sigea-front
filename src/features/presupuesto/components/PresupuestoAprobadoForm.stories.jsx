import PresupuestoAprobadoForm from './PresupuestoAprobadoForm';

export default {
  title: 'Features/Presupuesto/PresupuestoAprobadoForm',
  component: PresupuestoAprobadoForm,
  tags: ['autodocs'],
};

/**
 * Criterio 1 y Criterio 3: Formulario para registro inicial con preliminar de referencia.
 * Permite probar el Criterio 3 intentando guardar sin adjuntar el archivo de soporte.
 */
export const RegistroInicial = {
  args: {
    totalPreliminar: 15000000,
    esActualizacion: false,
    onSubmit: async (payload) => {
      alert(`Guardado con éxito: ${JSON.stringify(payload)}`);
    },
    onCancelar: () => {},
  },
};

/**
 * Criterio 2: Modo actualización. Solicita motivo de cambio y permite subir nuevo soporte.
 */
export const ActualizacionConVersionPrevia = {
  args: {
    totalPreliminar: 15000000,
    aprobadoVigente: {
      valorTotalAprobado: 15000000,
      resolucionOActa: 'Resolución Decanal No. 042-2026',
      evidenciaNombre: 'Resolucion_042_Aprobacion.pdf',
    },
    esActualizacion: true,
    onSubmit: async (payload) => {
      alert(`Actualizado con éxito: ${JSON.stringify(payload)}`);
    },
    onCancelar: () => {},
  },
};
