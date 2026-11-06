import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { AlertTriangle, CheckCircle2, Info, Plus, RotateCw, Save, Shapes, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import {
  ESCALA_LIMITE_MAXIMO,
  ESCALA_LIMITE_MINIMO,
  LIMITES_RUBRICA,
  aRequest,
  criterioVacio,
  desdeRubrica,
  formatearPeso,
  impactoDeError,
  interpretarErrorApi,
  plural,
  repartirPesos,
  sumaPesos,
  validarRubrica,
} from '../rubricaUtils';

/**
 * @file RubricaEditor.jsx
 * @description Configuración de la rúbrica de evaluación de una convocatoria (HU-15: RF22).
 * - Criterio 1: criterios con nombre, peso y escala; se guarda solo si los pesos suman 100 %.
 * - Criterio 2: si los pesos no suman 100 % se impide guardar y se muestra el error (también si el
 *   backend lo rechaza con RUBRICA_INVALIDA).
 * - Criterio 4: si la rúbrica ya tiene calificaciones se advierte el impacto antes de editar y, al guardar,
 *   se pide confirmación (409 RUBRICA_EN_USO → reintento con confirmar = true).
 * El padre debe montarlo con una `key` distinta por convocatoria.
 * @module features/rubricas/components/RubricaEditor
 */

const SwalReact = withReactContent(Swal);

const ESTILO_SWAL = {
  confirmButtonColor: '#a6192e',
  cancelButtonColor: '#5b5f66',
  customClass: {
    popup: 'rounded-[16px]',
    confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
    cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
  },
};

/** Criterio 4: pide confirmación para reemplazar una rúbrica que ya se usó para calificar. */
function confirmarReemplazo(impacto) {
  return SwalReact.fire({
    ...ESTILO_SWAL,
    icon: 'warning',
    title: 'Esta rúbrica ya se usó para calificar',
    html: (
      <div className="text-left space-y-3">
        <ul className="text-sm text-[#1f2023] space-y-1">
          <li>
            <strong>{plural(impacto.calificacionesRegistradas, 'calificación', 'calificaciones')}</strong> registradas
          </li>
          <li>
            <strong>{plural(impacto.asignacionesAfectadas, 'evaluación', 'evaluaciones')}</strong> sobre{' '}
            <strong>{plural(impacto.propuestasAfectadas, 'propuesta')}</strong>
          </li>
        </ul>
        <p className="text-sm text-[#5b5f66]">
          Si guardas los cambios se crea una nueva versión de la rúbrica. Las calificaciones anteriores se conservan
          como histórico, pero esas evaluaciones vuelven a <strong>pendiente</strong> y los evaluadores deberán
          calificarlas de nuevo con la nueva rúbrica.
        </p>
      </div>
    ),
    showCancelButton: true,
    confirmButtonText: 'Guardar y reabrir evaluaciones',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true,
  }).then((r) => r.isConfirmed);
}

/** Color de la barra de suma de pesos. */
function colorSuma(suma) {
  if (suma === 100) return { barra: 'bg-[#107e3e]', texto: 'text-[#107e3e]' };
  if (suma > 100) return { barra: 'bg-[#a6192e]', texto: 'text-[#a6192e]' };
  return { barra: 'bg-[#b7791f]', texto: 'text-[#8a5a12]' };
}

/**
 * @param {Object} props
 * @param {number} props.convocatoriaId
 * @param {typeof import('../../../api/rubricaService').rubricaService} props.api
 * @param {function(Object): void} [props.onGuardada] - Recibe la rúbrica guardada.
 */
export default function RubricaEditor({ convocatoriaId, api, onGuardada }) {
  const [carga, setCarga] = useState({ cargando: true, error: null, impacto: null, existe: false });
  const [form, setForm] = useState(null);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    Promise.all([api.obtenerRubrica(convocatoriaId), api.obtenerImpacto(convocatoriaId).catch(() => null)])
      .then(([rubrica, impacto]) => {
        if (!activo) return;
        setForm(desdeRubrica(rubrica));
        setCarga({ cargando: false, error: null, impacto, existe: Boolean(rubrica) });
      })
      .catch((err) => {
        if (activo) setCarga({ cargando: false, error: interpretarErrorApi(err).mensaje, impacto: null, existe: false });
      });
    return () => {
      activo = false;
    };
  }, [api, convocatoriaId, version]);

  const reintentarCarga = () => {
    setCarga((c) => ({ ...c, cargando: true, error: null }));
    setVersion((v) => v + 1);
  };

  if (carga.cargando) {
    return (
      <p className="py-10 text-center text-sm text-[#5b5f66]" role="status">
        Cargando rúbrica...
      </p>
    );
  }

  if (carga.error || !form) {
    return (
      <div className="py-10 text-center" role="alert">
        <p className="font-semibold text-[#1f2023]">No se pudo cargar la rúbrica</p>
        {carga.error && <p className="text-sm text-[#5b5f66] mt-1">{carga.error}</p>}
        <button
          type="button"
          onClick={reintentarCarga}
          className="mt-2 inline-flex items-center gap-1 text-xs text-[#a6192e] font-semibold underline cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  const suma = sumaPesos(form.criterios);
  const colores = colorSuma(suma);
  const impacto = carga.impacto;
  const enUso = Boolean(impacto?.requiereConfirmacion);

  const limpiarError = (...claves) => {
    if (errorGeneral) setErrorGeneral(null);
    setErrores((prev) => {
      if (!claves.some((k) => prev[k])) return prev;
      const copia = { ...prev };
      claves.forEach((k) => delete copia[k]);
      return copia;
    });
  };

  const cambiarNombre = (e) => {
    const nombre = e.target.value;
    setForm((f) => ({ ...f, nombre }));
    limpiarError('nombre');
  };

  const cambiarCriterio = (indice, campo) => (e) => {
    const valor = e.target.value;
    setForm((f) => ({
      ...f,
      criterios: f.criterios.map((c, i) => (i === indice ? { ...c, [campo]: valor } : c)),
    }));
    const claves = [`criterios[${indice}].${campo}`];
    if (campo === 'pesoPorcentual') claves.push('pesoPorcentual');
    if (campo === 'escalaMinima') claves.push(`criterios[${indice}].escalaMaxima`);
    limpiarError(...claves);
  };

  // Al agregar, quitar o repartir cambian los índices: se limpian los errores de las filas.
  const soloErrorNombre = () => setErrores((prev) => (prev.nombre ? { nombre: prev.nombre } : {}));

  const agregarCriterio = () => {
    setForm((f) => ({ ...f, criterios: [...f.criterios, criterioVacio()] }));
    soloErrorNombre();
  };

  const quitarCriterio = (indice) => {
    setForm((f) => ({ ...f, criterios: f.criterios.filter((_, i) => i !== indice) }));
    soloErrorNombre();
  };

  const repartir = () => {
    setForm((f) => ({ ...f, criterios: repartirPesos(f.criterios) }));
    soloErrorNombre();
  };

  const enviar = async (confirmar) => {
    setGuardando(true);
    setErrorGeneral(null);
    setAviso(null);
    try {
      const guardada = await api.configurarRubrica(convocatoriaId, aRequest(form), confirmar);
      const reabiertas = Number(guardada?.asignacionesReabiertas) || 0;
      setForm(desdeRubrica(guardada));
      setErrores({});
      setCarga({
        cargando: false,
        error: null,
        existe: true,
        impacto: { rubricaId: guardada?.rubricaId ?? null, calificacionesRegistradas: 0, asignacionesAfectadas: 0,
          propuestasAfectadas: 0, requiereConfirmacion: false },
      });
      setAviso(
        reabiertas > 0
          ? `Se guardó una nueva versión de la rúbrica. ${plural(reabiertas, 'evaluación volvió', 'evaluaciones volvieron')} a pendiente para calificarse de nuevo.`
          : 'La rúbrica se guardó correctamente.'
      );
      if (onGuardada) onGuardada(guardada);
    } catch (err) {
      const impactoError = !confirmar ? impactoDeError(err) : null;
      if (impactoError) {
        // Criterio 4: el backend advierte el impacto; solo se reemplaza si el organizador confirma.
        setGuardando(false);
        setCarga((c) => ({
          ...c,
          impacto: { ...impactoError, rubricaId: c.impacto?.rubricaId ?? null, requiereConfirmacion: true },
        }));
        if (await confirmarReemplazo(impactoError)) await enviar(true);
        return;
      }
      const { mensaje, campos } = interpretarErrorApi(err);
      setErrores(campos);
      setErrorGeneral(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    const validacion = validarRubrica(form);
    if (Object.keys(validacion).length > 0) {
      setErrores(validacion);
      setErrorGeneral(
        validacion.pesoPorcentual && Object.keys(validacion).length === 1
          ? 'No se puede guardar: la suma de los pesos de los criterios debe ser 100%.'
          : 'Revisa los campos marcados antes de guardar.'
      );
      return;
    }
    await enviar(false);
  };

  const anchoBarra = Math.min(100, Math.max(0, suma));

  return (
    <form onSubmit={guardar} noValidate className="space-y-5" aria-label="Rúbrica de evaluación">
      {/* Criterio 4: advertencia previa si la rúbrica ya se usó para calificar */}
      {enUso && (
        <div className="flex items-start gap-3 p-4 rounded-[12px] bg-[#fff7e6] border border-[#b7791f]/30 text-[#5c3d0a]" role="note">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#b7791f]" />
          <p className="text-sm leading-relaxed">
            Esta rúbrica ya se usó en{' '}
            <strong>{plural(impacto.calificacionesRegistradas, 'calificación', 'calificaciones')}</strong> de{' '}
            <strong>{plural(impacto.asignacionesAfectadas, 'evaluación', 'evaluaciones')}</strong> (
            {plural(impacto.propuestasAfectadas, 'propuesta')}). Si la modificas, esas evaluaciones tendrán que
            hacerse de nuevo.
          </p>
        </div>
      )}

      {!carga.existe && (
        <div className="flex items-start gap-3 p-4 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]" role="note">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-[#5b5f66]" />
          <p className="text-sm text-[#5b5f66] leading-relaxed">
            Esta convocatoria todavía no tiene rúbrica. Define los criterios con su peso y su escala; los evaluadores
            calificarán cada propuesta con ellos.
          </p>
        </div>
      )}

      <Input
        id="rubrica-nombre"
        label="Nombre de la rúbrica"
        value={form.nombre}
        onChange={cambiarNombre}
        placeholder="Rúbrica de ponencias 2026"
        error={errores.nombre}
        maxLength={LIMITES_RUBRICA.nombre}
        disabled={guardando}
        required
      />

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[#1f2023]">Criterios ({form.criterios.length})</p>
            <p className="text-xs text-[#5b5f66]">
              La escala de cada criterio puede ir de {ESCALA_LIMITE_MINIMO} a {ESCALA_LIMITE_MAXIMO}.
            </p>
          </div>
          <button
            type="button"
            onClick={repartir}
            disabled={guardando || form.criterios.length === 0}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a6192e] hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
          >
            <Shapes className="w-3.5 h-3.5" />
            Repartir pesos en partes iguales
          </button>
        </div>

        {errores.criterios && (
          <p className="text-xs text-[#7a0c1e] font-medium" role="alert">
            {errores.criterios}
          </p>
        )}

        <ol className="space-y-3">
          {form.criterios.map((criterio, i) => (
            <li key={criterio.clave} className="p-4 rounded-[12px] border border-[#e5e7ea] bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_110px_90px_90px_auto] items-start gap-3">
                <Input
                  id={`criterio-${criterio.clave}-nombre`}
                  label={`Criterio ${i + 1}`}
                  value={criterio.nombre}
                  onChange={cambiarCriterio(i, 'nombre')}
                  placeholder="Originalidad"
                  error={errores[`criterios[${i}].nombre`]}
                  maxLength={LIMITES_RUBRICA.criterio}
                  disabled={guardando}
                  required
                />
                <Input
                  id={`criterio-${criterio.clave}-peso`}
                  label="Peso (%)"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={criterio.pesoPorcentual}
                  onChange={cambiarCriterio(i, 'pesoPorcentual')}
                  placeholder="40"
                  error={errores[`criterios[${i}].pesoPorcentual`]}
                  disabled={guardando}
                  required
                />
                <Input
                  id={`criterio-${criterio.clave}-min`}
                  label="Escala mín."
                  type="number"
                  inputMode="decimal"
                  min={ESCALA_LIMITE_MINIMO}
                  max={ESCALA_LIMITE_MAXIMO}
                  step="0.5"
                  value={criterio.escalaMinima}
                  onChange={cambiarCriterio(i, 'escalaMinima')}
                  error={errores[`criterios[${i}].escalaMinima`]}
                  disabled={guardando}
                />
                <Input
                  id={`criterio-${criterio.clave}-max`}
                  label="Escala máx."
                  type="number"
                  inputMode="decimal"
                  min={ESCALA_LIMITE_MINIMO}
                  max={ESCALA_LIMITE_MAXIMO}
                  step="0.5"
                  value={criterio.escalaMaxima}
                  onChange={cambiarCriterio(i, 'escalaMaxima')}
                  error={errores[`criterios[${i}].escalaMaxima`]}
                  disabled={guardando}
                />
                <button
                  type="button"
                  onClick={() => quitarCriterio(i)}
                  disabled={guardando || form.criterios.length === 1}
                  title={form.criterios.length === 1 ? 'La rúbrica necesita al menos un criterio' : `Quitar el criterio ${i + 1}`}
                  aria-label={`Quitar el criterio ${i + 1}`}
                  className="sm:mt-[26px] w-11 h-11 inline-flex items-center justify-center rounded-[8px] border border-[#a6192e]/20 text-[#a6192e] bg-[#fdecec]/50 hover:bg-[#fdecec] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>

        <Button
          type="button"
          variant="outline"
          onClick={agregarCriterio}
          disabled={guardando || form.criterios.length >= LIMITES_RUBRICA.maxCriterios}
        >
          <Plus className="w-4 h-4" />
          <span>Agregar criterio</span>
        </Button>
      </div>

      {/* Criterios 1 y 2: suma de pesos en vivo */}
      <div className="p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8]">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#1f2023]">Suma de pesos</span>
          <span className={`font-bold ${colores.texto}`} aria-live="polite">
            {formatearPeso(suma)}% de 100%
          </span>
        </div>
        <div
          className="mt-2 h-2 rounded-full bg-[#e5e7ea] overflow-hidden"
          role="progressbar"
          aria-label="Suma de pesos de los criterios"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={anchoBarra}
        >
          <div className={`h-full ${colores.barra} transition-all`} style={{ width: `${anchoBarra}%` }} />
        </div>
        {errores.pesoPorcentual ? (
          <p className="text-xs text-[#7a0c1e] font-medium mt-2" role="alert">
            {errores.pesoPorcentual}
          </p>
        ) : suma !== 100 ? (
          <p className="text-xs text-[#5b5f66] mt-2">
            {suma < 100 ? `Faltan ${formatearPeso(100 - suma)}% por asignar.` : `Sobran ${formatearPeso(suma - 100)}%.`}
          </p>
        ) : (
          <p className="text-xs text-[#107e3e] mt-2 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Los pesos suman 100%.
          </p>
        )}
      </div>

      {errorGeneral && (
        <p className="text-sm text-[#7a0c1e] bg-[#fdecec] px-3 py-2 rounded-[8px]" role="alert">
          {errorGeneral}
        </p>
      )}
      {aviso && (
        <p className="text-sm text-[#0b5a2c] bg-[#e8f5ee] border border-[#107e3e]/20 px-3 py-2 rounded-[8px]" role="status">
          {aviso}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={guardando}>
          <Save className="w-4 h-4" />
          <span>{carga.existe ? 'Guardar cambios' : 'Crear rúbrica'}</span>
        </Button>
      </div>
    </form>
  );
}

RubricaEditor.propTypes = {
  convocatoriaId: PropTypes.number.isRequired,
  api: PropTypes.shape({
    obtenerRubrica: PropTypes.func.isRequired,
    obtenerImpacto: PropTypes.func.isRequired,
    configurarRubrica: PropTypes.func.isRequired,
  }).isRequired,
  onGuardada: PropTypes.func,
};
