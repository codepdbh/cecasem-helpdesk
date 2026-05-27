import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Alert, Button, Field, Input } from '../components/ui';
import { api, errorMessage } from '../lib/api';

export function ChangePasswordPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.patch('/auth/change-password', { currentPassword, newPassword, confirmPassword });
      await refresh();
      navigate('/dashboard');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cecasem-mist p-4">
      <div className="w-full max-w-md panel p-8">
        <h1 className="text-2xl font-bold text-cecasem-navy">Actualizar contraseña</h1>
        <p className="mb-6 mt-2 text-sm text-slate-500">Por seguridad, debes reemplazar tu contraseña temporal antes de continuar.</p>
        <form className="space-y-4" onSubmit={submit}>
          {error && <Alert>{error}</Alert>}
          <Field label="Contraseña actual" required><Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></Field>
          <Field label="Nueva contraseña" required><Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></Field>
          <Field label="Confirmar nueva contraseña" required><Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></Field>
          <p className="text-xs text-slate-500">Usa mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.</p>
          <Button className="w-full" disabled={loading}>{loading ? 'Actualizando...' : 'Actualizar contraseña'}</Button>
        </form>
      </div>
    </div>
  );
}
