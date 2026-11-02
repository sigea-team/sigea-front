import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import { History, KeyRound, RotateCw } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import Button from '../../../components/ui/Button';
import HistorialVersiones from './HistorialVersiones';
import { interpretarErrorPropuesta, puedeAutorizarEdicion } from '../documentoUtils';

/**
 * @file HistorialVersionesModal.jsx
 * @description Modal con el historial de versiones de una propuesta (HU-14, Criterio 4). Lo usan el autor
 * (Mis propuestas), el administrador (propuestas de la convocatoria) y el evaluador asignado (bandeja de
 * evaluaciones); el backend decide quién puede verlo (RNF08).
 * Si quien lo abre es administrador y la propuesta tiene versión definitiva, ofrece conceder la
 * autorización explícita de edición (Criterio 5). El padre debe montarlo con una `key` por propuesta.
 * @module features/propuestas/components/HistorialVersionesModal
 */

const ESTILO_ALERTA = {
  confirmButtonColor: '#a6192e',
  customClass: {
    popup: 'rounded-[16px]',
    confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
    cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
  },
};

/**
 * @param {Object} props
 * @param {{ id: number, titulo?: string, estado?: string }} props.propuesta
 * @param {Object} props.api - `propuestaService` (o su versión simulada).
 * @param {boolean} [props.esAdmin=false] - Muestra la autorización explícita de edición.
 * @param {function(): void} props.onClose
 * @param {function(): void} [props.onAutorizada] - Se llama tras conceder la autorización.
 */
export default function HistorialVersionesModal({ propuesta, api, esAdmin = false, onClose, onAutorizada }) {
  const [versiones, setVersiones] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const propuestaId = propuesta?.id;

  useEffect(() => {
    if (!propuestaId) return undefined;
    let activo = true;
    api
      .listarVersiones(propuestaId)
      .then((lista) => {
        if (!activo) return;
        setVersiones(lista);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(interpretarErrorPropuesta(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [api, propuestaId, version]);

  const reintentar = () => {
    setError(null);
    setVersiones(null);
    setVersion((v) => v + 1);
  };

  const autorizar = async () => {
    const { value: motivo, isConfirmed } = await Swal.fire({
      ...ESTILO_ALERTA,
      title: 'Autorizar modificación',
      text: 'La propuesta está en versión definitiva. La autorización permite al autor crear una sola versión nueva y se consume al usarla.',
      input: 'textarea',
      inputLabel: 'Motivo de la autorización',
      inputPlaceholder: 'Ej. Corrección de forma solicitada por el comité',
      inputAttributes: { maxlength: '500' },
      showCancelButton: true,
      confirmButtonText: 'Autorizar',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#5b5f66',
      inputValidator: (valor) => (!valor || !valor.trim() ? 'El motivo es obligatorio.' : undefined),
    });
    if (!isConfirmed) return;

    try {
      const respuesta = await api.autorizarEdicion(propuestaId, motivo.trim());
      await Swal.fire({ ...ESTILO_ALERTA, icon: 'success', title: 'Modificación autorizada', text: respuesta?.mensaje });
      if (onAutorizada) onAutorizada();
    } catch (err) {
      const { titulo, mensaje } = interpretarErrorPropuesta(err);
      Swal.fire({ ...ESTILO_ALERTA, icon: 'error', title: titulo, text: mensaje, confirmButtonText: 'Entendido' });
    }
  };

  const mostrarAutorizar = esAdmin && versiones && puedeAutorizarEdicion(versiones, propuesta?.estado);

  return (
    <ModalShell
      titulo="Historial de versiones"
      subtitulo={propuesta?.titulo}
      icono={History}
      onClose={onClose}
      ancho="max-w-3xl"
      tituloId="historial-versiones-titulo"
      pie={
        <>
          {mostrarAutorizar && (
            <Button type="button" variant="outline" onClick={autorizar}>
              <KeyRound className="w-4 h-4" />
              Autorizar modificación
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      {error && (
        <div className="py-10 text-center">
          <p className="font-semibold text-[#1f2023]">No se pudo cargar el historial</p>
          <p className="text-xs mt-1 text-[#5b5f66]">{error}</p>
          <button
            type="button"
            onClick={reintentar}
            className="inline-flex items-center gap-1 text-xs mt-2 text-[#a6192e] font-semibold underline cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

      {!error && !versiones && (
        <p className="py-10 text-center text-[#5b5f66]" role="status">
          Cargando versiones...
        </p>
      )}

      {!error && versiones && (
        <HistorialVersiones
          versiones={versiones}
          onDescargar={(doc) => api.descargarDocumento(propuestaId, doc)}
        />
      )}
    </ModalShell>
  );
}

HistorialVersionesModal.propTypes = {
  propuesta: PropTypes.shape({
    id: PropTypes.number.isRequired,
    titulo: PropTypes.string,
    estado: PropTypes.string,
  }).isRequired,
  api: PropTypes.object.isRequired,
  esAdmin: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onAutorizada: PropTypes.func,
};
