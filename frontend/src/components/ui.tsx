import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { fileUrl } from '../lib/api';
import type { Priority, Role, TicketStatus, UserStatus } from '../types';

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const variants = {
    primary: 'bg-cecasem-blue text-white hover:bg-cecasem-navy',
    secondary: 'bg-cecasem-mist text-cecasem-navy hover:bg-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
  };
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field ${props.className || ''}`} {...props} />;
}

export function PasswordInput({ className = '', disabled, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="relative">
      <input
        className={`field pr-11 ${className}`}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        {...props}
      />
      <button
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-cecasem-blue focus:outline-none focus:ring-2 focus:ring-cecasem-blue/20 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        onMouseDown={(event) => event.preventDefault()}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        type="button"
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`field ${props.className || ''}`} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field min-h-24 resize-y ${props.className || ''}`} {...props} />;
}

export function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="label">{label}{required && <span className="ml-1 text-red-500">*</span>}</span>
      {children}
    </label>
  );
}

export function Avatar({ path, name, size = 'md' }: { path?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = { sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-20 w-20 text-xl' };
  const initials = name.split(' ').slice(0, 2).map((item) => item[0]).join('').toUpperCase();
  return path ? (
    <img src={fileUrl(path)} alt={name} className={`${dimensions[size]} rounded-full object-cover ring-2 ring-white`} />
  ) : (
    <span className={`${dimensions[size]} flex items-center justify-center rounded-full bg-cecasem-blue font-semibold text-white`}>
      {initials}
    </span>
  );
}

export function roleLabel(role: Role): string {
  return role === 'SUPERADMIN' ? 'Equipo de Sistemas' : 'Usuario';
}

export function Badge({ value }: { value: TicketStatus | Priority | UserStatus | Role }) {
  const labels: Record<string, string> = {
    ABIERTO: 'Abierto',
    EN_PROCESO: 'En proceso',
    ESPERANDO_USUARIO: 'Esperando respuesta del usuario',
    RESUELTO: 'Resuelto',
    CERRADO: 'Cerrado',
    REABIERTO: 'Reabierto',
    CANCELADO: 'Cancelado',
    BAJA: 'Baja',
    MEDIA: 'Media',
    ALTA: 'Alta',
    CRITICA: 'Crítica',
    PENDING: 'Pendiente de aprobación',
    ACTIVE: 'Activo',
    REJECTED: 'Rechazado',
    DISABLED: 'Desactivado',
    USER: 'Usuario',
    SUPERADMIN: 'Equipo de Sistemas',
  };
  const colors: Record<string, string> = {
    ABIERTO: 'bg-sky-100 text-sky-700',
    EN_PROCESO: 'bg-amber-100 text-amber-800',
    ESPERANDO_USUARIO: 'bg-violet-100 text-violet-700',
    RESUELTO: 'bg-emerald-100 text-emerald-700',
    CERRADO: 'bg-slate-200 text-slate-700',
    REABIERTO: 'bg-orange-100 text-orange-700',
    CANCELADO: 'bg-red-100 text-red-700',
    BAJA: 'bg-green-100 text-green-700',
    MEDIA: 'bg-blue-100 text-blue-700',
    ALTA: 'bg-orange-100 text-orange-700',
    CRITICA: 'bg-red-100 text-red-700',
    PENDING: 'bg-amber-100 text-amber-700',
    ACTIVE: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    DISABLED: 'bg-slate-200 text-slate-700',
    SUPERADMIN: 'bg-cecasem-mist text-cecasem-blue',
    USER: 'bg-slate-100 text-slate-700',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[value]}`}>{labels[value]}</span>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-cecasem-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Alert({ children, kind = 'error' }: { children: ReactNode; kind?: 'error' | 'success' | 'info' }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  };
  return <div className={`rounded-xl border p-3 text-sm ${styles[kind]}`}>{children}</div>;
}

export function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">{text}</div>;
}

export function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleString('es-BO') : 'Sin registro';
}
