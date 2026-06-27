import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publicAPI } from '../../services/api';

const Navbar = ({ t, i18n }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-soft' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-xl font-bold text-[#1E293B]">Finora FX</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#plans" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">{t('nav.plans')}</a>
            <a href="#how" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">FAQ</a>
            <button onClick={() => { const lang = i18n.language === 'fr' ? 'en' : 'fr'; i18n.changeLanguage(lang); localStorage.setItem('lang', lang); }}
              className="text-sm font-medium text-slate-500 border border-slate-200 rounded-lg px-3 py-1 hover:border-primary-300 hover:text-primary-600">
              {i18n.language === 'fr' ? 'EN' : 'FR'}
            </button>
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">{t('nav.login')}</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-5">{t('nav.register')}</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ t }) => (
  <section className="pt-24 pb-20 bg-gradient-to-br from-[#EFF6FF] via-white to-[#F0FDF4] relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563EB' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-primary-700">Plateforme Active — Burundi</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-[#1E293B] leading-tight mb-6">
          {t('hero.title')}
        </h1>
        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="btn-primary text-lg px-8 py-4">{t('hero.cta')}</Link>
          <a href="#how" className="btn-secondary text-lg px-8 py-4">{t('hero.learnMore')}</a>
        </div>
      </div>
      {/* Floating stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
        {[
          { label: t('stats.users'), value: '12,000+', icon: '👥' },
          { label: t('stats.paid'), value: '850M+ FBu', icon: '💰' },
          { label: t('stats.plans'), value: '4', icon: '📊' },
          { label: t('stats.uptime'), value: '99.9%', icon: '✅' },
        ].map((stat, i) => (
          <div key={i} className="card text-center hover:shadow-soft transition-all duration-200">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-[#1E293B]">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const VIPPlans = ({ t, plans }) => (
  <section id="plans" className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">{t('vip.title')}</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">{t('vip.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, i) => (
          <div key={plan.id} className={`rounded-xl border-2 p-6 relative transition-all duration-200 hover:scale-105 hover:shadow-soft ${i === 2 ? 'border-primary-600 bg-primary-600' : 'border-[#E2E8F0] bg-white'}`}>
            {i === 2 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success-500 text-white text-xs font-bold px-4 py-1 rounded-full">POPULAIRE</div>}
            <div className={`text-sm font-semibold mb-4 ${i === 2 ? 'text-blue-200' : 'text-primary-600'}`}>{plan.name}</div>
            <div className={`text-4xl font-extrabold mb-1 ${i === 2 ? 'text-white' : 'text-[#1E293B]'}`}>
              {Number(plan.price).toLocaleString()} <span className="text-base font-normal">FBu</span>
            </div>
            <div className={`text-sm mb-6 ${i === 2 ? 'text-blue-200' : 'text-slate-400'}`}>{t('vip.price')}</div>
            <div className={`rounded-xl p-4 mb-6 ${i === 2 ? 'bg-blue-700' : 'bg-primary-50'}`}>
              <div className={`text-2xl font-bold ${i === 2 ? 'text-white' : 'text-primary-700'}`}>
                +{Number(plan.daily_profit).toLocaleString()} FBu
              </div>
              <div className={`text-sm ${i === 2 ? 'text-blue-200' : 'text-primary-600'}`}>{t('vip.perDay')}</div>
            </div>
            <Link to="/register" className={`w-full block text-center py-3 rounded-xl font-semibold transition-all duration-200 ${i === 2 ? 'bg-white text-primary-600 hover:bg-blue-50' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
              {t('vip.invest')}
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const HowItWorks = ({ t }) => (
  <section id="how" className="py-20 bg-[#F8FAFC]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B]">{t('how.title')}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { step: '01', title: t('how.step1'), desc: t('how.step1Desc'), color: 'bg-primary-100 text-primary-700' },
          { step: '02', title: t('how.step2'), desc: t('how.step2Desc'), color: 'bg-success-100 text-success-600' },
          { step: '03', title: t('how.step3'), desc: t('how.step3Desc'), color: 'bg-yellow-100 text-yellow-700' },
          { step: '04', title: t('how.step4'), desc: t('how.step4Desc'), color: 'bg-purple-100 text-purple-700' },
        ].map((item, i) => (
          <div key={i} className="text-center">
            <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center text-2xl font-extrabold mx-auto mb-4`}>
              {item.step}
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] mb-2">{item.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ReferralSection = ({ t }) => (
  <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('referral.title')}</h2>
          <p className="text-blue-200 text-lg mb-8">{t('referral.subtitle')}</p>
          <div className="flex gap-4 mb-8">
            <div className="bg-blue-700 rounded-xl p-4 text-center flex-1">
              <div className="text-3xl font-extrabold text-white">10%</div>
              <div className="text-blue-200 text-sm">{t('referral.level1')}</div>
            </div>
            <div className="bg-blue-700 rounded-xl p-4 text-center flex-1">
              <div className="text-3xl font-extrabold text-white">5%</div>
              <div className="text-blue-200 text-sm">{t('referral.level2')}</div>
            </div>
          </div>
          <Link to="/register" className="inline-block bg-white text-primary-600 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all">
            {t('referral.cta')}
          </Link>
        </div>
        <div className="hidden lg:block">
          <div className="bg-blue-700 rounded-2xl p-8 text-white">
            <div className="text-sm text-blue-300 mb-2">Exemple de gains</div>
            <div className="space-y-4">
              {[
                { name: 'Vous', role: 'Parrain', earning: '10,000 FBu', level: '' },
                { name: 'Votre filleul', role: 'Niveau 1 → 100,000 FBu déposés', earning: '10,000 FBu', level: '10%' },
                { name: 'Son filleul', role: 'Niveau 2 → 100,000 FBu déposés', earning: '5,000 FBu', level: '5%' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-blue-800 rounded-xl p-3">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-blue-300">{item.role}</div>
                  </div>
                  {item.level && <div className="text-right"><div className="font-bold text-green-400">{item.earning}</div><div className="text-xs text-blue-300">({item.level})</div></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const WhatsAppSection = ({ t, settings }) => (
  <section className="py-20 bg-white">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href={settings?.whatsapp_group_link || '#'} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 bg-[#25D366] rounded-2xl p-6 text-white hover:opacity-95 transition-opacity">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">💬</div>
          <div>
            <div className="font-bold text-lg">{t('whatsapp.joinGroup')}</div>
            <div className="text-green-100 text-sm mt-1">{t('whatsapp.groupDesc')}</div>
          </div>
        </a>
        <a href={`https://wa.me/${settings?.whatsapp_support_number?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 bg-[#128C7E] rounded-2xl p-6 text-white hover:opacity-95 transition-opacity">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">🎧</div>
          <div>
            <div className="font-bold text-lg">{t('whatsapp.support')}</div>
            <div className="text-green-100 text-sm mt-1">{t('whatsapp.supportDesc')}</div>
          </div>
        </a>
      </div>
    </div>
  </section>
);

const FAQ = ({ t }) => {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q: 'Comment fonctionne Finora FX ?', a: 'Finora FX est une plateforme d\'investissement où vous déposez des fonds, choisissez un plan VIP, et gagnez des profits quotidiens automatiquement crédités sur votre portefeuille.' },
    { q: 'Comment déposer des fonds ?', a: 'Envoyez votre dépôt via mobile money au numéro indiqué, uploadez la preuve de paiement sur la plateforme. Notre équipe approuvera votre dépôt dans les 24 heures.' },
    { q: 'Quand puis-je retirer mes gains ?', a: 'Vous pouvez demander un retrait à tout moment. Les retraits sont traités dans les 24-48 heures ouvrables.' },
    { q: 'Le parrainage est-il obligatoire ?', a: 'Non, le parrainage est optionnel. Mais il vous permet de gagner des commissions supplémentaires sur les dépôts de vos filleuls.' },
    { q: 'Y a-t-il des frais cachés ?', a: 'Non. Finora FX ne prend aucun frais caché. Vos gains sont crédités à 100% sur votre portefeuille.' },
  ];
  return (
    <section className="py-20 bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-[#1E293B] mb-12">{t('faq.title')}</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="card cursor-pointer" onClick={() => setOpen(open === i ? null : i)}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1E293B]">{faq.q}</span>
                <span className="text-primary-600 text-xl">{open === i ? '−' : '+'}</span>
              </div>
              {open === i && <p className="mt-3 text-slate-500 text-sm leading-relaxed">{faq.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-[#1E293B] text-slate-400 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="text-white font-bold text-lg">Finora FX</span>
        </div>
        <div className="text-sm">© {new Date().getFullYear()} Finora FX. Tous droits réservés. Burundi.</div>
      </div>
    </div>
  </footer>
);

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    publicAPI.vipPlans().then(r => setPlans(Array.isArray(r.data) ? r.data : [])).catch(() => setPlans([]));
    publicAPI.settings().then(r => setSettings(r.data || {})).catch(() => setSettings({}));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar t={t} i18n={i18n} />
      <Hero t={t} />
      <VIPPlans t={t} plans={plans} />
      <HowItWorks t={t} />
      <ReferralSection t={t} />
      <WhatsAppSection t={t} settings={settings} />
      <FAQ t={t} />
      <Footer />
    </div>
  );
}