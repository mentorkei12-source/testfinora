import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const typeLabel = { deposit: 'Dépôt', withdrawal: 'Retrait', vip_purchase: 'Achat VIP', daily_profit: 'Profit quotidien', referral_bonus: 'Commission parrainage', admin_adjustment: 'Ajustement admin' };
const typeColor = { deposit: 'text-success-600', withdrawal: 'text-red-500', vip_purchase: 'text-primary-600', daily_profit: 'text-success-600', referral_bonus: 'text-purple-600', admin_adjustment: 'text-orange-500' };

export function UserTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { userAPI.transactions().then(r => setTransactions(r.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">Transactions</h1>
      <div className="card">
        {transactions.length === 0 ? <p className="text-slate-400 text-center py-8">Aucune transaction</p> : (
          <div className="divide-y divide-[#E2E8F0]">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-[#1E293B]">{typeLabel[tx.type] || tx.type}</div>
                  <div className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleString('fr-FR')} · {tx.description}</div>
                </div>
                <div className={`font-bold ${typeColor[tx.type] || 'text-[#1E293B]'}`}>
                  {['withdrawal', 'vip_purchase'].includes(tx.type) ? '-' : '+'}{Number(tx.amount).toLocaleString()} FBu
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function UserReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  useEffect(() => { userAPI.referrals().then(r => setReferrals(r.data)).catch(() => {}); }, []);
  const link = `${window.location.origin}/register?ref=${user?.referral_code}`;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1E293B]">Parrainage</h1>
      <div className="card">
        <h2 className="font-semibold text-[#1E293B] mb-3">Mon lien de parrainage</h2>
        <div className="flex gap-2">
          <input readOnly className="input text-sm" value={link} />
          <button onClick={() => { navigator.clipboard.writeText(link); }} className="btn-primary whitespace-nowrap">Copier</button>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-primary-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-primary-600">{referrals.filter(r => r.level === 1).length}</div>
            <div className="text-xs text-slate-500">Niveau 1 (10%)</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{referrals.filter(r => r.level === 2).length}</div>
            <div className="text-xs text-slate-500">Niveau 2 (5%)</div>
          </div>
        </div>
      </div>
      <div className="card">
        <h2 className="font-semibold text-[#1E293B] mb-4">Mes filleuls</h2>
        {referrals.length === 0 ? <p className="text-slate-400 text-center py-6">Aucun filleul encore</p> : (
          <div className="divide-y divide-[#E2E8F0]">
            {referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-[#1E293B]">{r.full_name}</div>
                  <div className="text-xs text-slate-400">@{r.username} · Niveau {r.level}</div>
                </div>
                <div className="text-sm font-semibold text-success-600">+{Number(r.earned || 0).toLocaleString()} FBu</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function UserNotifications() {
  const [notifications, setNotifications] = useState([]);
  useEffect(() => { userAPI.notifications().then(r => setNotifications(r.data)).catch(() => {}); }, []);
  const markRead = async (id) => {
    await userAPI.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };
  const typeIcon = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">Notifications</h1>
      <div className="card">
        {notifications.length === 0 ? <p className="text-slate-400 text-center py-8">Aucune notification</p> : (
          <div className="divide-y divide-[#E2E8F0]">
            {notifications.map(n => (
              <div key={n.id} className={`flex items-start gap-3 py-3 cursor-pointer ${!n.is_read ? 'bg-primary-50 -mx-6 px-6' : ''}`} onClick={() => !n.is_read && markRead(n.id)}>
                <span className="text-xl">{typeIcon[n.type] || 'ℹ️'}</span>
                <div className="flex-1">
                  <div className={`font-medium ${!n.is_read ? 'text-primary-700' : 'text-[#1E293B]'}`}>{n.title}</div>
                  <div className="text-sm text-slate-500">{n.message}</div>
                  <div className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('fr-FR')}</div>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary-600 mt-2"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserTransactions;
