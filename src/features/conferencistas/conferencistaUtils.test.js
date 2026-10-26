import { describe, expect, it } from 'vitest';
import {
  aActualizarRequest,
  aAsociarRequest,
  aCompletarRequest,
  campoDelFormulario,
  dividirNombre,
  esEventoPublico,
  estudioVacio,
  eventosConVistaPublica,
  formularioDesdeInvitacion,
  formularioDesdePerfil,
  formularioVacio,
  interpretarErrorConferencista,
  mensajeInvitacionNoDisponible,
  normalizarErroresCampo,
  publicacionVacia,
  puedeAsociarConferencistas,
  textoCoincidencia,
  validarConferencista,
  validarInvitacion,
} from './conferencistaUtils';

const ANIO = 2026;

const formularioCompleto = () => ({
  ...formularioVacio(),
  numeroDocumento: ' 1090123456 ',
  nombres: ' Ana María ',
  apellidos: 'Pérez Gómez',
  correo: ' Ana.Perez@UFPS.edu.co ',
  telefono: ' ',
  tema: ' IA en la educación ',
  biografia: '  Ingeniera de sistemas con 15 años de experiencia.  ',
  cargoActual: 'Profesora titular',
  estudios: [{ ...estudioVacio(), nivel: 'doctorado', titulo: 'Doctora en Ingeniería', institucion: 'UNAL', anio: '2018' }],
  publicaciones: [{ ...publicacionVacia(), tipo: 'articulo', titulo: 'Microservicios', medio: '', anio: '', enlace: '' }],
});

const errorApi = (status, data) => ({ response: { status, data: { status, ...data } } });

describe('validarConferencista (HU-12, Criterio 2)', () => {
  it('acepta un formulario completo', () => {
    expect(validarConferencista(formularioCompleto(), { anioActual: ANIO })).toEqual({});
  });

  it('el invitado debe escribir documento, nombres, apellidos y biografía (el correo es el de la invitación)', () => {
    const errores = validarConferencista({ ...formularioVacio(), correo: '' }, { anioActual: ANIO });
    expect(Object.keys(errores).sort()).toEqual(['apellidos', 'biografia', 'nombres', 'numeroDocumento']);
  });

  it('al editar también exige un correo válido', () => {
    const errores = validarConferencista({ ...formularioCompleto(), correo: 'ana@ufps' }, { modo: 'editar', anioActual: ANIO });
    expect(errores.correo).toMatch(/formato/);
  });

  it('rechaza un enlace de perfil sin http(s)', () => {
    const form = { ...formularioCompleto(), enlacePerfil: 'orcid.org/0000' };
    expect(validarConferencista(form, { anioActual: ANIO }).enlacePerfil).toMatch(/http/);
  });

  it('exige completar cada estudio y publicación agregados', () => {
    const form = { ...formularioCompleto(), estudios: [estudioVacio()], publicaciones: [publicacionVacia()] };
    const errores = validarConferencista(form, { anioActual: ANIO });
    expect(errores['estudios.0.nivel']).toBeDefined();
    expect(errores['estudios.0.titulo']).toBeDefined();
    expect(errores['estudios.0.institucion']).toBeDefined();
    expect(errores['publicaciones.0.tipo']).toBeDefined();
    expect(errores['publicaciones.0.titulo']).toBeDefined();
  });

  it('rechaza años futuros o mal escritos', () => {
    const form = formularioCompleto();
    form.estudios[0].anio = '2027';
    form.publicaciones[0].anio = '24';
    const errores = validarConferencista(form, { anioActual: ANIO });
    expect(errores['estudios.0.anio']).toMatch(/Máximo 2026/);
    expect(errores['publicaciones.0.anio']).toMatch(/4 dígitos/);
  });

  it('en modo asociar solo pide la participación, y la trayectoria si la persona no la tiene', () => {
    const form = { ...formularioVacio(), tipoParticipacion: '' };
    expect(Object.keys(validarConferencista(form, { modo: 'asociar', conTrayectoria: false, anioActual: ANIO })))
      .toEqual(['tipoParticipacion']);
    const conTrayectoria = validarConferencista(formularioVacio(), { modo: 'asociar', conTrayectoria: true, anioActual: ANIO });
    expect(Object.keys(conTrayectoria)).toEqual(['biografia']);
  });

  it('en modo editar no valida la participación', () => {
    const form = { ...formularioCompleto(), tipoParticipacion: '' };
    expect(validarConferencista(form, { modo: 'editar', anioActual: ANIO })).toEqual({});
  });
});

describe('conversión a peticiones (Criterios 1, 3 y 4)', () => {
  it('el registro del invitado se normaliza y no envía el correo', () => {
    const req = aCompletarRequest(formularioCompleto());
    expect(req.numeroDocumento).toBe('1090123456');
    expect(req.nombres).toBe('Ana María');
    expect(req).not.toHaveProperty('correo');
    expect(req).not.toHaveProperty('tipoParticipacion');
    expect(req.telefono).toBeNull();
    expect(req.tema).toBe('IA en la educación');
    expect(req.trayectoria.biografia).toBe('Ingeniera de sistemas con 15 años de experiencia.');
    expect(req.trayectoria.estudios[0]).toEqual({ nivel: 'doctorado', titulo: 'Doctora en Ingeniería', institucion: 'UNAL', anio: 2018 });
    expect(req.trayectoria.publicaciones[0]).toEqual({ tipo: 'articulo', titulo: 'Microservicios', medio: null, anio: null, enlace: null });
  });

  it('la actualización envía el correo en minúsculas y no la participación', () => {
    const req = aActualizarRequest(formularioCompleto());
    expect(req.correo).toBe('ana.perez@ufps.edu.co');
    expect(req).not.toHaveProperty('tipoParticipacion');
    expect(req.trayectoria).toBeDefined();
  });

  it('al asociar solo envía la trayectoria si la persona no la tiene', () => {
    expect(aAsociarRequest(12, formularioCompleto(), false).trayectoria).toBeNull();
    expect(aAsociarRequest(12, formularioCompleto(), true).trayectoria.biografia).toMatch(/Ingeniera/);
  });

  it('precarga el formulario desde el perfil del backend', () => {
    const form = formularioDesdePerfil({
      tipoDocumento: 'CE', numeroDocumento: '123', nombres: 'Ana', apellidos: 'Pérez', correo: 'a@b.co', telefono: null,
      trayectoria: {
        biografia: 'Bio', cargoActual: null, institucion: 'UFPS', enlacePerfil: null,
        estudios: [{ id: 1, nivel: 'maestria', titulo: 'Magíster', institucion: 'UFPS', anio: 2012 }],
        publicaciones: [],
      },
    });
    expect(form.tipoDocumento).toBe('CE');
    expect(form.telefono).toBe('');
    expect(form.cargoActual).toBe('');
    expect(form.estudios[0]).toMatchObject({ nivel: 'maestria', anio: '2012' });
    expect(form.estudios[0].clave).toBeTruthy();
  });
});

describe('errores de la API', () => {
  it('convierte las rutas anidadas del backend a los campos del formulario', () => {
    expect(campoDelFormulario('trayectoria.estudios[0].titulo')).toBe('estudios.0.titulo');
    expect(campoDelFormulario('trayectoria.biografia')).toBe('biografia');
    expect(campoDelFormulario('correo')).toBe('correo');
  });

  it('descarta las copias con el último segmento para no pisar otros campos', () => {
    const campos = normalizarErroresCampo({
      'trayectoria.estudios[0].institucion': 'La institución del estudio es obligatoria',
      institucion: 'La institución del estudio es obligatoria',
      correo: 'El correo es obligatorio',
    });
    expect(campos).toEqual({
      'estudios.0.institucion': 'La institución del estudio es obligatoria',
      correo: 'El correo es obligatorio',
    });
  });

  it('Criterio 3: devuelve la coincidencia para ofrecer asociar a la persona existente', () => {
    const coincidencia = { personaId: 12, nombreCompleto: 'Ana Pérez', coincidePor: 'documento', tienePerfil: true };
    const r = interpretarErrorConferencista(errorApi(409, {
      codigo: 'CONFERENCISTA_EXISTENTE', message: 'Ana Pérez ya está registrado...', coincidencia,
    }));
    expect(r.coincidencia).toEqual(coincidencia);
    expect(r.campos).toEqual({});
  });

  it('documento de otra persona al editar → error en el campo', () => {
    const r = interpretarErrorConferencista(errorApi(409, {
      codigo: 'DATOS_PERSONA_DUPLICADOS', message: 'El documento ya pertenece a otra persona.',
      erroresValidacion: { numeroDocumento: 'El documento ya pertenece a otra persona.' },
    }));
    expect(r.campos.numeroDocumento).toMatch(/otra persona/);
    expect(r.mensaje).toBeNull();
  });

  it('estado del evento → mensaje general', () => {
    const r = interpretarErrorConferencista(errorApi(409, { codigo: 'OPERACION_NO_PERMITIDA', message: 'El evento está cerrado.' }));
    expect(r.mensaje).toBe('El evento está cerrado.');
    expect(r.coincidencia).toBeNull();
  });
});

describe('reglas de estado y textos', () => {
  it('solo se asocian conferencistas en configuración o habilitado', () => {
    expect(puedeAsociarConferencistas({ estado: 'en_configuracion' })).toBe(true);
    expect(puedeAsociarConferencistas({ estado: 'habilitado' })).toBe(true);
    expect(puedeAsociarConferencistas({ estado: 'en_ejecucion' })).toBe(false);
  });

  it('la vista pública existe desde que el evento se publica', () => {
    expect(esEventoPublico({ estado: 'en_configuracion' })).toBe(false);
    expect(esEventoPublico({ estado: 'habilitado' })).toBe(true);
    expect(esEventoPublico({ estado: 'cerrado' })).toBe(true);
  });

  it('describe la coincidencia según si ya está en el evento', () => {
    const base = { nombreCompleto: 'Ana Pérez', coincidePor: 'correo', eventosPrevios: 2 };
    expect(textoCoincidencia({ ...base, yaAsociadoAlEvento: false })).toMatch(/ese correo.*2 eventos.*asociarlo/);
    expect(textoCoincidencia({ ...base, yaAsociadoAlEvento: true })).toMatch(/ya es conferencista de este evento/);
  });

  it('lista los eventos publicados donde se refleja la trayectoria (Criterio 4)', () => {
    const perfil = {
      participaciones: [
        { eventoNombre: 'Congreso 2026', visiblePublicamente: true },
        { eventoNombre: 'Seminario', visiblePublicamente: false },
      ],
    };
    expect(eventosConVistaPublica(perfil)).toEqual(['Congreso 2026']);
  });
});

describe('invitación a conferencistas nuevos', () => {
  it('el administrador solo necesita nombre y correo válidos', () => {
    expect(validarInvitacion({ nombre: 'Ana Pérez', correo: 'ana@unal.edu.co' })).toEqual({});
    const errores = validarInvitacion({ nombre: ' ', correo: 'ana@' });
    expect(Object.keys(errores).sort()).toEqual(['correo', 'nombre']);
  });

  it('separa el nombre del invitado en nombres y apellidos', () => {
    expect(dividirNombre('Ana María Pérez Gómez')).toEqual({ nombres: 'Ana María', apellidos: 'Pérez Gómez' });
    expect(dividirNombre('Lucía Fernández Ortiz')).toEqual({ nombres: 'Lucía', apellidos: 'Fernández Ortiz' });
    expect(dividirNombre('Diego Torres')).toEqual({ nombres: 'Diego', apellidos: 'Torres' });
    expect(dividirNombre('Madonna')).toEqual({ nombres: 'Madonna', apellidos: '' });
  });

  it('precarga el formulario con el nombre de la invitación o con los datos que SIGEA ya tiene', () => {
    const nueva = formularioDesdeInvitacion({ nombre: 'Ana María Pérez Gómez', correo: 'ana@unal.edu.co' });
    expect(nueva).toMatchObject({ nombres: 'Ana María', apellidos: 'Pérez Gómez', correo: 'ana@unal.edu.co', numeroDocumento: '' });

    const existente = formularioDesdeInvitacion({
      nombre: 'Jorge', correo: 'jorge@ufps.edu.co',
      datosRegistrados: {
        tipoDocumento: 'CE', documentoEnmascarado: '••••••678', nombres: 'Jorge Enrique', apellidos: 'Villamizar',
        telefonoEnmascarado: null, trayectoria: null,
      },
    });
    expect(existente).toMatchObject({
      tipoDocumento: 'CE', numeroDocumento: '', telefono: '', documentoRegistrado: '••••••678', telefonoRegistrado: null,
      nombres: 'Jorge Enrique', correo: 'jorge@ufps.edu.co', biografia: '',
    });
  });

  it('pide contraseña solo a quien aún no tiene cuenta, con la misma política del registro', () => {
    const sinCuenta = formularioDesdeInvitacion({ nombre: 'Ana Pérez', correo: 'an•••@unal.edu.co', requiereContrasena: true });
    expect(sinCuenta).toMatchObject({ requiereContrasena: true, contrasena: '', confirmarContrasena: '' });

    const base = { ...formularioCompleto(), requiereContrasena: true };
    expect(validarConferencista({ ...base, contrasena: '', confirmarContrasena: '' }, { modo: 'invitacion' }).contrasena).toBeDefined();
    expect(validarConferencista({ ...base, contrasena: 'clave', confirmarContrasena: 'clave' }, { modo: 'invitacion' }).contrasena).toBeDefined();
    expect(validarConferencista({ ...base, contrasena: 'Clave123*', confirmarContrasena: 'Clave123' }, { modo: 'invitacion' }).confirmarContrasena).toBeDefined();
    const valido = { ...base, contrasena: 'Clave123*', confirmarContrasena: 'Clave123*' };
    expect(validarConferencista(valido, { modo: 'invitacion' }).contrasena).toBeUndefined();
    expect(aCompletarRequest(valido).contrasena).toBe('Clave123*');

    const conCuenta = { ...formularioCompleto(), requiereContrasena: false, contrasena: '' };
    expect(validarConferencista(conCuenta, { modo: 'invitacion' }).contrasena).toBeUndefined();
    expect(aCompletarRequest(conCuenta).contrasena).toBeNull();
  });

  it('no exige de nuevo el documento ya registrado y lo envía vacío para que el backend lo conserve', () => {
    const form = { ...formularioCompleto(), numeroDocumento: '', documentoRegistrado: '••••••456' };
    expect(validarConferencista(form, { modo: 'invitacion' }).numeroDocumento).toBeUndefined();
    expect(validarConferencista({ ...form, documentoRegistrado: null }, { modo: 'invitacion' }).numeroDocumento).toBeDefined();
    expect(validarConferencista(form, { modo: 'editar' }).numeroDocumento).toBeDefined();
    expect(aCompletarRequest(form).numeroDocumento).toBeNull();
  });

  it('explica por qué un enlace ya no sirve', () => {
    expect(mensajeInvitacionNoDisponible('INVITACION_VENCIDA').titulo).toMatch(/venció/);
    expect(mensajeInvitacionNoDisponible('INVITACION_COMPLETADA').titulo).toMatch(/Ya registraste/);
    expect(mensajeInvitacionNoDisponible(undefined, 404).titulo).toMatch(/no válido/);
  });
});
