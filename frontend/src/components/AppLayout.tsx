import { useEffect, useRef, useState } from 'react';
import { Bell, BookOpen, ClipboardList, FileBarChart, LayoutDashboard, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, dataOf } from '../lib/api';
import { disconnectLive, liveConnection } from '../lib/live';
import { Avatar, roleLabel } from './ui';
import { BrandLogo } from './BrandLogo';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  ticket?: { id: string; code: string; title: string };
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () =>
    api.get('/notifications').then((response) => setNotifications(dataOf<Notification[]>(response))).catch(() => undefined);

  useEffect(() => {
    loadNotifications();
    const socket = liveConnection();
    const refresh = () => loadNotifications();
    socket?.on('notification.updated', refresh);
    return () => { socket?.off('notification.updated', refresh); };
  }, [user?.id]);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  if (!user) return null;
  const nav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tickets', label: 'Tickets', icon: ClipboardList },
    { to: '/profile', label: 'Mi perfil', icon: Settings },
    ...(user.role === 'SUPERADMIN'
      ? [
          { to: '/users', label: 'Usuarios', icon: Users },
          { to: '/pending-users', label: 'Pendientes', icon: Users },
          { to: '/categories', label: 'Categorías', icon: BookOpen },
          { to: '/reports', label: 'Reportes', icon: FileBarChart },
          { to: '/audit', label: 'Auditoría', icon: ClipboardList },
        ]
      : []),
  ];
  const unread = notifications.filter((notification) => !notification.isRead).length;

  const closeSession = async () => {
    disconnectLive();
    await logout();
    navigate('/login');
  };

  const readNotification = async (notification: Notification) => {
    if (!notification.isRead) await api.patch(`/notifications/${notification.id}/read`);
    setNotificationsOpen(false);
    await loadNotifications();
    if (notification.ticket) navigate(`/tickets/${notification.ticket.id}`);
  };

  const readAllNotifications = async () => {
    await api.patch('/notifications/read-all');
    await loadNotifications();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-cecasem-navy px-4 py-5 text-white transition lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 rounded-xl bg-white p-1" />
            <div>
              <div className="font-bold">Mesa de Ayuda</div>
              <div className="text-xs text-slate-300">CECASEM</div>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
            >
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur md:px-8">
          <button className="text-cecasem-navy lg:hidden" onClick={() => { setNotificationsOpen(false); setOpen(true); }}><Menu /></button>
          <div className="hidden text-sm text-slate-500 lg:block">Sistema local de gestión de tickets y soporte interno</div>
          <div className="ml-auto flex items-center gap-4">
            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                aria-label="Ver notificaciones"
                onClick={() => { setOpen(false); setNotificationsOpen((shown) => !shown); }}
                className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-cecasem-blue"
              >
                <Bell size={20} />
                {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}
              </button>
              {notificationsOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Cerrar notificaciones"
                    onClick={() => setNotificationsOpen(false)}
                    className="fixed inset-0 z-30 bg-slate-900/10 sm:hidden"
                  />
                  <div className="fixed inset-x-3 top-[5.25rem] z-40 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                      <p className="min-w-0 font-semibold text-cecasem-navy">Notificaciones</p>
                      {unread > 0 && <button type="button" onClick={readAllNotifications} className="shrink-0 text-xs font-semibold text-cecasem-blue">Marcar todas como leídas</button>}
                    </div>
                    <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto sm:max-h-96">
                      {!notifications.length && <p className="p-6 text-center text-sm text-slate-500">No tienes notificaciones.</p>}
                      {notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          onClick={() => readNotification(notification)}
                          className={`block w-full border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${notification.isRead ? '' : 'bg-blue-50/70'}`}
                        >
                          <div className="flex items-start gap-2">
                            {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cecasem-blue" />}
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-cecasem-navy">{notification.title}</p>
                              <p className="mt-1 break-words text-xs text-slate-600">{notification.message}</p>
                              <p className="mt-2 text-[11px] text-slate-400">{new Date(notification.createdAt).toLocaleString('es-BO')}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <Avatar name={user.fullName} path={user.profilePhotoPath} />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-cecasem-navy">{user.fullName}</p>
                <p className="text-xs text-slate-500">{roleLabel(user.role)}</p>
              </div>
            </div>
            <button onClick={closeSession} title="Cerrar sesión" className="text-slate-500 hover:text-red-600"><LogOut size={19} /></button>
          </div>
        </header>
        <main className="p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
