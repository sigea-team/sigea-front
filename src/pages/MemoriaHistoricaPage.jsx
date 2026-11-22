import { useEffect, useMemo, useState } from 'react';
import { Archive, CheckCheck, Eye, Info, RotateCw, Search, ShieldAlert } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import MemoriaHistoricaModal from '../features/memoria/components/MemoriaHistoricaModal';
import EliminacionHistoricaModal from '../features/memoria/components/EliminacionHistoricaModal';
import { memoriaHistoricaService } from '../api/memoriaHistoricaService';
import { etiquetaModalidad, formatearRango } from '../features/eventos/eventoUtils';
import { formatearFechaHora } from '../features/encuestas/encuestaUtils';
import {
  formatearValorIndicador,
  interpretarErrorMemoria,
  puedeEliminarConAutorizacion,
  semestresDisponibles,
} from '../features/memoria/memoriaUtils';
import { useAuth } from '../context/AuthContext';

/**
 * @file MemoriaHistoricaPage.jsx
 * @description Archivo institucional de los eventos cerrados formalmente (HU-28: RF55, CU-32; Criterio 2). Lista los
 * eventos de la memoria histórica del más reciente al más antiguo, con sus indicadores principales; se filtra por
 * semestre, por nombre y por familia de ediciones. Cada evento se consulta en detalle, solo para consulta.
 * Quien tiene la autorización especial (permiso MEMORIA_HISTORICA_ELIMINAR) puede eliminar un evento (Criterio 3).
 * Ruta: /memoria-historica
 * @module pages/MemoriaHistoricaPage
 */

const TODOS = 'todos';

/**
 * @param {Object} props
 * @param {typeof memoriaHistoricaService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {Object} [props.usuarioProp] - Usuario de la sesión (Storybook).
 * @param {Function} [props.onSelectNav]
 */
export default function MemoriaHistoricaPage({ api = memoriaHistoricaService, usuarioProp, onSelectNav }) {
  const auth = useAuth();
  const usuario = usuarioProp || auth?.usuario;
  const puedeEliminar = puedeEliminarConAutorizacion(usuario);

  const [memorias, setMemorias] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState(null);

  const [texto, setTexto] = useState('');
  const [semestre, setSemestre] = useState(TODOS);
  const [familia, setFamilia] = useState(null); // { id, nombre } del evento cuya familia se está viendo

  const [abierta, setAbierta] = useState(null); // { tipo: 'detalle'|'eliminar', evento }

  // El filtro por familia lo resuelve el backend; semestre y nombre se filtran aquí sobre la lista cargada.
  useEffect(() => {
    let activo = true;
    api
      .listarMemorias(familia ? { familiaEventoId: familia.id } : {})
      .then((lista) => {
        if (!activo) return;
        setMemorias(lista);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(interpretarErrorMemoria(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [api, version, familia]);

  const recargar = () => setVersion((v) => v + 1);

  const reintentar = () => {
    setError(null);
    setMemorias(null);
    recargar();
  };

  const semestres = useMemo(() => semestresDisponibles(memorias), [memorias]);
  const opcionesSemestre = [
    { value: TODOS, label: 'Todos los semestres' },
    ...semestres.map((s) => ({ value: s, label: s })),
  ];

  const visibles = useMemo(() => {
    if (!memorias) return null;
    const buscado = texto.trim().toLowerCase();
    return memorias.filter((m) => {
      if (semestre !== TODOS && m.semestre !== semestre) return false;
      return !buscado || (m.nombre || '').toLowerCase().includes(buscado);
    });
  }, [memorias, texto, semestre]);

  const verFamilia = (m) => {
    setAviso(null);
    setMemorias(null);
    setFamilia({ id: m.eventoId, nombre: m.nombre });
  };

  return (
    <MainLayout title="Memoria histórica" activeNav="memoria-historica" onSelectNav={onSelectNav} usuario={usuario}>
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5" aria-hidden="true" />
            SIGEA — Memoria histórica
          </span>
          <h2 className="font-serif-title text-2xl sm:text-3xl text-ink-900 mt-1 tracking-tight">Archivo de eventos</h2>
          <p className="text-sm text-ink-600 mt-1 max-w-2xl">
            Eventos cerrados formalmente. Su información quedó consolidada al cierre y solo se puede consultar.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="w-full md:max-w-sm">
            <Input
              id="buscar-memoria"
              label="Buscar"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Nombre del evento"
              rightElement={<Search className="w-4 h-4 text-ink-600" />}
            />
          </div>
          <div className="w-full md:w-56">
            <Select
              id="filtro-semestre-memoria"
              label="Semestre"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              options={opcionesSemestre}
            />
          </div>
          <p className="md:ml-auto text-xs text-ink-600 md:pb-3">
            {visibles ? `${visibles.length} de ${memorias.length} eventos` : 'Cargando...'}
          </p>
        </div>

        {familia && (
          <p className="text-sm text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px] flex flex-wrap items-center gap-2" role="status">
            <Info className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
            Ediciones de la familia de «{familia.nombre}».
            <button
              type="button"
              onClick={() => {
                setMemorias(null);
                setFamilia(null);
              }}
              className="font-semibold text-brand-600 underline cursor-pointer"
            >
              Ver todos los eventos
            </button>
          </p>
        )}

        {aviso && (
          <p className="text-sm text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px] flex items-center gap-2" role="status">
            <CheckCheck className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
            {aviso}
          </p>
        )}

        {error && (
          <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700 text-sm flex items-center justify-between gap-4" role="alert">
            <span>{error}</span>
            <button type="button" onClick={reintentar} className="inline-flex items-center gap-1 font-semibold underline cursor-pointer">
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        )}

        {!error && !visibles && (
          <p className="text-sm text-ink-600 py-6 text-center" role="status">Cargando la memoria histórica...</p>
        )}

        {!error && visibles && visibles.length === 0 && (
          <div className="p-8 rounded-[12px] border border-dashed border-field-border bg-white text-center space-y-1">
            <p className="text-sm font-semibold text-ink-900">
              {memorias.length === 0 ? 'Todavía no hay eventos en la memoria histórica.' : 'Ningún evento coincide con la búsqueda.'}
            </p>
            <p className="text-sm text-ink-600">
              {memorias.length === 0
                ? 'Un evento entra a la memoria cuando el organizador hace su cierre formal desde Eventos.'
                : 'Prueba con otro nombre o cambia el semestre.'}
            </p>
          </div>
        )}

        {!error && visibles && visibles.length > 0 && (
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visibles.map((m) => (
              <li key={m.memoriaId} className="p-5 rounded-[12px] border border-border bg-white flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-ink-600">
                      {[m.tipoEvento, m.semestre, m.modalidad ? etiquetaModalidad(m.modalidad) : null].filter(Boolean).join(' · ')}
                    </p>
                    <p className="font-semibold text-ink-900 mt-0.5">{m.nombre}</p>
                    <p className="text-xs text-ink-600 mt-0.5">{formatearRango(m.fechaInicio, m.fechaFin)}</p>
                  </div>
                </div>
                {m.indicadores?.length > 0 && (
                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {m.indicadores.map((i) => (
                      <div key={i.codigo} className="p-2 rounded-[8px] bg-surface-muted border border-border">
                        <dd className="text-base font-semibold text-ink-900 tabular-nums">{formatearValorIndicador(i)}</dd>
                        <dt className="text-[11px] text-ink-600 leading-tight">{i.nombre}</dt>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-auto pt-1">
                  <p className="text-xs text-ink-600">
                    Cerrado el {formatearFechaHora(m.fechaConsolidacion)}
                    {m.cerradaPor ? ` por ${m.cerradaPor}` : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    {!familia && (
                      <Button type="button" variant="outline" onClick={() => verFamilia(m)} className="h-9 px-3 text-xs">
                        Ediciones
                      </Button>
                    )}
                    {puedeEliminar && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAbierta({ tipo: 'eliminar', evento: { id: m.eventoId, nombre: m.nombre } })}
                        className="h-9 px-3 text-xs"
                        aria-label={`Eliminar ${m.nombre} con autorización especial`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                        Eliminar
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setAbierta({ tipo: 'detalle', evento: { id: m.eventoId, nombre: m.nombre } })}
                      className="h-9 px-3 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      Ver memoria
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {abierta?.tipo === 'detalle' && (
        <MemoriaHistoricaModal
          key={`memoria-${abierta.evento.id}`}
          evento={abierta.evento}
          api={api}
          onClose={() => setAbierta(null)}
          onEliminar={puedeEliminar ? () => setAbierta({ tipo: 'eliminar', evento: abierta.evento }) : undefined}
        />
      )}

      {abierta?.tipo === 'eliminar' && (
        <EliminacionHistoricaModal
          key={`eliminar-memoria-${abierta.evento.id}`}
          evento={abierta.evento}
          api={api}
          onClose={() => setAbierta(null)}
          onEliminado={(mensaje) => {
            setAbierta(null);
            setAviso(mensaje);
            recargar();
          }}
        />
      )}
    </MainLayout>
  );
}
