import { useState } from 'react';
import Swal from 'sweetalert2';
import { Send, FileText, Calendar, AlertCircle } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import TextArea from '../../eventos/components/TextArea';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import AutorFormSection from './AutorFormSection';
import AutoresList from './AutoresList';
import { validarPropuesta } from '../propuestaUtils';
import { propuestaService } from '../../../api/propuestaService';
import { formatearFechaHora } from '../../convocatorias/convocatoriaUtils';

/**
 * @file PropuestaFormModal.jsx
 * @description Modal para el envío de propuestas académicas asociando autores y ponentes (HU Registro de Autores y Ponentes).
 * Satisface:
 * - Criterio 1: Dado que estoy enviando una propuesta, cuando registro mis datos como autor o ponente, entonces el sistema los asocia a la propuesta enviada.
 * - Criterio 2: Dado que una propuesta tiene varios autores, cuando registro cada uno con su rol específico (autor principal, coautor, ponente), entonces el sistema los guarda diferenciadamente.
 * - Criterio 3: Dado que intento registrar un autor sin datos obligatorios (nombre, correo, filiación), cuando confirmo el registro, entonces el sistema rechaza la operación y señala los campos faltantes.
 * @module features/propuestas/components/PropuestaFormModal
 */

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
  const [errores, setErrores] = useState({});
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
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      Swal.fire({
        icon: 'error',
        title: 'Verifique los campos requeridos',
        text: errs.autores || errs.titulo || errs.resumen || 'Por favor complete todos los datos requeridos antes de enviar la propuesta.',
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
    try {
      // Criterio 1: Se asocian los datos de los autores y ponentes a la propuesta enviada
      const respuesta = await api.enviarPropuesta(datosPropuesta);

      // Mapear roles a etiquetas legibles para el mensaje de éxito
      const rolesLegibles = {
        autor_principal: 'Autor Principal',
        coautor: 'Coautor',
        ponente: 'Ponente',
      };

      Swal.fire({
        ...ALERTA_EXITO,
        title: '¡Propuesta enviada con éxito!',
        html: `
          <p class="text-sm text-[#5b5f66] mb-3">
            La propuesta <strong>«${datosPropuesta.titulo}»</strong> ha sido registrada con <strong>${autores.length} autor(es)/ponente(s)</strong> vinculados correctamente.
          </p>
          <div class="bg-[#f7f7f8] border border-[#e5e7ea] rounded-[8px] p-3 text-left text-xs space-y-1">
            <p><strong>Convocatoria:</strong> ${convocatoria?.titulo || 'Convocatoria académica'}</p>
            <p><strong>Evento:</strong> ${convocatoria?.eventoNombre || 'Evento UFPS'}</p>
            <p><strong>Autores asociados:</strong> ${autores.map((a) => `${a.nombreCompleto} (${rolesLegibles[a.rol] || a.rol})`).join(', ')}</p>
          </div>
        `,
      });

      if (onPropuestaEnviada) {
        onPropuestaEnviada(respuesta);
      }
      onClose();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      // Extraer mensaje de error del backend
      let titulo = 'Error al enviar propuesta';
      let msg = 'Ocurrió un error al enviar la propuesta. Intente nuevamente.';

      if (status === 400) {
        titulo = 'Datos inválidos';
        msg = data?.mensaje || data?.message || 'Verifique que todos los campos obligatorios estén completos y sean válidos.';
      } else if (status === 404) {
        titulo = 'Recurso no encontrado';
        msg = data?.mensaje || data?.message || 'La convocatoria seleccionada no fue encontrada o ya no está disponible.';
      } else if (status === 409) {
        titulo = 'Conflicto detectado';
        msg = data?.mensaje || data?.message || 'Un autor ya se encuentra registrado en esta propuesta con los mismos datos.';
      } else {
        msg = data?.mensaje || data?.message || err?.message || msg;
      }

      Swal.fire({
        icon: 'error',
        title: titulo,
        text: msg,
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
          <div className="bg-[#f7f7f8] border border-[#e5e7ea] rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a6192e] block">
                Evento asociado
              </span>
              <p className="text-sm font-semibold text-[#1f2023]">
                {convocatoria.eventoNombre || 'Evento Académico UFPS'}
              </p>
            </div>
            {convocatoria.fechaCierre && (
              <div className="flex items-center gap-1.5 text-xs text-[#5b5f66] bg-white border border-[#e5e7ea] px-3 py-1.5 rounded-[8px] self-start sm:self-auto">
                <Calendar className="w-3.5 h-3.5 text-[#a6192e]" />
                <span>Cierre: {formatearFechaHora(convocatoria.fechaCierre)}</span>
              </div>
            )}
          </div>
        )}

        {/* Datos generales de la propuesta */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5b5f66]">
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

        {/* Sección de Autores y Ponentes (HU Principal) */}
        <div className="space-y-4 pt-2 border-t border-[#e5e7ea]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5b5f66]">
                Identificación de Autores y Ponentes (*)
              </h3>
              <p className="text-xs text-[#5b5f66] mt-0.5">
                Criterios 1, 2 y 3: Registre los participantes asociando su rol específico (Autor Principal, Coautor, Ponente).
              </p>
            </div>
          </div>

          {errores.autores && (
            <div className="flex items-center gap-2 bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e] text-xs rounded-[8px] p-3">
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
