import { BookOpen, GraduationCap, Plus, Trash2 } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import TextArea from '../../eventos/components/TextArea';
import {
  LIMITES_CONFERENCISTA,
  NIVELES_ESTUDIO,
  TIPOS_PUBLICACION,
  estudioVacio,
  publicacionVacia,
} from '../conferencistaUtils';

/**
 * @file TrayectoriaFields.jsx
 * @description Campos de la trayectoria académica y profesional del conferencista (HU-12, Criterio 1):
 * biografía, cargo, institución, enlace de perfil y las listas de estudios y publicaciones.
 * Se reutiliza al registrar, al asociar a una persona sin trayectoria y al editar (Criterio 4).
 * Es un componente controlado: el formulario padre guarda el estado y los errores.
 * @module features/conferencistas/components/TrayectoriaFields
 */

const BOTON_QUITAR =
  'mt-[26px] w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-[8px] border border-[#a6192e]/20 text-[#a6192e] bg-[#fdecec]/50 hover:bg-[#fdecec] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e]';

const BOTON_AGREGAR =
  'inline-flex items-center gap-1.5 text-sm font-semibold text-[#a6192e] hover:text-[#7a0c1e] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:underline';

/**
 * @param {Object} props
 * @param {Object} props.form - Estado del formulario (biografia, cargoActual, institucion, enlacePerfil, estudios, publicaciones).
 * @param {Object} props.errores - Errores por campo ("biografia", "estudios.0.titulo", ...).
 * @param {function(string, any): void} props.onCambiar - Cambia un campo de primer nivel del formulario.
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.idPrefijo='tray'] - Prefijo de los id HTML (evita duplicados si hay dos formularios).
 */
export default function TrayectoriaFields({ form, errores, onCambiar, disabled = false, idPrefijo = 'tray' }) {
  const campo = (nombre) => (e) => onCambiar(nombre, e.target.value);

  const cambiarFila = (lista, indice, nombre, valor) =>
    onCambiar(lista, form[lista].map((fila, i) => (i === indice ? { ...fila, [nombre]: valor } : fila)));
  const quitarFila = (lista, indice) => onCambiar(lista, form[lista].filter((_, i) => i !== indice));

  const puedeAgregarEstudio = form.estudios.length < LIMITES_CONFERENCISTA.estudios;
  const puedeAgregarPublicacion = form.publicaciones.length < LIMITES_CONFERENCISTA.publicaciones;

  return (
    <div className="space-y-5">
      <div>
        <TextArea
          id={`${idPrefijo}-biografia`}
          label="Biografía *"
          value={form.biografia}
          onChange={campo('biografia')}
          rows={5}
          maxLength={LIMITES_CONFERENCISTA.biografia}
          placeholder="Reseña breve de su perfil académico y profesional. Se publica en la agenda y el material de difusión."
          error={errores.biografia}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id={`${idPrefijo}-cargo`}
          label="Cargo actual"
          value={form.cargoActual}
          onChange={campo('cargoActual')}
          placeholder="Profesora titular"
          error={errores.cargoActual}
          maxLength={LIMITES_CONFERENCISTA.cargoActual}
          disabled={disabled}
        />
        <Input
          id={`${idPrefijo}-institucion`}
          label="Institución o empresa"
          value={form.institucion}
          onChange={campo('institucion')}
          placeholder="Universidad Nacional de Colombia"
          error={errores.institucion}
          maxLength={LIMITES_CONFERENCISTA.institucion}
          disabled={disabled}
        />
      </div>

      <Input
        id={`${idPrefijo}-enlace`}
        type="url"
        label="Enlace a su perfil (CvLAC, ORCID, Google Scholar, LinkedIn)"
        value={form.enlacePerfil}
        onChange={campo('enlacePerfil')}
        placeholder="https://orcid.org/0000-0002-1825-0097"
        error={errores.enlacePerfil}
        maxLength={LIMITES_CONFERENCISTA.enlacePerfil}
        disabled={disabled}
      />

      {/* ----- Estudios ----- */}
      <fieldset className="rounded-[12px] border border-[#e5e7ea] p-4">
        <legend className="px-1.5 text-sm font-semibold text-[#1f2023] flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-[#a6192e]" />
          Estudios
        </legend>
        {form.estudios.length === 0 && (
          <p className="text-xs text-[#5b5f66]">Sin estudios registrados. Son opcionales.</p>
        )}
        {errores.estudios && <p className="text-xs text-[#7a0c1e] font-medium">{errores.estudios}</p>}
        <div className="space-y-3">
          {form.estudios.map((estudio, i) => (
            <div
              key={estudio.clave}
              className="grid grid-cols-1 sm:grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)_96px_auto] items-start gap-3"
            >
              <Select
                id={`${idPrefijo}-est-${i}-nivel`}
                label="Nivel"
                value={estudio.nivel}
                onChange={(e) => cambiarFila('estudios', i, 'nivel', e.target.value)}
                options={NIVELES_ESTUDIO}
                placeholder="Nivel"
                error={errores[`estudios.${i}.nivel`]}
                disabled={disabled}
              />
              <Input
                id={`${idPrefijo}-est-${i}-titulo`}
                label="Título obtenido"
                value={estudio.titulo}
                onChange={(e) => cambiarFila('estudios', i, 'titulo', e.target.value)}
                placeholder="Doctora en Ingeniería"
                error={errores[`estudios.${i}.titulo`]}
                maxLength={LIMITES_CONFERENCISTA.tituloEstudio}
                disabled={disabled}
              />
              <Input
                id={`${idPrefijo}-est-${i}-institucion`}
                label="Institución"
                value={estudio.institucion}
                onChange={(e) => cambiarFila('estudios', i, 'institucion', e.target.value)}
                placeholder="Universidad Nacional"
                error={errores[`estudios.${i}.institucion`]}
                maxLength={LIMITES_CONFERENCISTA.institucionEstudio}
                disabled={disabled}
              />
              <Input
                id={`${idPrefijo}-est-${i}-anio`}
                label="Año"
                inputMode="numeric"
                value={estudio.anio}
                onChange={(e) => cambiarFila('estudios', i, 'anio', e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="2018"
                error={errores[`estudios.${i}.anio`]}
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => quitarFila('estudios', i)}
                disabled={disabled}
                className={BOTON_QUITAR}
                title="Quitar estudio"
                aria-label={`Quitar estudio ${i + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onCambiar('estudios', [...form.estudios, estudioVacio()])}
          disabled={disabled || !puedeAgregarEstudio}
          className={`${BOTON_AGREGAR} mt-3`}
        >
          <Plus className="w-4 h-4" />
          Agregar estudio
        </button>
      </fieldset>

      {/* ----- Publicaciones ----- */}
      <fieldset className="rounded-[12px] border border-[#e5e7ea] p-4">
        <legend className="px-1.5 text-sm font-semibold text-[#1f2023] flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-[#a6192e]" />
          Publicaciones
        </legend>
        {form.publicaciones.length === 0 && (
          <p className="text-xs text-[#5b5f66]">Sin publicaciones registradas. Son opcionales.</p>
        )}
        {errores.publicaciones && <p className="text-xs text-[#7a0c1e] font-medium">{errores.publicaciones}</p>}
        <div className="space-y-4">
          {form.publicaciones.map((pub, i) => (
            <div key={pub.clave} className="space-y-3 pb-4 border-b border-dashed border-[#e5e7ea] last:border-b-0 last:pb-0">
              <div className="grid grid-cols-1 sm:grid-cols-[170px_minmax(0,1fr)_auto] items-start gap-3">
                <Select
                  id={`${idPrefijo}-pub-${i}-tipo`}
                  label="Tipo"
                  value={pub.tipo}
                  onChange={(e) => cambiarFila('publicaciones', i, 'tipo', e.target.value)}
                  options={TIPOS_PUBLICACION}
                  placeholder="Tipo"
                  error={errores[`publicaciones.${i}.tipo`]}
                  disabled={disabled}
                />
                <Input
                  id={`${idPrefijo}-pub-${i}-titulo`}
                  label="Título"
                  value={pub.titulo}
                  onChange={(e) => cambiarFila('publicaciones', i, 'titulo', e.target.value)}
                  placeholder="Arquitecturas de microservicios en sistemas académicos"
                  error={errores[`publicaciones.${i}.titulo`]}
                  maxLength={LIMITES_CONFERENCISTA.tituloPublicacion}
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() => quitarFila('publicaciones', i)}
                  disabled={disabled}
                  className={BOTON_QUITAR}
                  title="Quitar publicación"
                  aria-label={`Quitar publicación ${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] items-start gap-3 sm:pr-14">
                <Input
                  id={`${idPrefijo}-pub-${i}-medio`}
                  label="Revista, editorial o evento"
                  value={pub.medio}
                  onChange={(e) => cambiarFila('publicaciones', i, 'medio', e.target.value)}
                  placeholder="Revista Colombiana de Computación"
                  error={errores[`publicaciones.${i}.medio`]}
                  maxLength={LIMITES_CONFERENCISTA.medio}
                  disabled={disabled}
                />
                <Input
                  id={`${idPrefijo}-pub-${i}-anio`}
                  label="Año"
                  inputMode="numeric"
                  value={pub.anio}
                  onChange={(e) => cambiarFila('publicaciones', i, 'anio', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="2024"
                  error={errores[`publicaciones.${i}.anio`]}
                  disabled={disabled}
                />
                <Input
                  id={`${idPrefijo}-pub-${i}-enlace`}
                  type="url"
                  label="Enlace o DOI"
                  value={pub.enlace}
                  onChange={(e) => cambiarFila('publicaciones', i, 'enlace', e.target.value)}
                  placeholder="https://doi.org/..."
                  error={errores[`publicaciones.${i}.enlace`]}
                  maxLength={LIMITES_CONFERENCISTA.enlace}
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onCambiar('publicaciones', [...form.publicaciones, publicacionVacia()])}
          disabled={disabled || !puedeAgregarPublicacion}
          className={`${BOTON_AGREGAR} mt-3`}
        >
          <Plus className="w-4 h-4" />
          Agregar publicación
        </button>
      </fieldset>
    </div>
  );
}
