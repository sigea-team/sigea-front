import { describe, it, expect } from 'vitest';
import { agruparPermisosPorModulo, esRolEvaluador, validarRol, mensajeErrorApi } from './rolUtils';
import { puedeEvaluar, tienePermiso } from '../../utils/permisos';
import { normalizarSesion } from '../../store/authStore';
import { crearRolesApiMock, PERMISOS_MOCK } from './mocks/rolesMock';

const TOKEN = 'aaa.bbb.ccc';

describe('HU-02 - rolUtils', () => {
  it('agrupa los permisos por módulo con etiqueta legible', () => {
    const grupos = agruparPermisosPorModulo(PERMISOS_MOCK);
    const evaluacion = grupos.find((g) => g.modulo === 'EVALUACION');
    expect(evaluacion.etiqueta).toBe('Evaluación de propuestas');
    expect(evaluacion.permisos.map((p) => p.codigo)).toEqual(['PROPUESTAS_EVALUAR']);
    expect(grupos.find((g) => g.modulo === 'ROLES').permisos).toHaveLength(2);
  });

  it('reconoce los roles que habilitan el perfil Evaluador', () => {
    expect(esRolEvaluador({ permisos: [{ codigo: 'PROPUESTAS_EVALUAR' }] })).toBe(true);
    expect(esRolEvaluador({ permisos: [{ codigo: 'PROPUESTAS_VER' }] })).toBe(false);
    expect(esRolEvaluador({})).toBe(false);
  });

  it('valida nombre obligatorio y longitudes', () => {
    expect(validarRol({ nombre: '  ' }).nombre).toBeDefined();
    expect(validarRol({ nombre: 'X'.repeat(51) }).nombre).toBeDefined();
    expect(validarRol({ nombre: 'EVALUADOR', descripcion: 'ok' })).toEqual({});
  });

  it('extrae el mensaje del backend o uno legible por defecto', () => {
    expect(mensajeErrorApi({ response: { status: 409, data: { message: 'Duplicado' } } }, 'x')).toBe('Duplicado');
    expect(mensajeErrorApi({ response: { status: 403, data: {} } }, 'x')).toMatch(/permiso/);
    expect(mensajeErrorApi({}, 'x')).toMatch(/servidor/);
  });
});

describe('HU-02 - acceso al perfil Evaluador', () => {
  it('la sesión conserva los permisos que envía el backend al iniciar sesión', () => {
    const sesion = normalizarSesion({ token: TOKEN, correo: 'a@b.co', roles: ['participante'], permisos: ['propuestas_evaluar'] });
    expect(sesion.usuario.permisos).toEqual(['PROPUESTAS_EVALUAR']);
    expect(normalizarSesion({ token: TOKEN, roles: [] }).usuario.permisos).toEqual([]);
  });

  it('solo puede evaluar quien tiene PROPUESTAS_EVALUAR o es administrador', () => {
    expect(puedeEvaluar({ roles: ['PARTICIPANTE'], permisos: [] })).toBe(false);
    expect(puedeEvaluar({ roles: ['PARTICIPANTE'], permisos: [], modoIngreso: 'EVALUADOR' })).toBe(false);
    expect(puedeEvaluar({ roles: ['EVALUADOR'], permisos: ['PROPUESTAS_EVALUAR'] })).toBe(true);
    expect(puedeEvaluar({ roles: ['ADMIN'], permisos: [] })).toBe(true);
    expect(tienePermiso(null, 'PROPUESTAS_EVALUAR')).toBe(false);
  });

  it('al asignar el rol evaluador el usuario obtiene el permiso (contrato del mock)', async () => {
    const api = crearRolesApiMock({ demora: 0 });
    const luis = (await api.listarUsuarios()).find((u) => u.usuarioId === 3);
    expect(luis.permisos).not.toContain('PROPUESTAS_EVALUAR');

    const actualizado = await api.actualizarRolesUsuario(3, [2, 3]);
    expect(actualizado.permisos).toContain('PROPUESTAS_EVALUAR');
    expect(actualizado.roles.map((r) => r.nombre)).toEqual(['PARTICIPANTE', 'EVALUADOR']);
  });
});
