import { useEffect, useState } from 'react';
import { Alert, Avatar, Button, Empty, PageTitle, formatDate } from '../../components/ui';
import { api, dataOf, errorMessage } from '../../lib/api';
import { liveConnection } from '../../lib/live';
import type { User } from '../../types';

export function PendingUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const load = () => api.get('/users/pending').then((response) => setUsers(dataOf<User[]>(response)));
  useEffect(() => { load().catch((requestError) => setError(errorMessage(requestError))); }, []);
  useEffect(() => {
    const socket = liveConnection();
    const refresh = () => load().catch((requestError) => setError(errorMessage(requestError)));
    socket?.on('administration.updated', refresh);
    return () => { socket?.off('administration.updated', refresh); };
  }, []);

  const approve = async (id: string) => {
    await api.patch(`/users/${id}/approve`);
    load();
  };
  const reject = async (id: string) => {
    const reason = window.prompt('Indica el motivo de rechazo:');
    if (!reason || !window.confirm('¿Confirmas el rechazo de esta solicitud?')) return;
    await api.patch(`/users/${id}/reject`, { reason });
    load();
  };

  return (
    <>
      <PageTitle title="Usuarios pendientes" subtitle="Solicitudes registradas desde la red local que requieren aprobación" />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {!users.length ? <Empty text="No hay usuarios pendientes de aprobación." /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {users.map((member) => (
            <div key={member.id} className="panel flex flex-wrap items-start gap-4">
              <Avatar name={member.fullName} path={member.profilePhotoPath} size="lg" />
              <div className="flex-1 text-sm">
                <h2 className="font-bold text-cecasem-navy">{member.fullName}</h2>
                <p className="text-slate-500">@{member.username}</p>
                <p className="mt-3"><strong>IP de primer ingreso:</strong> {member.firstAccessIp}</p>
                <p className="truncate"><strong>Dispositivo:</strong> {member.firstAccessUserAgent}</p>
                <p><strong>Fecha:</strong> {formatDate(member.firstAccessAt)}</p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => approve(member.id)}>Aprobar</Button>
                  <Button variant="danger" onClick={() => reject(member.id)}>Rechazar</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
