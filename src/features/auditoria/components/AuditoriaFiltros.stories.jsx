import { useState } from 'react';
import AuditoriaFiltros from './AuditoriaFiltros';
import { TIPOS_OPERACION_MOCK } from '../mockAuditoria';

const VACIOS = { correo: '', accion: '', desde: '', hasta: '' };

function FiltrosInteractivos({ iniciales = VACIOS, errorFechas = null }) {
  const [valores, setValores] = useState(iniciales);
  return (
    <div className="p-8 bg-white">
      <AuditoriaFiltros
        valores={valores}
        tiposOperacion={TIPOS_OPERACION_MOCK}
        onCambiar={(campo, valor) => setValores((v) => ({ ...v, [campo]: valor }))}
        onAplicar={() => alert(`Aplicar: ${JSON.stringify(valores)}`)}
        onLimpiar={() => setValores(VACIOS)}
        errorFechas={errorFechas}
      />
    </div>
  );
}

export default {
  title: 'Features/Auditoria/AuditoriaFiltros',
  component: AuditoriaFiltros,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export const Vacios = {
  render: () => <FiltrosInteractivos />,
};

export const ConFiltrosAplicados = {
  render: () => (
    <FiltrosInteractivos
      iniciales={{ correo: 'admin@', accion: 'ROL_ACTUALIZADO', desde: '2026-09-01', hasta: '2026-09-30' }}
    />
  ),
};

export const RangoDeFechasInvalido = {
  render: () => (
    <FiltrosInteractivos
      iniciales={{ correo: '', accion: '', desde: '2026-09-30', hasta: '2026-09-01' }}
      errorFechas='La fecha "Hasta" no puede ser anterior a la fecha "Desde".'
    />
  ),
};
