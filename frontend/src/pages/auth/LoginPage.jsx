import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { t } = useTranslation();
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      loginUser(data.token, data.user);
      toast.success('Connexion réussie!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la connexion');
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
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('auth.login')}</h1>
          <p className="text-slate-500 mt-2">Bienvenue! Connectez-vous à votre compte.</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('auth.phone')}</label>
              <input type="tel" className="input" placeholder="+257 XX XXX XXX"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-2">{t('auth.password')}</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('common.loading') : t('auth.loginBtn')}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">{t('nav.register')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
