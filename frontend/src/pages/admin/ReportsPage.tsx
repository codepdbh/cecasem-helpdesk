import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Avatar, Badge, Button, Empty, Field, Input, PageTitle, Select, formatDate } from '../../components/ui';
import { api, dataOf, downloadFile, errorMessage } from '../../lib/api';
import type { Category, Paged, Ticket, User } from '../../types';

export function ReportsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '', dateTo: '', status: '', priority: '', categoryId: '', userId: '', hasConstancyPhoto: '',
    includeProfilePhotos: false, includeConstancyPhotos: false, includeCreationIp: true, includeActions: false,
  });
  useEffect(() => {
    api.get('/categories').then((response) => setCategories(dataOf<Category[]>(response)));
    api.get('/users?limit=100').then((response) => setUsers(dataOf<Paged<User>>(response).items));
  }, []);

  const exportParams = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== false) params.append(key, String(value));
    });
    return params;
  };
  const ticketParams = () => {
    const params = new URLSearchParams({ limit: '100' });
    ['dateFrom', 'dateTo', 'status', 'priority', 'categoryId', 'hasConstancyPhoto'].forEach((key) => {
      const value = filters[key as keyof typeof filters];
      if (value !== '') params.append(key, String(value));
    });
    if (filters.userId) params.append('createdById', filters.userId);
    return params;
  };
  const generate = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setTickets(dataOf<Paged<Ticket>>(await api.get(`/tickets?${ticketParams()}`)).items);
    } catch (requestError) { setError(errorMessage(requestError)); }
  };
  const pdf = () => {
    if ((filters.includeProfilePhotos || filters.includeConstancyPhotos) && !window.confirm('El PDF incluirá fotografías seleccionadas. ¿Confirmas la generación?')) return;
    downloadFile(`/reports/export/pdf?${exportParams()}`, 'reporte_cecasem_tickets.pdf').catch((requestError) => setError(errorMessage(requestError)));
  };

  return (
    <>
      <PageTitle title="Reportes" subtitle="Exportación institucional con evidencias opcionales" />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <form className="panel mb-6 space-y-5" onSubmit={generate}>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Fecha desde"><Input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} /></Field>
          <Field label="Fecha hasta"><Input type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} /></Field>
          <Field label="Estado"><Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos</option>{['ABIERTO', 'EN_PROCESO', 'ESPERANDO_USUARIO', 'RESUELTO', 'CERRADO', 'REABIERTO', 'CANCELADO'].map((value) => <option key={value}>{value}</option>)}</Select></Field>
          <Field label="Prioridad"><Select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}><option value="">Todas</option>{['BAJA', 'MEDIA', 'ALTA', 'CRITICA'].map((value) => <option key={value}>{value}</option>)}</Select></Field>
          <Field label="Categoría"><Select value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}><option value="">Todas</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</Select></Field>
          <Field label="Usuario"><Select value={filters.userId} onChange={(event) => setFilters({ ...filters, userId: event.target.value })}><option value="">Todos</option>{users.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}</Select></Field>
          <Field label="Tiene foto de constancia"><Select value={filters.hasConstancyPhoto} onChange={(event) => setFilters({ ...filters, hasConstancyPhoto: event.target.value })}><option value="">Todos</option><option value="true">Sí</option><option value="false">No</option></Select></Field>
        </div>
        <div className="flex flex-wrap gap-5 rounded-xl bg-slate-50 p-4 text-sm">
          <Check label="Incluir fotos de perfil" checked={filters.includeProfilePhotos} change={(value) => setFilters({ ...filters, includeProfilePhotos: value })} />
          <Check label="Incluir fotos de constancia" checked={filters.includeConstancyPhotos} change={(value) => setFilters({ ...filters, includeConstancyPhotos: value })} />
          <Check label="Incluir IP de creación" checked={filters.includeCreationIp} change={(value) => setFilters({ ...filters, includeCreationIp: value })} />
          <Check label="Incluir historial de acciones" checked={filters.includeActions} change={(value) => setFilters({ ...filters, includeActions: value })} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button>Generar reporte</Button>
          <Button type="button" variant="secondary" onClick={() => downloadFile(`/reports/export/csv?${exportParams()}`, 'reporte_cecasem_tickets.csv')}>Exportar CSV</Button>
          <Button type="button" variant="secondary" onClick={pdf}>Exportar PDF</Button>
        </div>
      </form>
      <section className="panel overflow-x-auto p-0">
        {!tickets.length ? <div className="p-5"><Empty text="Genera un reporte para visualizar resultados." /></div> : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">Ticket</th><th className="px-4 py-3 text-left">Usuario</th><th className="px-4 py-3">Prioridad</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Constancia</th><th className="px-4 py-3">Fecha</th></tr></thead>
            <tbody>{tickets.map((ticket) => (
              <tr className="border-t border-slate-100" key={ticket.id}>
                <td className="px-4 py-3"><strong>{ticket.code}</strong><br />{ticket.title}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar size="sm" name={ticket.createdBy.fullName} path={ticket.createdBy.profilePhotoPath} />{ticket.createdBy.fullName}</div></td>
                <td className="px-4 py-3 text-center"><Badge value={ticket.priority} /></td>
                <td className="px-4 py-3 text-center"><Badge value={ticket.status} /></td>
                <td className="px-4 py-3 text-center">{ticket.constancyPhotos.length ? 'Sí' : 'No'}</td>
                <td className="px-4 py-3 text-center text-xs">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </>
  );
}

function Check({ label, checked, change }: { label: string; checked: boolean; change: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={(event) => change(event.target.checked)} className="h-4 w-4 accent-cecasem-blue" />{label}</label>;
}

