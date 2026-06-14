import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { userAPI, publicAPI } from '../../services/api';

const statusBadge = (s) => {
  if (s === 'approved') return <span className="badge-success">Approuvé</span>;
  if (s === 'rejected') return <span className="badge-danger">Rejeté</span>;
  return <span className="badge-warning">En attente</span>;
};

export default function UserDeposit() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ amount: '', proof: null });
  const [deposits, setDeposits] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    userAPI.deposits().then(r => setDeposits(r.data)).catch(() => {});
    publicAPI.settings().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setForm({ ...form, proof: file }); setPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.proof) return toast.error('Veuillez uploader la preuve de paiement');
    if (parseFloat(form.amount) <= 0) return toast.error('Montant invalide');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('amount', form.amount);
      fd.append('proof', form.proof);
      await userAPI.createDeposit(fd);
      toast.success('Dépôt soumis avec succès!');
      setForm({ amount: '', proof: null }); setPreview(null);
      const r = await userAPI.deposits(); setDeposits(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du dépôt');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1E293B]">{t('deposit.title')}</h1>

      {/* Instructions */}
      {settings.deposit_instructions && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <h3 className="font-semibold text-primary-700 mb-2">📋 {t('deposit.instructions')}</h3>
          <p className="text-sm text-primary-600">{settings.deposit_instructions}</p>
          {settings.deposit_phone && (
            <div className="mt-3 font-bold text-primary-700">📱 {settings.deposit_phone}</div>
          )}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('deposit.amount')}</label>
            <input type="number" className="input" placeholder="20000" min="1"
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('deposit.proof')}</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E2E8F0] rounded-xl p-6 cursor-pointer hover:border-primary-400 transition-colors">
              {preview ? <img src={preview} alt="preview" className="max-h-40 rounded-lg object-contain" /> : (
                <><span className="text-4xl mb-2">📸</span><span className="text-sm text-slate-500">Cliquez pour uploader une image</span></>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t('common.loading') : t('deposit.submit')}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="card">
        <h2 className="font-bold text-[#1E293B] mb-4">{t('deposit.history')}</h2>
        {deposits.length === 0 ? <p className="text-slate-400 text-center py-4">{t('common.noData')}</p> : (
          <div className="space-y-3">
            {deposits.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl">
                <div>
                  <div className="font-semibold text-[#1E293B]">{Number(d.amount).toLocaleString()} FBu</div>
                  <div className="text-xs text-slate-400">{new Date(d.created_at).toLocaleDateString('fr-FR')}</div>
                  {d.admin_note && <div className="text-xs text-red-500 mt-1">{d.admin_note}</div>}
                </div>
                {statusBadge(d.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
