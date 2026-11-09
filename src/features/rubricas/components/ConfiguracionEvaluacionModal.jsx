import { useState } from 'react';
import PropTypes from 'prop-types';
import { ListChecks, Users } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import RubricaEditor from './RubricaEditor';
import ComiteEvaluadorPanel from '../../comiteEvaluador/components/ComiteEvaluadorPanel';

/**
 * @file ConfiguracionEvaluacionModal.jsx
 * @description Configuración de la evaluación de una convocatoria (HU-15): la rúbrica con sus criterios,
 * pesos y escalas (RF22) y el comité evaluador con sus integrantes (RF23).
 * El padre debe montarlo con una `key` distinta por convocatoria.
 * @module features/rubricas/components/ConfiguracionEvaluacionModal
 */

const PESTANAS = [
  { id: 'rubrica', etiqueta: 'Rúbrica', icono: ListChecks },
  { id: 'comite', etiqueta: 'Comité evaluador', icono: Users },
];

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {{ id: number, titulo: string, eventoNombre?: string }} props.convocatoria
 * @param {typeof import('../../../api/rubricaService').rubricaService} props.apiRubricas
 * @param {typeof import('../../../api/comiteEvaluadorService').comiteEvaluadorService} props.apiComite
 * @param {'rubrica'|'comite'} [props.pestanaInicial='rubrica']
 * @param {function(): void} props.onClose
 */
export default function ConfiguracionEvaluacionModal({
  isOpen,
  convocatoria,
  apiRubricas,
  apiComite,
  pestanaInicial = 'rubrica',
  onClose,
}) {
  const [pestana, setPestana] = useState(pestanaInicial);

  if (!isOpen || !convocatoria) return null;

  // Navegación con flechas entre pestañas (patrón ARIA de tabs)
  const moverConTeclado = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const actual = PESTANAS.findIndex((p) => p.id === pestana);
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const siguiente = PESTANAS[(actual + delta + PESTANAS.length) % PESTANAS.length];
    setPestana(siguiente.id);
    document.getElementById(`pestana-${siguiente.id}`)?.focus();
  };

  return (
    <ModalShell
      titulo="Configurar evaluación"
      subtitulo={`${convocatoria.titulo}${convocatoria.eventoNombre ? ` · ${convocatoria.eventoNombre}` : ''}`}
      icono={ListChecks}
      onClose={onClose}
      ancho="max-w-4xl"
      tituloId="configuracion-evaluacion-titulo"
      pie={
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-5">
        <div role="tablist" aria-label="Configuración de la evaluación" className="flex gap-1 border-b border-border">
          {PESTANAS.map(({ id, etiqueta, icono: Icono }) => {
            const activa = pestana === id;
            return (
              <button
                key={id}
                id={`pestana-${id}`}
                type="button"
                role="tab"
                aria-selected={activa}
                aria-controls={`panel-${id}`}
                tabIndex={activa ? 0 : -1}
                onClick={() => setPestana(id)}
                onKeyDown={moverConTeclado}
                className={`-mb-px inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-t-[8px] ${
                  activa
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-ink-600 hover:text-ink-900'
                }`}
              >
                <Icono className="w-4 h-4" />
                {etiqueta}
              </button>
            );
          })}
        </div>

        {/* Ambos paneles quedan montados para no perder lo escrito al cambiar de pestaña */}
        <div id="panel-rubrica" role="tabpanel" aria-labelledby="pestana-rubrica" hidden={pestana !== 'rubrica'}>
          <RubricaEditor convocatoriaId={convocatoria.id} api={apiRubricas} />
        </div>
        <div id="panel-comite" role="tabpanel" aria-labelledby="pestana-comite" hidden={pestana !== 'comite'}>
          <ComiteEvaluadorPanel convocatoriaId={convocatoria.id} api={apiComite} />
        </div>
      </div>
    </ModalShell>
  );
}

ConfiguracionEvaluacionModal.propTypes = {
  isOpen: PropTypes.bool,
  convocatoria: PropTypes.shape({
    id: PropTypes.number.isRequired,
    titulo: PropTypes.string,
    eventoNombre: PropTypes.string,
  }),
  apiRubricas: PropTypes.object.isRequired,
  apiComite: PropTypes.object.isRequired,
  pestanaInicial: PropTypes.oneOf(['rubrica', 'comite']),
  onClose: PropTypes.func.isRequired,
};
