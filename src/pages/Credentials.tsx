import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, KeyRound, FileText, Shield, AlertTriangle, Clock, XCircle, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Credential, CredentialType, CredentialStatus, CREDENTIAL_TYPES } from '@/types';
import { getCredentialStatus } from '@/lib/risk';
import { formatDate, daysUntil, cn } from '@/lib/utils';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Reveal from '@/components/Reveal';

const emptyForm: Omit<Credential, 'id' | 'created_at'> = {
  name: '', type: 'Employee Access', holder: '', issue_date: '', expiry_date: '', status: 'Active',
};

const typeIcons: Record<CredentialType, typeof KeyRound> = {
  'Employee Access': KeyRound,
  'SSL Certificate': Shield,
  'Security Policy': FileText,
};

export default function Credentials() {
  const [creds, setCreds] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<CredentialStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('grc_credentials').select('*').order('expiry_date', { ascending: true, nullsFirst: false });
    if (data) setCreds(data as Credential[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getStatus = (c: Credential): CredentialStatus => getCredentialStatus(c);

  const filtered = creds.filter((c) => {
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
    setForm({
      name: c.name, type: c.type, holder: c.holder ?? '',
      issue_date: c.issue_date ?? '', expiry_date: c.expiry_date ?? '', status: c.status,
    });
    setError(null); setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('O nome é obrigatório.'); return; }
    if (!form.expiry_date) { setError('A data de vencimento é obrigatória.'); return; }
    setSaving(true); setError(null);
    const payload = {
      name: form.name, type: form.type, holder: form.holder || null,
      issue_date: form.issue_date || null, expiry_date: form.expiry_date,
      status: form.status,
    };
    const result = editing
      ? await supabase.from('grc_credentials').update(payload).eq('id', editing.id)
      : await supabase.from('grc_credentials').insert(payload);
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    setSaving(false); setShowForm(false); load();
  };

  const remove = async (c: Credential) => {
    if (!confirm(`Excluir "${c.name}"?`)) return;
    await supabase.from('grc_credentials').delete().eq('id', c.id);
    load();
  };

  const expiredCount = creds.filter((c) => getStatus(c) === 'Expired').length;
  const expiringCount = creds.filter((c) => getStatus(c) === 'Expiring Soon').length;

  const labelClass = 'block text-sm font-medium text-ink-700 dark:text-slate-300 mb-1.5';
  const fieldClass = 'input-base';

  const statusStyle: Record<CredentialStatus, { bg: string; text: string; icon: typeof CheckCircle2; label: string }> = {
    'Active': { bg: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2, label: 'Ativo' },
    'Expiring Soon': { bg: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', icon: Clock, label: 'Vencendo em breve' },
    'Expired': { bg: 'bg-red-50 dark:bg-red-500/15', text: 'text-red-600 dark:text-red-400', icon: XCircle, label: 'Vencido' },
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <Reveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-ink-900 dark:text-white tracking-tight">Acessos & Vencimentos</h1>
            <p className="text-sm text-ink-500 dark:text-slate-400 mt-1">{creds.length} credenciais e certificados monitorados</p>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4" /> Adicionar Credencial</Button>
        </div>
      </Reveal>

      {/* Alert summary */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <Reveal delay={60}>
          <div className="flex flex-wrap gap-3">
            {expiredCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">{expiredCount} {expiredCount === 1 ? 'item vencido' : 'itens vencidos'}</span>
              </div>
            )}
            {expiringCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{expiringCount} vencendo em até 30 dias</span>
              </div>
            )}
          </div>
        </Reveal>
      )}

      <Reveal delay={100}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-slate-500 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou titular..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-200/60 dark:border-slate-700/60 glass-input text-sm text-ink-900 dark:text-slate-200 placeholder:text-ink-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/10 transition-all duration-300"
            />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CredentialStatus | 'all')} className={`${fieldClass} sm:w-44`}>
            <option value="all">Todos os Status</option>
            <option value="Active">Ativo</option>
            <option value="Expiring Soon">Vencendo em breve</option>
            <option value="Expired">Vencido</option>
          </select>
        </div>
      </Reveal>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 text-center">
          <KeyRound className="w-10 h-10 text-ink-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-ink-400 dark:text-slate-500 text-sm">Nenhuma credencial encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => {
            const status = getStatus(c);
            const days = daysUntil(c.expiry_date);
            const style = statusStyle[status];
            const Icon = typeIcons[c.type];
            const StatusIcon = style.icon;
            return (
              <div
                key={c.id}
                className={cn(
                  'glass-card rounded-2xl border p-5 card-lift group stagger-item',
                  status === 'Expired' ? 'border-red-200/60 dark:border-red-500/30' :
                  status === 'Expiring Soon' ? 'border-amber-200/60 dark:border-amber-500/30' :
                  'border-transparent'
                )}
                style={{ '--stagger': Math.min(i, 12) } as React.CSSProperties}
              >
                <div className="flex items-center gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', style.bg)}>
                    <Icon className={cn('w-5 h-5', style.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-bold text-ink-900 dark:text-white">{c.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-ink-500 dark:text-slate-400">
                      <span>{c.type}</span>
                      {c.holder && <span>· {c.holder}</span>}
                      <span>· Vence em {formatDate(c.expiry_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold', style.bg, style.text)}>
                      <StatusIcon className={cn('w-3.5 h-3.5', status === 'In Progress' && 'animate-spin')} />
                      {style.label}
                      {days !== null && days < 30 && (
                        <span className="ml-0.5">({days > 0 ? `${days}d` : `${Math.abs(days)}d atrás`})</span>
                      )}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-ink-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-600/15 transition-colors active:scale-90">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(c)} className="p-1.5 rounded-lg text-ink-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors active:scale-90">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
              <input type="text" value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} className={fieldClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data de Emissão</label>
              <input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Data de Vencimento *</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className={fieldClass} required />
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
