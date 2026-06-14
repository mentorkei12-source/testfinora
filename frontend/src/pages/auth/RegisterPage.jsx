import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    full_name: '', username: '', phone: '', password: '',
    referral_code: searchParams.get('ref') || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Le mot de passe doit avoir au moins 6 caractères');
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      loginUser(data.token, data.user);
      toast.success('Compte créé avec succès!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">Finora FX</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('auth.register')}</h1>
          <p className="text-slate-500 mt-2">Créez votre compte et commencez à investir.</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'full_name', label: t('auth.fullName'), type: 'text', placeholder: 'Jean Niyonzima' },
              { key: 'username', label: t('auth.username'), type: 'text', placeholder: 'jeanniyonzima' },
              { key: 'phone', label: t('auth.phone'), type: 'tel', placeholder: '+257 XX XXX XXX' },
              { key: 'password', label: t('auth.password'), type: 'password', placeholder: '••••••••' },
              { key: 'referral_code', label: t('auth.referralCode'), type: 'text', placeholder: 'ABC123 (optionnel)' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">{field.label}</label>
                <input type={field.type} className="input" placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  required={field.key !== 'referral_code'} />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('common.loading') : t('auth.registerBtn')}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">{t('auth.loginBtn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
