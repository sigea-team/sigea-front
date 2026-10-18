import { useState, useEffect } from 'react';
import { UserPlus, Check, Sparkles, AlertCircle } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { OPCIONES_ROL_AUTOR, ROLES_AUTOR, validarAutor } from '../propuestaUtils';
import { useAuth } from '../../../context/AuthContext';

/**
 * @file AutorFormSection.jsx
 * @description Formulario para registrar o editar un autor o ponente dentro de una propuesta.
 * Satisface:
 * - Criterio 2: Registro con rol específico (Autor Principal, Coautor, Ponente).
 * - Criterio 3: Validación estricta de datos obligatorios (nombre, correo, filiación).
 * @module features/propuestas/components/AutorFormSection
 */

const AUTOR_VACIO = {
  nombreCompleto: '',
  correo: '',
  filiacion: '',
  rol: ROLES_AUTOR.AUTOR_PRINCIPAL,
};

export default function AutorFormSection({
  onAgregarAutor,
  autorEnEdicion = null,
  onCancelarEdicion,
  autoresActuales = [],
}) {
  const { usuario } = useAuth();
  const [formData, setFormData] = useState(() => autorEnEdicion || AUTOR_VACIO);
  const [errores, setErrores] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCargarMisDatos = () => {
    if (!usuario) return;
    setFormData((prev) => ({
      ...prev,
      nombreCompleto: usuario.nombreCompleto || usuario.nombre || '',
      correo: usuario.correo || usuario.email || '',
      filiacion: 'Universidad Francisco de Paula Santander (UFPS)',
      rol: prev.rol || ROLES_AUTOR.AUTOR_PRINCIPAL,
    }));
    setErrores({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Criterio 3: Rechaza la operación si faltan datos obligatorios y señala los campos
    const errs = validarAutor(formData);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      return;
    }

    onAgregarAutor({
      ...formData,
      id: autorEnEdicion?.id || Date.now(),
    });

    setFormData(AUTOR_VACIO);
    setErrores({});
  };

  const esEdicion = Boolean(autorEnEdicion);

  return (
    <div className="bg-[#f7f7f8] rounded-[16px] border border-[#e5e7ea] p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1f2023] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#a6192e]" />
            {esEdicion ? 'Editar datos del autor / ponente' : 'Agregar autor o ponente a la propuesta'}
          </h3>
          <p className="text-xs text-[#5b5f66] mt-0.5">
            Diligencie los campos requeridos con su rol específico en la ponencia.
          </p>
        </div>

        {!esEdicion && usuario && (
          <button
            type="button"
            onClick={handleCargarMisDatos}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#a6192e] bg-white border border-[#a6192e]/30 rounded-[8px] hover:bg-[#fdecec] transition-colors cursor-pointer shadow-2xs"
            title="Autocompletar con mis datos de usuario autenticado"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Usar mis datos
          </button>
        )}
      </div>

      {Object.keys(errores).length > 0 && (
        <div className="mb-4 flex items-start gap-2 bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e] text-xs rounded-[8px] p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Faltan campos obligatorios para registrar al autor (Criterio 3):</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {Object.values(errores).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre Completo"
            name="nombreCompleto"
            value={formData.nombreCompleto}
            onChange={handleChange}
            placeholder="Ej. Ing. Carlos Mendoza"
            error={errores.nombreCompleto}
            required
          />

          <Input
            label="Correo Electrónico"
            name="correo"
            type="email"
            value={formData.correo}
            onChange={handleChange}
            placeholder="ejemplo@ufps.edu.co"
            error={errores.correo}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Filiación Institucional"
            name="filiacion"
            value={formData.filiacion}
            onChange={handleChange}
            placeholder="Ej. Universidad Francisco de Paula Santander"
            error={errores.filiacion}
            required
          />

          <Select
            label="Rol en la Propuesta"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            options={OPCIONES_ROL_AUTOR}
            error={errores.rol}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          {esEdicion && (
            <Button type="button" variant="secondary" onClick={onCancelarEdicion}>
              Cancelar edición
            </Button>
          )}
          <Button type="submit" variant="primary">
            {esEdicion ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Actualizar autor
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1.5" />
                Añadir autor
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
