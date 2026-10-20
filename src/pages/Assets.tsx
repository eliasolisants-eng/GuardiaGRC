import { useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
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

interface AssetsProps {
  assets: GrcAsset[];
  onChange: () => void;
}

const emptyForm: Omit<GrcAsset, 'id' | 'created_at' | 'updated_at'> = {
  name: '', type: 'Server', criticality: 'Medium', owner: '', last_audit_date: '', status: 'Compliant',
};

export default function Assets({ assets, onChange }: AssetsProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AssetStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GrcAsset | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => { onChange(); }, [onChange]);

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
    setForm({ name: a.name, type: a.type, criticality: a.criticality, owner: a.owner ?? '', last_audit_date: a.last_audit_date ?? '', status: a.status });
    setError(null); setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('O nome do ativo é obrigatório.'); return; }
    setSaving(true); setError(null);
    const payload = {
      name: form.name, type: form.type, criticality: form.criticality,
      owner: form.owner || null, last_audit_date: form.last_audit_date || null, status: form.status,
    };
    const result = editing
      ? await supabase.from('grc_assets').update(payload).eq('id', editing.id)
      : await supabase.from('grc_assets').insert(payload);
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    setSaving(false); setShowForm(false); reload();
  };

  const remove = async (a: GrcAsset) => {
    if (!confirm(`Excluir o ativo "${a.name}"?`)) return;
    await supabase.from('grc_assets').delete().eq('id', a.id);
    reload();
  };

  const fieldClass = 'input-base';
  const labelClass = 'block text-sm font-medium text-ink-700 dark:text-slate-300 mb-1.5';

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight text-ink-900 dark:text-white">Ativos de TI</h1>
          <p className="text-sm text-ink-500 dark:text-slate-400 mt-0.5">{assets.length} computadores e sistemas cadastrados</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Adicionar Ativo</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou responsável..." className="w-full pl-10 pr-4 py-2 rounded-xl input-base" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as AssetType | 'all')} className={`${fieldClass} sm:w-36`}>
          <option value="all">Todos os Tipos</option>
          {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as AssetStatus | 'all')} className={`${fieldClass} sm:w-40`}>
          <option value="all">Todos os Status</option>
          {ASSET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-12 text-center">
          <p className="text-ink-400 dark:text-slate-500 text-sm">Nenhum ativo encontrado</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Desktop table */}
          <table className="w-full hidden md:table">
            <thead>
              <tr className="border-b border-ink-100 dark:border-slate-700/40">
                <th className="text-left text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Nome</th>
                <th className="text-left text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Responsável</th>
                <th className="text-left text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Última Auditoria</th>
                <th className="text-left text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Criticidade</th>
                <th className="text-left text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Conformidade</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-ink-50 dark:border-slate-700/30 hover:bg-ink-50/50 dark:hover:bg-surface-2/30 transition-colors group">
                  <td className="px-4 py-3 text-sm font-medium text-ink-900 dark:text-white">{a.name}</td>
                  <td className="px-4 py-3 text-sm text-ink-500 dark:text-slate-400">{a.type}</td>
                  <td className="px-4 py-3 text-sm text-ink-500 dark:text-slate-400">{a.owner ?? '--'}</td>
                  <td className="px-4 py-3 text-sm text-ink-500 dark:text-slate-400">{formatDate(a.last_audit_date)}</td>
                  <td className="px-4 py-3"><Badge className={CRITICALITY_COLORS[a.criticality]}>{a.criticality}</Badge></td>
                  <td className="px-4 py-3"><Badge className={ASSET_STATUS_COLORS[a.status]}>{a.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-600/15 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(a)} className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-ink-50 dark:divide-slate-700/30">
            {filtered.map((a) => (
              <div key={a.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-ink-900 dark:text-white">{a.name}</p>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(a)} className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-ink-500 dark:text-slate-400 mb-2">
                  <span>{a.type}</span>
                  <span>· {a.owner ?? '--'}</span>
                  <span>· {formatDate(a.last_audit_date)}</span>
                </div>
                <div className="flex gap-2">
                  <Badge className={CRITICALITY_COLORS[a.criticality]}>{a.criticality}</Badge>
                  <Badge className={ASSET_STATUS_COLORS[a.status]}>{a.status}</Badge>
                </div>
              </div>
            ))}
          </div>
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
              <input type="text" value={form.owner ?? ''} onChange={(e) => setForm({ ...form, owner: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Data da Última Auditoria</label>
              <input type="date" value={form.last_audit_date ?? ''} onChange={(e) => setForm({ ...form, last_audit_date: e.target.value })} className={fieldClass} />
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
