// UserWithdrawal.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const statusBadge = (s) => {
  if (s === 'completed') return <span className="badge-success">Complété</span>;
  if (s === 'rejected') return <span className="badge-danger">Rejeté</span>;
  if (s === 'approved') return <span className="badge-info">Approuvé</span>;
  return <span className="badge-warning">En attente</span>;
};

export function UserWithdrawal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({ amount: '', phone_number: '' });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { userAPI.withdrawals().then(r => setWithdrawals(r.data)).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userAPI.createWithdrawal(form);
      toast.success('Demande de retrait soumise!');
      setForm({ amount: '', phone_number: '' });
      const r = await userAPI.withdrawals(); setWithdrawals(r.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1E293B]">{t('withdrawal.title')}</h1>
      <div className="bg-success-50 border border-success-200 rounded-xl p-4">
        <div className="text-sm text-success-600 font-medium">Solde disponible</div>
        <div className="text-2xl font-bold text-success-600">{Number(user?.wallet_balance || 0).toLocaleString()} FBu</div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('withdrawal.amount')}</label>
            <input type="number" className="input" placeholder="10000" min="1"
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <p className="text-xs text-slate-400 mt-1">{t('withdrawal.min')}: 10,000 FBu</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('withdrawal.phone')}</label>
            <input type="tel" className="input" placeholder="+257 XX XXX XXX"
              value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t('common.loading') : t('withdrawal.submit')}
          </button>
        </form>
      </div>
      <div className="card">
        <h2 className="font-bold text-[#1E293B] mb-4">{t('withdrawal.history')}</h2>
        {withdrawals.length === 0 ? <p className="text-slate-400 text-center py-4">{t('common.noData')}</p> : (
          <div className="space-y-3">
            {withdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl">
                <div>
                  <div className="font-semibold text-[#1E293B]">{Number(w.amount).toLocaleString()} FBu</div>
                  <div className="text-xs text-slate-400">{w.phone_number} · {new Date(w.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                {statusBadge(w.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserWithdrawal;
