import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Search,
  X,
  ClipboardList,
  FolderOpen,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LgpdItem, LGPDStatus, LGPD_STATUSES } from '@/types';
import { cn } from '@/lib/utils';
import Reveal from '@/components/Reveal';

interface LGPDProps {
  onChange?: () => void;
}

type Filter = 'all' | LGPDStatus;

const STATUS_LABEL: Record<LGPDStatus, string> = {
  'Compliant': 'Em Conformidade',
  'In Progress': 'Em Andamento',
  'Non-Compliant': 'Não Conforme',
};

const STATUS_SHORT: Record<LGPDStatus, string> = {
  'Compliant': 'Conforme',
  'In Progress': 'Andamento',
  'Non-Compliant': 'Não conforme',
};

const STATUS_STYLE: Record<LGPDStatus, { icon: typeof CheckCircle2; box: string; text: string; active: string; dot: string; bar: string }> = {
  'Compliant': {
    icon: CheckCircle2,
    box: 'bg-emerald-50 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    active: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-500/40',
    dot: 'bg-emerald-500',
    bar: 'from-emerald-400 to-emerald-600',
  },
  'In Progress': {
    icon: Loader2,
    box: 'bg-brand-50 dark:bg-brand-600/15',
    text: 'text-brand-600 dark:text-brand-400',
    active: 'bg-brand-100 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-300 dark:ring-brand-500/40',
    dot: 'bg-brand-500',
    bar: 'from-brand-400 to-brand-600',
  },
  'Non-Compliant': {
    icon: AlertCircle,
    box: 'bg-red-50 dark:bg-red-500/15',
    text: 'text-red-600 dark:text-red-400',
    active: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-500/40',
    dot: 'bg-red-500',
    bar: 'from-red-400 to-red-600',
  },
};

export default function LGPD({ onChange }: LGPDProps) {
  const [items, setItems] = useState<LgpdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

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

  const searched = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter((i) =>
      i.title.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  }, [items, search]);

  const visible = useMemo(
    () => (filter === 'all' ? searched : searched.filter((i) => i.status === filter)),
    [searched, filter]
  );

  const categories = useMemo(() => [...new Set(visible.map((i) => i.category))], [visible]);

  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; compliant: number }> = {};
    items.forEach((i) => {
      if (!map[i.category]) map[i.category] = { total: 0, compliant: 0 };
      map[i.category].total++;
      if (i.status === 'Compliant') map[i.category].compliant++;
    });
    return map;
  }, [items]);

  if (loading && items.length === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="h-28 skeleton rounded-2xl" />
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      </div>
    );
  }

  const filters: { id: Filter; label: string; count: number; status?: LGPDStatus }[] = [
    { id: 'all', label: 'Todos', count: items.length },
    ...LGPD_STATUSES.map((s) => ({ id: s as Filter, label: STATUS_LABEL[s], count: counts[s], status: s })),
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <Reveal>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight gradient-text">Checklist de Conformidade LGPD</h1>
            <p className="text-sm text-ink-500 dark:text-slate-400 mt-1">
              Acompanhe e atualize o status de cada exigência da Lei Geral de Proteção de Dados.
            </p>
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
        <div role="alert" className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto shrink-0 text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Painel de progresso geral */}
      <Reveal delay={60}>
        <div className="glass-card shimmer-sweep rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-sm font-display font-bold text-ink-900 dark:text-white">Conformidade Geral</span>
                <p className="text-[11px] text-ink-400 dark:text-slate-500">{counts['Compliant']} de {items.length} itens em conformidade</p>
              </div>
            </div>
            <span className="text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{pct}%</span>
          </div>
          <div className="h-3 bg-ink-100 dark:bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full liquid-progress transition-all duration-700 ease-spring"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs">
            {LGPD_STATUSES.map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', STATUS_STYLE[s].dot)} />
                <span className="text-ink-500 dark:text-slate-400">{STATUS_SHORT[s]}</span>
                <span className="font-semibold text-ink-700 dark:text-slate-300 tabular-nums">{counts[s]}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar item do checklist..."
          className="input-base pl-10 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95',
              filter === f.id
                ? f.status
                  ? STATUS_STYLE[f.status].active
                  : 'bg-brand-600 text-white shadow-soft shadow-brand-600/20'
                : 'bg-ink-50 dark:bg-surface-2 text-ink-600 dark:text-slate-300 hover:bg-ink-100 dark:hover:bg-surface-3'
            )}
          >
            {f.status && <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_STYLE[f.status].dot)} />}
            {f.label}
            <span className="opacity-60 tabular-nums">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Resumo por categoria */}
      {filter === 'all' && !search && items.length > 0 && (
        <Reveal delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(categoryStats).map(([cat, stat]) => {
              const catPct = Math.round((stat.compliant / stat.total) * 100);
              return (
                <div key={cat} className="glass-card rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FolderOpen className="w-3.5 h-3.5 text-ink-400 dark:text-slate-500" />
                    <span className="text-[11px] font-semibold text-ink-600 dark:text-slate-300 truncate">{cat}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg font-display font-bold text-ink-900 dark:text-white tabular-nums">{catPct}%</span>
                    <span className="text-[10px] text-ink-400 dark:text-slate-500">{stat.compliant}/{stat.total}</span>
                  </div>
                  <div className="h-1.5 bg-ink-100 dark:bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full bg-gradient-to-r rounded-full transition-all duration-700', catPct >= 67 ? 'from-emerald-400 to-emerald-600' : catPct >= 34 ? 'from-amber-400 to-amber-600' : 'from-red-400 to-red-600')}
                      style={{ width: `${catPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      )}

      {/* Lista de itens */}
      {items.length === 0 && !error ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 text-ink-300 dark:text-slate-600" />
          <p className="text-sm text-ink-500 dark:text-slate-400">Nenhum item no checklist.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Search className="w-8 h-8 mx-auto mb-2 text-ink-300 dark:text-slate-600" />
          <p className="text-sm text-ink-500 dark:text-slate-400">
            {search ? `Nenhum resultado para "${search}"` : 'Nenhum item com esse status.'}
          </p>
        </div>
      ) : (
        categories.map((category, catIdx) => (
          <Reveal key={category} delay={catIdx * 40}>
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider">{category}</h2>
                <span className="text-[11px] text-ink-400 dark:text-slate-500 tabular-nums">
                  {visible.filter((i) => i.category === category).length} {visible.filter((i) => i.category === category).length === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <div className="space-y-2.5">
                {visible.filter((i) => i.category === category).map((item, i) => {
                  const style = STATUS_STYLE[item.status];
                  const Icon = style.icon;
                  const isSaving = saving.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="glass-card shimmer-sweep rounded-2xl p-4 md:p-5 stagger-item"
                      style={{ '--stagger': i } as React.CSSProperties}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-110', style.box)}>
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
                                {STATUS_SHORT[status]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className={cn('hidden sm:flex w-1 h-12 rounded-full bg-gradient-to-b', style.bar)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </Reveal>
        ))
      )}
    </div>
  );
}
