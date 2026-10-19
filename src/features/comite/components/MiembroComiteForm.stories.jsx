import MiembroComiteForm from './MiembroComiteForm';

export default {
  title: 'Features/Comite/MiembroComiteForm',
  component: MiembroComiteForm,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

const errorApi = (status, message, codigo) => {
  const err = new Error(message);
  err.response = { status, data: { status, message, codigo } };
  return err;
};

/** Agrega sin errores (el formulario se limpia al terminar). */
export const Normal = {
  args: { onAgregar: async (datos) => new Promise((r) => setTimeout(() => r(datos), 500)) },
};

/** Criterio 2: la persona ya es miembro vigente; el error aparece junto al documento. */
export const MiembroDuplicado = {
  args: {
    onAgregar: async () => {
      throw errorApi(
        409,
        "Ana María Pérez Gómez ya es miembro vigente del comité organizador del evento 'Congreso 2026'.",
        'MIEMBRO_COMITE_DUPLICADO'
      );
    },
  },
};

/** El documento no corresponde a ninguna persona registrada. */
export const PersonaNoRegistrada = {
  args: {
    onAgregar: async () => {
      throw errorApi(404, 'No se encontró una persona registrada con el documento: 123', 'RECURSO_NO_ENCONTRADO');
    },
  },
};

/** El evento cambió de estado mientras se llenaba el formulario. */
export const EventoYaNoModificable = {
  args: {
    onAgregar: async () => {
      throw errorApi(
        409,
        "El comité organizador del evento 'Congreso 2026' ya no puede modificarse (estado actual: en_ejecucion).",
        'OPERACION_NO_PERMITIDA'
      );
    },
  },
};

export const Deshabilitado = {
  args: { onAgregar: async () => {}, disabled: true },
};
