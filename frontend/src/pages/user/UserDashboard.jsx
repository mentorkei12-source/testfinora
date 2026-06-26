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
  const [whatsappNumber, setWhatsappNumber] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([userAPI.dashboard(), publicAPI.announcements(), publicAPI.settings()])
      .then(([dashRes, annRes, settingsRes]) => {
        setStats(dashRes.data);
        updateUser({ wallet_balance: dashRes.data.wallet_balance });
        setAnnouncements(annRes.data);
        const number = settingsRes.data?.whatsapp_support_number;
        if (number) setWhatsappNumber(number.replace(/\D/g, ''));
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

      {/* Floating WhatsApp Button */}
      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110"
          style={{ backgroundColor: '#25D366' }}
          title="Support WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  );
}