import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { errorMessage } from '../../lib/api';
import { Alert, Button, Field, Input } from '../../components/ui';
import { BrandLogo } from '../../components/BrandLogo';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(identifier, password);
      navigate(result.mustChangePassword ? '/change-password' : '/dashboard');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Iniciar sesión" subtitle="Acceso autorizado para personal de CECASEM">
      <form className="space-y-5" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <Field label="Usuario, o nombre y apellido" required>
          <Input value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required />
        </Field>
        <Field label="Contraseña" required>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </Field>
        <Button className="w-full" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</Button>
        <p className="text-center text-sm text-slate-500">
          ¿Es tu primera vez? <Link to="/first-access" className="font-semibold text-cecasem-blue">Primer ingreso</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cecasem-mist px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-panel md:p-9">
        <Link to="/" className="mb-7 flex items-center gap-3">
          <BrandLogo className="h-14 w-14 rounded-xl border border-slate-100 bg-white p-1" />
          <div><p className="font-bold text-cecasem-navy">Mesa de Ayuda CECASEM</p><p className="text-xs text-slate-500">Sistema local</p></div>
        </Link>
        <h1 className="text-2xl font-bold text-cecasem-navy">{title}</h1>
        <p className="mb-7 mt-2 text-sm text-slate-500">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
