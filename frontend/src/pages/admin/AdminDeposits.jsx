import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

// ===================== ADMIN DEPOSITS =====================
export function AdminDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); adminAPI.deposits({ status: filter }).then(r => setDeposits(r.data.deposits)).finally(() => setLoading(false)); };
  useEffect(load, [filter]);

  const process = async (id, action) => {
    const note = action === 'reject' ? prompt('Raison du rejet (optionnel):') : '';
    try { await adminAPI.processDeposit(id, { action, admin_note: note }); toast.success(`Dépôt ${action === 'approve' ? 'approuvé' : 'rejeté'}`); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Gestion des Dépôts</h1>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-[#E2E8F0] text-slate-600 hover:border-primary-300'}`}>
              {s === 'pending' ? 'En attente' : s === 'approved' ? 'Approuvés' : 'Rejetés'}
            </button>
          ))}
        </div>
      </div>
      <div className="card overflow-x-auto">
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div> : deposits.length === 0 ? <p className="text-slate-400 text-center py-8">Aucun dépôt</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#E2E8F0]">{['Utilisateur', 'Montant', 'Preuve', 'Date', 'Actions'].map(h => <th key={h} className="text-left py-3 px-4 text-slate-500 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {deposits.map(d => (
                <tr key={d.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4"><div className="font-medium text-[#1E293B]">{d.full_name}</div><div className="text-xs text-slate-400">{d.phone}</div></td>
                  <td className="py-3 px-4 font-bold text-[#1E293B]">{Number(d.amount).toLocaleString()} FBu</td>
                  <td className="py-3 px-4">{d.proof_image ? <a href={`/uploads/${d.proof_image}`} target="_blank" rel="noopener" className="text-primary-600 hover:underline text-xs">Voir preuve</a> : '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4">
                    {d.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button onClick={() => process(d.id, 'approve')} className="btn-success text-xs px-3 py-1.5">Approuver</button>
                        <button onClick={() => process(d.id, 'reject')} className="btn-danger text-xs px-3 py-1.5">Rejeter</button>
                      </div>
                    ) : <span className={d.status === 'approved' ? 'badge-success' : 'badge-danger'}>{d.status === 'approved' ? 'Approuvé' : 'Rejeté'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ===================== ADMIN WITHDRAWALS =====================
export function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [filter, setFilter] = useState('pending');

  const load = () => adminAPI.withdrawals({ status: filter }).then(r => setWithdrawals(r.data.withdrawals));
  useEffect(load, [filter]);

  const process = async (id, action) => {
    const note = action === 'reject' ? prompt('Raison:') : '';
    try { await adminAPI.processWithdrawal(id, { action, admin_note: note }); toast.success('Mis à jour'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Gestion des Retraits</h1>
        <div className="flex gap-2">
          {['pending', 'approved', 'completed', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-[#E2E8F0] text-slate-600'}`}>
              {s === 'pending' ? 'En attente' : s === 'approved' ? 'Approuvés' : s === 'completed' ? 'Complétés' : 'Rejetés'}
            </button>
          ))}
        </div>
      </div>
      <div className="card overflow-x-auto">
        {withdrawals.length === 0 ? <p className="text-slate-400 text-center py-8">Aucun retrait</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#E2E8F0]">{['Utilisateur', 'Montant', 'Mobile Money', 'Date', 'Actions'].map(h => <th key={h} className="text-left py-3 px-4 text-slate-500 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {withdrawals.map(w => (
                <tr key={w.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4"><div className="font-medium text-[#1E293B]">{w.full_name}</div><div className="text-xs text-slate-400">{w.phone}</div></td>
                  <td className="py-3 px-4 font-bold text-[#1E293B]">{Number(w.amount).toLocaleString()} FBu</td>
                  <td className="py-3 px-4 text-slate-600">{w.phone_number}</td>
                  <td className="py-3 px-4 text-slate-500">{new Date(w.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4">
                    {w.status === 'pending' && <div className="flex gap-1"><button onClick={() => process(w.id, 'approve')} className="btn-success text-xs px-2 py-1">Approuver</button><button onClick={() => process(w.id, 'reject')} className="btn-danger text-xs px-2 py-1">Rejeter</button></div>}
                    {w.status === 'approved' && <button onClick={() => process(w.id, 'complete')} className="bg-teal-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-teal-600">Terminer</button>}
                    {['completed', 'rejected'].includes(w.status) && <span className={w.status === 'completed' ? 'badge-success' : 'badge-danger'}>{w.status}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ===================== ADMIN USERS =====================
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); adminAPI.users({ search }).then(r => setUsers(r.data.users)).finally(() => setLoading(false)); };
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  const toggleBan = async (user) => {
    try { await adminAPI.updateUser(user.id, { ...user, is_banned: !user.is_banned }); toast.success(user.is_banned ? 'Compte réactivé' : 'Compte suspendu'); load(); }
    catch { toast.error('Erreur'); }
  };

  const adjustBalance = async (user) => {
    const amount = prompt('Montant (positif = crédit, négatif = débit):');
    if (!amount) return;
    const num = parseFloat(amount);
    try { await adminAPI.adjustBalance(user.id, { amount: Math.abs(num), type: num > 0 ? 'credit' : 'debit', description: 'Admin manual adjustment' }); toast.success('Solde ajusté'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#1E293B]">Utilisateurs ({users.length})</h1>
        <input className="input max-w-xs" placeholder="Rechercher nom, username, tel..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="card overflow-x-auto">
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#E2E8F0]">{['Utilisateur', 'Solde', 'Plan actif', 'Filleuls', 'Statut', 'Actions'].map(h => <th key={h} className="text-left py-3 px-4 text-slate-500 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4"><div className="font-medium text-[#1E293B]">{u.full_name}</div><div className="text-xs text-slate-400">@{u.username} · {u.phone}</div></td>
                  <td className="py-3 px-4 font-medium">{Number(u.wallet_balance).toLocaleString()} FBu</td>
                  <td className="py-3 px-4">{u.active_plan || <span className="text-slate-400">—</span>}</td>
                  <td className="py-3 px-4 text-center">{u.referral_count || 0}</td>
                  <td className="py-3 px-4">{u.is_banned ? <span className="badge-danger">Suspendu</span> : <span className="badge-success">Actif</span>}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => adjustBalance(u)} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-100">Solde</button>
                      <button onClick={() => toggleBan(u)} className={`text-xs px-2 py-1 rounded-lg ${u.is_banned ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{u.is_banned ? 'Réactiver' : 'Suspendre'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ===================== ADMIN VIP PLANS =====================
export function AdminVipPlans() {
  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', daily_profit: '', duration_days: 365, is_active: true, sort_order: 0 });

  const load = () => adminAPI.vipPlans().then(r => setPlans(r.data));
  useEffect(load, []);

  const save = async () => {
    try {
      if (editing === 'new') await adminAPI.createVip(form);
      else await adminAPI.updateVip(editing, form);
      toast.success('Sauvegardé'); setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const del = async (id) => { if (!confirm('Supprimer ce plan?')) return; await adminAPI.deleteVip(id); load(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E293B]">Plans VIP</h1>
        <button onClick={() => { setForm({ name: '', price: '', daily_profit: '', duration_days: 365, is_active: true, sort_order: plans.length }); setEditing('new'); }} className="btn-primary">+ Nouveau Plan</button>
      </div>
      {editing && (
        <div className="card border-2 border-primary-200">
          <h2 className="font-bold text-[#1E293B] mb-4">{editing === 'new' ? 'Nouveau Plan' : 'Modifier Plan'}</h2>
          <div className="grid grid-cols-2 gap-4">
            {[{k:'name',l:'Nom',t:'text'},{k:'price',l:'Prix (FBu)',t:'number'},{k:'daily_profit',l:'Profit quotidien (FBu)',t:'number'},{k:'duration_days',l:'Durée (jours)',t:'number'}].map(f => (
              <div key={f.k}><label className="block text-sm font-medium text-[#1E293B] mb-1">{f.l}</label><input type={f.t} className="input" value={form[f.k]} onChange={e => setForm({...form, [f.k]: e.target.value})} /></div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4"><label className="text-sm font-medium text-[#1E293B]"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="mr-2" />Actif</label></div>
          <div className="flex gap-3 mt-4"><button onClick={save} className="btn-primary">Sauvegarder</button><button onClick={() => setEditing(null)} className="btn-secondary">Annuler</button></div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(p => (
          <div key={p.id} className={`card border-2 ${p.is_active ? 'border-primary-200' : 'border-[#E2E8F0] opacity-60'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-primary-600">{p.name}</span>
              {p.is_active ? <span className="badge-success">Actif</span> : <span className="badge-warning">Inactif</span>}
            </div>
            <div className="text-2xl font-extrabold text-[#1E293B]">{Number(p.price).toLocaleString()} FBu</div>
            <div className="text-success-600 font-semibold mt-1">+{Number(p.daily_profit).toLocaleString()} FBu/jour</div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setForm(p); setEditing(p.id); }} className="flex-1 text-xs bg-primary-50 text-primary-700 py-2 rounded-lg hover:bg-primary-100">Modifier</button>
              <button onClick={() => del(p.id)} className="flex-1 text-xs bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== ADMIN SETTINGS =====================
export function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { adminAPI.settings().then(r => setSettings(r.data)).catch(() => {}); }, []);

  const save = async () => {
    setSaving(true);
    try { await adminAPI.updateSettings(settings); toast.success('Paramètres sauvegardés'); }
    catch (err) { toast.error('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  const fields = [
    { k: 'site_name', l: 'Nom du site' }, { k: 'site_tagline', l: 'Slogan' },
    { k: 'whatsapp_group_link', l: 'Lien groupe WhatsApp' }, { k: 'whatsapp_support_number', l: 'Numéro support WhatsApp' },
    { k: 'deposit_phone', l: 'Numéro de dépôt' }, { k: 'deposit_instructions', l: 'Instructions de dépôt', textarea: true },
    { k: 'min_withdrawal', l: 'Retrait minimum (FBu)', type: 'number' }, { k: 'max_withdrawal', l: 'Retrait maximum (FBu)', type: 'number' },
    { k: 'referral_level1_rate', l: 'Commission Niveau 1 (%)', type: 'number' }, { k: 'referral_level2_rate', l: 'Commission Niveau 2 (%)', type: 'number' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1E293B]">Paramètres du Site</h1>
      <div className="card space-y-4">
        {fields.map(f => (
          <div key={f.k}>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">{f.l}</label>
            {f.textarea ? <textarea className="input min-h-24" value={settings[f.k] || ''} onChange={e => setSettings({...settings, [f.k]: e.target.value})} /> : <input type={f.type || 'text'} className="input" value={settings[f.k] || ''} onChange={e => setSettings({...settings, [f.k]: e.target.value})} />}
          </div>
        ))}
        <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Sauvegarde...' : 'Sauvegarder les Paramètres'}</button>
      </div>
    </div>
  );
}

// ===================== ADMIN ANNOUNCEMENTS =====================
export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', type: 'info' });
  const [editing, setEditing] = useState(null);

  const load = () => fetch('/api/announcements').then(r => r.json()).then(setAnnouncements).catch(() => {});
  useEffect(load, []);

  const save = async () => {
    try {
      if (editing) await adminAPI.updateAnnouncement(editing, form);
      else await adminAPI.createAnnouncement(form);
      toast.success('Sauvegardé'); setForm({ title: '', content: '', type: 'info' }); setEditing(null); load();
    } catch { toast.error('Erreur'); }
  };

  const del = async (id) => { if (!confirm('Supprimer?')) return; await adminAPI.deleteAnnouncement(id); load(); };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-[#1E293B]">Annonces</h1>
      <div className="card">
        <h2 className="font-bold text-[#1E293B] mb-4">{editing ? 'Modifier' : 'Nouvelle Annonce'}</h2>
        <div className="space-y-3">
          <input className="input" placeholder="Titre" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <textarea className="input min-h-24" placeholder="Contenu" value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
          <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
            <option value="info">Info</option><option value="success">Succès</option><option value="warning">Avertissement</option>
          </select>
          <div className="flex gap-3"><button onClick={save} className="btn-primary">Publier</button>{editing && <button onClick={() => {setEditing(null); setForm({title:'',content:'',type:'info'})}} className="btn-secondary">Annuler</button>}</div>
        </div>
      </div>
      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div><div className="font-semibold text-[#1E293B]">{a.title}</div><div className="text-sm text-slate-500 mt-1">{a.content}</div><div className="text-xs text-slate-400 mt-2">{new Date(a.created_at).toLocaleDateString('fr-FR')}</div></div>
              <div className="flex gap-2 shrink-0"><button onClick={() => { setForm(a); setEditing(a.id); }} className="text-xs text-primary-600 hover:underline">Modifier</button><button onClick={() => del(a.id)} className="text-xs text-red-500 hover:underline">Supprimer</button></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== ADMIN AUDIT LOGS =====================
export function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { adminAPI.auditLogs().then(r => setLogs(r.data)).catch(() => {}); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">Journaux d'Audit</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[#E2E8F0]">{['Admin', 'Action', 'Type', 'IP', 'Date'].map(h => <th key={h} className="text-left py-3 px-4 text-slate-500 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-[#F8FAFC]">
                <td className="py-2 px-4 font-medium text-[#1E293B]">{l.admin_name || 'System'}</td>
                <td className="py-2 px-4"><span className="badge-info">{l.action}</span></td>
                <td className="py-2 px-4 text-slate-500">{l.entity_type || '—'}</td>
                <td className="py-2 px-4 text-slate-400 text-xs">{l.ip_address || '—'}</td>
                <td className="py-2 px-4 text-slate-400 text-xs">{new Date(l.created_at).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-center text-slate-400 py-8">Aucun log</p>}
      </div>
    </div>
  );
}

export default AdminDeposits;
