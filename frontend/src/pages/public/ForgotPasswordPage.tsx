import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Field, Input, Textarea } from '../../components/ui';
import { api, dataOf, errorMessage } from '../../lib/api';
import { AuthShell } from './LoginPage';

export function ForgotPasswordPage() {
  const [form, setForm] = useState({ identifier: '', email: '', phone: '', notes: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (!form.email.trim() && !form.phone.trim()) {
      setError('Ingresa el correo o el celular registrado.');
      setLoading(false);
      return;
    }
    try {
      const response = await api.post('/auth/password-reset-request', form);
      const result = dataOf<{ message: string }>(response);
      setMessage(result.message);
      setForm({ identifier: '', email: '', phone: '', notes: '' });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Recuperar contraseña" subtitle="Envía tus datos registrados al Equipo de Sistemas">
      <form className="space-y-5" onSubmit={submit}>
        {message && <Alert kind="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
        <Field label="Nombre completo o usuario" required>
          <Input
            value={form.identifier}
            onChange={(event) => update('identifier', event.target.value)}
            autoComplete="username"
            required
          />
        </Field>
        <Field label="Correo registrado">
          <Input
            type="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Celular registrado">
          <Input
            value={form.phone}
            onChange={(event) => update('phone', event.target.value)}
            autoComplete="tel"
          />
        </Field>
        <Field label="Detalle opcional">
          <Textarea
            value={form.notes}
            onChange={(event) => update('notes', event.target.value)}
            maxLength={240}
            placeholder="Ej. no puedo ingresar desde mi celular."
          />
        </Field>
        <Button className="w-full" disabled={loading}>{loading ? 'Enviando...' : 'Enviar solicitud'}</Button>
        <p className="text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-cecasem-blue">Volver al inicio de sesión</Link>
        </p>
      </form>
    </AuthShell>
  );
}
