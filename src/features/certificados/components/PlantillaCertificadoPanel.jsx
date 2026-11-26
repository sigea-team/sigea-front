import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCheck,
  Eye,
  ImageOff,
  ImagePlus,
  Lock,
  Pencil,
  Percent,
  PenLine,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import useImagenProtegida from '../useImagenProtegida';
import {
  LIMITES_PLANTILLA,
  OPCIONES_TIPO,
  aPorcentajeRequest,
  abrirPdf,
  erroresDeBackend,
  formatearPorcentaje,
  interpretarErrorCertificado,
  moverFirmante,
  validarFirmante,
  validarImagen,
  validarPorcentaje,
} from '../certificadoUtils';

/**
 * @file PlantillaCertificadoPanel.jsx
 * @description Plantilla de los certificados de un evento (HU-26): porcentaje mínimo de asistencia, imagen de fondo y
 * firmantes (nombre, cargo y firma; máximo 4). La plantilla es la misma para todos los roles y exige fondo y al menos
 * una firma. Se puede cambiar hasta que se habilitan los certificados; desde ahí queda congelada para que todos los
 * certificados sean iguales.
 * @module features/certificados/components/PlantillaCertificadoPanel
 */

const caja = 'p-4 rounded-[12px] border border-border bg-white space-y-3';
const tituloCaja = 'text-sm font-semibold text-ink-900 flex items-center gap-2';

function ErrorCaja({ children }) {
  if (!children) return null;
  return (
    <p className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 flex items-start gap-2" role="alert">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
ErrorCaja.propTypes = { children: PropTypes.node };

/** Requisito de asistencia para el certificado de asistente. */
function RequisitoAsistencia({ eventoId, api, config, onConfig }) {
  const [valor, setValor] = useState(String(config.porcentajeMinimoAsistencia ?? ''));
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const sinCambios = aPorcentajeRequest(valor) === Number(config.porcentajeMinimoAsistencia);

  const guardar = async (e) => {
    e.preventDefault();
    const problema = validarPorcentaje(valor);
    setAviso(null);
    if (problema) {
      setError(problema);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const nueva = await api.actualizarConfiguracion(eventoId, aPorcentajeRequest(valor));
      onConfig(nueva);
      setValor(String(nueva.porcentajeMinimoAsistencia));
      setAviso('Porcentaje mínimo actualizado.');
    } catch (err) {
      const info = interpretarErrorCertificado(err);
      setError(info.campos.porcentajeMinimoAsistencia || info.mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className={caja} aria-labelledby="titulo-requisito">
      <h3 id="titulo-requisito" className={tituloCaja}>
        <Percent className="w-4 h-4 text-brand-600" aria-hidden="true" />
        Requisito de asistencia
      </h3>
      <p className="text-xs text-ink-600">
        Para el certificado de asistente, la persona debe haber asistido a este porcentaje de las actividades en las que se
        inscribió. Ponentes y conferencistas lo reciben por las actividades a su cargo.
      </p>
      {config.editable ? (
        <form onSubmit={guardar} className="flex items-end gap-3" noValidate>
          <div className="w-40">
            <Input
              id="porcentaje-minimo"
              label="Porcentaje mínimo"
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => {
                setValor(e.target.value);
                setError(null);
                setAviso(null);
              }}
              error={error || undefined}
              rightElement={<span className="text-sm text-ink-600">%</span>}
            />
          </div>
          <Button type="submit" variant="outline" className="h-11 px-4 text-sm" loading={guardando} disabled={sinCambios}>
            Guardar
          </Button>
        </form>
      ) : (
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-ink-900 tabular-nums">{formatearPorcentaje(config.porcentajeMinimoAsistencia)}</p>
          {config.motivoNoEditable && (
            <p className="text-xs text-ink-600 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              {config.motivoNoEditable}
            </p>
          )}
        </div>
      )}
      {aviso && (
        <p className="text-xs text-ink-900 flex items-center gap-1.5" role="status">
          <CheckCheck className="w-3.5 h-3.5 text-brand-600" aria-hidden="true" />
          {aviso}
        </p>
      )}
    </section>
  );
}
RequisitoAsistencia.propTypes = {
  eventoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  api: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  onConfig: PropTypes.func.isRequired,
};

/** Imagen de fondo del certificado. */
function FondoCertificado({ eventoId, api, plantilla, version, onPlantilla }) {
  const entrada = useRef(null);
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(null); // 'subir' | 'quitar'
  const { url, error: errorImagen } = useImagenProtegida(
    plantilla.tieneFondo ? () => api.imagenFondo(eventoId, version) : null,
    `fondo-${version}`
  );

  const elegir = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    const problema = validarImagen(archivo, 'fondo');
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setOcupado('subir');
    try {
      onPlantilla(await api.subirFondo(eventoId, archivo), { fondo: true });
    } catch (err) {
      setError(erroresDeBackend(err).fondo || interpretarErrorCertificado(err).mensaje);
    } finally {
      setOcupado(null);
    }
  };

  const quitar = async () => {
    setError(null);
    setOcupado('quitar');
    try {
      onPlantilla(await api.eliminarFondo(eventoId), { fondo: true });
    } catch (err) {
      setError(interpretarErrorCertificado(err).mensaje);
    } finally {
      setOcupado(null);
    }
  };

  return (
    <section className={caja} aria-labelledby="titulo-fondo">
      <div className="flex items-center justify-between gap-3">
        <h3 id="titulo-fondo" className={tituloCaja}>
          <ImagePlus className="w-4 h-4 text-brand-600" aria-hidden="true" />
          Imagen de fondo
        </h3>
        {plantilla.editable && (
          <div className="flex items-center gap-2">
            {plantilla.tieneFondo && (
              <Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={quitar} loading={ocupado === 'quitar'} disabled={Boolean(ocupado)}>
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Quitar
              </Button>
            )}
            <Button type="button" variant="primary" className="h-9 px-3 text-xs" onClick={() => entrada.current?.click()} loading={ocupado === 'subir'} disabled={Boolean(ocupado)}>
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              {plantilla.tieneFondo ? 'Reemplazar' : 'Subir fondo'}
            </Button>
            <input
              ref={entrada}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={elegir}
              aria-label="Archivo de la imagen de fondo"
              data-testid="entrada-fondo"
            />
          </div>
        )}
      </div>

      <div className="aspect-[22/17] w-full max-w-sm rounded-[8px] border border-border bg-surface-muted overflow-hidden flex items-center justify-center">
        {plantilla.tieneFondo && url && <img src={url} alt="Fondo del certificado" className="w-full h-full object-cover" />}
        {plantilla.tieneFondo && !url && (
          <span className="text-xs text-ink-600">{errorImagen ? 'No se pudo cargar la imagen.' : 'Cargando imagen...'}</span>
        )}
        {!plantilla.tieneFondo && (
          <span className="text-xs text-ink-600 flex flex-col items-center gap-1.5 px-6 text-center">
            <ImageOff className="w-6 h-6 text-ink-300" aria-hidden="true" />
            Sin imagen de fondo
          </span>
        )}
      </div>
      <p className="text-xs text-ink-600">
        PNG o JPG horizontal, de al menos {LIMITES_PLANTILLA.anchoMinimoFondo} px de ancho y hasta {LIMITES_PLANTILLA.fondoMb} MB.
        Se recorta al centro en tamaño carta horizontal; deja libre el centro, donde va el texto.
      </p>
      <ErrorCaja>{error}</ErrorCaja>
    </section>
  );
}
FondoCertificado.propTypes = {
  eventoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  api: PropTypes.object.isRequired,
  plantilla: PropTypes.object.isRequired,
  version: PropTypes.number.isRequired,
  onPlantilla: PropTypes.func.isRequired,
};

/** Miniatura de la firma guardada de un firmante. */
function FirmaGuardada({ eventoId, api, firmante, version }) {
  const { url, error } = useImagenProtegida(
    () => api.imagenFirma(eventoId, firmante.firmanteId, version),
    `firma-${firmante.firmanteId}-${version}`
  );
  return (
    <div className="w-28 h-12 rounded-[6px] border border-border bg-white flex items-center justify-center overflow-hidden shrink-0">
      {url ? (
        <img src={url} alt={`Firma de ${firmante.nombre}`} className="max-w-full max-h-full object-contain" />
      ) : (
        <span className="text-[10px] text-ink-600">{error ? 'Sin imagen' : '...'}</span>
      )}
    </div>
  );
}
FirmaGuardada.propTypes = {
  eventoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  api: PropTypes.object.isRequired,
  firmante: PropTypes.object.isRequired,
  version: PropTypes.number.isRequired,
};

/** Formulario para agregar o editar un firmante. */
function FirmanteFormulario({ firmante, onGuardar, onCancelar }) {
  const esNuevo = !firmante;
  const [datos, setDatos] = useState({ nombre: firmante?.nombre || '', cargo: firmante?.cargo || '', firma: null });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [vista, setVista] = useState(null);

  const cambiar = (campo, valor) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  // Libera la vista previa de la firma elegida al cambiarla o al cerrar el formulario.
  useEffect(() => () => {
    if (vista) URL.revokeObjectURL(vista);
  }, [vista]);

  const elegirFirma = (e) => {
    const archivo = e.target.files?.[0] || null;
    setVista(archivo ? URL.createObjectURL(archivo) : null);
    cambiar('firma', archivo);
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validarFirmante(datos, esNuevo);
    if (Object.keys(encontrados).length) {
      setErrores(encontrados);
      return;
    }
    setGuardando(true);
    setErrorGeneral(null);
    try {
      await onGuardar({ nombre: datos.nombre.trim(), cargo: datos.cargo.trim(), firma: datos.firma });
    } catch (err) {
      const porCampo = erroresDeBackend(err);
      if (Object.keys(porCampo).length) setErrores(porCampo);
      else setErrorGeneral(interpretarErrorCertificado(err).mensaje);
      setGuardando(false);
    }
  };

  const idBase = esNuevo ? 'nuevo-firmante' : `firmante-${firmante.firmanteId}`;

  return (
    <form onSubmit={enviar} className="p-4 rounded-[12px] border border-brand-600/40 bg-surface-muted space-y-3" noValidate>
      <p className="text-sm font-semibold text-ink-900">{esNuevo ? 'Nuevo firmante' : `Editar a ${firmante.nombre}`}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input id={`${idBase}-nombre`} label="Nombre" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} error={errores.nombre} placeholder="Ej.: Martha Lucía Peña" />
        <Input id={`${idBase}-cargo`} label="Cargo" value={datos.cargo} onChange={(e) => cambiar('cargo', e.target.value)} error={errores.cargo} placeholder="Ej.: Directora de Programa" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idBase}-firma`} className="block text-sm font-medium text-ink-900">
          Firma {esNuevo ? '' : <span className="font-normal text-ink-600">(opcional: solo si la vas a cambiar)</span>}
        </label>
        <div className="flex items-center gap-3">
          <input
            id={`${idBase}-firma`}
            type="file"
            accept="image/png,image/jpeg"
            onChange={elegirFirma}
            className="text-xs text-ink-600 file:mr-3 file:h-9 file:px-3 file:rounded-[8px] file:border file:border-field-border file:bg-white file:text-xs file:font-medium file:text-ink-900 file:cursor-pointer"
          />
          {vista && (
            <div className="w-28 h-12 rounded-[6px] border border-border bg-white flex items-center justify-center overflow-hidden">
              <img src={vista} alt="Firma seleccionada" className="max-w-full max-h-full object-contain" />
            </div>
          )}
        </div>
        <p className="text-xs text-ink-600">
          PNG con fondo transparente o JPG sobre fondo blanco (el blanco se vuelve transparente), hasta {LIMITES_PLANTILLA.firmaMb} MB.
        </p>
        {errores.firma && <p className="text-xs text-brand-600" role="alert">{errores.firma}</p>}
      </div>
      <ErrorCaja>{errorGeneral}</ErrorCaja>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" className="h-9 px-3 text-xs" loading={guardando}>
          {esNuevo ? 'Agregar firmante' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
FirmanteFormulario.propTypes = {
  firmante: PropTypes.object,
  onGuardar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};

/** Firmantes de la plantilla, en el orden en que aparecen en el certificado. */
function FirmantesCertificado({ eventoId, api, plantilla, versiones, onPlantilla }) {
  const [editando, setEditando] = useState(null); // 'nuevo' | firmanteId
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [ocupado, setOcupado] = useState(null);
  const [error, setError] = useState(null);
  const firmantes = plantilla.firmantes || [];
  const maximo = plantilla.maximoFirmantes || LIMITES_PLANTILLA.maximoFirmantes;

  const ejecutar = async (clave, accion, extra) => {
    setOcupado(clave);
    setError(null);
    try {
      onPlantilla(await accion(), extra);
    } catch (err) {
      setError(interpretarErrorCertificado(err).mensaje);
    } finally {
      setOcupado(null);
    }
  };

  const mover = (indice, direccion) =>
    ejecutar(`mover-${indice}-${direccion}`, () => api.reordenarFirmantes(eventoId, moverFirmante(firmantes, indice, direccion)));

  const eliminar = (firmante) =>
    ejecutar(`eliminar-${firmante.firmanteId}`, async () => {
      const r = await api.eliminarFirmante(eventoId, firmante.firmanteId);
      setConfirmarEliminar(null);
      return r;
    });

  return (
    <section className={caja} aria-labelledby="titulo-firmantes">
      <div className="flex items-center justify-between gap-3">
        <h3 id="titulo-firmantes" className={tituloCaja}>
          <PenLine className="w-4 h-4 text-brand-600" aria-hidden="true" />
          Firmantes
          <span className="text-xs font-normal text-ink-600 tabular-nums">
            {firmantes.length} de {maximo}
          </span>
        </h3>
        {plantilla.editable && editando === null && firmantes.length < maximo && (
          <Button type="button" variant="primary" className="h-9 px-3 text-xs" onClick={() => setEditando('nuevo')}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Agregar firmante
          </Button>
        )}
      </div>
      <p className="text-xs text-ink-600">
        Quienes firman todos los certificados del evento (por ejemplo, la dirección del programa o la decanatura). Aparecen
        de izquierda a derecha en este orden.
      </p>

      {firmantes.length === 0 && editando !== 'nuevo' && (
        <div className="p-6 rounded-[12px] border border-dashed border-field-border text-center">
          <p className="text-sm font-semibold text-ink-900">Aún no hay firmantes.</p>
          <p className="text-xs text-ink-600 mt-0.5">El certificado necesita al menos una firma.</p>
        </div>
      )}

      <ol className="space-y-2">
        {firmantes.map((f, i) =>
          editando === f.firmanteId ? (
            <li key={f.firmanteId}>
              <FirmanteFormulario
                firmante={f}
                onCancelar={() => setEditando(null)}
                onGuardar={async (datos) => {
                  onPlantilla(await api.actualizarFirmante(eventoId, f.firmanteId, datos), datos.firma ? { firma: f.firmanteId } : undefined);
                  setEditando(null);
                }}
              />
            </li>
          ) : (
            <li key={f.firmanteId} className="p-3 rounded-[12px] border border-border bg-white flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-surface-muted text-xs font-semibold text-ink-600 flex items-center justify-center shrink-0 tabular-nums">
                {i + 1}
              </span>
              <FirmaGuardada eventoId={eventoId} api={api} firmante={f} version={versiones[f.firmanteId] || 0} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900 truncate">{f.nombre}</p>
                <p className="text-xs text-ink-600 truncate">{f.cargo}</p>
              </div>
              {plantilla.editable && confirmarEliminar !== f.firmanteId && (
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => mover(i, -1)} disabled={i === 0 || Boolean(ocupado)} className="p-1.5 rounded-[6px] text-ink-600 hover:bg-surface-muted disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed" aria-label={`Subir a ${f.nombre}`} title="Subir">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => mover(i, 1)} disabled={i === firmantes.length - 1 || Boolean(ocupado)} className="p-1.5 rounded-[6px] text-ink-600 hover:bg-surface-muted disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed" aria-label={`Bajar a ${f.nombre}`} title="Bajar">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setEditando(f.firmanteId)} disabled={editando !== null || Boolean(ocupado)} className="p-1.5 rounded-[6px] text-ink-600 hover:bg-surface-muted disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed" aria-label={`Editar a ${f.nombre}`} title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setConfirmarEliminar(f.firmanteId)} disabled={Boolean(ocupado)} className="p-1.5 rounded-[6px] text-brand-600 hover:bg-brand-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed" aria-label={`Quitar a ${f.nombre}`} title="Quitar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              {confirmarEliminar === f.firmanteId && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-ink-900">¿Quitar?</span>
                  <Button type="button" variant="outline" className="h-8 px-2.5 text-xs" onClick={() => setConfirmarEliminar(null)} disabled={Boolean(ocupado)}>
                    No
                  </Button>
                  <Button type="button" variant="primary" className="h-8 px-2.5 text-xs" onClick={() => eliminar(f)} loading={ocupado === `eliminar-${f.firmanteId}`}>
                    Sí, quitar
                  </Button>
                </div>
              )}
            </li>
          )
        )}
      </ol>

      {editando === 'nuevo' && (
        <FirmanteFormulario
          onCancelar={() => setEditando(null)}
          onGuardar={async (datos) => {
            onPlantilla(await api.agregarFirmante(eventoId, datos));
            setEditando(null);
          }}
        />
      )}
      <ErrorCaja>{error}</ErrorCaja>
    </section>
  );
}
FirmantesCertificado.propTypes = {
  eventoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  api: PropTypes.object.isRequired,
  plantilla: PropTypes.object.isRequired,
  versiones: PropTypes.object.isRequired,
  onPlantilla: PropTypes.func.isRequired,
};

/** PDF de ejemplo con la plantilla actual. */
function VistaPrevia({ eventoId, api, completa }) {
  const [tipo, setTipo] = useState('asistente');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const ver = async () => {
    setCargando(true);
    setError(null);
    try {
      await abrirPdf(() => api.vistaPrevia(eventoId, tipo), `vista-previa-${tipo}.pdf`);
    } catch (err) {
      setError(interpretarErrorCertificado(err).mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className={caja} aria-labelledby="titulo-vista-previa">
      <h3 id="titulo-vista-previa" className={tituloCaja}>
        <Eye className="w-4 h-4 text-brand-600" aria-hidden="true" />
        Vista previa
      </h3>
      <p className="text-xs text-ink-600">
        Genera un certificado de ejemplo con datos ficticios para revisar cómo queda.
        {!completa && ' Mientras falte el fondo o las firmas, se usa el diseño básico de SIGEA.'}
      </p>
      <div className="flex items-end gap-3">
        <div className="w-48 space-y-1.5">
          <label htmlFor="tipo-vista-previa" className="block text-sm font-medium text-ink-900">
            Rol
          </label>
          <select
            id="tipo-vista-previa"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full h-11 px-3 rounded-[8px] bg-white text-sm text-ink-900 border border-field-border outline-none focus:border-brand-600"
          >
            {OPCIONES_TIPO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="outline" className="h-11 px-4 text-sm" onClick={ver} loading={cargando}>
          <Eye className="w-4 h-4" aria-hidden="true" />
          Ver PDF
        </Button>
      </div>
      <ErrorCaja>{error}</ErrorCaja>
    </section>
  );
}
VistaPrevia.propTypes = {
  eventoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  api: PropTypes.object.isRequired,
  completa: PropTypes.bool,
};

/**
 * @param {Object} props
 * @param {number|string} props.eventoId
 * @param {Object} props.api - certificadoService o su simulación.
 * @param {Object} props.plantilla - PlantillaCertificadoResponse.
 * @param {Object} props.config - ConfiguracionCertificadosResponse.
 * @param {function(Object): void} props.onPlantilla - Recibe la plantilla actualizada.
 * @param {function(Object): void} props.onConfig - Recibe la configuración actualizada.
 */
export default function PlantillaCertificadoPanel({ eventoId, api, plantilla, config, onPlantilla, onConfig }) {
  // Versión local de cada imagen: obliga a volver a pedirla cuando se reemplaza (la URL del backend no cambia).
  const [versionFondo, setVersionFondo] = useState(1);
  const [versionesFirma, setVersionesFirma] = useState({});

  const actualizar = (nueva, cambio) => {
    if (cambio?.fondo) setVersionFondo((v) => v + 1);
    if (cambio?.firma) setVersionesFirma((v) => ({ ...v, [cambio.firma]: (v[cambio.firma] || 0) + 1 }));
    onPlantilla(nueva);
  };

  return (
    <div className="space-y-4">
      {!plantilla.editable && plantilla.motivoNoEditable && (
        <p className="text-sm text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px] flex items-center gap-2" role="status">
          <Lock className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
          {plantilla.motivoNoEditable}
        </p>
      )}
      {plantilla.editable && !plantilla.completa && (plantilla.faltantes || []).length > 0 && (
        <div className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 space-y-1" role="status">
          <p className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            Para habilitar los certificados falta:
          </p>
          <ul className="list-disc pl-10 space-y-0.5">
            {plantilla.faltantes.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {config && <RequisitoAsistencia key={String(config.editable)} eventoId={eventoId} api={api} config={config} onConfig={onConfig} />}
      <FondoCertificado eventoId={eventoId} api={api} plantilla={plantilla} version={versionFondo} onPlantilla={actualizar} />
      <FirmantesCertificado eventoId={eventoId} api={api} plantilla={plantilla} versiones={versionesFirma} onPlantilla={actualizar} />
      <VistaPrevia eventoId={eventoId} api={api} completa={plantilla.completa} />
    </div>
  );
}

PlantillaCertificadoPanel.propTypes = {
  eventoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  api: PropTypes.object.isRequired,
  plantilla: PropTypes.object.isRequired,
  config: PropTypes.object,
  onPlantilla: PropTypes.func.isRequired,
  onConfig: PropTypes.func.isRequired,
};
