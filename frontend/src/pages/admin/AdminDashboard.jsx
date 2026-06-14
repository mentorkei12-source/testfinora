import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const StatCard = ({ label, value, icon, color, link }) => (
  <Link to={link || '#'} className={`card border-l-4 ${color} hover:shadow-soft transition-all block`}>
    <div className="flex items-start justify-between">
      <div><p className="text-sm text-slate-500 mb-1">{label}</p><p className="text-2xl font-bold text-[#1E293B]">{value}</p></div>
      <span className="text-3xl">{icon}</span>
    </div>
  </Link>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => { adminAPI.stats().then(r => setStats(r.data)).catch(() => {}); }, []);
  const fmt = (n) => Number(n || 0).toLocaleString();

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-[#1E293B]">Tableau de bord Admin</h1><p className="text-slate-500 mt-1">Vue d'ensemble de la plateforme</p></div>
      {stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Utilisateurs" value={fmt(stats.total_users)} icon="👥" color="border-primary-500" link="/admin/users" />
            <StatCard label="Utilisateurs Actifs" value={fmt(stats.active_users)} icon="✅" color="border-success-500" link="/admin/users" />
            <StatCard label="VIP Actifs" value={fmt(stats.active_vip_users)} icon="💎" color="border-yellow-500" />
            <StatCard label="Nouveaux Aujourd'hui" value={fmt(stats.new_users_today)} icon="🆕" color="border-purple-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Dépôts" value={`${fmt(stats.total_deposits)} FBu`} icon="💳" color="border-green-500" link="/admin/deposits" />
            <StatCard label="Total Retraits" value={`${fmt(stats.total_withdrawals)} FBu`} icon="💸" color="border-orange-500" link="/admin/withdrawals" />
            <StatCard label="Profits Aujourd'hui" value={`${fmt(stats.today_profits)} FBu`} icon="📈" color="border-teal-500" />
            <div className="card border-l-4 border-red-400">
              <div className="text-sm text-slate-500 mb-1">En attente</div>
              <div className="flex items-center gap-4">
                <div><div className="text-lg font-bold text-orange-500">{fmt(stats.pending_deposits)}</div><div className="text-xs text-slate-400">Dépôts</div></div>
                <div className="w-px h-8 bg-[#E2E8F0]"></div>
                <div><div className="text-lg font-bold text-red-500">{fmt(stats.pending_withdrawals)}</div><div className="text-xs text-slate-400">Retraits</div></div>
              </div>
            </div>
          </div>
          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { to: '/admin/deposits', label: 'Gérer les dépôts', icon: '💳', badge: stats.pending_deposits },
              { to: '/admin/withdrawals', label: 'Gérer les retraits', icon: '💸', badge: stats.pending_withdrawals },
              { to: '/admin/users', label: 'Utilisateurs', icon: '👥' },
              { to: '/admin/vip-plans', label: 'Plans VIP', icon: '💎' },
            ].map(item => (
              <Link key={item.to} to={item.to} className="card hover:shadow-soft transition-all text-center relative">
                {item.badge > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span>}
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-sm font-medium text-[#1E293B]">{item.label}</div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      )}
    </div>
  );
}
