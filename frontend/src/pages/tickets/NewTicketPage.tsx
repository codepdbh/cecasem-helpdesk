import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Field, Input, PageTitle, Select, Textarea } from '../../components/ui';
import { api, dataOf, errorMessage } from '../../lib/api';
import type { Category, Ticket } from '../../types';

export function NewTicketPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: '', categoryId: '', priority: 'MEDIA', priorityJustification: '', reason: '', purpose: '', description: '',
  });
  const [attachment, setAttachment] = useState<File>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/categories').then((response) => setCategories(dataOf<Category[]>(response).filter((category) => category.isActive)));
  }, []);
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (attachment) payload.append('attachment', attachment);
    try {
      const ticket = dataOf<Ticket>(await api.post('/tickets', payload));
      navigate(`/tickets/${ticket.id}`);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle title="Crear ticket" subtitle="Describe claramente la solicitud para que el Equipo de Sistemas pueda atenderla." />
      <form className="panel mx-auto max-w-3xl space-y-5" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <Field label="Título del ticket" required><Input value={form.title} onChange={(event) => update('title', event.target.value)} required /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Categoría" required>
            <Select value={form.categoryId} onChange={(event) => update('categoryId', event.target.value)} required>
              <option value="">Seleccionar...</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
          </Field>
          <Field label="Prioridad" required>
            <Select value={form.priority} onChange={(event) => update('priority', event.target.value)}>
              <option value="BAJA">Baja</option><option value="MEDIA">Media</option><option value="ALTA">Alta</option><option value="CRITICA">Crítica</option>
            </Select>
          </Field>
        </div>
        <Field label="Justificación de prioridad" required><Textarea value={form.priorityJustification} onChange={(event) => update('priorityJustification', event.target.value)} required /></Field>
        <Field label="¿Por qué se solicita este ticket?" required><Textarea value={form.reason} onChange={(event) => update('reason', event.target.value)} required /></Field>
        <Field label="¿Para qué propósito se necesita?" required><Textarea value={form.purpose} onChange={(event) => update('purpose', event.target.value)} required /></Field>
        <Field label="Descripción detallada" required><Textarea value={form.description} onChange={(event) => update('description', event.target.value)} required className="min-h-32" /></Field>
        <Field label="Archivo adjunto opcional (imagen, PDF u Office, máx. 10 MB)">
          <Input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx" onChange={(event) => setAttachment(event.target.files?.[0])} />
        </Field>
        <Button disabled={loading}>{loading ? 'Enviando...' : 'Enviar ticket'}</Button>
      </form>
    </>
  );
}
