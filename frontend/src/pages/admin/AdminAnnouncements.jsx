import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

export default function AdminNotifications() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '', type: 'info' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    adminAPI.getAnnouncements()
      .then(r => setAnnouncements(r.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async () => {
    if (!form.title || !form.content) return toast.error('Titre et contenu requis');
    try {
      if (editing) {
        await adminAPI.updateAnnouncement(editing, form);
        toast.success('Annonce mise à jour');
      } else {
        await adminAPI.createAnnouncement(form);
        toast.success('Annonce créée');
      }
      setForm({ title: '', content: '', type: 'info' });
      setEditing(null);
      setShowForm(false);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const del = async (id) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    try {
      await adminAPI.deleteAnnouncement(id);
      toast.success('Annonce supprimée');
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleActive = async (ann) => {
    try {
      await adminAPI.updateAnnouncement(ann.id, { ...ann, is_active: !ann.is_active });
      toast.success(ann.is_active ? 'Annonce désactivée' : 'Annonce activée');
      load();
    } catch {
      toast.error('Erreur');
    }
  };

  const startEdit = (ann) => {
    setForm({ title: ann.title, content: ann.content, type: ann.type });
    setEditing(ann.id);
    setShowForm(true);
  };

  const cancel = () => {
    setForm({ title: '', content: '', type: 'info' });
    setEditing(null);
    setShowForm(false);
  };

  const typeColor = { info: 'bg-blue-50 text-blue-700 border-blue-200', success: 'bg-green-50 text-green-700 border-green-200', warning: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
  const typeIcon = { info: 'ℹ️', success: '✅', warning: '⚠️' };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E293B]">Annonces & Notifications</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Nouvelle Annonce
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border-2 border-primary-200">
          <h2 className="font-bold text-[#1E293B] mb-4">{editing ? 'Modifier l\'annonce' : 'Nouvelle Annonce'}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1">Titre</label>
              <input
                className="input"
                placeholder="Titre de l'annonce"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1">Contenu</label>
              <textarea
                className="input min-h-24"
                placeholder="Contenu de l'annonce..."
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="info">ℹ️ Info</option>
                <option value="success">✅ Succès</option>
                <option value="warning">⚠️ Avertissement</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} className="btn-primary">{editing ? 'Mettre à jour' : 'Publier'}</button>
              <button onClick={cancel} className="btn-secondary">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="card text-center py-8 text-slate-400">Aucune annonce</div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className={`card border ${!ann.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-xl mt-0.5">{typeIcon[ann.type] || 'ℹ️'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-[#1E293B]">{ann.title}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColor[ann.type] || typeColor.info}`}>
                        {ann.type}
                      </span>
                      {!ann.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Inactif
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">{ann.content}</div>
                    <div className="text-xs text-slate-400 mt-2">
                      {new Date(ann.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(ann)}
                    className={`text-xs px-2 py-1 rounded-lg ${ann.is_active ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                  >
                    {ann.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => startEdit(ann)}
                    className="text-xs px-2 py-1 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => del(ann.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
