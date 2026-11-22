import { useMemo, useState } from 'react';
import { AlertTriangle, Lock, UserRound } from 'lucide-react';
import IndicadoresMemoria from './IndicadoresMemoria';
import { etiquetaModalidad, formatearFecha, formatearRango } from '../../eventos/eventoUtils';
import { formatearFechaHora } from '../../encuestas/encuestaUtils';
import {
  CLASIFICACIONES,
  ESTADOS_ACTIVIDAD,
  ESTADOS_PROPUESTA,
  agruparActividadesPorFecha,
  formatearHora,
  formatearPesos,
  parsearContenido,
  plural,
  propuestasDeConvocatorias,
} from '../memoriaUtils';

/**
 * @file MemoriaHistoricaDetalle.jsx
 * @description Información consolidada de un evento cerrado formalmente (HU-28, Criterio 2), solo de consulta.
 * Muestra lo que guardó el backend al cierre: resumen e indicadores, configuración (comité, líneas, tipos de
 * actividad y presupuesto), propuestas, agenda, participantes y asistencia, encuestas y certificados.
 * No tiene ningún control de edición.
 * @module features/memoria/components/MemoriaHistoricaDetalle
 */

const PESTANAS = [
  { id: 'resumen', etiqueta: 'Resumen' },
  { id: 'configuracion', etiqueta: 'Configuración' },
  { id: 'propuestas', etiqueta: 'Propuestas' },
  { id: 'agenda', etiqueta: 'Agenda' },
  { id: 'participantes', etiqueta: 'Participantes' },
  { id: 'encuestas', etiqueta: 'Encuestas y certificados' },
];

function Seccion({ titulo, children, vacio }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">{titulo}</h3>
      {vacio ? <p className="text-sm text-ink-600">{vacio}</p> : children}
    </section>
  );
}

function Dato({ etiqueta, children }) {
  return (
    <div>
      <dt className="text-xs text-ink-600">{etiqueta}</dt>
      <dd className="text-sm text-ink-900 mt-0.5">{children || '—'}</dd>
    </div>
  );
}

function Tabla({ columnas, filas, vacio }) {
  if (!filas.length) {
    return (
      <p className="text-sm text-ink-600 p-4 rounded-[12px] border border-dashed border-field-border text-center">{vacio}</p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-[8px] border border-border">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-surface-muted text-xs text-ink-900 uppercase tracking-wider">
            {columnas.map((c) => (
              <th key={c} scope="col" className="py-2 px-3 whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-ink-900">{filas}</tbody>
      </table>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {Object} props.memoria - `MemoriaHistoricaResponse` del backend.
 */
export default function MemoriaHistoricaDetalle({ memoria }) {
  const [pestana, setPestana] = useState('resumen');
  const contenido = useMemo(() => parsearContenido(memoria?.contenido), [memoria]);
  const indicadores = memoria?.indicadores?.length ? memoria.indicadores : contenido.indicadores;
  const evento = contenido.evento;
  const propuestas = useMemo(() => propuestasDeConvocatorias(contenido.convocatorias), [contenido]);
  const dias = useMemo(() => agruparActividadesPorFecha(contenido.agenda.actividades), [contenido]);
  const presupuesto = contenido.presupuesto;

  let cuerpo;
  if (pestana === 'resumen') {
    cuerpo = (
      <div className="space-y-6">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Dato etiqueta="Tipo de evento">{evento.tipoEvento}</Dato>
          <Dato etiqueta="Fechas">{evento.fechaInicio ? formatearRango(evento.fechaInicio, evento.fechaFin) : null}</Dato>
          <Dato etiqueta="Semestre">{evento.semestre}</Dato>
          <Dato etiqueta="Modalidad">{evento.modalidad ? etiquetaModalidad(evento.modalidad) : null}</Dato>
          <Dato etiqueta="Edición de">{evento.eventoBaseNombre || (evento.eventoBaseId ? `Evento ${evento.eventoBaseId}` : 'Es el evento base')}</Dato>
          <Dato etiqueta="Cierre formal">
            {formatearFechaHora(memoria?.fechaConsolidacion)}
            {memoria?.cerradaPor ? ` por ${memoria.cerradaPor}` : ''}
          </Dato>
        </dl>
        {evento.objetivo && <Dato etiqueta="Objetivo">{evento.objetivo}</Dato>}
        {memoria?.resumen && (
          <Seccion titulo="Resumen o acta de cierre">
            <p className="text-sm text-ink-900 whitespace-pre-line p-3 rounded-[8px] bg-surface-muted border border-border">{memoria.resumen}</p>
          </Seccion>
        )}
        <Seccion titulo="Indicadores al cierre">
          <IndicadoresMemoria indicadores={indicadores} />
        </Seccion>
        {contenido.pendientesAlCierre.length > 0 && (
          <Seccion titulo="Pendientes confirmados al cierre">
            <ul className="space-y-1">
              {contenido.pendientesAlCierre.map((p) => (
                <li key={p.codigo} className="text-sm text-ink-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
                  {p.descripcion}: {p.cantidad}
                </li>
              ))}
            </ul>
          </Seccion>
        )}
      </div>
    );
  } else if (pestana === 'configuracion') {
    cuerpo = (
      <div className="space-y-6">
        <Seccion titulo="Comité organizador">
          <Tabla
            columnas={['Nombre', 'Rol', 'Correo', 'Estado']}
            vacio="No se registró comité organizador."
            filas={contenido.comiteOrganizador.map((m) => (
              <tr key={`${m.personaId}-${m.fechaAsignacion}`}>
                <td className="py-2 px-3">{m.nombre}</td>
                <td className="py-2 px-3 capitalize">{String(m.rol || '').replace(/_/g, ' ')}</td>
                <td className="py-2 px-3">{m.correo || '—'}</td>
                <td className="py-2 px-3">{m.activo ? 'Activo' : `Retirado ${m.fechaRetiro ? formatearFecha(m.fechaRetiro) : ''}`}</td>
              </tr>
            ))}
          />
        </Seccion>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Seccion titulo="Líneas temáticas" vacio={contenido.lineasTematicas.length ? null : 'Sin líneas temáticas.'}>
            <ul className="list-disc list-inside text-sm text-ink-900">
              {contenido.lineasTematicas.map((l) => <li key={l.id}>{l.nombre}</li>)}
            </ul>
          </Seccion>
          <Seccion titulo="Tipos de actividad" vacio={contenido.tiposActividad.length ? null : 'Sin tipos de actividad.'}>
            <ul className="list-disc list-inside text-sm text-ink-900">
              {contenido.tiposActividad.map((t) => <li key={t.id}>{t.nombre}</li>)}
            </ul>
          </Seccion>
        </div>
        <Seccion titulo="Presupuesto">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
            <Dato etiqueta="Proyectado">{formatearPesos(presupuesto.totalProyectado)}</Dato>
            <Dato etiqueta="Aprobado">{presupuesto.aprobado ? formatearPesos(presupuesto.aprobado.valor) : 'Sin presupuesto aprobado'}</Dato>
            <Dato etiqueta="Ejecutado">{formatearPesos(presupuesto.totalEjecutado)}</Dato>
          </dl>
          <Tabla
            columnas={['Rubro', 'Proyectado', 'Ejecutado']}
            vacio="No se registraron rubros."
            filas={presupuesto.rubros.map((r) => (
              <tr key={r.id}>
                <td className="py-2 px-3">{r.nombre}{r.activo === false ? ' (inactivo)' : ''}</td>
                <td className="py-2 px-3 tabular-nums">{formatearPesos(r.totalProyectado)}</td>
                <td className="py-2 px-3 tabular-nums">{formatearPesos(r.ejecutado)}</td>
              </tr>
            ))}
          />
        </Seccion>
      </div>
    );
  } else if (pestana === 'propuestas') {
    cuerpo = (
      <div className="space-y-6">
        <Seccion titulo={`Propuestas (${propuestas.length})`}>
          <Tabla
            columnas={['Propuesta', 'Autores', 'Convocatoria', 'Puntuación', 'Resultado']}
            vacio="El evento no recibió propuestas."
            filas={propuestas.map((p) => (
              <tr key={p.id}>
                <td className="py-2 px-3">
                  <p className="font-medium">{p.titulo}</p>
                  <p className="text-xs text-ink-600">{p.lineaTematica || 'Sin línea temática'}</p>
                </td>
                <td className="py-2 px-3">{(p.autores || []).map((a) => a.nombre).join(', ') || '—'}</td>
                <td className="py-2 px-3">{p.convocatoria}</td>
                <td className="py-2 px-3 tabular-nums">{p.puntuacionPonderada ?? '—'}</td>
                <td className="py-2 px-3">
                  {ESTADOS_PROPUESTA[p.estado] || p.estado}
                  {p.clasificacion && CLASIFICACIONES[p.clasificacion] && CLASIFICACIONES[p.clasificacion] !== ESTADOS_PROPUESTA[p.estado] ? (
                    <span className="block text-xs text-ink-600">Clasificación: {CLASIFICACIONES[p.clasificacion]}</span>
                  ) : null}
                  {p.versionDefinitiva ? <span className="block text-xs text-ink-600">Versión definitiva {p.versionDefinitiva}</span> : null}
                </td>
              </tr>
            ))}
          />
        </Seccion>
        <Seccion titulo="Conferencistas y ponentes">
          <Tabla
            columnas={['Nombre', 'Participación', 'Tema']}
            vacio="Sin conferencistas registrados."
            filas={contenido.conferencistas.map((c) => (
              <tr key={`${c.personaId}-${c.tipoParticipacion}`}>
                <td className="py-2 px-3">{c.nombre}</td>
                <td className="py-2 px-3 capitalize">{String(c.tipoParticipacion || '').replace(/_/g, ' ')}</td>
                <td className="py-2 px-3">{c.tema || '—'}</td>
              </tr>
            ))}
          />
        </Seccion>
      </div>
    );
  } else if (pestana === 'agenda') {
    cuerpo = dias.length === 0 ? (
      <p className="text-sm text-ink-600 p-4 rounded-[12px] border border-dashed border-field-border text-center">El evento no tuvo actividades.</p>
    ) : (
      <div className="space-y-5">
        {dias.map(({ fecha, actividades }) => (
          <Seccion key={fecha || 'sin-fecha'} titulo={fecha ? formatearFecha(fecha) : 'Sin programar'}>
            <ul className="divide-y divide-border rounded-[8px] border border-border">
              {actividades.map((a) => (
                <li key={a.id} className={`p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${a.estado === 'cancelada' ? 'opacity-70' : ''}`}>
                  <span className="text-xs font-semibold text-ink-900 tabular-nums w-24 shrink-0">
                    {a.horaInicio ? `${formatearHora(a.horaInicio)}–${formatearHora(a.horaFin)}` : '—'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900">{a.nombre}</p>
                    <p className="text-xs text-ink-600">
                      {[a.tipoActividad, a.sala, a.ponente].filter(Boolean).join(' · ') || 'Sin detalles'}
                    </p>
                  </div>
                  <span className="text-xs text-ink-600 whitespace-nowrap">
                    {a.estado === 'programada'
                      ? `${a.asistentes} de ${plural(a.inscritos, 'inscrito')}`
                      : ESTADOS_ACTIVIDAD[a.estado] || a.estado}
                  </span>
                </li>
              ))}
            </ul>
          </Seccion>
        ))}
      </div>
    );
  } else if (pestana === 'participantes') {
    const asistencia = contenido.asistencia;
    cuerpo = (
      <div className="space-y-6">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Dato etiqueta="Inscritos">{String(contenido.participantes.length)}</Dato>
          <Dato etiqueta="Con asistencia">{String(asistencia.personasConAsistencia)}</Dato>
          <Dato etiqueta="Registros con QR">{String(asistencia.porQr)}</Dato>
          <Dato etiqueta="Registros manuales">{String(asistencia.manuales)}</Dato>
        </dl>
        <Tabla
          columnas={['Participante', 'Documento', 'Categoría', 'Actividades asistidas']}
          vacio="El evento no tuvo inscritos."
          filas={contenido.participantes.map((p) => (
            <tr key={p.inscripcionId}>
              <td className="py-2 px-3">
                <p>{p.nombre}</p>
                <p className="text-xs text-ink-600">{p.correo}</p>
              </td>
              <td className="py-2 px-3 whitespace-nowrap">{[p.tipoDocumento, p.numeroDocumento].filter(Boolean).join(' ') || '—'}</td>
              <td className="py-2 px-3 capitalize">{p.categoria || '—'}</td>
              <td className="py-2 px-3 tabular-nums">{p.actividadesAsistidas} de {p.actividadesInscritas}</td>
            </tr>
          ))}
        />
      </div>
    );
  } else {
    const certificados = contenido.certificados;
    cuerpo = (
      <div className="space-y-6">
        <Seccion titulo="Encuestas de satisfacción" vacio={contenido.encuestas.length ? null : 'El evento no tuvo encuestas.'}>
          <ul className="space-y-3">
            {contenido.encuestas.map((e) => (
              <li key={e.id} className="p-4 rounded-[12px] border border-border space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink-900">{e.titulo}</p>
                    <p className="text-xs text-ink-600 flex items-center gap-2">
                      {e.actividad ? `Actividad: ${e.actividad}` : 'Encuesta general del evento'}
                      <span className="inline-flex items-center gap-1">
                        {e.anonima ? <Lock className="w-3 h-3" aria-hidden="true" /> : <UserRound className="w-3 h-3" aria-hidden="true" />}
                        {e.anonima ? 'Anónima' : 'Identificada'}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-ink-600">{plural(e.respuestas || 0, 'respuesta')}</span>
                </div>
                <ul className="space-y-2">
                  {(e.preguntas || []).map((q, indice) => (
                    <li key={`${e.id}-${indice}`} className="text-sm">
                      <p className="text-ink-900">{q.texto}</p>
                      {q.tipo === 'escala' && (
                        <p className="text-xs text-ink-600">
                          Promedio {q.promedio ?? '—'} (escala {q.escalaMinima}–{q.escalaMaxima}) · {plural(q.respuestas || 0, 'respuesta')}
                        </p>
                      )}
                      {q.tipo === 'opcion' && (
                        <p className="text-xs text-ink-600">
                          {(q.opciones || []).map((o) => `${o.texto}: ${o.respuestas}`).join(' · ') || 'Sin opciones'}
                        </p>
                      )}
                      {q.tipo === 'texto' && (
                        (q.textos || []).length ? (
                          <ul className="mt-1 space-y-1">
                            {q.textos.map((t, i) => (
                              <li key={i} className="text-xs text-ink-900 bg-surface-muted border border-border rounded-[8px] px-2 py-1">«{t}»</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-ink-600">Sin respuestas abiertas.</p>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Seccion>
        <Seccion titulo="Certificados">
          <Tabla
            columnas={['Persona', 'Tipo', 'Actividad', 'Generado']}
            vacio="No se generaron certificados para este evento."
            filas={certificados.detalle.map((c) => (
              <tr key={c.id}>
                <td className="py-2 px-3">
                  <p>{c.nombre}</p>
                  <p className="text-xs text-ink-600">{c.numeroDocumento}</p>
                </td>
                <td className="py-2 px-3 capitalize">{c.tipo}</td>
                <td className="py-2 px-3">{c.actividad || 'Evento completo'}</td>
                <td className="py-2 px-3 whitespace-nowrap">
                  {c.archivoUrl ? (
                    <a href={c.archivoUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">
                      {formatearFechaHora(c.fechaGeneracion)}
                    </a>
                  ) : (
                    formatearFechaHora(c.fechaGeneracion)
                  )}
                </td>
              </tr>
            ))}
          />
        </Seccion>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px] flex items-center gap-2" role="note">
        <Lock className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
        Información consolidada en el cierre formal. Es solo de consulta: no se puede modificar ni eliminar.
      </p>
      <div role="tablist" aria-label="Secciones de la memoria histórica" className="flex flex-wrap gap-1 border-b border-border">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`memoria-tab-${p.id}`}
            aria-selected={pestana === p.id}
            aria-controls="memoria-panel"
            onClick={() => setPestana(p.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px cursor-pointer transition-colors ${
              pestana === p.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-600 hover:text-ink-900'
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>
      <div id="memoria-panel" role="tabpanel" aria-labelledby={`memoria-tab-${pestana}`}>
        {cuerpo}
      </div>
    </div>
  );
}
