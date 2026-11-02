/**
 * @file rolService.js
 * @description Cliente de la API de administración de roles, permisos y asignación de roles a usuarios (HU-02).
 * Endpoints: /api/v1/roles, /api/v1/permisos y /api/v1/usuarios.
 * @module api/rolService
 */
import { httpClient } from './httpClient';

export const rolService = {
  /**
   * Lista los roles con sus permisos y la cantidad de usuarios asignados.
   * Endpoint: GET /api/v1/roles
   * @returns {Promise<Array<Object>>} RolResponse[]
   */
  async listarRoles() {
    const { data } = await httpClient.get('/roles');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Crea un rol.
   * Endpoint: POST /api/v1/roles
   * @param {{ nombre: string, descripcion?: string, permisosIds: number[] }} rol
   */
  async crearRol(rol) {
    const { data } = await httpClient.post('/roles', rol);
    return data;
  },

  /**
   * Actualiza nombre, descripción y permisos de un rol. Aplica de inmediato a sus usuarios.
   * Endpoint: PUT /api/v1/roles/{id}
   * @param {number} id
   * @param {{ nombre: string, descripcion?: string, permisosIds: number[] }} rol
   */
  async actualizarRol(id, rol) {
    const { data } = await httpClient.put(`/roles/${id}`, rol);
    return data;
  },

  /**
   * Elimina un rol. El backend lo impide si tiene usuarios activos.
   * Endpoint: DELETE /api/v1/roles/{id}
   * @param {number} id
   */
  async eliminarRol(id) {
    await httpClient.delete(`/roles/${id}`);
  },

  /**
   * Catálogo de permisos del sistema.
   * Endpoint: GET /api/v1/permisos
   * @returns {Promise<Array<{ id: number, codigo: string, modulo: string, descripcion: string }>>}
   */
  async listarPermisos() {
    const { data } = await httpClient.get('/permisos');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Usuarios con sus roles y permisos.
   * Endpoint: GET /api/v1/usuarios?busqueda=
   * @param {string} [busqueda]
   * @returns {Promise<Array<Object>>} UsuarioRolesResponse[]
   */
  async listarUsuarios(busqueda) {
    const { data } = await httpClient.get('/usuarios', {
      params: busqueda && busqueda.trim() ? { busqueda: busqueda.trim() } : {},
    });
    return Array.isArray(data) ? data : [];
  },

  /**
   * Reemplaza los roles de un usuario.
   * Endpoint: PUT /api/v1/usuarios/{usuarioId}/roles
   * @param {number} usuarioId
   * @param {number[]} rolesIds
   */
  async actualizarRolesUsuario(usuarioId, rolesIds) {
    const { data } = await httpClient.put(`/usuarios/${usuarioId}/roles`, { rolesIds });
    return data;
  },
};
