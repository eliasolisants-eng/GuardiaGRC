import { useState, useCallback } from 'react';
import { Plus, Search, AlertTriangle, FileSearch, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AuditLog, AuditSeverity, AuditStatus, AUDIT_SEVERITIES, AUDIT_STATUSES, SEVERITY_COLORS, AUDIT_STATUS_COLORS } from '@/types';
import { formatDate, relativeTime, cn } from '@/lib/utils';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Badge from '@/components/Badge';

interface AuditsProps {
  logs: AuditLog[];
  onChange: () => void;
}

const emptyForm: Omit<AuditLog, 'id' | 'created_at' | 'resolved_at'> = {
  title: '', description: '', severity: 'Medium', status: 'Open', assigned_to: '', incident_date: '',
};

export default function Audits({ logs, onChange }: AuditsProps) {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<AuditSeverity | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AuditStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AuditLog | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => { onChange(); }, [onChange]);

  const filtered = logs.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.assigned_to?.toLowerCase().includes(q)) return false;
    }
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  const openNew = () => { setEditing(null); setForm(emptyForm); setError(null); setShowForm(true); };
  const openEdit = (a: AuditLog) => {
    setEditing(a);
    setForm({ title: a.title, description: a.description ?? '', severity: a.severity, status: a.status, assigned_to: a.assigned_to ?? '', incident_date: a.incident_date ?? '' });
    setError(null); setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('O título é obrigatório.'); return; }
    setSaving(true); setError(null);
    const payload = {
      title: form.title, description: form.description || null, severity: form.severity,
      status: form.status, assigned_to: form.assigned_to || null,
      incident_date: form.incident_date || null,
      resolved_at: form.status === 'Resolved' ? new Date().toISOString() : null,
    };
    const result = editing
      ? await supabase.from('grc_audit_logs').update(payload).eq('id', editing.id)
      : await supabase.from('grc_audit_logs').insert(payload);
    if (result.error) { setError(result.error.message); setSaving(false); return; }
    setSaving(false); setShowForm(false); reload();
  };

  const remove = async (a: AuditLog) => {
    if (!confirm(`Excluir o registro "${a.title}"?`)) return;
    await supabase.from('grc_audit_logs').delete().eq('id', a.id);
    reload();
  };

  const updateStatus = async (a: AuditLog, newStatus: AuditStatus) => {
    await supabase.from('grc_audit_logs').update({
      status: newStatus,
      resolved_at: newStatus === 'Resolved' ? new Date().toISOString() : null,
    }).eq('id', a.id);
    reload();
  };

  const openCount = logs.filter((l) => l.status === 'Open').length;
  const inReviewCount = logs.filter((l) => l.status === 'In Review').length;
  const resolvedCount = logs.filter((l) => l.status === 'Resolved').length;

  const fieldClass = 'input-base';
  const labelClass = 'block text-sm font-medium text-ink-700 dark:text-slate-300 mb-1.5';

  const summaryCards = [
    { label: 'Em aberto', count: openCount, color: 'text-red-600 dark:text-red-400' },
    { label: 'Em análise', count: inReviewCount, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Resolvidos', count: resolvedCount, color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight text-ink-900 dark:text-white">Auditoria & Incidentes</h1>
          <p className="text-sm text-ink-500 dark:text-slate-400 mt-0.5">{logs.length} incidentes registrados</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Registrar Incidente</Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        {summaryCards.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-3 text-center">
            <p className={cn('text-2xl font-display font-bold tabular-nums', s.color)}>{s.count}</p>
            <p className="text-xs text-ink-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título ou responsável..." className="w-full pl-10 pr-4 py-2 rounded-xl input-base" />
        </div>
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as AuditSeverity | 'all')} className={`${fieldClass} sm:w-36`}>
          <option value="all">Severidade</option>
          {AUDIT_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as AuditStatus | 'all')} className={`${fieldClass} sm:w-36`}>
          <option value="all">Status</option>
          {AUDIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-12 text-center">
          <FileSearch className="w-8 h-8 text-ink-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-ink-400 dark:text-slate-500 text-sm">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.id} className={cn('glass-card rounded-xl p-3.5 group', a.severity === 'High' && a.status !== 'Resolved' && 'border border-red-100/60 dark:border-red-500/20')}>
              <div className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  a.severity === 'High' ? 'bg-red-50 dark:bg-red-500/15' :
                  a.severity === 'Medium' ? 'bg-amber-50 dark:bg-amber-500/15' :
                  'bg-emerald-50 dark:bg-emerald-500/15'
                )}>
                  {a.status === 'Resolved' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> :
                    <AlertTriangle className={cn('w-4 h-4', a.severity === 'High' ? 'text-red-600 dark:text-red-400' : a.severity === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{a.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-ink-400 dark:text-slate-500">
                    {a.assigned_to && <span>{a.assigned_to}</span>}
                    {a.incident_date && <span>· {formatDate(a.incident_date)}</span>}
                    <span>· {relativeTime(a.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={SEVERITY_COLORS[a.severity]}>{a.severity}</Badge>
                  <Badge className={AUDIT_STATUS_COLORS[a.status]}>{a.status}</Badge>
                  {a.status !== 'Resolved' && (
                    <select value={a.status} onChange={(e) => updateStatus(a, e.target.value as AuditStatus)} className="text-xs px-2 py-1 rounded-lg border border-ink-200 dark:border-slate-700 bg-white dark:bg-surface-2 text-ink-600 dark:text-slate-300 focus:outline-none focus:border-brand-400">
                      {AUDIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-600/15 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(a)} className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar Incidente' : 'Registrar Incidente'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className={labelClass}>Título *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={fieldClass} required />
          </div>
          <div>
            <label className={labelClass}>Descrição</label>
            <textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className={fieldClass} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Severidade</label>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as AuditSeverity })} className={fieldClass}>
                {AUDIT_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AuditStatus })} className={fieldClass}>
                {AUDIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Responsável</label>
              <input type="text" value={form.assigned_to ?? ''} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Data do Incidente</label>
              <input type="date" value={form.incident_date ?? ''} onChange={(e) => setForm({ ...form, incident_date: e.target.value })} className={fieldClass} />
            </div>
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-3.5 py-2.5">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? 'Salvar' : 'Registrar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
