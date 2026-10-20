import { useState, useCallback, useMemo } from 'react';
import { Plus, Search, AlertTriangle, Clock, XCircle, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Credential, CredentialType, CredentialStatus, CREDENTIAL_TYPES } from '@/types';
import { getCredentialStatus } from '@/lib/risk';
import { formatDate, daysUntil, cn } from '@/lib/utils';
import Modal from '@/components/Modal';
import Button from '@/components/Button';

interface CredentialsProps {
  credentials: Credential[];
  onChange: () => void;
}

const emptyForm: Omit<Credential, 'id' | 'created_at'> = {
  name: '', type: 'Employee Access', holder: '', issue_date: '', expiry_date: '', status: 'Active',
};

const statusStyle: Record<CredentialStatus, { bg: string; text: string; badge: string; label: string }> = {
  'Active': { bg: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', badge: 'compliant', label: 'Ativo' },
  'Expiring Soon': { bg: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', badge: 'at-risk', label: 'Vencendo' },
  'Expired': { bg: 'bg-red-50 dark:bg-red-500/15', text: 'text-red-600 dark:text-red-400', badge: 'non-compliant', label: 'Vencido' },
};

export default function Credentials({ credentials, onChange }: CredentialsProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<CredentialStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => { onChange(); }, [onChange]);

  const getStatus = (c: Credential): CredentialStatus => getCredentialStatus(c);

  const filtered = credentials.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.holder?.toLowerCase().includes(q)) return false;
    }
    if (filterStatus !== 'all' && getStatus(c) !== filterStatus) return false;
    return true;
  });

  const openNew = () => { setEditing(null); setForm(emptyForm); setError(null); setShowForm(true); };
  const openEdit = (c: Credential) => {
    setEditing(c);
    setForm({ name: c.name, type: c.type, holder: c.holder ?? '', issue_date: c.issue_date ?? '', expiry_date: c.expiry_date ?? '', status: c.status });
    setError(null); setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('O nome é obrigatório.'); return; }
    if (!form.expiry_date) { setError('A data de vencimento é obrigatória.'); return; }
    setSaving(true); setError(null);
    const payload = {
      name: form.name, type: form.type, holder: form.holder || null,
      issue_date: form.issue_date || null, expiry_date: form.expiry_date, status: form.status,
    };
    const result = editing
      ? await supabase.from('grc_credentials').update(payload).eq('id', editing.id)
      : await supabase.from('grc_credentials').insert(payload);
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    setSaving(false); setShowForm(false); reload();
  };

  const remove = async (c: Credential) => {
    if (!confirm(`Excluir "${c.name}"?`)) return;
    await supabase.from('grc_credentials').delete().eq('id', c.id);
    reload();
  };

  const expiredCount = credentials.filter((c) => getStatus(c) === 'Expired').length;
  const expiringCount = credentials.filter((c) => getStatus(c) === 'Expiring Soon').length;

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const sa = getStatus(a), sb = getStatus(b);
      const order: Record<CredentialStatus, number> = { 'Expired': 0, 'Expiring Soon': 1, 'Active': 2 };
      if (order[sa] !== order[sb]) return order[sa] - order[sb];
      return (daysUntil(a.expiry_date) ?? 999) - (daysUntil(b.expiry_date) ?? 999);
    });
  }, [filtered]);

  const fieldClass = 'input-base';
  const labelClass = 'block text-sm font-medium text-ink-700 dark:text-slate-300 mb-1.5';

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight text-ink-900 dark:text-white">Acessos & Vencimentos</h1>
          <p className="text-sm text-ink-500 dark:text-slate-400 mt-0.5">{credentials.length} itens cadastrados</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Adicionar</Button>
      </div>

      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {expiredCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">{expiredCount} vencido{expiredCount > 1 ? 's' : ''}</span>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{expiringCount} vencendo em até 30 dias</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou titular..." className="w-full pl-10 pr-4 py-2 rounded-xl input-base" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CredentialStatus | 'all')} className={`${fieldClass} sm:w-44`}>
          <option value="all">Todos os Status</option>
          <option value="Active">Ativo</option>
          <option value="Expiring Soon">Vencendo</option>
          <option value="Expired">Vencido</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-card rounded-2xl py-12 text-center">
          <p className="text-ink-400 dark:text-slate-500 text-sm">Nenhuma credencial encontrada</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Desktop table */}
          <table className="w-full hidden md:table">
            <thead>
              <tr className="border-b border-ink-100 dark:border-slate-700/40">
                <th className="text-left text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Nome</th>
                <th className="text-left text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Categoria</th>
                <th className="text-left text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Responsável</th>
                <th className="text-left text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Vencimento</th>
                <th className="text-left text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const status = getStatus(c);
                const days = daysUntil(c.expiry_date);
                const style = statusStyle[status];
                return (
                  <tr key={c.id} className={cn('border-b border-ink-50 dark:border-slate-700/30 hover:bg-ink-50/50 dark:hover:bg-surface-2/30 transition-colors group', status === 'Expired' && 'bg-red-50/30 dark:bg-red-500/5')}>
                    <td className="px-4 py-3 text-sm font-medium text-ink-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-ink-500 dark:text-slate-400">{c.type}</td>
                    <td className="px-4 py-3 text-sm text-ink-500 dark:text-slate-400">{c.holder ?? '--'}</td>
                    <td className="px-4 py-3 text-sm text-ink-500 dark:text-slate-400">{formatDate(c.expiry_date)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('status-badge', style.badge)}>
                        {style.label}
                        {days !== null && days < 30 && <span className="ml-1 opacity-70">({days > 0 ? `${days}d` : `${Math.abs(days)}d`})</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-600/15 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(c)} className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-ink-50 dark:divide-slate-700/30">
            {sorted.map((c) => {
              const status = getStatus(c);
              const days = daysUntil(c.expiry_date);
              const style = statusStyle[status];
              return (
                <div key={c.id} className={cn('p-4', status === 'Expired' && 'bg-red-50/30 dark:bg-red-500/5')}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-ink-900 dark:text-white">{c.name}</p>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(c)} className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-ink-500 dark:text-slate-400 mb-2">
                    <span>{c.type}</span>
                    <span>· {c.holder ?? '--'}</span>
                    <span>· {formatDate(c.expiry_date)}</span>
                  </div>
                  <span className={cn('status-badge', style.badge)}>
                    {style.label}
                    {days !== null && days < 30 && <span className="ml-1 opacity-70">({days > 0 ? `${days}d` : `${Math.abs(days)}d`})</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar Credencial' : 'Adicionar Credencial'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className={labelClass}>Nome *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CredentialType })} className={fieldClass}>
                {CREDENTIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Titular</label>
              <input type="text" value={form.holder ?? ''} onChange={(e) => setForm({ ...form, holder: e.target.value })} className={fieldClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data de Emissão</label>
              <input type="date" value={form.issue_date ?? ''} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Data de Vencimento *</label>
              <input type="date" value={form.expiry_date ?? ''} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className={fieldClass} required />
            </div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-3.5 py-2.5">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? 'Salvar' : 'Adicionar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
