import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Alert, Avatar, Button, Field, Input, PageTitle, formatDate, roleLabel } from '../components/ui';
import { api, errorMessage } from '../lib/api';

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const [fields, setFields] = useState({
    area: user?.area || '', position: user?.position || '', phone: user?.phone || '', email: user?.email || '',
  });
  const [photo, setPhoto] = useState<File>();
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  if (!user) return null;

  const ok = async (text: string) => {
    setMessage(text);
    setError('');
    await refresh();
  };
  const fail = (requestError: unknown) => {
    setError(errorMessage(requestError));
    setMessage('');
  };
  const updateProfile = async (event: FormEvent) => {
    event.preventDefault();
    try { await api.patch('/auth/profile', fields); await ok('Perfil actualizado.'); } catch (requestError) { fail(requestError); }
  };
  const updatePhoto = async () => {
    if (!photo) return;
    const form = new FormData();
    form.append('photo', photo);
    try { await api.patch('/auth/profile/photo', form); await ok('Foto actualizada.'); } catch (requestError) { fail(requestError); }
  };
  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    try { await api.patch('/auth/change-password', password); setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' }); await ok('Contraseña actualizada.'); } catch (requestError) { fail(requestError); }
  };

  return (
    <>
      <PageTitle title="Mi perfil" subtitle="Datos personales y seguridad de tu acceso" />
      {message && <div className="mb-5"><Alert kind="success">{message}</Alert></div>}
      {error && <div className="mb-5"><Alert>{error}</Alert></div>}
      <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
        <section className="panel text-center">
          <div className="flex justify-center"><Avatar size="lg" path={user.profilePhotoPath} name={user.fullName} /></div>
          <h2 className="mt-4 text-lg font-bold text-cecasem-navy">{user.fullName}</h2>
          <p className="text-sm text-slate-500">@{user.username} · {roleLabel(user.role)}</p>
          <dl className="mt-6 space-y-3 text-left text-sm">
            <div><dt className="text-slate-400">IP de primer ingreso</dt><dd>{user.firstAccessIp || 'No registrada'}</dd></div>
            <div><dt className="text-slate-400">Último acceso</dt><dd>{formatDate(user.lastLoginAt)}</dd></div>
            <div><dt className="text-slate-400">Última IP</dt><dd>{user.lastLoginIp || 'No registrada'}</dd></div>
          </dl>
          <div className="mt-5 space-y-2 text-left">
            <Input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => setPhoto(event.target.files?.[0])} />
            <Button type="button" variant="secondary" className="w-full" disabled={!photo} onClick={updatePhoto}>Cambiar foto</Button>
          </div>
        </section>
        <div className="space-y-6">
          <form className="panel space-y-4" onSubmit={updateProfile}>
            <h2 className="font-semibold text-cecasem-navy">Información de trabajo</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Área o dependencia"><Input value={fields.area} onChange={(event) => setFields({ ...fields, area: event.target.value })} /></Field>
              <Field label="Cargo"><Input value={fields.position} onChange={(event) => setFields({ ...fields, position: event.target.value })} /></Field>
              <Field label="Número de celular"><Input value={fields.phone} onChange={(event) => setFields({ ...fields, phone: event.target.value })} /></Field>
              <Field label="Correo electrónico"><Input type="email" value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} /></Field>
            </div>
            <Button>Guardar perfil</Button>
          </form>
          <form className="panel space-y-4" onSubmit={changePassword}>
            <h2 className="font-semibold text-cecasem-navy">Cambiar contraseña</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Actual" required><Input type="password" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} required /></Field>
              <Field label="Nueva" required><Input type="password" value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} required /></Field>
              <Field label="Confirmar" required><Input type="password" value={password.confirmPassword} onChange={(event) => setPassword({ ...password, confirmPassword: event.target.value })} required /></Field>
            </div>
            <Button>Actualizar contraseña</Button>
          </form>
        </div>
      </div>
    </>
  );
}

