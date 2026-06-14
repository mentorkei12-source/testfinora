import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/admin/users', label: 'Utilisateurs', icon: '👥' },
  { to: '/admin/deposits', label: 'Dépôts', icon: '💳' },
  { to: '/admin/withdrawals', label: 'Retraits', icon: '💸' },
  { to: '/admin/vip-plans', label: 'Plans VIP', icon: '💎' },
  { to: '/admin/announcements', label: 'Annonces', icon: '📢' },
  { to: '/admin/settings', label: 'Paramètres', icon: '⚙️' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1E293B] transform transition-transform duration-300 lg:static lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm">Finora FX</div>
              <div className="text-slate-400 text-xs">Admin Panel</div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-white/5 rounded-xl p-3 mb-6">
            <div className="text-xs text-slate-400">Connecté en tant que</div>
            <div className="text-white font-semibold text-sm truncate">{admin?.name}</div>
            <div className="text-slate-400 text-xs">{admin?.role}</div>
          </div>
          <nav className="space-y-1">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                onClick={() => setSidebarOpen(false)}>
                <span>{item.icon}</span>{item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-slate-400 hover:bg-white/10 hover:text-red-400 transition-all">
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#E2E8F0] px-4 py-4 flex items-center gap-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="text-sm text-slate-500">Finora FX — <span className="font-medium text-[#1E293B]">Administration</span></div>
        </header>
        <main className="p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
