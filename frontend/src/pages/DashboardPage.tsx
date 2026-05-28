import { useEffect, useState } from 'react';
import { AlertCircle, Camera, CheckCircle, Clock3, FolderOpen, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Avatar, Badge, Empty, PageTitle, auditActionLabel, formatDate, priorityLabel, ticketStatusLabel } from '../components/ui';
import { api, dataOf } from '../lib/api';
import { liveConnection } from '../lib/live';
import type { Paged, Summary, Ticket, User } from '../types';

interface AccessItem {
  id: string;
  action: string;
  ipAddress: string;
  createdAt: string;
  user?: Pick<User, 'fullName' | 'profilePhotoPath'>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [summary, setSummary] = useState<Summary>();
  const [pending, setPending] = useState<User[]>([]);
  const [access, setAccess] = useState<AccessItem[]>([]);

  const load = () => {
    api.get('/tickets?limit=100').then((response) => setTickets(dataOf<Paged<Ticket>>(response).items));
    if (user?.role === 'SUPERADMIN') {
      api.get('/reports/summary').then((response) => setSummary(dataOf<Summary>(response)));
      api.get('/users/pending').then((response) => setPending(dataOf<User[]>(response)));
      api.get('/logs/access?limit=5').then((response) => setAccess(dataOf<Paged<AccessItem>>(response).items));
    }
  };

  useEffect(() => { load(); }, [user?.role]);

  useEffect(() => {
    const socket = liveConnection();
    const refreshTickets = () => load();
    const refreshAdministration = () => load();
    socket?.on('ticket.updated', refreshTickets);
    socket?.on('administration.updated', refreshAdministration);
    return () => {
      socket?.off('ticket.updated', refreshTickets);
      socket?.off('administration.updated', refreshAdministration);
    };
  }, [user?.role]);

  const mine = {
    open: tickets.filter((ticket) => ticket.status === 'ABIERTO').length,
    process: tickets.filter((ticket) => ticket.status === 'EN_PROCESO').length,
    closed: tickets.filter((ticket) => ticket.status === 'CERRADO').length,
  };
  const cards = user?.role === 'SUPERADMIN' && summary
    ? [
        { label: 'Total de tickets', value: summary.totalTickets, icon: FolderOpen },
        { label: 'Abiertos', value: summary.openTickets, icon: AlertCircle },
        { label: 'En proceso', value: summary.processingTickets, icon: Clock3 },
        { label: 'Críticos', value: summary.criticalTickets, icon: AlertCircle },
        { label: 'Cerrados hoy', value: summary.closedToday, icon: CheckCircle },
        { label: 'Pendientes', value: summary.pendingUsers, icon: Users },
        { label: 'Con constancia', value: summary.withConstancy, icon: Camera },
      ]
    : [
        { label: 'Mis tickets recientes', value: tickets.length, icon: FolderOpen },
        { label: 'Abiertos', value: mine.open, icon: AlertCircle },
        { label: 'En proceso', value: mine.process, icon: Clock3 },
        { label: 'Cerrados', value: mine.closed, icon: CheckCircle },
      ];

  return (
    <>
      <PageTitle
        title={user?.role === 'SUPERADMIN' ? 'Panel del Equipo de Sistemas' : 'Mi panel de soporte'}
        subtitle="Resumen de solicitudes y movimientos recientes"
        action={<Link to="/tickets/new" className="rounded-xl bg-cecasem-blue px-4 py-2.5 text-sm font-semibold text-white">Crear ticket</Link>}
      />
      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel flex items-center justify-between">
            <div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-cecasem-navy">{value}</p></div>
            <span className="rounded-xl bg-cecasem-mist p-3 text-cecasem-blue"><Icon size={22} /></span>
          </div>
        ))}
      </div>
      {summary && (
        <div className="mb-7 grid gap-5 lg:grid-cols-2">
          <Chart title="Tickets por estado" items={summary.byStatus.map((item) => ({ label: ticketStatusLabel(item.status), value: item._count }))} />
          <Chart title="Tickets por prioridad" items={summary.byPriority.map((item) => ({ label: priorityLabel(item.priority), value: item._count }))} />
        </div>
      )}
      {user?.role === 'SUPERADMIN' && (
        <div className="mb-7 grid gap-5 lg:grid-cols-2">
          <section className="panel">
            <h2 className="mb-4 font-semibold text-cecasem-navy">Últimos usuarios pendientes</h2>
            {!pending.length ? <Empty text="No hay aprobaciones pendientes." /> : pending.slice(0, 5).map((member) => (
              <div key={member.id} className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                <Avatar size="sm" name={member.fullName} path={member.profilePhotoPath} />
                <div className="flex-1"><p className="font-medium">{member.fullName}</p><p className="text-xs text-slate-500">{member.firstAccessIp}</p></div>
                <Link to="/pending-users" className="text-xs font-semibold text-cecasem-blue">Revisar</Link>
              </div>
            ))}
          </section>
          <section className="panel">
            <h2 className="mb-4 font-semibold text-cecasem-navy">Accesos recientes</h2>
            {!access.length ? <Empty text="Sin accesos registrados." /> : access.map((item) => (
              <div key={item.id} className="mb-3 flex justify-between rounded-xl bg-slate-50 p-3 text-xs">
                <div><p className="font-semibold">{item.user?.fullName || 'No identificado'}</p><p className="text-slate-500">{auditActionLabel(item.action)} · {item.ipAddress}</p></div>
                <span className="text-slate-400">{formatDate(item.createdAt)}</span>
              </div>
            ))}
          </section>
        </div>
      )}
      <section className="panel">
        <h2 className="mb-4 text-lg font-semibold text-cecasem-navy">Últimos tickets</h2>
        {!tickets.length ? <Empty text="No hay tickets registrados todavía." /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr className="border-b text-left text-slate-500"><th className="pb-3">Código</th><th className="pb-3">Título</th><th className="pb-3">Estado</th><th className="pb-3">Fecha</th></tr></thead>
              <tbody>{tickets.slice(0, 6).map((ticket) => (
                <tr key={ticket.id} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-cecasem-blue"><Link to={`/tickets/${ticket.id}`}>{ticket.code}</Link></td>
                  <td className="py-3">{ticket.title}</td>
                  <td className="py-3"><Badge value={ticket.status} /></td>
                  <td className="py-3 text-slate-500">{formatDate(ticket.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Chart({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="panel">
      <h2 className="mb-5 font-semibold text-cecasem-navy">{title}</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-xs text-slate-600"><span>{item.label}</span><span>{item.value}</span></div>
            <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-cecasem-blue" style={{ width: `${(item.value / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
