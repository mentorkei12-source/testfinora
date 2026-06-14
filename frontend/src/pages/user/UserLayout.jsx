import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Tableau de bord', icon: '🏠', end: true },
  { to: '/dashboard/plans', label: 'Plans VIP', icon: '💎' },
  { to: '/dashboard/deposit', label: 'Dépôt', icon: '💳' },
  { to: '/dashboard/withdraw', label: 'Retrait', icon: '💸' },
  { to: '/dashboard/transactions', label: 'Transactions', icon: '📋' },
  { to: '/dashboard/referrals', label: 'Parrainage', icon: '👥' },
  { to: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
];

export default function UserLayout() {
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-soft border-r border-[#E2E8F0] transform transition-transform duration-300 lg:static lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-[#1E293B]">Finora FX</span>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-primary-50 rounded-xl p-4 mb-6">
            <div className="text-sm text-slate-500">Bonjour,</div>
            <div className="font-bold text-[#1E293B] truncate">{user?.full_name}</div>
            <div className="text-xs text-slate-400 mt-1">@{user?.username}</div>
          </div>
          <nav className="space-y-1">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-[#F8FAFC] hover:text-primary-600'}`}
                onClick={() => setSidebarOpen(false)}>
                <span>{item.icon}</span>{item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#E2E8F0]">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#E2E8F0] px-4 py-4 flex items-center justify-between lg:px-8">
          <button className="lg:hidden text-slate-600" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={() => { const l = i18n.language === 'fr' ? 'en' : 'fr'; i18n.changeLanguage(l); localStorage.setItem('lang', l); }}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 hover:text-primary-600">
              {i18n.language === 'fr' ? 'EN' : 'FR'}
            </button>
          </div>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
