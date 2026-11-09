import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import { AlertCircle, FilePen, FileText, Save } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import TextArea from '../../eventos/components/TextArea';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import DocumentosUploader from './DocumentosUploader';
import {
  construirCambiosVersion,
  formatearTamano,
  interpretarErrorPropuesta,
  validarNuevaVersion,
} from '../documentoUtils';

/**
 * @file NuevaVersionModal.jsx
 * @description Modificación de una propuesta enviada (HU-14, Criterios 3 y 5). Al guardar, el sistema crea
 * una nueva versión y conserva las anteriores como evidencia. El autor puede cambiar los datos, conservar
 * o quitar documentos de la versión actual y adjuntar documentos nuevos (para reemplazar uno, se quita y se
 * adjunta el nuevo). El padre debe montarlo con una `key` por propuesta.
 * @module features/propuestas/components/NuevaVersionModal
 */

const ESTILO_ALERTA = {
  confirmButtonText: 'Entendido',
  confirmButtonColor: '#a6192e',
  customClass: {
    popup: 'rounded-[16px]',
    confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
  },
};

/**
 * @param {Object} props
 * @param {{ propuesta: Object, versionActual?: number, edicionAutorizada?: boolean }} props.mia - Elemento de `mis-propuestas`.
 * @param {Object} props.api - `propuestaService` (o su versión simulada).
 * @param {function(): void} props.onClose
 * @param {function(Object): void} [props.onCreada] - Recibe la respuesta del backend tras crear la versión.
 */
export default function NuevaVersionModal({ mia, api, onClose, onCreada }) {
  const propuesta = mia?.propuesta;
  const propuestaId = propuesta?.id;

  const [form, setForm] = useState({
    titulo: propuesta?.titulo || '',
    resumen: propuesta?.resumen || '',
    palabrasClave: propuesta?.palabrasClave || '',
    notaCambio: '',
  });
  const [documentosActuales, setDocumentosActuales] = useState(null);
  const [conservados, setConservados] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorCarga, setErrorCarga] = useState(null);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Documentos de la versión actual: por defecto se conservan todos.
  useEffect(() => {
    if (!propuestaId) return undefined;
    let activo = true;
    api
      .listarVersiones(propuestaId)
      .then((versiones) => {
        if (!activo) return;
        const ultima = versiones[versiones.length - 1];
        const docs = ultima?.documentos || [];
        setDocumentosActuales(docs);
        setConservados(docs.map((d) => d.id));
      })
      .catch((err) => {
        if (activo) setErrorCarga(interpretarErrorPropuesta(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [api, propuestaId]);

  const cambiar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const alternarConservado = (id) => {
    setConservados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setErrores((prev) => ({ ...prev, documentos: undefined }));
  };

  const guardar = async () => {
    const total = conservados.length + archivos.length;
    const errs = validarNuevaVersion(form, total);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);
    try {
      const cambios = construirCambiosVersion(form, propuesta, conservados);
      const respuesta = await api.crearNuevaVersion(propuestaId, cambios, archivos);
      await Swal.fire({
        ...ESTILO_ALERTA,
        icon: 'success',
        title: `Versión ${respuesta?.version?.numeroVersion ?? ''} registrada`,
        text: respuesta?.mensaje,
      });
      if (onCreada) onCreada(respuesta);
      onClose();
    } catch (err) {
      setErrorEnvio(interpretarErrorPropuesta(err));
    } finally {
      setEnviando(false);
    }
  };

  const pie = (
    <>
      <Button type="button" variant="secondary" onClick={onClose} disabled={enviando}>
        Cancelar
      </Button>
      <Button type="button" variant="primary" onClick={guardar} loading={enviando} disabled={enviando || !documentosActuales}>
        <Save className="w-4 h-4" />
        Guardar nueva versión
      </Button>
    </>
  );

  return (
    <ModalShell
      titulo="Modificar propuesta"
      subtitulo={`Se creará la versión ${(mia?.versionActual || 0) + 1}; las anteriores se conservan como evidencia.`}
      icono={FilePen}
      onClose={onClose}
      pie={pie}
      ancho="max-w-3xl"
      tituloId="nueva-version-titulo"
    >
      <div className="space-y-6">
        {mia?.edicionAutorizada && (
          <p className="text-xs text-ink-600 bg-surface-muted border border-border rounded-[8px] p-3">
            Esta propuesta está en versión definitiva. El administrador autorizó una modificación; la autorización se
            usará al guardar esta versión.
          </p>
        )}

        {errorEnvio && (
          <div className="flex items-start gap-2 bg-brand-100 border border-brand-600 text-brand-700 text-sm rounded-[8px] p-3" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
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

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-600">Datos de la propuesta</h3>
          <Input
            label="Título de la propuesta"
            name="titulo"
            value={form.titulo}
            onChange={(e) => cambiar('titulo', e.target.value)}
            error={errores.titulo}
            required
          />
          <TextArea
            label="Resumen / Abstract"
            name="resumen"
            value={form.resumen}
            onChange={(e) => cambiar('resumen', e.target.value)}
            filas={4}
          />
          <Input
            label="Palabras clave"
            name="palabrasClave"
            value={form.palabrasClave}
            onChange={(e) => cambiar('palabrasClave', e.target.value)}
          />
          <TextArea
            label="¿Qué cambió en esta versión? (opcional)"
            name="notaCambio"
            value={form.notaCambio}
            onChange={(e) => cambiar('notaCambio', e.target.value)}
            placeholder="Ej. Se ajustó la metodología según las observaciones del evaluador."
            error={errores.notaCambio}
            filas={2}
          />
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-600">Documentos de la versión actual</h3>
          {errorCarga && <p className="text-sm text-brand-700">{errorCarga}</p>}
          {!errorCarga && !documentosActuales && (
            <p className="text-sm text-ink-600" role="status">Cargando documentos...</p>
          )}
          {documentosActuales?.length === 0 && (
            <p className="text-sm text-ink-600">La versión actual no tiene documentos.</p>
          )}
          {documentosActuales?.length > 0 && (
            <>
              <p className="text-xs text-ink-600">
                Desmarca los documentos que quieras quitar. Para reemplazar uno, desmárcalo y adjunta el nuevo abajo.
              </p>
              <ul className="divide-y divide-border rounded-[12px] border border-border bg-white">
                {documentosActuales.map((doc) => (
                  <li key={doc.id}>
                    <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={conservados.includes(doc.id)}
                        onChange={() => alternarConservado(doc.id)}
                        disabled={enviando}
                        className="w-4 h-4 accent-brand-600"
                      />
                      <FileText className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm truncate ${conservados.includes(doc.id) ? 'text-ink-900' : 'text-ink-300 line-through'}`}>
                          {doc.nombreOriginal}
                        </span>
                        <span className="block text-xs text-ink-600">
                          {formatearTamano(doc.tamanoBytes)}
                          {doc.principal && ' · principal'}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}

          <DocumentosUploader
            archivos={archivos}
            onChange={(lista) => {
              setArchivos(lista);
              setErrores((prev) => ({ ...prev, documentos: undefined }));
            }}
            yaIncluidos={conservados.length}
            error={errores.documentos}
            deshabilitado={enviando}
            etiqueta="Documentos nuevos"
          />
          {archivos.length > 0 && (
            <p className="text-xs text-ink-600">El primer documento nuevo será el documento principal de la versión.</p>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

NuevaVersionModal.propTypes = {
  mia: PropTypes.shape({
    propuesta: PropTypes.shape({
      id: PropTypes.number.isRequired,
      titulo: PropTypes.string,
      resumen: PropTypes.string,
      palabrasClave: PropTypes.string,
    }).isRequired,
    versionActual: PropTypes.number,
    edicionAutorizada: PropTypes.bool,
  }).isRequired,
  api: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreada: PropTypes.func,
};
