import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { memoriaHistoricaService } from '../../../api/memoriaHistoricaService';
import { MOTIVO_MAXIMO, interpretarErrorMemoria, validarEliminacion } from '../memoriaUtils';

/**
 * @file EliminacionHistoricaModal.jsx
 * @description Eliminación con autorización especial de un evento de la memoria histórica (HU-28, Criterio 3).
 * Solo se ofrece a quien tiene el permiso MEMORIA_HISTORICA_ELIMINAR (ser administrador no basta). Exige escribir el
 * nombre exacto del evento y un motivo; el backend lo registra en la auditoría.
 * @module features/memoria/components/EliminacionHistoricaModal
 */

/**
 * @param {Object} props
 * @param {{ id: number, nombre: string }} props.evento
 * @param {typeof memoriaHistoricaService} [props.api]
 * @param {function(): void} props.onClose
 * @param {function(string): void} props.onEliminado - Recibe el mensaje del backend.
 */
export default function EliminacionHistoricaModal({ evento, api = memoriaHistoricaService, onClose, onEliminado }) {
  const [form, setForm] = useState({ nombreEvento: '', motivo: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => {
    const valor = e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((x) => ({ ...x, [campo]: undefined }));
  };

  const eliminar = async () => {
    const nuevos = validarEliminacion(form, evento.nombre);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await api.eliminarConAutorizacion(evento.id, {
        nombreEvento: form.nombreEvento.trim(),
        motivo: form.motivo.trim(),
      });
      onEliminado(respuesta?.mensaje || 'El evento y su memoria histórica fueron eliminados.');
    } catch (err) {
      const info = interpretarErrorMemoria(err);
      if (info.codigo === 'CONFIRMACION_INVALIDA') setErrores({ nombreEvento: info.mensaje });
      else if (info.campos.nombreEvento || info.campos.motivo) setErrores(info.campos);
      else setError(info);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalShell
      titulo="Eliminar de la memoria histórica"
      subtitulo={evento.nombre}
      icono={ShieldAlert}
      onClose={onClose}
      ancho="max-w-xl"
      tituloId="eliminacion-historica-titulo"
      pie={
        <>
          <Button type="button" variant="secondary" onClick={onClose} className="h-10 px-4 text-sm" disabled={enviando}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={eliminar} loading={enviando} className="h-10 px-4 text-sm">
            Eliminar definitivamente
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 space-y-1">
          <p className="font-semibold">Esta acción no se puede deshacer</p>
          <p>
            Se eliminará el evento con toda su información y su memoria histórica. Quedarán registrados en la auditoría
            tu usuario, el motivo y los indicadores del evento.
          </p>
        </div>
        <Input
          id="eliminacion-nombre"
          label={`Escribe el nombre del evento: «${evento.nombre}»`}
          value={form.nombreEvento}
          onChange={cambiar('nombreEvento')}
          error={errores.nombreEvento}
          autoComplete="off"
          required
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="eliminacion-motivo" className="text-sm font-medium text-ink-900 flex items-center gap-1">
            Motivo de la eliminación <span className="text-brand-600 font-bold">*</span>
          </label>
          <textarea
            id="eliminacion-motivo"
            rows={3}
            maxLength={MOTIVO_MAXIMO}
            value={form.motivo}
            onChange={cambiar('motivo')}
            placeholder="Por ejemplo: evento de prueba creado por error durante la capacitación."
            className={`w-full px-3.5 py-2.5 rounded-[8px] bg-surface text-sm text-ink-900 placeholder-ink-300 border outline-none resize-y ${
              errores.motivo
                ? 'border-brand-600 focus:ring-1 focus:ring-brand-700'
                : 'border-field-border hover:border-ink-300 focus:border-brand-600 focus:ring-1 focus:ring-brand-600'
            }`}
            aria-invalid={Boolean(errores.motivo)}
          />
          {errores.motivo && <p className="text-xs text-brand-700" role="alert">{errores.motivo}</p>}
        </div>
        {error && (
          <div className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 space-y-1" role="alert">
            <p className="font-semibold">{error.titulo}</p>
            <p>{error.mensaje}</p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
