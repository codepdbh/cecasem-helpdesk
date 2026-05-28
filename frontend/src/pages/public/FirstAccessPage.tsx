import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Field, Input, PasswordInput } from '../../components/ui';
import { api, dataOf, errorMessage } from '../../lib/api';
import { AuthShell } from './LoginPage';

interface RegistrationResult {
  user: { username: string };
  detectedIp: string;
  requiresApproval: boolean;
  message: string;
}

const maxProfilePhotoBytes = 3 * 1024 * 1024;

export function FirstAccessPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', password: '', confirmPassword: '', area: '', position: '', phone: '', email: '',
  });
  const [photo, setPhoto] = useState<File>();
  const [detectedIp, setDetectedIp] = useState('Detectando...');
  const [result, setResult] = useState<RegistrationResult>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const preview = useMemo(() => photo && URL.createObjectURL(photo), [photo]);

  useEffect(() => {
    api.get('/auth/network-info')
      .then((response) => setDetectedIp(dataOf<{ detectedIp: string }>(response).detectedIp))
      .catch(() => setDetectedIp('No disponible'));
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const update = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const selectPhoto = (file?: File) => {
    setError('');
    if (!file) {
      setPhoto(undefined);
      return;
    }
    if (file.size > maxProfilePhotoBytes) {
      setPhoto(undefined);
      setError('La foto de perfil debe pesar máximo 3 MB.');
      return;
    }
    setPhoto(file);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!photo) {
      setError('Selecciona una foto de perfil.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (['area', 'position', 'phone', 'email'].includes(key) && !value.trim()) return;
      payload.append(key, value);
    });
    payload.append('photo', photo);
    try {
      setResult(dataOf<RegistrationResult>(await api.post('/auth/first-access', payload)));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Primer ingreso al sistema" subtitle="Registra tus datos personales para solicitar acceso.">
      {result ? (
        <div className="space-y-5">
          <Alert kind="success">{result.message}</Alert>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p><strong>Usuario generado:</strong> {result.user.username}</p>
            <p><strong>IP registrada:</strong> {result.detectedIp}</p>
          </div>
          <Link className="block rounded-xl bg-cecasem-blue px-4 py-3 text-center font-semibold text-white" to="/login">Ir a iniciar sesión</Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          {error && <Alert>{error}</Alert>}
          <Alert kind="info">IP registrada: <strong>{detectedIp}</strong><br />Esta IP quedará asociada a tu nombre, apellido y foto para fines de control interno y auditoría.</Alert>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" required><Input value={form.firstName} onChange={(event) => update('firstName', event.target.value)} required /></Field>
            <Field label="Apellido" required><Input value={form.lastName} onChange={(event) => update('lastName', event.target.value)} required /></Field>
          </div>
          <Field label="Foto de perfil (JPG, PNG o WEBP, máx. 3 MB)" required>
            <Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => selectPhoto(event.target.files?.[0])} required />
          </Field>
          {preview && <img src={preview} alt="Vista previa" className="h-20 w-20 rounded-full object-cover" />}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contraseña" required><PasswordInput value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete="new-password" required /></Field>
            <Field label="Confirmar" required><PasswordInput value={form.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} autoComplete="new-password" required /></Field>
          </div>
          <Field label="Área o dependencia"><Input value={form.area} onChange={(event) => update('area', event.target.value)} /></Field>
          <Field label="Cargo"><Input value={form.position} onChange={(event) => update('position', event.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Celular"><Input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></Field>
            <Field label="Correo"><Input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></Field>
          </div>
          <Button disabled={loading} className="w-full">{loading ? 'Registrando...' : 'Registrar mis datos'}</Button>
        </form>
      )}
    </AuthShell>
  );
}
