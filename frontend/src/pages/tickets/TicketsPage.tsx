import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Avatar, Badge, Button, Empty, Field, Input, PageTitle, Select, formatDate, priorityLabel, ticketPriorityOptions, ticketStatusLabel, ticketStatusOptions } from '../../components/ui';
import { api, dataOf, errorMessage } from '../../lib/api';
import { liveConnection } from '../../lib/live';
import type { Category, Paged, Ticket } from '../../types';

export function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState({ status: '', priority: '', categoryId: '', search: '', hasConstancyPhoto: '' });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      Object.entries(filters).forEach(([key, value]) => value && params.append(key, value));
      setTickets(dataOf<Paged<Ticket>>(await api.get(`/tickets?${params}`)).items);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  useEffect(() => {
    api.get('/categories').then((response) => setCategories(dataOf<Category[]>(response)));
    load();
  }, []);

  useEffect(() => {
    const socket = liveConnection();
    const refresh = () => load();
    socket?.on('ticket.updated', refresh);
    return () => { socket?.off('ticket.updated', refresh); };
  }, [filters]);

  const filter = (event: FormEvent) => {
    event.preventDefault();
    load();
  };

  return (
    <>
      <PageTitle title="Tickets" subtitle={user?.role === 'SUPERADMIN' ? 'Gestión integral de solicitudes internas' : 'Seguimiento de mis solicitudes'} action={
        <Link to="/tickets/new" className="rounded-xl bg-cecasem-blue px-4 py-2.5 text-sm font-semibold text-white">Nuevo ticket</Link>
      } />
      <form className="panel mb-6 grid gap-4 md:grid-cols-5" onSubmit={filter}>
        <Field label="Buscar"><Input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Código o título" /></Field>
        <Field label="Estado">
          <Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Todos</option>
            {ticketStatusOptions.map((value) => <option key={value} value={value}>{ticketStatusLabel(value)}</option>)}
          </Select>
        </Field>
        <Field label="Prioridad">
          <Select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
            <option value="">Todas</option>{ticketPriorityOptions.map((value) => <option key={value} value={value}>{priorityLabel(value)}</option>)}
          </Select>
        </Field>
        <Field label="Categoría">
          <Select value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
            <option value="">Todas</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </Select>
        </Field>
        <div className="flex items-end"><Button className="w-full">Aplicar filtros</Button></div>
      </form>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <section className="panel overflow-hidden p-0">
        {!tickets.length ? <div className="p-5"><Empty text="No hay tickets que coincidan con los filtros." /></div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr><th className="px-5 py-4">Código / Título</th><th className="px-5 py-4">Creador</th><th className="px-5 py-4">Categoría</th><th className="px-5 py-4">Prioridad</th><th className="px-5 py-4">Estado</th>{user?.role === 'SUPERADMIN' && <th className="px-5 py-4">IP</th>}<th className="px-5 py-4">Constancia</th><th className="px-5 py-4">Fecha</th></tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4"><Link className="font-semibold text-cecasem-blue" to={`/tickets/${ticket.id}`}>{ticket.code}</Link><p className="max-w-xs truncate">{ticket.title}</p></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2"><Avatar size="sm" name={ticket.createdBy.fullName} path={ticket.createdBy.profilePhotoPath} /><span>{ticket.createdBy.fullName}</span></div></td>
                    <td className="px-5 py-4">{ticket.category.name}</td>
                    <td className="px-5 py-4"><Badge value={ticket.priority} /></td>
                    <td className="px-5 py-4"><Badge value={ticket.status} /></td>
                    {user?.role === 'SUPERADMIN' && <td className="px-5 py-4 text-xs">{ticket.createdFromIp}</td>}
                    <td className="px-5 py-4">{ticket.constancyPhotos.length ? 'Sí' : 'No'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
