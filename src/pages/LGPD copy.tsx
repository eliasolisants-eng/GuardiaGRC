import { useEffect, useState, useCallback, useMemo } from 'react';
import { ShieldCheck, AlertCircle, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LgpdItem, LGPDStatus, LGPD_STATUSES } from '@/types';
import { cn } from '@/lib/utils';
import Reveal from '@/components/Reveal';

interface LGPDProps {
  /** Chamado após qualquer alteração salva, para o app atualizar contadores globais. */
  onChange?: () => void;
}

type Filter = 'all' | LGPDStatus;

const STATUS_LABEL: Record<LGPDStatus, string> = {
  'Compliant': 'Em conformidade',
  'In Progress': 'Em andamento',
  'Non-Compliant': 'Não conforme',
};

const STATUS_STYLE: Record<LGPDStatus, { icon: typeof CheckCircle2; box: string; text: string; active: string }> = {
  'Compliant': {
    icon: CheckCircle2,
    box: 'bg-emerald-50 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    active: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  },
  'In Progress': {
    icon: Loader2,
    box: 'bg-brand-50 dark:bg-brand-600/15',
    text: 'text-brand-600 dark:text-brand-400',
    active: 'bg-brand-100 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300',
  },
  'Non-Compliant': {
    icon: AlertCircle,
    box: 'bg-red-50 dark:bg-red-500/15',
    text: 'text-red-600 dark:text-red-400',
    active: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',
  },
};

export default function LGPD({ onChange }: LGPDProps) {
  const [items, setItems] = useState<LgpdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('grc_lgpd_items')
      .select('*')
      .order('category')
      .order('title');
    if (err) setError(`Não foi possível carregar o checklist: ${err.message}`);
    else setItems((data ?? []) as LgpdItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (item: LgpdItem, newStatus: LGPDStatus) => {
    if (item.status === newStatus || saving.has(item.id)) return;

    const previous = item.status;
    const now = new Date().toISOString();

    // Atualização otimista: a tela responde na hora, sem recarregar a página inteira.
    setError(null);
    setSaving((s) => new Set(s).add(item.id));
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: newStatus, updated_at: now } : i)));

    const { error: err } = await supabase
      .from('grc_lgpd_items')
      .update({ status: newStatus, updated_at: now })
      .eq('id', item.id);

    setSaving((s) => {
      const next = new Set(s);
      next.delete(item.id);
      return next;
    });

    if (err) {
      // Reverte se o banco recusou a alteração
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: previous } : i)));
      setError(`Não foi possível salvar "${item.title}": ${err.message}`);
      return;
    }
    onChange?.();
  };

  const counts = useMemo(() => ({
    'Compliant': items.filter((i) => i.status === 'Compliant').length,
    'In Progress': items.filter((i) => i.status === 'In Progress').length,
    'Non-Compliant': items.filter((i) => i.status === 'Non-Compliant').length,
  }), [items]);

  const pct = items.length > 0 ? Math.round((counts['Compliant'] / items.length) * 100) : 0;

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.status === filter)),
    [items, filter]
  );
  const categories = useMemo(() => [...new Set(visible.map((i) => i.category))], [visible]);

  if (loading && items.length === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="h-24 skeleton rounded-2xl" />
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      </div>
    );
  }

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Todos', count: items.length },
    ...LGPD_STATUSES.map((s) => ({ id: s as Filter, label: STATUS_LABEL[s], count: counts[s] })),
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <Reveal>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight gradient-text">Checklist LGPD</h1>
            <p className="text-sm text-ink-500 dark:text-slate-400 mt-1">Marque o status de cada exigência da Lei Geral de Proteção de Dados.</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            title="Recarregar"
            className="p-2 rounded-xl text-ink-400 hover:text-ink-700 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-surface-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </Reveal>

      {error && (
        <div role="alert" className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Progresso */}
      <Reveal delay={60}>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-display font-bold text-ink-900 dark:text-white">Conformidade geral</span>
            </div>
            <span className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{pct}%</span>
          </div>
          <div className="h-2.5 bg-ink-100 dark:bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full liquid-progress transition-all duration-700 ease-spring"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-ink-500 dark:text-slate-400 mt-3">
            {counts['Compliant']} de {items.length} itens em conformidade
          </p>
        </div>
      </Reveal>

      {/* Filtros (também servem como legenda dos contadores) */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter === f.id
                ? 'bg-brand-600 text-white'
                : 'bg-ink-50 dark:bg-surface-2 text-ink-600 dark:text-slate-300 hover:bg-ink-100 dark:hover:bg-surface-3'
            )}
          >
            {f.label} <span className="opacity-70 tabular-nums">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {items.length === 0 && !error ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-ink-500 dark:text-slate-400">
          Nenhum item no checklist. Verifique se a migration do Supabase foi aplicada (tabela <code>grc_lgpd_items</code>).
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-ink-500 dark:text-slate-400">
          Nenhum item com esse status.
        </div>
      ) : (
        categories.map((category) => (
          <section key={category}>
            <h2 className="text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider mb-3">{category}</h2>
            <div className="space-y-3">
              {visible.filter((i) => i.category === category).map((item) => {
                const style = STATUS_STYLE[item.status];
                const Icon = style.icon;
                const isSaving = saving.has(item.id);
                return (
                  <div key={item.id} className="glass-card rounded-2xl p-4 md:p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', style.box)}>
                        {isSaving
                          ? <Loader2 className={cn('w-5 h-5 animate-spin', style.text)} />
                          : <Icon className={cn('w-5 h-5', style.text)} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-bold text-ink-900 dark:text-white">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-ink-500 dark:text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-3" role="group" aria-label={`Status de ${item.title}`}>
                          {LGPD_STATUSES.map((status) => (
                            <button
                              key={status}
                              onClick={() => updateStatus(item, status)}
                              disabled={isSaving}
                              aria-pressed={item.status === status}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 disabled:cursor-wait',
                                item.status === status
                                  ? STATUS_STYLE[status].active
                                  : 'bg-ink-50 dark:bg-surface-2 text-ink-500 dark:text-slate-400 hover:bg-ink-100 dark:hover:bg-surface-3'
                              )}
                            >
                              {STATUS_LABEL[status]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
