import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './i18n';

// Public pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';

// User pages
import UserLayout from './pages/user/UserLayout';
import UserDashboard from './pages/user/UserDashboard';
import UserDeposit from './pages/user/UserDeposit';
import UserWithdrawal from './pages/user/UserWithdrawal';
import UserVipPlans from './pages/user/UserVipPlans';
import UserTransactions from './pages/user/UserTransactions';
import UserReferrals from './pages/user/UserReferrals';
import UserNotifications from './pages/user/UserNotifications';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDeposits from './pages/admin/AdminDeposits';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminVipPlans from './pages/admin/AdminVipPlans';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

const ProtectedUser = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const ProtectedAdmin = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  return admin ? children : <Navigate to="/admin/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* User */}
      <Route path="/dashboard" element={<ProtectedUser><UserLayout /></ProtectedUser>}>
        <Route index element={<UserDashboard />} />
        <Route path="deposit" element={<UserDeposit />} />
        <Route path="withdraw" element={<UserWithdrawal />} />
        <Route path="plans" element={<UserVipPlans />} />
        <Route path="transactions" element={<UserTransactions />} />
        <Route path="referrals" element={<UserReferrals />} />
        <Route path="notifications" element={<UserNotifications />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="deposits" element={<AdminDeposits />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
        <Route path="vip-plans" element={<AdminVipPlans />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', background: '#1E293B', color: '#fff' } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
