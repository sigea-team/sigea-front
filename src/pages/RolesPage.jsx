import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Shield,
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  UserCog,
  ClipboardCheck,
  RefreshCw,
} from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import RoleFormModal from '../features/roles/components/RoleFormModal';
import RoleDeleteModal from '../features/roles/components/RoleDeleteModal';
import UsuarioRolesModal from '../features/roles/components/UsuarioRolesModal';
import { rolService } from '../api/rolService';
import { esRolEvaluador, mensajeErrorApi } from '../features/roles/rolUtils';
import { ROLES_ADMINISTRADOR, PERMISO_EVALUAR } from '../utils/permisos';

/**
 * @file RolesPage.jsx
 * @description Administración de roles y permisos (HU-02), conectada al backend.
 *  - Pestaña «Roles»: crear, editar y eliminar roles con los permisos reales del sistema.
 *  - Pestaña «Usuarios»: asignar roles a cada usuario. Quien reciba un rol con el permiso PROPUESTAS_EVALUAR
 *    queda habilitado para ingresar con el perfil «Evaluador».
 * @module pages/RolesPage
 */

const esRolSistema = (rol) => ROLES_ADMINISTRADOR.includes(String(rol?.nombre).toUpperCase());

const coincide = (texto, q) => String(texto || '').toLowerCase().includes(q);

export default function RolesPage({ api = rolService, onSelectNav }) {
  const [pestana, setPestana] = useState('roles'); // 'roles' | 'usuarios'

  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [busquedaRoles, setBusquedaRoles] = useState('');
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [soloEvaluadores, setSoloEvaluadores] = useState(false);

  const [rolEditando, setRolEditando] = useState(null); // null cerrado | {} nuevo | rol
  const [rolEliminando, setRolEliminando] = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(null);

  const [notificacion, setNotificacion] = useState(null);

  const cargarTodo = useCallback(
    () =>
      Promise.all([api.listarRoles(), api.listarPermisos(), api.listarUsuarios()])
        .then(([r, p, u]) => {
          setRoles(r);
          setPermisos(p);
          setUsuarios(u);
          setErrorCarga(null);
        })
        .catch((err) => setErrorCarga(mensajeErrorApi(err, 'No fue posible cargar los roles y usuarios.')))
        .finally(() => setCargando(false)),
    [api]
  );

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const recargar = () => {
    setCargando(true);
    return cargarTodo();
  };

  const notificar = (tipo, mensaje) => setNotificacion({ tipo, mensaje });

  // ── Roles ─────────────────────────────────────────────────────────────
  const abrirRol = (rol) => {
    setErrorGuardado(null);
    setRolEditando(rol || {});
  };

  const guardarRol = async (datos) => {
    setGuardando(true);
    setErrorGuardado(null);
    try {
      const editando = Boolean(rolEditando?.id);
      const guardado = editando ? await api.actualizarRol(rolEditando.id, datos) : await api.crearRol(datos);
      setRolEditando(null);
      await recargar();
      if (editando && (rolEditando.totalUsuariosAsignados || 0) > 0) {
        notificar(
          'warning',
          `El rol "${guardado?.nombre || datos.nombre}" se actualizó. Los cambios afectan de inmediato a ${rolEditando.totalUsuariosAsignados} usuario(s).`
        );
      } else {
        notificar('success', `El rol "${guardado?.nombre || datos.nombre}" se ${editando ? 'actualizó' : 'creó'} correctamente.`);
      }
    } catch (err) {
      setErrorGuardado(mensajeErrorApi(err, 'No fue posible guardar el rol.'));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarRol = async (rol) => {
    setGuardando(true);
    try {
      await api.eliminarRol(rol.id);
      setRolEliminando(null);
      await recargar();
      notificar('success', `El rol "${rol.nombre}" fue eliminado.`);
    } catch (err) {
      setRolEliminando(null);
      notificar('warning', mensajeErrorApi(err, 'No fue posible eliminar el rol.'));
    } finally {
      setGuardando(false);
    }
  };

  const verUsuariosDelRol = (rol) => {
    setRolEliminando(null);
    setBusquedaUsuarios(rol.nombre);
    setSoloEvaluadores(false);
    setPestana('usuarios');
  };

  // ── Usuarios ──────────────────────────────────────────────────────────
  const abrirUsuario = (usuario) => {
    setErrorGuardado(null);
    setUsuarioEditando(usuario);
  };

  const guardarRolesUsuario = async (rolesIds) => {
    setGuardando(true);
    setErrorGuardado(null);
    try {
      const actualizado = await api.actualizarRolesUsuario(usuarioEditando.usuarioId, rolesIds);
      setUsuarioEditando(null);
      await recargar();
      const evaluador = Array.isArray(actualizado?.permisos) && actualizado.permisos.includes(PERMISO_EVALUAR);
      notificar(
        'success',
        `Roles de ${actualizado?.nombreCompleto || 'el usuario'} actualizados. ${
          evaluador ? 'Ahora puede ingresar como Evaluador.' : 'No tiene acceso al perfil Evaluador.'
        }`
      );
    } catch (err) {
      setErrorGuardado(mensajeErrorApi(err, 'No fue posible actualizar los roles del usuario.'));
    } finally {
      setGuardando(false);
    }
  };

  // ── Filtros ───────────────────────────────────────────────────────────
  const rolesFiltrados = useMemo(() => {
    const q = busquedaRoles.toLowerCase().trim();
    return roles.filter((r) => !q || coincide(r.nombre, q) || coincide(r.descripcion, q));
  }, [roles, busquedaRoles]);

  const usuariosFiltrados = useMemo(() => {
    const q = busquedaUsuarios.toLowerCase().trim();
    return usuarios.filter((u) => {
      if (soloEvaluadores && !(u.permisos || []).includes(PERMISO_EVALUAR)) return false;
      if (!q) return true;
      return (
        coincide(u.nombreCompleto, q) ||
        coincide(u.correo, q) ||
        coincide(u.numeroDocumento, q) ||
        (u.roles || []).some((r) => coincide(r.nombre, q))
      );
    });
  }, [usuarios, busquedaUsuarios, soloEvaluadores]);

  const totalEvaluadores = usuarios.filter((u) => (u.permisos || []).includes(PERMISO_EVALUAR)).length;

  const claseTab = (activa) =>
    `px-4 py-2 rounded-[6px] text-sm font-bold transition-colors cursor-pointer ${
      activa ? 'bg-white text-[#a6192e] shadow-2xs' : 'text-[#5b5f66] hover:text-[#1f2023]'
    }`;

  return (
    <MainLayout title="Administración de Roles y Permisos" activeNav="roles" onSelectNav={onSelectNav}>
      <div className="space-y-6">
        {notificacion && (
          <div
            role="status"
            className={`p-4 rounded-[12px] border text-sm font-medium flex items-center justify-between gap-4 ${
              notificacion.tipo === 'warning'
                ? 'bg-[#fdecec] border-[#a6192e]/30 text-[#7a0c1e]'
                : 'bg-[#edf7ed] border-[#2e7d32]/30 text-[#1b5e20]'
            }`}
          >
            <div className="flex items-center gap-3">
              {notificacion.tipo === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-[#a6192e] shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#2e7d32] shrink-0" />
              )}
              <span>{notificacion.mensaje}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotificacion(null)}
              className="p-1 hover:opacity-75 cursor-pointer"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e5e7ea]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              SIGEA — Control de Acceso
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl text-[#1f2023] mt-1 tracking-tight">
              Administración de Roles y Permisos
            </h2>
            <p className="text-sm text-[#5b5f66] mt-1">
              Gestiona los roles, sus permisos y los roles de cada usuario. Para habilitar a alguien como evaluador,
              asígnale un rol con el permiso de evaluar propuestas.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={recargar} loading={cargando}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar</span>
            </Button>
            {pestana === 'roles' && (
              <Button type="button" variant="primary" onClick={() => abrirRol(null)} disabled={cargando}>
                <Plus className="w-4 h-4" />
                <span>Crear Nuevo Rol</span>
              </Button>
            )}
          </div>
        </div>

        {errorCarga && (
          <div role="alert" className="flex items-start gap-3 p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e]">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#a6192e]" />
            <p className="text-sm">{errorCarga}</p>
          </div>
        )}

        <div role="tablist" className="inline-flex items-center gap-1.5 p-1 bg-[#f7f7f8] rounded-[8px] border border-[#e5e7ea]">
          <button type="button" role="tab" aria-selected={pestana === 'roles'} className={claseTab(pestana === 'roles')} onClick={() => setPestana('roles')}>
            <span className="inline-flex items-center gap-1.5"><Shield className="w-4 h-4" />Roles ({roles.length})</span>
          </button>
          <button type="button" role="tab" aria-selected={pestana === 'usuarios'} className={claseTab(pestana === 'usuarios')} onClick={() => setPestana('usuarios')}>
            <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" />Usuarios ({usuarios.length})</span>
          </button>
        </div>

        {pestana === 'roles' ? (
          <>
            <div className="w-full max-w-sm">
              <Input
                id="buscar-rol"
                value={busquedaRoles}
                onChange={(e) => setBusquedaRoles(e.target.value)}
                placeholder="Buscar rol por nombre o descripción..."
                rightElement={<Search className="w-4 h-4 text-[#5b5f66]" />}
              />
            </div>

            <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
                      <th className="py-3.5 px-6">Rol</th>
                      <th className="py-3.5 px-6">Descripción</th>
                      <th className="py-3.5 px-6 text-center">Permisos</th>
                      <th className="py-3.5 px-6 text-center">Usuarios</th>
                      <th className="py-3.5 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
                    {cargando && roles.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 px-6 text-center text-[#5b5f66]">Cargando roles...</td></tr>
                    ) : rolesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 px-6 text-center text-[#5b5f66]">
                          <p className="font-semibold text-base text-[#1f2023]">No se encontraron roles</p>
                          <p className="text-xs mt-1 text-[#9ca0a6]">Prueba con otros términos o crea un nuevo rol.</p>
                        </td>
                      </tr>
                    ) : (
                      rolesFiltrados.map((rol) => (
                        <tr key={rol.id} className="hover:bg-[#f7f7f8]/50 transition-colors">
                          <td className="py-4 px-6 align-middle">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-base">{rol.nombre}</span>
                              {esRolSistema(rol) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fdecec] text-[#a6192e] border border-[#a6192e]/20">
                                  <Lock className="w-3 h-3" />
                                  Sistema
                                </span>
                              )}
                              {esRolEvaluador(rol) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf3] text-[#027a48] border border-[#a6f4c5]">
                                  <ClipboardCheck className="w-3 h-3" />
                                  Evaluador
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 align-middle max-w-md">
                            <p className="text-xs text-[#5b5f66] leading-relaxed line-clamp-2">{rol.descripcion || '—'}</p>
                          </td>
                          <td className="py-4 px-6 align-middle text-center text-xs font-semibold">{(rol.permisos || []).length}</td>
                          <td className="py-4 px-6 align-middle text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-[#f7f7f8] border-[#e5e7ea]">
                              <Users className="w-3.5 h-3.5 text-[#a6192e]" />
                              {rol.totalUsuariosAsignados ?? 0}
                            </span>
                          </td>
                          <td className="py-4 px-6 align-middle text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => abrirRol(rol)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-white border border-[#d8dadf] hover:bg-[#f7f7f8] cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-[#5b5f66]" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setRolEliminando(rol)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-semibold text-[#a6192e] bg-[#fdecec]/50 border border-[#a6192e]/20 hover:bg-[#fdecec] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="w-full max-w-sm">
                <Input
                  id="buscar-usuario"
                  value={busquedaUsuarios}
                  onChange={(e) => setBusquedaUsuarios(e.target.value)}
                  placeholder="Buscar por nombre, correo, documento o rol..."
                  rightElement={<Search className="w-4 h-4 text-[#5b5f66]" />}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1f2023] cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloEvaluadores}
                  onChange={(e) => setSoloEvaluadores(e.target.checked)}
                  className="accent-[#a6192e]"
                />
                Solo evaluadores habilitados ({totalEvaluadores})
              </label>
            </div>

            <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
                      <th className="py-3.5 px-6">Usuario</th>
                      <th className="py-3.5 px-6">Roles</th>
                      <th className="py-3.5 px-6 text-center">Evaluador</th>
                      <th className="py-3.5 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
                    {cargando && usuarios.length === 0 ? (
                      <tr><td colSpan={4} className="py-12 px-6 text-center text-[#5b5f66]">Cargando usuarios...</td></tr>
                    ) : usuariosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 px-6 text-center text-[#5b5f66]">
                          <p className="font-semibold text-base text-[#1f2023]">No se encontraron usuarios</p>
                        </td>
                      </tr>
                    ) : (
                      usuariosFiltrados.map((u) => {
                        const evaluador = (u.permisos || []).includes(PERMISO_EVALUAR);
                        return (
                          <tr key={u.usuarioId} className="hover:bg-[#f7f7f8]/50 transition-colors">
                            <td className="py-4 px-6 align-middle">
                              <p className="font-semibold">{u.nombreCompleto}</p>
                              <p className="text-xs text-[#5b5f66]">{u.correo}</p>
                              {u.estado && u.estado !== 'activo' && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f7f7f8] border border-[#e5e7ea] text-[#5b5f66] uppercase">
                                  {u.estado}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 align-middle">
                              <div className="flex flex-wrap gap-1.5">
                                {(u.roles || []).length === 0 ? (
                                  <span className="text-xs text-[#9ca0a6]">Sin roles</span>
                                ) : (
                                  u.roles.map((r) => (
                                    <span key={r.id} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f7f7f8] border border-[#e5e7ea]">
                                      {r.nombre}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 align-middle text-center">
                              {evaluador ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ecfdf3] text-[#027a48] border border-[#a6f4c5]">
                                  <ClipboardCheck className="w-3 h-3" />
                                  Habilitado
                                </span>
                              ) : (
                                <span className="text-xs text-[#9ca0a6]">No</span>
                              )}
                            </td>
                            <td className="py-4 px-6 align-middle text-right">
                              <button
                                type="button"
                                onClick={() => abrirUsuario(u)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-white border border-[#d8dadf] hover:bg-[#f7f7f8] cursor-pointer"
                              >
                                <UserCog className="w-3.5 h-3.5 text-[#5b5f66]" />
                                <span>Asignar roles</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {rolEditando && (
        <RoleFormModal
          key={rolEditando.id || 'nuevo'}
          isOpen
          role={rolEditando.id ? rolEditando : null}
          permisosCatalogo={permisos}
          guardando={guardando}
          errorGuardado={errorGuardado}
          onClose={() => setRolEditando(null)}
          onSave={guardarRol}
        />
      )}

      <RoleDeleteModal
        isOpen={Boolean(rolEliminando)}
        role={rolEliminando && { ...rolEliminando, label: rolEliminando.nombre, usuariosAsignados: rolEliminando.usuariosActivosAsignados }}
        onClose={() => setRolEliminando(null)}
        onConfirmDelete={() => eliminarRol(rolEliminando)}
        onNavigateToUsers={() => verUsuariosDelRol(rolEliminando)}
      />

      {usuarioEditando && (
        <UsuarioRolesModal
          key={usuarioEditando.usuarioId}
          usuario={usuarioEditando}
          roles={roles}
          guardando={guardando}
          errorGuardado={errorGuardado}
          onClose={() => setUsuarioEditando(null)}
          onSave={guardarRolesUsuario}
        />
      )}
    </MainLayout>
  );
}

RolesPage.propTypes = {
  api: PropTypes.shape({
    listarRoles: PropTypes.func.isRequired,
    listarPermisos: PropTypes.func.isRequired,
    listarUsuarios: PropTypes.func.isRequired,
    crearRol: PropTypes.func.isRequired,
    actualizarRol: PropTypes.func.isRequired,
    eliminarRol: PropTypes.func.isRequired,
    actualizarRolesUsuario: PropTypes.func.isRequired,
  }),
  onSelectNav: PropTypes.func,
};
