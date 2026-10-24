import { useState } from 'react';
import { Globe, Save, Send } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import EstadoEventoBadge from '../../eventos/components/EstadoEventoBadge';
import { formatearFecha } from '../../eventos/eventoUtils';
import TrayectoriaFields from './TrayectoriaFields';
import {
  LIMITES_CONFERENCISTA,
  TIPOS_DOCUMENTO,
  etiquetaParticipacion,
  formularioDesdePerfil,
  interpretarErrorConferencista,
  validarConferencista,
} from '../conferencistaUtils';

/**
 * @file ConferencistaForm.jsx
 * @description Formulario de datos personales, de contacto y trayectoria del conferencista (HU-12).
 * - modo "invitacion" (Criterios 1 y 2): el conferencista invitado registra sus datos desde el enlace
 *   del correo. El correo es el de la invitación y no se edita; además escribe el tema de su conferencia.
 *   Si ya existía en SIGEA, su documento y teléfono solo se muestran enmascarados (el enlace no pide sesión).
 * - modo "editar" (Criterio 4): el administrador (o el propio conferencista) actualiza los datos y la
 *   trayectoria; muestra el historial de eventos (RF17) y en cuáles el cambio ya se ve en la vista pública.
 * El componente no llama a la API: recibe `enviar`, que hace la petición que corresponda.
 * @module features/conferencistas/components/ConferencistaForm
 */

const SECCION = 'text-xs font-bold uppercase tracking-wider text-[#5b5f66]';

/**
 * @param {Object} props
 * @param {'invitacion'|'editar'} props.modo
 * @param {Object} [props.formInicial] - Estado inicial del formulario; si no se envía, se arma desde `perfil`.
 * @param {Object} [props.perfil] - PerfilConferencistaResponse (modo editar: datos e historial).
 * @param {boolean} [props.correoBloqueado=false] - El correo no se puede cambiar.
 * @param {string} [props.ayudaCorreo] - Texto bajo el correo cuando está bloqueado.
 * @param {function(Object): Promise<Object>} props.enviar - Recibe el formulario validado y hace la petición.
 * @param {function(Object): void} props.onGuardado - Recibe la respuesta del backend.
 * @param {function(): void} [props.onCancelar] - Si no se envía, no se muestra el botón Cancelar.
 * @param {string} [props.textoGuardar]
 */
export default function ConferencistaForm({
  modo,
  formInicial,
  perfil,
  correoBloqueado = false,
  ayudaCorreo,
  enviar,
  onGuardado,
  onCancelar,
  textoGuardar,
}) {
  const esInvitacion = modo === 'invitacion';
  const [form, setForm] = useState(() => formInicial || formularioDesdePerfil(perfil));
  // Invitación de alguien que ya existe en SIGEA: documento y teléfono llegan enmascarados, nunca completos.
  const documentoRegistrado = esInvitacion ? form.documentoRegistrado : null;
  const telefonoRegistrado = esInvitacion ? form.telefonoRegistrado : null;
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((er) => {
      if (!Object.keys(er).some((k) => k === campo || k.startsWith(`${campo}.`))) return er;
      const copia = { ...er };
      Object.keys(copia).forEach((k) => {
        if (k === campo || k.startsWith(`${campo}.`)) delete copia[k];
      });
      return copia;
    });
    if (errorGeneral) setErrorGeneral(null);
  };
  const campo = (nombre) => (e) => cambiar(nombre, e.target.value);

  const alEnviar = async (e) => {
    e.preventDefault();
    const validacion = validarConferencista(form, { modo });
    if (Object.keys(validacion).length > 0) {
      setErrores(validacion);
      setErrorGeneral('Revisa los campos marcados: faltan datos obligatorios o hay valores inválidos.');
      return;
    }
    setGuardando(true);
    try {
      const respuesta = await enviar(form);
      onGuardado(respuesta);
    } catch (err) {
      const r = interpretarErrorConferencista(err);
      setErrores(r.campos);
      setErrorGeneral(r.mensaje || (Object.keys(r.campos).length ? 'Revisa los campos marcados.' : null));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={alEnviar} noValidate className="space-y-6">
      {/* ----- Datos personales y de contacto ----- */}
      <section className="space-y-4">
        <h3 className={SECCION}>Datos personales y de contacto</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="conf-tipo-documento"
            label="Tipo de documento"
            value={form.tipoDocumento}
            onChange={campo('tipoDocumento')}
            options={TIPOS_DOCUMENTO}
            error={errores.tipoDocumento}
            required
            disabled={guardando}
          />
          <Input
            id="conf-documento"
            label="Número de documento"
            value={form.numeroDocumento}
            onChange={campo('numeroDocumento')}
            placeholder={documentoRegistrado ? `Registrado: ${documentoRegistrado}` : '1090123456'}
            error={errores.numeroDocumento}
            helperText={
              documentoRegistrado
                ? 'Ya lo tenemos registrado; por seguridad no se muestra completo. Déjalo vacío para conservarlo.'
                : undefined
            }
            maxLength={LIMITES_CONFERENCISTA.numeroDocumento}
            required={!documentoRegistrado}
            disabled={guardando}
            autoComplete="off"
          />
          <Input
            id="conf-nombres"
            label="Nombres"
            value={form.nombres}
            onChange={campo('nombres')}
            placeholder="Ana María"
            error={errores.nombres}
            maxLength={LIMITES_CONFERENCISTA.nombres}
            required
            disabled={guardando}
          />
          <Input
            id="conf-apellidos"
            label="Apellidos"
            value={form.apellidos}
            onChange={campo('apellidos')}
            placeholder="Pérez Gómez"
            error={errores.apellidos}
            maxLength={LIMITES_CONFERENCISTA.apellidos}
            required
            disabled={guardando}
          />
          <Input
            id="conf-correo"
            type="email"
            label="Correo"
            value={form.correo}
            onChange={campo('correo')}
            placeholder="ana.perez@universidad.edu.co"
            error={errores.correo}
            helperText={correoBloqueado ? ayudaCorreo : undefined}
            maxLength={LIMITES_CONFERENCISTA.correo}
            required
            disabled={guardando || correoBloqueado}
          />
          <Input
            id="conf-telefono"
            type="tel"
            label="Teléfono"
            value={form.telefono}
            onChange={campo('telefono')}
            placeholder={telefonoRegistrado ? `Registrado: ${telefonoRegistrado}` : '3001234567'}
            error={errores.telefono}
            helperText={telefonoRegistrado ? 'Déjalo vacío para conservar el registrado.' : undefined}
            maxLength={LIMITES_CONFERENCISTA.telefono}
            disabled={guardando}
          />
        </div>
      </section>

      {/* ----- Participación en el evento (solo el invitado) ----- */}
      {esInvitacion && (
        <section className="space-y-4">
          <h3 className={SECCION}>Tu participación en el evento</h3>
          <Input
            id="conf-tema"
            label="Tema de tu conferencia"
            value={form.tema}
            onChange={campo('tema')}
            placeholder="Inteligencia artificial aplicada a la educación"
            error={errores.tema}
            helperText="Opcional. El organizador también puede definirlo después."
            maxLength={LIMITES_CONFERENCISTA.tema}
            disabled={guardando}
          />
        </section>
      )}

      {/* ----- Trayectoria ----- */}
      <section className="space-y-4">
        <h3 className={SECCION}>Trayectoria académica y profesional</h3>
        <TrayectoriaFields form={form} errores={errores} onCambiar={cambiar} disabled={guardando} idPrefijo="conf" />
      </section>

      {/* ----- Historial (RF17) ----- */}
      {!esInvitacion && perfil?.participaciones?.length > 0 && (
        <section className="space-y-3">
          <h3 className={SECCION}>Participaciones en eventos del Programa</h3>
          <ul className="divide-y divide-[#e5e7ea] rounded-[12px] border border-[#e5e7ea] bg-white">
            {perfil.participaciones.map((p) => (
              <li key={p.participacionId} className="px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1f2023] truncate">{p.eventoNombre}</p>
                  <p className="text-xs text-[#5b5f66]">
                    {etiquetaParticipacion(p.tipoParticipacion)}
                    {p.tema ? ` · ${p.tema}` : ''} · {formatearFecha(p.fechaInicio)}
                  </p>
                </div>
                <EstadoEventoBadge estado={p.estadoEvento} />
                {p.visiblePublicamente && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f5ee] text-[#1d6b45] border border-[#bfe3cf]">
                    <Globe className="w-3 h-3" />
                    En la vista pública
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#5b5f66]">
            La trayectoria es una sola por conferencista: al guardar, el cambio se refleja en la vista pública de
            todos los eventos marcados.
          </p>
        </section>
      )}

      {errorGeneral && (
        <p className="text-sm text-[#7a0c1e] bg-[#fdecec] px-3 py-2 rounded-[8px]" role="alert">
          {errorGeneral}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#e5e7ea]">
        {onCancelar && (
          <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" loading={guardando}>
          {esInvitacion ? <Send className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{textoGuardar || (esInvitacion ? 'Enviar mis datos' : 'Guardar cambios')}</span>
        </Button>
      </div>
    </form>
  );
}
