import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, GitCompare, History, UserCheck } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import HistorialPersonaTab from '../features/historialPeriodo/components/HistorialPersonaTab';
import PeriodosIndicadoresTab from '../features/historialPeriodo/components/PeriodosIndicadoresTab';
import ComparacionSemestresTab from '../features/historialPeriodo/components/ComparacionSemestresTab';
import { useAuth } from '../context/AuthContext';

/**
 * @file HistorialPeriodoPage.jsx
 * @description Vista principal para la consulta de historial de participación, análisis por periodo
 * académico y comparación de indicadores entre semestres (HU-27, Criterios 1 a 5).
 * @module pages/HistorialPeriodoPage
 */

export default function HistorialPeriodoPage({ usuarioProp, onSelectNav }) {
  const auth = useAuth();
  const usuario = usuarioProp || auth?.usuario;
  const [searchParams, setSearchParams] = useSearchParams();

  const tabInicial = searchParams.get('tab') || 'historial-persona';
  const [tabActiva, setTabActiva] = useState(tabInicial);

  const cambiarTab = (tabId) => {
    setTabActiva(tabId);
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    {
      id: 'historial-persona',
      label: 'Historial de persona',
      icono: UserCheck,
      descripcion: 'Criterios 1 y 2: Trayectoria, actividades y roles en eventos',
    },
    {
      id: 'indicadores-periodo',
      label: 'Eventos e indicadores por periodo',
      icono: BarChart3,
      descripcion: 'Criterios 3 y 4: Métricas y eventos por semestre o rango de fechas',
    },
    {
      id: 'comparar-semestres',
      label: 'Comparar semestres',
      icono: GitCompare,
      descripcion: 'Criterio 5: Análisis comparativo y tendencias entre dos semestres',
    },
  ];

  return (
    <MainLayout
      title="Historial e Indicadores"
      activeNav="historial-periodo"
      onSelectNav={onSelectNav}
      usuario={usuario}
    >
      <div className="space-y-6">
        {/* Cabecera de la página */}
        <div className="pb-4 border-b border-border">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" aria-hidden="true" />
            SIGEA — Trayectoria e Indicadores Académicos (HU-27)
          </span>
          <h2 className="font-serif-title text-2xl sm:text-3xl text-ink-900 mt-1 tracking-tight">
            Historial de Participación e Indicadores
          </h2>
          <p className="text-sm text-ink-600 mt-1 max-w-3xl leading-relaxed">
            Consulte la trayectoria y roles de una persona en los eventos del programa, filtre eventos e
            indicadores por semestre académico o rango de fechas, y compare los resultados entre periodos.
          </p>
        </div>

        {/* Selector de pestañas */}
        <div className="border-b border-border flex overflow-x-auto gap-2">
          {tabs.map((tab) => {
            const Icono = tab.icono;
            const esActiva = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => cambiarTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  esActiva
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-ink-600 hover:text-ink-900 hover:border-border'
                }`}
              >
                <Icono className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="pt-2">
          {tabActiva === 'historial-persona' && <HistorialPersonaTab />}
          {tabActiva === 'indicadores-periodo' && <PeriodosIndicadoresTab />}
          {tabActiva === 'comparar-semestres' && <ComparacionSemestresTab />}
        </div>
      </div>
    </MainLayout>
  );
}
