import React, { useEffect, useState } from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { tipoEventoService } from '../../../api/tipoEventoService';
import { periodoAcademicoService } from '../../../api/periodoAcademicoService';
import { validarRangoFechas } from '../historialPeriodoUtils';

/**
 * @file FiltrosPeriodoBar.jsx
 * @description Barra de filtros común para consultas por periodo académico (HU-27, Criterio 3):
 * semestre académico, rango de fechas (fechaDesde, fechaHasta), tipo de evento y tipo de actividad.
 * @module features/historialPeriodo/components/FiltrosPeriodoBar
 */

export default function FiltrosPeriodoBar({
  filtros,
  onChangeFiltros,
  onAplicar,
  onLimpiar,
  loading = false,
  mostrarBotonAplicar = true,
  semestresDisponibles = null,
}) {
  const [semestres, setSemestres] = useState(semestresDisponibles || []);
  const [tiposEvento, setTiposEvento] = useState([]);
  const [errorRango, setErrorRango] = useState(null);

  useEffect(() => {
    if (semestresDisponibles) {
      setSemestres(semestresDisponibles);
      return;
    }
    let activo = true;
    periodoAcademicoService
      .listarSemestres()
      .then((lista) => {
        if (activo) setSemestres(lista);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [semestresDisponibles]);

  useEffect(() => {
    let activo = true;
    tipoEventoService
      .listar()
      .then((lista) => {
        if (activo && Array.isArray(lista)) setTiposEvento(lista);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  const handleChange = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    if (campo === 'fechaDesde' || campo === 'fechaHasta') {
      const error = validarRangoFechas(
        campo === 'fechaDesde' ? valor : filtros.fechaDesde,
        campo === 'fechaHasta' ? valor : filtros.fechaHasta
      );
      setErrorRango(error);
    }
    onChangeFiltros(nuevosFiltros);
  };

  const handleLimpiar = () => {
    setErrorRango(null);
    onLimpiar();
  };

  const opcionesSemestre = [
    { value: '', label: 'Todos los semestres' },
    ...semestres.map((s) => ({ value: s, label: s })),
  ];

  const opcionesTipoEvento = [
    { value: '', label: 'Todos los tipos' },
    ...tiposEvento.map((t) => ({ value: String(t.id), label: t.nombre })),
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border text-ink-900 font-semibold text-sm">
        <Filter className="w-4 h-4 text-brand-600" aria-hidden="true" />
        <span>Filtros de consulta (Criterio 3)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <Select
            id="filtro-semestre"
            label="Semestre académico"
            value={filtros.semestre || ''}
            onChange={(e) => handleChange('semestre', e.target.value)}
            options={opcionesSemestre}
            placeholder="Seleccione un semestre"
          />
        </div>

        <div>
          <Select
            id="filtro-tipo-evento"
            label="Tipo de evento"
            value={filtros.tipoEventoId ? String(filtros.tipoEventoId) : ''}
            onChange={(e) => handleChange('tipoEventoId', e.target.value ? Number(e.target.value) : '')}
            options={opcionesTipoEvento}
            placeholder="Seleccione tipo de evento"
          />
        </div>

        <div>
          <Input
            id="filtro-fecha-desde"
            label="Fecha desde"
            type="date"
            value={filtros.fechaDesde || ''}
            onChange={(e) => handleChange('fechaDesde', e.target.value)}
          />
        </div>

        <div>
          <Input
            id="filtro-fecha-hasta"
            label="Fecha hasta"
            type="date"
            value={filtros.fechaHasta || ''}
            onChange={(e) => handleChange('fechaHasta', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        <div className="lg:col-span-2">
          <Input
            id="filtro-tipo-actividad"
            label="Tipo de actividad"
            placeholder="Ej: Taller, Conferencia, Ponencia..."
            value={filtros.tipoActividad || ''}
            onChange={(e) => handleChange('tipoActividad', e.target.value)}
            helperText="Filtra las actividades por nombre o tipo específico"
          />
        </div>

        <div className="lg:col-span-2 flex items-end justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleLimpiar}
            disabled={loading}
            className="text-xs h-10 px-3"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </Button>

          {mostrarBotonAplicar && (
            <Button
              type="button"
              variant="primary"
              onClick={onAplicar}
              loading={loading}
              disabled={Boolean(errorRango)}
              className="text-xs h-10 px-4"
            >
              <Search className="w-3.5 h-3.5" />
              Aplicar filtros
            </Button>
          )}
        </div>
      </div>

      {errorRango && (
        <div className="text-xs text-brand-600 bg-brand-100/50 p-2 rounded-lg border border-brand-600/20 font-medium">
          {errorRango}
        </div>
      )}
    </div>
  );
}
