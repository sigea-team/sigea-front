import { useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Send, FileText, Calendar, AlertCircle } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import TextArea from '../../eventos/components/TextArea';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import AutorFormSection from './AutorFormSection';
import AutoresList from './AutoresList';
import DocumentosUploader from './DocumentosUploader';
import { validarPropuesta } from '../propuestaUtils';
import { interpretarErrorPropuesta } from '../documentoUtils';
import { propuestaService } from '../../../api/propuestaService';
import { formatearFechaHora } from '../../convocatorias/convocatoriaUtils';

/**
 * @file PropuestaFormModal.jsx
 * @description Modal para el envío de propuestas académicas asociando autores y ponentes (HU Registro de Autores y Ponentes).
 * Satisface:
 * - Criterio 1: Dado que estoy enviando una propuesta, cuando registro mis datos como autor o ponente, entonces el sistema los asocia a la propuesta enviada.
 * - Criterio 2: Dado que una propuesta tiene varios autores, cuando registro cada uno con su rol específico (autor principal, coautor, ponente), entonces el sistema los guarda diferenciadamente.
 * - Criterio 3: Dado que intento registrar un autor sin datos obligatorios (nombre, correo, filiación), cuando confirmo el registro, entonces el sistema rechaza la operación y señala los campos faltantes.
 * HU-14 (Postular propuesta con documentos):
 * - Criterio 1: la propuesta se envía con sus documentos (POST /propuestas/envio) y el sistema confirma la recepción (versión 1).
 * - Criterio 2: si la convocatoria cerró o un archivo tiene formato o tamaño no permitido, o faltan datos o documentos,
 *   se rechaza el envío indicando el motivo (por archivo cuando aplica).
 * @module features/propuestas/components/PropuestaFormModal
 */

/** SweetAlert2 con contenido React: los textos (títulos, nombres de archivo) se escapan solos. */
const SwalReact = withReactContent(Swal);

const ALERTA_EXITO = {
  icon: 'success',
  confirmButtonText: 'Entendido',
  confirmButtonColor: '#a6192e',
  customClass: {
    popup: 'rounded-[16px]',
    confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
  },
};

/**
 * Modal que gestiona el envío de una propuesta académica y la vinculación de sus autores y ponentes.
 * @param {Object} props
 * @param {boolean} props.isOpen - Define si el modal se encuentra visible.
 * @param {Object} props.convocatoria - Objeto de la convocatoria a la que se postula la propuesta.
 * @param {function(): void} props.onClose - Callback al cerrar el modal.
 * @param {function(Object): void} [props.onPropuestaEnviada] - Callback invocado tras enviar la propuesta con éxito.
 * @param {typeof propuestaService} [props.api=propuestaService] - Cliente de API para el envío de propuestas.
 * @returns {JSX.Element|null}
 */
export default function PropuestaFormModal({
  isOpen,
  convocatoria,
  onClose,
  onPropuestaEnviada,
  api = propuestaService,
}) {
  const [form, setForm] = useState({
    titulo: '',
    resumen: '',
    ejeTematico: '',
  });

  const [autores, setAutores] = useState([]);
  const [autorEnEdicion, setAutorEnEdicion] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (!isOpen) return null;

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => {
        const copia = { ...prev };
        delete copia[campo];
        return copia;
      });
    }
  };

  const handleAgregarAutor = (autor) => {
    setAutores((prev) => {
      const existe = prev.findIndex((a) => a.id === autor.id);
      if (existe >= 0) {
        const actualizados = [...prev];
        actualizados[existe] = autor;
        return actualizados;
      }
      return [...prev, autor];
    });
    setAutorEnEdicion(null);

    if (errores.autores) {
      setErrores((prev) => {
        const copia = { ...prev };
        delete copia.autores;
        return copia;
      });
    }
  };

  const handleEliminarAutor = (id) => {
    setAutores((prev) => prev.filter((a) => a.id !== id));
    if (autorEnEdicion?.id === id) {
      setAutorEnEdicion(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar la propuesta y la presencia de autores
    const datosPropuesta = {
      ...form,
      convocatoriaId: convocatoria?.id,
      autores,
    };

    const errs = validarPropuesta(datosPropuesta);
    // HU-14, Criterio 2: los documentos son obligatorios.
    if (archivos.length === 0) {
      errs.documentos = 'Debe adjuntar al menos un documento de la propuesta.';
    }
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      Swal.fire({
        icon: 'error',
        title: 'Verifique los campos requeridos',
        text: errs.autores || errs.titulo || errs.resumen || errs.documentos || 'Por favor complete todos los datos requeridos antes de enviar la propuesta.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        },
      });
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);
    try {
      // HU-13 Criterio 1 y HU-14 Criterio 1: la propuesta se registra con sus autores y documentos (versión 1).
      const respuesta = await api.enviarPropuestaConDocumentos(datosPropuesta, archivos);

      const rolesLegibles = {
        autor_principal: 'Autor Principal',
        coautor: 'Coautor',
        ponente: 'Ponente',
      };

      SwalReact.fire({
        ...ALERTA_EXITO,
        title: '¡Propuesta recibida!',
        html: (
          <div className="text-left">
            <p className="text-sm text-ink-600 mb-3">
              {respuesta?.mensaje || `La propuesta «${datosPropuesta.titulo}» fue recibida correctamente.`}
            </p>
            <div className="bg-surface-muted border border-border rounded-[8px] p-3 text-xs space-y-1">
              <p><strong>Convocatoria:</strong> {convocatoria?.titulo || 'Convocatoria académica'}</p>
              <p><strong>Autores:</strong> {autores.map((a) => `${a.nombreCompleto} (${rolesLegibles[a.rol] || a.rol})`).join(', ')}</p>
              <p><strong>Documentos:</strong> {archivos.map((a) => a.name).join(', ')}</p>
              <p>Puedes consultar sus versiones y modificarla desde «Mis propuestas».</p>
            </div>
          </div>
        ),
      });

      if (onPropuestaEnviada) {
        onPropuestaEnviada(respuesta);
      }
      onClose();
    } catch (err) {
      // HU-14, Criterio 2: se indica el motivo del rechazo (convocatoria cerrada, archivo inválido, datos faltantes).
      const error = interpretarErrorPropuesta(err);
      setErrorEnvio(error);
      SwalReact.fire({
        icon: 'error',
        title: error.titulo,
        html: (
          <div className="text-left text-sm text-ink-600">
            <p>{error.mensaje}</p>
            {error.detalles.length > 0 && (
              <ul className="list-disc pl-5 mt-2 text-[13px] text-ink-900 space-y-1">
                {error.detalles.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        ),
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        },
      });
    } finally {
      setEnviando(false);
    }
  };

  const pie = (
    <>
      <Button type="button" variant="secondary" onClick={onClose} disabled={enviando}>
        Cancelar
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={handleSubmit}
        loading={enviando}
        disabled={enviando}
      >
        <Send className="w-4 h-4 mr-2" />
        Enviar propuesta
      </Button>
    </>
  );

  return (
    <ModalShell
      titulo="Enviar Propuesta de Ponencia"
      subtitulo={
        convocatoria?.titulo
          ? `Convocatoria: ${convocatoria.titulo}`
          : 'Complete la información y los datos de autor/ponente'
      }
      icono={FileText}
      onClose={onClose}
      pie={pie}
      ancho="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Banner informativo de la convocatoria */}
        {convocatoria && (
          <div className="bg-surface-muted border border-border rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                Evento asociado
              </span>
              <p className="text-sm font-semibold text-ink-900">
                {convocatoria.eventoNombre || 'Evento Académico UFPS'}
              </p>
            </div>
            {convocatoria.fechaCierre && (
              <div className="flex items-center gap-1.5 text-xs text-ink-600 bg-white border border-border px-3 py-1.5 rounded-[8px] self-start sm:self-auto">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                <span>Cierre: {formatearFechaHora(convocatoria.fechaCierre)}</span>
              </div>
            )}
          </div>
        )}

        {/* Datos generales de la propuesta */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-600">
            Información del Trabajo
          </h3>

          <Input
            label="Título de la Propuesta / Ponencia"
            name="titulo"
            value={form.titulo}
            onChange={(e) => handleChange('titulo', e.target.value)}
            placeholder="Ej. Aplicación de Inteligencia Artificial en Diagnóstico Clínico"
            error={errores.titulo}
            required
          />

          <TextArea
            label="Resumen / Abstract"
            name="resumen"
            value={form.resumen}
            onChange={(e) => handleChange('resumen', e.target.value)}
            placeholder="Describa el objetivo, metodología y principales contribuciones del trabajo (mínimo 20 caracteres)..."
            error={errores.resumen}
            filas={4}
            required
          />

          <Input
            label="Eje Temático o Área de Conocimiento (Opcional)"
            name="ejeTematico"
            value={form.ejeTematico}
            onChange={(e) => handleChange('ejeTematico', e.target.value)}
            placeholder="Ej. Ingeniería de Software, Ciencia de Datos, Telecomunicaciones"
          />
        </div>

        {errorEnvio && (
          <div className="flex items-start gap-2 bg-brand-100 border border-brand-600 text-brand-700 text-sm rounded-[8px] p-3" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorEnvio.titulo}</p>
              <p>{errorEnvio.mensaje}</p>
              {errorEnvio.detalles.length > 0 && (
                <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
                  {errorEnvio.detalles.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* HU-14: documentos de la propuesta (versión 1) */}
        <div className="pt-2 border-t border-border">
          <DocumentosUploader
            archivos={archivos}
            onChange={(lista) => {
              setArchivos(lista);
              if (errores.documentos) {
                setErrores((prev) => {
                  const copia = { ...prev };
                  delete copia.documentos;
                  return copia;
                });
              }
            }}
            error={errores.documentos}
            obligatorio
            deshabilitado={enviando}
          />
        </div>

        {/* Sección de Autores y Ponentes (HU Principal) */}
        <div className="space-y-4 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Identificación de Autores y Ponentes (*)
              </h3>
              <p className="text-xs text-ink-600 mt-0.5">
                Criterios 1, 2 y 3: Registre los participantes asociando su rol específico (Autor Principal, Coautor, Ponente).
              </p>
            </div>
          </div>

          {errores.autores && (
            <div className="flex items-center gap-2 bg-brand-100 border border-brand-600 text-brand-700 text-xs rounded-[8px] p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errores.autores}</span>
            </div>
          )}

          {/* Formulario de autor */}
          <AutorFormSection
            key={autorEnEdicion ? `edit-${autorEnEdicion.id}` : 'nuevo'}
            onAgregarAutor={handleAgregarAutor}
            autorEnEdicion={autorEnEdicion}
            onCancelarEdicion={() => setAutorEnEdicion(null)}
            autoresActuales={autores}
          />

          {/* Lista de autores registrados */}
          <AutoresList
            autores={autores}
            onEditar={(autor) => setAutorEnEdicion(autor)}
            onEliminar={handleEliminarAutor}
          />
        </div>
      </div>
    </ModalShell>
  );
}
