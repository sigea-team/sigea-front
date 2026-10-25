import { useEffect, useState } from 'react';
import { CheckCircle2, Link2, Mail, Search, Send, UserRound } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import AvisoCoincidencia from './AvisoCoincidencia';
import {
  LIMITES_CONFERENCISTA,
  interpretarErrorConferencista,
  validarInvitacion,
} from '../conferencistaUtils';

/**
 * @file AgregarConferencistaPanel.jsx
 * @description Agregar un conferencista a un evento (HU-12).
 * - Criterio 3: lista buscable de los conferencistas ya registrados; se vinculan sin pedir de nuevo sus datos.
 * - Si es nuevo, el administrador solo escribe nombre y correo y se le envía una invitación con un
 *   enlace para que él mismo registre sus datos y su trayectoria. Si ese correo ya es de un
 *   conferencista registrado, se ofrece vincularlo en lugar de invitarlo.
 * @module features/conferencistas/components/AgregarConferencistaPanel
 */

const ESPERA_BUSQUEDA_MS = 300;

/**
 * @param {Object} props
 * @param {number} props.eventoId
 * @param {typeof import('../../../api/conferencistaService').conferencistaService} props.api
 * @param {function(Object): void} props.onVincular - Recibe el conferencista registrado elegido (para asociarlo).
 * @param {function(Object): void} props.onInvitado - Recibe la invitación creada.
 */
export default function AgregarConferencistaPanel({ eventoId, api, onVincular, onInvitado }) {
  const [busqueda, setBusqueda] = useState('');
  // { termino, lista } | { termino, error }: se guarda el término para no mostrar resultados de otra búsqueda.
  const [resultado, setResultado] = useState(null);
  const [version, setVersion] = useState(0);

  const [invitacion, setInvitacion] = useState({ nombre: '', correo: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [coincidencia, setCoincidencia] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const termino = busqueda.trim();

  useEffect(() => {
    let activo = true;
    const temporizador = setTimeout(() => {
      api
        .listarRegistrados(termino, eventoId)
        .then((lista) => {
          if (activo) setResultado({ termino, lista: Array.isArray(lista) ? lista : [] });
        })
        .catch(() => {
          if (activo) setResultado({ termino, error: true });
        });
    }, ESPERA_BUSQUEDA_MS);
    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [api, eventoId, termino, version]);

  const actual = resultado?.termino === termino ? resultado : null;

  const cambiarInvitacion = (campo) => (e) => {
    const valor = e.target.value;
    setInvitacion((d) => ({ ...d, [campo]: valor }));
    if (errores[campo]) setErrores((er) => ({ ...er, [campo]: null }));
    setErrorGeneral(null);
    if (campo === 'correo') setCoincidencia(null);
  };

  const invitar = async (e) => {
    e.preventDefault();
    const validacion = validarInvitacion(invitacion);
    if (Object.keys(validacion).length > 0) {
      setErrores(validacion);
      return;
    }
    setEnviando(true);
    try {
      const creada = await api.invitarConferencista(eventoId, {
        nombre: invitacion.nombre.trim(),
        correo: invitacion.correo.trim().toLowerCase(),
      });
      onInvitado(creada);
    } catch (err) {
      const r = interpretarErrorConferencista(err);
      if (r.coincidencia) {
        setCoincidencia(r.coincidencia);
      } else {
        setErrores(r.campos);
        setErrorGeneral(r.mensaje);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ----- Conferencistas registrados ----- */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[#1f2023]">Conferencistas registrados</h3>
          <p className="text-xs text-[#5b5f66] mt-0.5">
            Si ya participó en otro evento, búscalo y vincúlalo: se usará su trayectoria registrada.
          </p>
        </div>
        <Input
          id="buscar-conferencista"
          label="Buscar"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Nombre, documento o correo..."
          rightElement={<Search className="w-4 h-4 text-[#5b5f66]" />}
          autoComplete="off"
        />

        <div className="rounded-[12px] border border-[#e5e7ea] bg-white max-h-72 overflow-y-auto">
          {!actual && (
            <p className="py-8 text-center text-sm text-[#5b5f66]" role="status">
              Buscando conferencistas...
            </p>
          )}
          {actual?.error && (
            <div className="py-8 text-center text-sm">
              <p className="font-semibold text-[#1f2023]">No se pudo cargar la lista</p>
              <button
                type="button"
                onClick={() => setVersion((v) => v + 1)}
                className="text-xs mt-1 text-[#a6192e] font-semibold underline cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          )}
          {actual?.lista?.length === 0 && (
            <p className="py-8 px-4 text-center text-sm text-[#5b5f66]">
              {termino
                ? `Ningún conferencista registrado coincide con «${termino}». Si es nuevo, invítalo abajo.`
                : 'Todavía no hay conferencistas registrados. Invita al primero abajo.'}
            </p>
          )}
          {actual?.lista?.length > 0 && (
            <ul className="divide-y divide-[#e5e7ea]">
              {actual.lista.map((c) => (
                <li key={c.personaId} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#f7f7f8] border border-[#e5e7ea] text-[#5b5f66] flex items-center justify-center shrink-0">
                    <UserRound className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1f2023] truncate">{c.nombreCompleto}</p>
                    <p className="text-xs text-[#5b5f66] truncate">
                      {[c.cargoActual, c.institucion].filter(Boolean).join(' · ') || c.correo}
                    </p>
                    <p className="text-[11px] text-[#9ca0a6]">
                      {c.tipoDocumento} {c.numeroDocumento}
                      {c.eventosPrevios > 0
                        ? ` · ${c.eventosPrevios} ${c.eventosPrevios === 1 ? 'evento' : 'eventos'}`
                        : ''}
                    </p>
                  </div>
                  {c.yaAsociadoAlEvento ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d6b45] shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      Ya está en el evento
                    </span>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => onVincular(c)} className="shrink-0">
                      <Link2 className="w-4 h-4" />
                      <span>Vincular</span>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ----- Invitar a uno nuevo ----- */}
      <form onSubmit={invitar} noValidate className="p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8] space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1f2023]">¿No está en la lista? Invítalo</h3>
            <p className="text-xs text-[#5b5f66] mt-0.5">
              Solo escribe su nombre y correo. Le llegará un enlace (vigente 3 días) para que registre él mismo su
              documento, teléfono y trayectoria. Al completarlo queda vinculado a este evento.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-3">
          <Input
            id="invitar-nombre"
            label="Nombre"
            value={invitacion.nombre}
            onChange={cambiarInvitacion('nombre')}
            placeholder="Ana María Pérez Gómez"
            error={errores.nombre}
            maxLength={LIMITES_CONFERENCISTA.nombreInvitacion}
            required
            disabled={enviando}
          />
          <Input
            id="invitar-correo"
            type="email"
            label="Correo"
            value={invitacion.correo}
            onChange={cambiarInvitacion('correo')}
            placeholder="ana.perez@universidad.edu.co"
            error={errores.correo}
            maxLength={LIMITES_CONFERENCISTA.correo}
            required
            disabled={enviando}
            autoComplete="off"
          />
          <Button type="submit" variant="primary" loading={enviando} className="sm:mt-[26px]">
            <Send className="w-4 h-4" />
            <span>Enviar invitación</span>
          </Button>
        </div>

        <AvisoCoincidencia coincidencia={coincidencia} onAsociar={coincidencia ? () => onVincular(coincidencia) : undefined} />

        {errorGeneral && (
          <p className="text-sm text-[#7a0c1e] bg-[#fdecec] px-3 py-2 rounded-[8px]" role="alert">
            {errorGeneral}
          </p>
        )}
      </form>
    </div>
  );
}
