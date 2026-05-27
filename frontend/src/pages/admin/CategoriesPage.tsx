import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Badge, Button, Field, Input, PageTitle } from '../../components/ui';
import { api, dataOf, errorMessage } from '../../lib/api';
import type { Category } from '../../types';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const load = () => api.get('/categories').then((response) => setCategories(dataOf<Category[]>(response)));
  useEffect(() => { load(); }, []);
  const create = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/categories', form);
      setForm({ name: '', description: '' });
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  };
  const toggle = async (category: Category) => {
    await api.patch(`/categories/${category.id}/${category.isActive ? 'deactivate' : 'activate'}`);
    load();
  };
  return (
    <>
      <PageTitle title="Categorías" subtitle="Clasificación disponible para los tickets" />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      <form className="panel mb-6 flex flex-wrap items-end gap-4" onSubmit={create}>
        <Field label="Nueva categoría"><Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Descripción"><Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
        <Button>Crear categoría</Button>
      </form>
      <div className="panel divide-y divide-slate-100">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between gap-3 py-4">
            <div><p className="font-medium">{category.name}</p><p className="text-sm text-slate-500">{category.description || 'Sin descripción'}</p></div>
            <div className="flex items-center gap-3"><Badge value={category.isActive ? 'ACTIVE' : 'DISABLED'} /><Button variant="ghost" onClick={() => toggle(category)}>{category.isActive ? 'Desactivar' : 'Activar'}</Button></div>
          </div>
        ))}
      </div>
    </>
  );
}
