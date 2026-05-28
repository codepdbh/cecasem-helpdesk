import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminRoute, AuthProvider, ProtectedRoute } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';
import { AuditPage } from './pages/admin/AuditPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { PendingUsersPage } from './pages/admin/PendingUsersPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { FirstAccessPage } from './pages/public/FirstAccessPage';
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { NewTicketPage } from './pages/tickets/NewTicketPage';
import { TicketDetailPage } from './pages/tickets/TicketDetailPage';
import { TicketsPage } from './pages/tickets/TicketsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/first-access" element={<FirstAccessPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/new" element={<NewTicketPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<AdminRoute />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/pending-users" element={<PendingUsersPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/audit" element={<AuditPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
