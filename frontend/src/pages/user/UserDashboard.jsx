import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userAPI, publicAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ label, value, sub, icon, color }) => (
  <div className={`card border-l-4 ${color}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-[#1E293B]">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
  </div>
);

export default function UserDashboard() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([userAPI.dashboard(), publicAPI.announcements()])
      .then(([dashRes, annRes]) => {
        setStats(dashRes.data);
        updateUser({ wallet_balance: dashRes.data.wallet_balance });
        setAnnouncements(annRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString() + ' FBu';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      {/* Announcements */}
      {announcements.map(ann => (
        <div key={ann.id} className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-lg">📢</span>
          <div><div className="font-semibold text-primary-700">{ann.title}</div><div className="text-sm text-primary-600">{ann.content}</div></div>
        </div>
      ))}

      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Bienvenue, {user?.full_name} 👋</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('dashboard.wallet')} value={fmt(stats?.wallet_balance)} icon="💰" color="border-primary-500" />
        <StatCard label={t('dashboard.todayEarnings')} value={fmt(stats?.today_earnings)} icon="📈" color="border-success-500" />
        <StatCard label={t('dashboard.totalEarnings')} value={fmt(stats?.total_earnings)} icon="🏆" color="border-yellow-500" />
        <StatCard label={t('dashboard.referralEarnings')} value={fmt(stats?.referral_earnings)} icon="👥" color="border-purple-500" />
      </div>

      {/* Active Plan + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active plan */}
        <div className="lg:col-span-2 card">
          <h2 className="font-bold text-[#1E293B] mb-4">{t('dashboard.activePlan')}</h2>
          {stats?.active_vip ? (
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg">{stats.active_vip.name}</span>
                <span className="badge-success">Actif</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-blue-200 text-sm">Profit quotidien</div>
                  <div className="text-2xl font-bold">+{Number(stats.active_vip.plan_daily_profit).toLocaleString()} FBu</div>
                </div>
                <div>
                  <div className="text-blue-200 text-sm">Total gagné</div>
                  <div className="text-2xl font-bold">{Number(stats.active_vip.total_earned || 0).toLocaleString()} FBu</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">💎</div>
              <p className="text-slate-500 mb-4">{t('dashboard.noPlan')}</p>
              <Link to="/dashboard/plans" className="btn-primary">{t('dashboard.buyPlan')}</Link>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <h2 className="font-bold text-[#1E293B] mb-4">Actions rapides</h2>
          <div className="space-y-3">
            {[
              { to: '/dashboard/deposit', label: t('dashboard.deposit'), icon: '💳', color: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
              { to: '/dashboard/withdraw', label: t('dashboard.withdraw'), icon: '💸', color: 'bg-success-50 text-success-600 hover:bg-success-100' },
              { to: '/dashboard/plans', label: t('dashboard.buyPlan'), icon: '💎', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
            ].map(item => (
              <Link key={item.to} to={item.to} className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-all ${item.color}`}>
                <span className="text-xl">{item.icon}</span>{item.label}
              </Link>
            ))}
          </div>

          {/* Referral code */}
          <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
            <p className="text-xs text-slate-500 mb-2">Mon code de parrainage</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm font-mono font-bold text-primary-700">
                {user?.referral_code}
              </code>
              <button onClick={() => navigator.clipboard.writeText(user?.referral_code).then(() => {})}
                className="text-xs bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700">
                Copier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Team stats */}
      <div className="card">
        <h2 className="font-bold text-[#1E293B] mb-4">Mon équipe de parrainage</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#F8FAFC] rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-600">{stats?.referral_level1 || 0}</div>
            <div className="text-sm text-slate-500 mt-1">Filleuls Niveau 1 (10%)</div>
          </div>
          <div className="bg-[#F8FAFC] rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats?.referral_level2 || 0}</div>
            <div className="text-sm text-slate-500 mt-1">Filleuls Niveau 2 (5%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
