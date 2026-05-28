import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api, dataOf } from '../lib/api';
import type { User } from '../types';

interface LoginResult {
  accessToken: string;
  user: User;
  mustChangePassword: boolean;
  ipAlert?: string;
}

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const response = await api.get('/auth/profile');
    setUser(dataOf<User>(response));
  };

  useEffect(() => {
    const token = localStorage.getItem('cecasem_token');
    if (!token) {
      setLoading(false);
      return;
    }
    refresh()
      .catch(() => localStorage.removeItem('cecasem_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier: string, password: string) => {
    const result = dataOf<LoginResult>(await api.post('/auth/login', { identifier, password }));
    localStorage.setItem('cecasem_token', result.accessToken);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('cecasem_token');
      setUser(null);
    }
  };

  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider no configurado');
  return context;
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-cecasem-blue">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}

export function AdminRoute() {
  const { user } = useAuth();
  if (user?.role !== 'SUPERADMIN') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

