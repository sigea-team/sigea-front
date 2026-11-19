import { ScanLine } from 'lucide-react';
import { CODIGO_OTRO_EVENTO_MOCK, CODIGO_SIN_ACTIVIDAD_MOCK, INSCRITOS_MOCK } from './asistenciaMock';

/**
 * @file EscanerSimulado.jsx
 * @description Sustituto del lector con cámara para Storybook: cada botón simula la lectura de un QR.
 * @module features/asistencia/mocks/EscanerSimulado
 */

const LECTURAS = [
  { texto: 'QR de María (sin registrar)', codigo: INSCRITOS_MOCK[0].codigo },
  { texto: 'QR de Juan (ya registrado)', codigo: INSCRITOS_MOCK[1].codigo },
  { texto: 'QR de Andrés', codigo: INSCRITOS_MOCK[3].codigo },
  { texto: 'Inscrito al evento, no a la actividad', codigo: CODIGO_SIN_ACTIVIDAD_MOCK },
  { texto: 'QR de otro evento', codigo: CODIGO_OTRO_EVENTO_MOCK },
  { texto: 'QR desconocido', codigo: 'SIGEA-no-existe' },
];

/**
 * @param {{ onLectura: function(string): void }} props
 */
export default function EscanerSimulado({ onLectura }) {
  return (
    <div className="rounded-[12px] border border-dashed border-field-border p-3 space-y-2">
      <p className="text-[11px] font-semibold text-ink-600 flex items-center gap-1">
        <ScanLine className="w-3.5 h-3.5" aria-hidden="true" />
        Escáner simulado (Storybook)
      </p>
      <div className="grid gap-1.5">
        {LECTURAS.map((l) => (
          <button
            key={l.codigo}
            type="button"
            onClick={() => onLectura(l.codigo)}
            className="text-left text-xs px-2.5 py-1.5 rounded-[8px] border border-border bg-white hover:bg-surface-muted cursor-pointer"
          >
            {l.texto}
          </button>
        ))}
      </div>
    </div>
  );
}
