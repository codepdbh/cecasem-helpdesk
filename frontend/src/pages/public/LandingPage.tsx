import { ArrowRight, KeyRound, ShieldCheck, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cecasem-navy via-[#154d6a] to-cecasem-teal px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid w-full gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <section className="flex flex-col justify-center">
            <BrandLogo className="mb-8 h-24 w-24 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-white/25" />
            <p className="mb-3 text-sm font-semibold uppercase tracking-[.3em] text-cyan-200">CECASEM</p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-5xl">Mesa de Ayuda CECASEM</h1>
            <p className="mt-5 max-w-lg text-lg text-slate-200">Sistema local de gestión de tickets y soporte interno</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-cecasem-navy transition hover:bg-slate-100" to="/login">
                Iniciar sesión <ArrowRight size={18} />
              </Link>
              <Link className="rounded-xl border border-white/35 px-6 py-3 font-semibold transition hover:bg-white/10" to="/first-access">
                Primer ingreso
              </Link>
            </div>
          </section>
          <section className="grid content-center gap-4">
            {[
              { icon: Wifi, title: 'Red institucional', text: 'Disponible dentro de la red LAN o Wi-Fi de CECASEM.' },
              { icon: ShieldCheck, title: 'Auditoría interna', text: 'Registro seguro de accesos, IP y movimientos del ticket.' },
              { icon: KeyRound, title: 'Acceso personal', text: 'La IP se audita; su contraseña sigue siendo su credencial.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <Icon className="mt-1 text-cyan-200" />
                <div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-200">{text}</p></div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
