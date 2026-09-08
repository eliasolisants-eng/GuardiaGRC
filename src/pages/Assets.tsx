import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Server, Database, Code, Monitor, Edit2, Trash2, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  GrcAsset, AssetType, Criticality, AssetStatus,
  ASSET_TYPES, CRITICALITIES, ASSET_STATUSES,
  ASSET_STATUS_COLORS, CRITICALITY_COLORS,
} from '@/types';
import { formatDate, cn } from '@/lib/utils';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Reveal from '@/components/Reveal';

const emptyForm: Omit<GrcAsset, 'id' | 'created_at' | 'updated_at'> = {
  name: '', type: 'Server', criticality: 'Medium', owner: '', last_audit_date: '', status: 'Compliant',
};

const typeIcons: Record<AssetType, typeof Server> = {
  Server: Server, Database: Database, API: Code, Endpoint: Monitor,
};

export default function Assets() {
  const [assets, setAssets] = useState<GrcAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AssetStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GrcAsset | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('grc_assets').select('*').order('name');
    if (data) setAssets(data as GrcAsset[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = assets.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      if (!a.name.toLowerCase().includes(q) && !a.owner?.toLowerCase().includes(q)) return false;
    }
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  const openNew = () => { setEditing(null); setForm(emptyForm); setError(null); setShowForm(true); };
  const openEdit = (a: GrcAsset) => {
    setEditing(a);
    setForm({
      name: a.name, type: a.type, criticality: a.criticality,
      owner: a.owner ?? '', last_audit_date: a.last_audit_date ?? '', status: a.status,
    });
    setError(null); setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('O nome do ativo é obrigatório.'); return; }
    setSaving(true); setError(null);
    const payload = {
      name: form.name, type: form.type, criticality: form.criticality,
      owner: form.owner || null,
      last_audit_date: form.last_audit_date || null,
      status: form.status,
    };
    const result = editing
      ? await supabase.from('grc_assets').update(payload).eq('id', editing.id)
      : await supabase.from('grc_assets').insert(payload);
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    setSaving(false); setShowForm(false); load();
  };

  const remove = async (a: GrcAsset) => {
    if (!confirm(`Excluir o ativo "${a.name}"?`)) return;
    await supabase.from('grc_assets').delete().eq('id', a.id);
    load();
  };

  const labelClass = 'block text-sm font-medium text-ink-700 dark:text-slate-300 mb-1.5';
  const fieldClass = 'input-base';

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <Reveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-ink-900 dark:text-white tracking-tight">Ativos de TI</h1>
            <p className="text-sm text-ink-500 dark:text-slate-400 mt-1">{filtered.length} ativos cadastrados</p>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4" /> Adicionar Ativo</Button>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-slate-500 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou responsável..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-200/60 dark:border-slate-700/60 glass-input text-sm text-ink-900 dark:text-slate-200 placeholder:text-ink-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/10 transition-all duration-300"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as AssetType | 'all')} className={`${fieldClass} sm:w-40`}>
            <option value="all">Todos os Tipos</option>
            {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as AssetStatus | 'all')} className={`${fieldClass} sm:w-44`}>
            <option value="all">Todos os Status</option>
            {ASSET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Reveal>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 text-center">
          <Server className="w-10 h-10 text-ink-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-ink-400 dark:text-slate-500 text-sm">Nenhum ativo encontrado</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a, i) => {
            const Icon = typeIcons[a.type];
            return (
              <div
                key={a.id}
                className="glass-card rounded-2xl p-5 card-lift group stagger-item"
                style={{ '--stagger': Math.min(i, 12) } as React.CSSProperties}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105',
                      a.type === 'Database' ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400' :
                      a.type === 'API' ? 'bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400' :
                      a.type === 'Endpoint' ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                      'bg-brand-50 dark:bg-brand-600/15 text-brand-600 dark:text-brand-400'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-display font-bold text-ink-900 dark:text-white">{a.name}</p>
                      <p className="text-xs text-ink-400 dark:text-slate-500">{a.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-ink-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-600/15 transition-colors active:scale-90">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(a)} className="p-1.5 rounded-lg text-ink-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors active:scale-90">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {a.owner && (
                    <div className="flex items-center gap-2 text-xs text-ink-600 dark:text-slate-400">
                      <User className="w-3.5 h-3.5 text-ink-400 dark:text-slate-500" /> {a.owner}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-ink-600 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-ink-400 dark:text-slate-500" /> Última auditoria: {formatDate(a.last_audit_date)}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-ink-50 dark:border-slate-700/40 flex items-center justify-between">
                  <Badge className={CRITICALITY_COLORS[a.criticality]}>{a.criticality}</Badge>
                  <Badge className={ASSET_STATUS_COLORS[a.status]}>{a.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar Ativo' : 'Adicionar Ativo de TI'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className={labelClass}>Nome do Ativo *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AssetType })} className={fieldClass}>
                {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Criticidade</label>
              <select value={form.criticality} onChange={(e) => setForm({ ...form, criticality: e.target.value as Criticality })} className={fieldClass}>
                {CRITICALITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Responsável</label>
              <input type="text" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Data da Última Auditoria</label>
              <input type="date" value={form.last_audit_date} onChange={(e) => setForm({ ...form, last_audit_date: e.target.value })} className={fieldClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AssetStatus })} className={fieldClass}>
              {ASSET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-3.5 py-2.5">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? 'Salvar' : 'Adicionar Ativo'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
