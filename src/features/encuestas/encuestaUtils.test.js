import { describe, expect, it } from 'vitest';
import {
  ALCANCE_EVENTO,
  aEncuestaRequest,
  aFechaBackend,
  aFormulario,
  aRespuestasRequest,
  aValorFechaLocal,
  accionesEncuesta,
  anchoBarra,
  cambiarTipoPregunta,
  erroresDeBackend,
  erroresRespuestasDeBackend,
  filtrarMisEncuestas,
  formatearPorcentaje,
  formatearPromedio,
  formularioVacio,
  interpretarErrorEncuesta,
  opcionesAlcance,
  ordenarMisEncuestas,
  preguntaVacia,
  resumenPregunta,
  situacionParticipante,
  textoAlcance,
  validarAlcance,
  validarEncuesta,
  validarRespuestas,
  valoresEscala,
} from './encuestaUtils';
import { crearEncuestasApiMock } from './mocks/encuestasMock';

const AHORA = new Date('2026-11-20T10:00:00');

const errorAxios = (status, data) => {
  const err = new Error('error');
  err.response = { status, data };
  return err;
};

const formValido = () => ({
  ...formularioVacio(),
  titulo: '  ¿Cómo te pareció el taller?  ',
  actividadId: '201',
  anonima: true,
  fechaCierre: '2026-11-30T23:59',
  preguntas: [
    { ...preguntaVacia('escala'), texto: 'Satisfacción' },
    { ...preguntaVacia('opcion'), texto: '¿Lo recomendarías?', opciones: [' Sí ', 'No'] },
    { ...preguntaVacia('texto'), texto: 'Comentarios', obligatoria: false },
  ],
});

describe('validarEncuesta (Criterio 1)', () => {
  it('acepta una configuración válida', () => {
    expect(validarEncuesta(formValido(), AHORA).valido).toBe(true);
  });

  it('exige título y una fecha de cierre futura', () => {
    const { valido, errores } = validarEncuesta({ ...formValido(), titulo: '   ', fechaCierre: '2026-11-19T08:00' }, AHORA);
    expect(valido).toBe(false);
    expect(errores.titulo).toMatch(/obligatorio/);
    expect(errores.fechaCierre).toMatch(/posterior/);
  });

  it('valida el rango de la escala, las opciones y el enunciado como el backend', () => {
    const form = formValido();
    form.preguntas = [
      { ...preguntaVacia('escala'), texto: 'A', escalaMinima: '5', escalaMaxima: '3' },
      { ...preguntaVacia('escala'), texto: 'B', escalaMinima: '0', escalaMaxima: '11' },
      { ...preguntaVacia('opcion'), texto: 'C', opciones: ['Sí'] },
      { ...preguntaVacia('opcion'), texto: 'D', opciones: ['Sí', ' sí', ''] },
      { ...preguntaVacia('texto'), texto: '  ' },
    ];
    const { valido, errores } = validarEncuesta(form, AHORA);
    expect(valido).toBe(false);
    expect(errores.preguntas[0].escala).toBeTruthy();
    expect(errores.preguntas[1].escala).toBeTruthy();
    expect(errores.preguntas[2].opciones).toMatch(/entre 2 y 20/);
    expect(errores.preguntas[3].porOpcion).toEqual({ 1: 'Opción repetida.', 2: 'Escribe la opción.' });
    expect(errores.preguntas[4].texto).toMatch(/Escribe/);
  });

  it('permite guardar un borrador sin preguntas', () => {
    expect(validarEncuesta({ ...formValido(), preguntas: [] }, AHORA).valido).toBe(true);
  });
});

describe('aEncuestaRequest y aFormulario', () => {
  it('arma el cuerpo del backend: recorta textos, convierte la escala y la fecha', () => {
    const r = aEncuestaRequest(formValido());
    expect(r.titulo).toBe('¿Cómo te pareció el taller?');
    expect(r.descripcion).toBeNull();
    expect(r.actividadId).toBe(201);
    expect(r.fechaCierre).toBe('2026-11-30T23:59:00');
    expect(r.preguntas[0]).toMatchObject({ tipoRespuesta: 'escala', escalaMinima: 1, escalaMaxima: 5, opciones: [] });
    expect(r.preguntas[1]).toMatchObject({ escalaMinima: null, escalaMaxima: null, opciones: ['Sí', 'No'] });
    expect(r.preguntas[2].obligatoria).toBe(false);
  });

  it('la encuesta general del evento se envía sin actividad', () => {
    expect(aEncuestaRequest({ ...formValido(), actividadId: ALCANCE_EVENTO }).actividadId).toBeNull();
    expect(formularioVacio().actividadId).toBe(ALCANCE_EVENTO);
  });

  it('carga un borrador del backend para editarlo', () => {
    const [publicada, borrador] = crearEncuestasApiMock()._estado.encuestas;
    const f = aFormulario(publicada);
    expect(f.actividadId).toBe('201');
    expect(f.fechaCierre).toBe('2026-12-15T23:59');
    expect(f.preguntas[1].opciones).toEqual(['Sí', 'No', 'Tal vez']);
    expect(aFormulario(borrador).actividadId).toBe(ALCANCE_EVENTO);
    expect(aFormulario(borrador).preguntas[0]).toMatchObject({ escalaMinima: '0', escalaMaxima: '10' });
  });

  it('al pasar una pregunta a «opción» le prepara dos opciones vacías', () => {
    expect(cambiarTipoPregunta({ ...preguntaVacia('texto'), texto: 'X' }, 'opcion')).toMatchObject({ texto: 'X', opciones: ['', ''] });
  });

  it('convierte fechas entre el backend y datetime-local', () => {
    expect(aValorFechaLocal('2026-11-30T23:59:00')).toBe('2026-11-30T23:59');
    expect(aValorFechaLocal(null)).toBe('');
    expect(aFechaBackend('')).toBeNull();
  });
});

describe('erroresDeBackend', () => {
  it('ubica los errores del backend en cada pregunta y opción', () => {
    const e = erroresDeBackend({
      titulo: 'El título es obligatorio',
      actividadId: 'La actividad está cancelada.',
      'preguntas[1].opciones': 'Necesita entre 2 y 20 opciones.',
      'preguntas[0].opciones[2]': 'Opción repetida.',
      'preguntas[3].escalaMaxima': 'Rango inválido.',
      preguntas: 'Máximo 50',
    });
    expect(e.titulo).toBeTruthy();
    expect(e.actividadId).toBeTruthy();
    expect(e.preguntas[1].opciones).toBeTruthy();
    expect(e.preguntas[0].porOpcion[2]).toBe('Opción repetida.');
    expect(e.preguntas[3].escala).toBe('Rango inválido.');
    expect(e.preguntasGeneral).toBe('Máximo 50');
  });
});

describe('accionesEncuesta', () => {
  const borrador = { estado: 'borrador', preguntas: [{}], totalRespuestas: 0 };

  it('un borrador se edita, se publica y se elimina, pero no tiene resultados', () => {
    const a = accionesEncuesta(borrador, { estado: 'habilitado' }, AHORA);
    expect(a.editar.permitido && a.publicar.permitido && a.eliminar.permitido).toBe(true);
    expect(a.resultados.permitido).toBe(false);
    expect(a.cerrar.permitido).toBe(false);
  });

  it('no se publica sin preguntas, con el evento en configuración o con la fecha vencida', () => {
    expect(accionesEncuesta({ ...borrador, preguntas: [] }, {}, AHORA).publicar.motivo).toMatch(/al menos una/);
    expect(accionesEncuesta(borrador, { estado: 'en_configuracion' }, AHORA).publicar.motivo).toMatch(/configuración/);
    expect(accionesEncuesta({ ...borrador, fechaCierre: '2026-11-19T00:00:00' }, {}, AHORA).publicar.motivo).toMatch(/pasó/);
  });

  it('una cerrada no se edita y el motivo lo dice', () => {
    const a = accionesEncuesta({ estado: 'cerrada', preguntas: [{}], totalRespuestas: 0 }, {}, AHORA);
    expect(a.editar.permitido).toBe(false);
    expect(a.editar.motivo).toMatch(/Una encuesta cerrada no se modifica/);
    expect(a.cerrar.permitido).toBe(false);
  });

  it('una publicada con respuestas no se edita ni se elimina; se cierra', () => {
    const a = accionesEncuesta({ estado: 'publicada', preguntas: [{}], totalRespuestas: 3 }, {}, AHORA);
    expect(a.editar.permitido).toBe(false);
    expect(a.eliminar.motivo).toMatch(/3 respuestas/);
    expect(a.cerrar.permitido).toBe(true);
    expect(a.resultados.permitido).toBe(true);
  });
});

describe('opcionesAlcance', () => {
  it('ofrece el evento en general y las actividades que admiten encuesta', () => {
    const opciones = opcionesAlcance(crearEncuestasApiMock()._estado.actividades);
    expect(opciones[0].value).toBe(ALCANCE_EVENTO);
    expect(opciones.map((o) => o.value)).toEqual([ALCANCE_EVENTO, '201', '202']);
    expect(opciones[1].label).toBe('Taller de Spring Boot — 20/11/2026 09:00');
  });
});

describe('validarAlcance', () => {
  const opciones = opcionesAlcance(crearEncuestasApiMock()._estado.actividades);

  it('acepta el evento en general y las actividades disponibles', () => {
    expect(validarAlcance(ALCANCE_EVENTO, opciones)).toBeNull();
    expect(validarAlcance('201', opciones)).toBeNull();
  });

  it('rechaza una actividad cancelada o que ya no está en la lista', () => {
    expect(validarAlcance('203', opciones)).toMatch(/ya no está disponible/);
    expect(validarAlcance('999', opciones)).toMatch(/ya no está disponible/);
    expect(validarAlcance('', opciones)).toMatch(/Elige/);
  });

  it('no valida mientras las actividades no han cargado', () => {
    expect(validarAlcance('203', null)).toBeNull();
  });
});

describe('responder (Criterio 2)', () => {
  const preguntas = crearEncuestasApiMock()._estado.encuestas[0].preguntas;

  it('exige las obligatorias y valida la escala y la opción', () => {
    const { valido, errores } = validarRespuestas(preguntas, { 40: '9', 41: '999', 42: '' });
    expect(valido).toBe(false);
    expect(errores[40]).toMatch(/de 1 a 5/);
    expect(errores[41]).toMatch(/opciones/);
    expect(errores[42]).toBeUndefined();
    expect(validarRespuestas(preguntas, { 40: '', 41: '', 42: '' }).errores[40]).toMatch(/obligatoria/);
  });

  it('pide al menos una respuesta cuando todas son opcionales', () => {
    const opcionales = preguntas.map((p) => ({ ...p, obligatoria: false }));
    expect(validarRespuestas(opcionales, {}).general).toMatch(/al menos una/);
  });

  it('envía solo las respondidas, con el campo de cada tipo', () => {
    expect(aRespuestasRequest(preguntas, { 40: '4', 41: '410', 42: '  Bien  ' })).toEqual([
      { preguntaId: 40, valorEscala: 4 },
      { preguntaId: 41, opcionId: 410 },
      { preguntaId: 42, texto: 'Bien' },
    ]);
    expect(aRespuestasRequest(preguntas, { 40: '4', 41: '410', 42: '' })).toHaveLength(2);
  });

  it('lee los errores por pregunta del backend', () => {
    expect(erroresRespuestasDeBackend({ pregunta_41: 'Obligatoria', respuestas: 'Al menos una' })).toEqual({
      porPregunta: { 41: 'Obligatoria' },
      general: 'Al menos una',
    });
  });

  it('lista los valores de la escala', () => {
    expect(valoresEscala({ escalaMinima: 0, escalaMaxima: 3 })).toEqual([0, 1, 2, 3]);
  });
});

describe('mis encuestas (Criterios 1 y 3)', () => {
  it('distingue por responder, respondida y cerrada', () => {
    expect(situacionParticipante({ recibeRespuestas: true }).id).toBe('pendiente');
    expect(situacionParticipante({ respondida: true }).id).toBe('respondida');
    expect(situacionParticipante({ recibeRespuestas: false }).id).toBe('cerrada');
  });

  it('no muestra las que cerraron o vencieron sin responder', () => {
    const lista = filtrarMisEncuestas([
      { encuestaId: 1, recibeRespuestas: true },
      { encuestaId: 2, recibeRespuestas: false, respondida: false },
      { encuestaId: 3, respondida: true },
    ]);
    expect(lista.map((e) => e.encuestaId)).toEqual([1, 3]);
  });

  it('ordena primero las pendientes (la que cierra antes primero)', () => {
    const lista = ordenarMisEncuestas([
      { encuestaId: 1, respondida: true, fechaRespuesta: '2026-11-19T10:00:00' },
      { encuestaId: 2, recibeRespuestas: true },
      { encuestaId: 3, recibeRespuestas: true, fechaCierre: '2026-11-25T10:00:00' },
      { encuestaId: 4, respondida: true, fechaRespuesta: '2026-11-21T10:00:00' },
    ]);
    expect(lista.map((e) => e.encuestaId)).toEqual([3, 2, 4, 1]);
  });

  it('describe el alcance de la encuesta', () => {
    expect(textoAlcance({ actividadId: 201, actividadNombre: 'Taller' })).toBe('Actividad: Taller');
    expect(textoAlcance({ actividadId: null })).toBe('Evento en general');
  });
});

describe('resultados (Criterio 4)', () => {
  it('la barra más larga es la del valor más elegido', () => {
    const d = [{ cantidad: 2 }, { cantidad: 4 }, { cantidad: 0 }];
    expect(d.map((x) => anchoBarra(x.cantidad, d))).toEqual([50, 100, 0]);
    expect(anchoBarra(0, [{ cantidad: 0 }])).toBe(0);
  });

  it('resume cada pregunta', () => {
    expect(resumenPregunta({ totalRespuestas: 0 })).toBe('Sin respuestas todavía.');
    expect(resumenPregunta({ tipoRespuesta: 'escala', totalRespuestas: 4, promedio: 3.75, escalaMaxima: 5, omitidas: 1 }))
      .toBe('4 respuestas · promedio 3,75 de 5 · 1 la omitieron');
  });

  it('formatea porcentaje y promedio', () => {
    expect(formatearPorcentaje(66.7)).toBe('66,7 %');
    expect(formatearPorcentaje(null)).toBe('—');
    expect(formatearPromedio('4.5')).toBe('4,50');
  });

  it('el mock consolida como el backend', async () => {
    const api = crearEncuestasApiMock();
    const r = await api.obtenerResultados(1, 7);
    expect(r.totalRespuestas).toBe(4);
    expect(r.preguntas[0].promedio).toBe(3.75);
    expect(r.preguntas[1].distribucion.map((x) => x.cantidad)).toEqual([2, 1, 1]);
    expect(r.preguntas[2].respuestasTexto).toHaveLength(2);
    expect(r.preguntas[2].respuestasTexto[0].participanteNombre).toBeUndefined();
  });
});

describe('el mock aplica las reglas del backend', () => {
  const rechazo = async (promesa) => {
    try {
      await promesa;
    } catch (err) {
      return err.response;
    }
    return null;
  };

  it('no publica con la fecha de cierre vencida ni con la actividad cancelada', async () => {
    const api = crearEncuestasApiMock({ respuestas: [] });
    const borrador = api._estado.encuestas[1];
    borrador.fechaCierre = '2020-01-01T00:00:00';
    const vencida = await rechazo(api.publicarEncuesta(1, borrador.encuestaId));
    expect(vencida.status).toBe(409);
    expect(vencida.data.codigo).toBe('ENCUESTA_INCOMPLETA');
    expect(vencida.data.erroresValidacion.fechaCierre).toBeTruthy();

    borrador.fechaCierre = null;
    borrador.actividadId = 203;
    const cancelada = await rechazo(api.publicarEncuesta(1, borrador.encuestaId));
    expect(cancelada.data.codigo).toBe('ACTIVIDAD_NO_DISPONIBLE');
  });

  it('no guarda una encuesta con actividad cancelada o fecha de cierre pasada', async () => {
    const api = crearEncuestasApiMock();
    const r = await rechazo(api.crearEncuesta(1, { titulo: 'X', actividadId: 203, fechaCierre: '2020-01-01T00:00:00', preguntas: [] }));
    expect(r.status).toBe(400);
    expect(r.data.codigo).toBe('ENCUESTA_CONFIGURACION_INVALIDA');
    expect(Object.keys(r.data.erroresValidacion).sort()).toEqual(['actividadId', 'fechaCierre']);
  });

  it('no publica en un evento en configuración ni dos veces', async () => {
    const enConfiguracion = crearEncuestasApiMock({ estadoEvento: 'en_configuracion' });
    expect((await rechazo(enConfiguracion.publicarEncuesta(1, 8))).data.codigo).toBe('EVENTO_NO_DISPONIBLE');
    expect((await rechazo(crearEncuestasApiMock().publicarEncuesta(1, 7))).data.codigo).toBe('ENCUESTA_ESTADO_INVALIDO');
  });
});

describe('interpretarErrorEncuesta', () => {
  it('muestra el motivo del 403 por falta de asistencia (Criterio 3)', () => {
    const info = interpretarErrorEncuesta(errorAxios(403, { codigo: 'ENCUESTA_NO_HABILITADA', message: 'No tienes asistencia registrada.' }));
    expect(info.titulo).toBe('Encuesta no habilitada');
    expect(info.mensaje).toBe('No tienes asistencia registrada.');
  });

  it('el 403 de permisos usa el mensaje genérico', () => {
    expect(interpretarErrorEncuesta(errorAxios(403, { message: 'Forbidden' })).mensaje).toMatch(/permiso/);
  });

  it('devuelve el código y los campos del backend', () => {
    const info = interpretarErrorEncuesta(errorAxios(400, {
      codigo: 'RESPUESTAS_INVALIDAS', message: 'Revise sus respuestas.', erroresValidacion: { pregunta_40: 'Obligatoria' },
    }));
    expect(info).toMatchObject({ codigo: 'RESPUESTAS_INVALIDAS', titulo: 'Revisa tus respuestas', campos: { pregunta_40: 'Obligatoria' } });
  });

  it('sin respuesta del servidor avisa que no hay conexión', () => {
    const err = new Error('Network');
    err.request = {};
    expect(interpretarErrorEncuesta(err).mensaje).toMatch(/conectarse/);
  });
});
