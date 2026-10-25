import { useState } from 'react';
import { Link2, UserRound } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import TrayectoriaFields from './TrayectoriaFields';
import {
  LIMITES_CONFERENCISTA,
  TIPOS_PARTICIPACION,
  aAsociarRequest,
  formularioVacio,
  interpretarErrorConferencista,
  validarConferencista,
} from '../conferencistaUtils';

/**
 * @file AsociarConferencistaPanel.jsx
 * @description Asocia al evento a una persona que ya existe en SIGEA (HU-12, Criterio 3), sin volver a
 * registrar sus datos. Si la persona todavía no tiene trayectoria (por ejemplo, un participante que se
 * registró en el sistema), pide la biografía antes de asociarla.
 * @module features/conferencistas/components/AsociarConferencistaPanel
 */

/**
 * @param {Object} props
 * @param {Object} props.coincidencia - CoincidenciaConferencistaResponse de la persona existente.
 * @param {Object} [props.formInicial] - Lo que ya se había escrito en el registro (participación y trayectoria).
 * @param {number} props.eventoId
 * @param {typeof import('../../../api/conferencistaService').conferencistaService} props.api
 * @param {function(Object): void} props.onAsociado - Recibe el conferencista asociado.
 * @param {function(): void} props.onCancelar
 */
export default function AsociarConferencistaPanel({ coincidencia, formInicial, eventoId, api, onAsociado, onCancelar }) {
  const pideTrayectoria = !coincidencia.tienePerfil;
  const [form, setForm] = useState(() => ({ ...formularioVacio(), ...(formInicial || {}) }));
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((er) => {
      const copia = { ...er };
      Object.keys(copia).forEach((k) => {
        if (k === campo || k.startsWith(`${campo}.`)) delete copia[k];
      });
      return copia;
    });
    setErrorGeneral(null);
  };

  const enviar = async (e) => {
    e.preventDefault();
    const validacion = validarConferencista(form, { modo: 'asociar', conTrayectoria: pideTrayectoria });
    if (Object.keys(validacion).length > 0) {
      setErrores(validacion);
      return;
    }
    setGuardando(true);
    try {
      const asociado = await api.asociarConferencista(eventoId, aAsociarRequest(coincidencia.personaId, form, pideTrayectoria));
      onAsociado(asociado);
    } catch (err) {
      const r = interpretarErrorConferencista(err);
      setErrores(r.campos);
      setErrorGeneral(r.mensaje || 'Revisa los campos marcados.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
        <div className="w-10 h-10 rounded-full bg-white border border-[#e5e7ea] text-[#5b5f66] flex items-center justify-center shrink-0">
          <UserRound className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#1f2023]">{coincidencia.nombreCompleto}</p>
          <p className="text-xs text-[#5b5f66] mt-0.5">
            {coincidencia.tipoDocumento} {coincidencia.numeroDocumento} · {coincidencia.correo}
          </p>
          <p className="text-xs text-[#5b5f66] mt-1">
            {coincidencia.eventosPrevios > 0
              ? `Ha participado como conferencista en ${coincidencia.eventosPrevios} ${coincidencia.eventosPrevios === 1 ? 'evento' : 'eventos'}. `
              : ''}
            {pideTrayectoria
              ? 'Todavía no tiene trayectoria registrada: complétala para publicarla en el evento.'
              : 'Su trayectoria ya está registrada y se usará tal como está.'}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5b5f66]">Participación en este evento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)] gap-4">
          <Select
            id="asoc-tipo-participacion"
            label="Tipo de participación"
            value={form.tipoParticipacion}
            onChange={(e) => cambiar('tipoParticipacion', e.target.value)}
            options={TIPOS_PARTICIPACION}
            error={errores.tipoParticipacion}
            required
            disabled={guardando}
          />
          <Input
            id="asoc-tema"
            label="Tema de su participación"
            value={form.tema}
            onChange={(e) => cambiar('tema', e.target.value)}
            placeholder="Inteligencia artificial aplicada a la educación"
            error={errores.tema}
            maxLength={LIMITES_CONFERENCISTA.tema}
            disabled={guardando}
          />
        </div>
      </section>

      {pideTrayectoria && (
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5b5f66]">Trayectoria académica y profesional</h3>
          <TrayectoriaFields form={form} errores={errores} onCambiar={cambiar} disabled={guardando} idPrefijo="asoc" />
        </section>
      )}

      {errorGeneral && (
        <p className="text-sm text-[#7a0c1e] bg-[#fdecec] px-3 py-2 rounded-[8px]" role="alert">
          {errorGeneral}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#e5e7ea]">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={guardando}>
          <Link2 className="w-4 h-4" />
          <span>Asociar al evento</span>
        </Button>
      </div>
    </form>
  );
}
