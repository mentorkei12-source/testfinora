import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { publicAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function UserVipPlans() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    publicAPI.vipPlans().then(r => setPlans(r.data));
    userAPI.vipActive().then(r => setActivePlan(r.data.find(v => v.is_active))).catch(() => {});
  }, []);

  const handlePurchase = async (plan) => {
    if (!confirm(`Confirmer l'achat de ${plan.name} pour ${Number(plan.price).toLocaleString()} FBu ?`)) return;
    setPurchasing(plan.id);
    try {
      const { data } = await userAPI.purchaseVip(plan.id);
      toast.success(data.message);
      updateUser({ wallet_balance: data.new_balance });
      const r = await userAPI.vipActive(); setActivePlan(r.data.find(v => v.is_active));
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setPurchasing(null); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1E293B]">{t('vip.title')}</h1>
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-primary-600">Solde disponible</div>
          <div className="text-xl font-bold text-primary-700">{Number(user?.wallet_balance || 0).toLocaleString()} FBu</div>
        </div>
        {activePlan && <span className="badge-success">Plan actif: {activePlan.name}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan, i) => {
          const isActive = activePlan?.vip_plan_id === plan.id;
          const canAfford = parseFloat(user?.wallet_balance || 0) >= parseFloat(plan.price);
          return (
            <div key={plan.id} className={`rounded-xl border-2 p-5 transition-all ${isActive ? 'border-success-500 bg-success-50' : 'border-[#E2E8F0] bg-white hover:border-primary-300'}`}>
              {isActive && <div className="badge-success mb-3">Plan Actif</div>}
              <div className="text-sm font-semibold text-primary-600 mb-2">{plan.name}</div>
              <div className="text-3xl font-extrabold text-[#1E293B] mb-1">{Number(plan.price).toLocaleString()}<span className="text-base font-normal text-slate-400"> FBu</span></div>
              <div className="text-xs text-slate-400 mb-4">Investissement</div>
              <div className="bg-primary-50 rounded-xl p-3 mb-4 text-center">
                <div className="text-xl font-bold text-primary-700">+{Number(plan.daily_profit).toLocaleString()} FBu</div>
                <div className="text-xs text-primary-600">par jour</div>
              </div>
              <button onClick={() => handlePurchase(plan)} disabled={purchasing === plan.id || !canAfford || isActive}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${isActive ? 'bg-success-100 text-success-600 cursor-default' : canAfford ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                {purchasing === plan.id ? '...' : isActive ? '✓ Actif' : !canAfford ? 'Solde insuffisant' : t('vip.invest')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
