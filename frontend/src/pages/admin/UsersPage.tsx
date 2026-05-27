import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Avatar, Badge, Button, Empty, Field, Input, PageTitle, Select, formatDate } from '../../components/ui';
import { api, dataOf, errorMessage } from '../../lib/api';
import { liveConnection } from '../../lib/live';
import type { Paged, User } from '../../types';

interface IpLog {
  id: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  isDifferentFromFirstIp: boolean;
  createdAt: string;
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<{ user: User; items: IpLog[] }>();
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', password: '', role: 'USER', area: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = () => api.get('/users?limit=100').then((response) => setUsers(dataOf<Paged<User>>(response).items));
  useEffect(() => { load().catch((requestError) => setError(errorMessage(requestError))); }, []);
  useEffect(() => {
    const socket = liveConnection();
    const refresh = () => load().catch((requestError) => setError(errorMessage(requestError)));
    socket?.on('administration.updated', refresh);
    return () => { socket?.off('administration.updated', refresh); };
  }, []);

  const action = async (id: string, path: string, body?: object) => {
    try {
      await api.patch(`/users/${id}/${path}`, body || {});
      setMessage('Acción realizada correctamente.');
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  };
  const seeHistory = async (selected: User) => {
    const response = await api.get(`/users/${selected.id}/ip-history`);
    setHistory({ user: selected, items: dataOf<IpLog[]>(response) });
  };
  const edit = async (selected: User) => {
    const area = window.prompt('Área o dependencia:', selected.area || '');
    if (area === null) return;
    const position = window.prompt('Cargo:', selected.position || '');
    if (position === null) return;
    try {
      await api.patch(`/users/${selected.id}`, { area, position });
      setMessage('Datos del usuario actualizados.');
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  };
  const resetPassword = async (selected: User) => {
    const newPassword = window.prompt(`Nueva contraseña temporal para ${selected.fullName}:`);
    if (!newPassword) return;
    if (!window.confirm('El usuario deberá cambiar esta contraseña al ingresar. ¿Confirmas?')) return;
    try {
      await api.patch(`/users/${selected.id}/password`, { newPassword, mustChangePassword: true });
      setMessage('Contraseña temporal actualizada.');
    } catch (requestError) { setError(errorMessage(requestError)); }
  };
  const create = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/users', newUser);
      setShowCreate(false);
      setMessage('Usuario creado; deberá cambiar la contraseña asignada al iniciar.');
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  };

  return (
    <>
      <PageTitle title="Gestión de usuarios" subtitle="Cuentas, accesos y asociación de direcciones IP" action={<Button onClick={() => setShowCreate(!showCreate)}>Crear usuario</Button>} />
      {message && <div className="mb-4"><Alert kind="success">{message}</Alert></div>}
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {showCreate && (
        <form className="panel mb-6 grid gap-4 md:grid-cols-5" onSubmit={create}>
          <Field label="Nombre" required><Input required value={newUser.firstName} onChange={(event) => setNewUser({ ...newUser, firstName: event.target.value })} /></Field>
          <Field label="Apellido" required><Input required value={newUser.lastName} onChange={(event) => setNewUser({ ...newUser, lastName: event.target.value })} /></Field>
          <Field label="Contraseña temporal" required><Input required type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} /></Field>
          <Field label="Rol"><Select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}><option value="USER">Usuario</option><option value="SUPERADMIN">Equipo de Sistemas</option></Select></Field>
          <div className="flex items-end"><Button className="w-full">Registrar</Button></div>
        </form>
      )}
      <section className="panel overflow-x-auto p-0">
        {!users.length ? <div className="p-5"><Empty text="No hay usuarios." /></div> : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-4">Usuario</th><th className="px-4 py-4">Área / Cargo</th><th className="px-4 py-4">Rol</th><th className="px-4 py-4">Estado</th><th className="px-4 py-4">IP inicial / Última IP</th><th className="px-4 py-4">Acciones</th></tr></thead>
            <tbody>{users.map((member) => (
              <tr key={member.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-4"><div className="flex gap-2"><Avatar size="sm" path={member.profilePhotoPath} name={member.fullName} /><div><strong>{member.fullName}</strong><p className="text-xs text-slate-500">@{member.username}<br />Último inicio: {formatDate(member.lastLoginAt)}</p></div></div></td>
                <td className="px-4 py-4">{member.area || '-'}<br /><span className="text-slate-500">{member.position || '-'}</span></td>
                <td className="px-4 py-4"><Badge value={member.role} /></td>
                <td className="px-4 py-4"><Badge value={member.status} /></td>
                <td className="px-4 py-4 text-xs">{member.firstAccessIp || '-'}<br />{member.lastLoginIp || '-'}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {member.status === 'PENDING' && <Button className="px-2 py-1 text-xs" onClick={() => action(member.id, 'approve')}>Aprobar</Button>}
                    {member.isActive ? <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => window.confirm('¿Desactivar usuario?') && action(member.id, 'deactivate')}>Desactivar</Button> : <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => action(member.id, 'activate')}>Activar</Button>}
                    <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => edit(member)}>Editar</Button>
                    <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => resetPassword(member)}>Cambiar contraseña</Button>
                    <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => seeHistory(member)}>Historial IP</Button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
      {history && (
        <section className="panel mt-6">
          <div className="mb-4 flex justify-between"><h2 className="font-semibold text-cecasem-navy">Historial de IP: {history.user.fullName}</h2><button onClick={() => setHistory(undefined)}>Cerrar</button></div>
          {!history.items.length ? <Empty text="Sin registros de IP." /> : history.items.map((log) => (
            <div key={log.id} className="mb-2 grid rounded-xl bg-slate-50 p-3 text-xs md:grid-cols-4">
              <span>{log.action}</span><span>{log.ipAddress}{log.isDifferentFromFirstIp && ' (diferente)'}</span><span className="truncate">{log.userAgent}</span><span>{formatDate(log.createdAt)}</span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
