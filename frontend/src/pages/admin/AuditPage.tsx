import { useEffect, useState } from 'react';
import { Alert, Avatar, Button, Empty, PageTitle, auditActionLabel, formatDate } from '../../components/ui';
import { api, dataOf, errorMessage } from '../../lib/api';
import type { Paged } from '../../types';

type Tab = 'access' | 'tickets' | 'user-devices';
interface LogRecord {
  id: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  message?: string;
  createdAt: string;
  user?: { fullName: string; username?: string; profilePhotoPath?: string };
  ticket?: { code: string; title: string };
}

export function AuditPage() {
  const [tab, setTab] = useState<Tab>('access');
  const [records, setRecords] = useState<LogRecord[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get(`/logs/${tab}?limit=50`)
      .then((response) => setRecords(dataOf<Paged<LogRecord>>(response).items))
      .catch((requestError) => setError(errorMessage(requestError)));
  }, [tab]);
  return (
    <>
      <PageTitle title="Auditoría" subtitle="Accesos, acciones sobre tickets e historial de dispositivos/IP" />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <div className="mb-5 flex flex-wrap gap-2">
        {[['access', 'Registros de acceso'], ['tickets', 'Registros de tickets'], ['user-devices', 'Dispositivos / IP']] .map(([value, label]) => (
          <Button key={value} variant={tab === value ? 'primary' : 'ghost'} onClick={() => setTab(value as Tab)}>{label}</Button>
        ))}
      </div>
      <section className="panel overflow-x-auto p-0">
        {!records.length ? <div className="p-5"><Empty text="No hay registros en esta bandeja." /></div> : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-4">Usuario</th><th className="px-4 py-4">Acción</th><th className="px-4 py-4">Ticket / Mensaje</th><th className="px-4 py-4">IP</th><th className="px-4 py-4">Navegador / dispositivo</th><th className="px-4 py-4">Fecha</th></tr></thead>
            <tbody>{records.map((record) => (
              <tr key={record.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{record.user ? <div className="flex items-center gap-2"><Avatar size="sm" name={record.user.fullName} path={record.user.profilePhotoPath} />{record.user.fullName}</div> : 'No identificado'}</td>
                <td className="px-4 py-3 font-medium">{auditActionLabel(record.action)}</td>
                <td className="px-4 py-3 text-xs">{record.ticket?.code || record.message || '-'}</td>
                <td className="px-4 py-3">{record.ipAddress || '-'}</td>
                <td className="max-w-56 truncate px-4 py-3 text-xs text-slate-500">{record.userAgent || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDate(record.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </>
  );
}
