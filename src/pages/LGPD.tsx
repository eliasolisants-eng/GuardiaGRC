import { useState, useCallback, useMemo } from 'react';
import { ChevronDown, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LgpdItem, LGPDStatus, LGPD_STATUSES } from '@/types';
import { cn } from '@/lib/utils';

interface LGPDProps {
  items: LgpdItem[];
  onChange: () => void;
}

const STATUS_SHORT: Record<LGPDStatus, string> = {
  'Compliant': 'Conforme',
  'In Progress': 'Andamento',
  'Non-Compliant': 'Não conforme',
};

const STATUS_DOT: Record<LGPDStatus, string> = {
  'Compliant': 'bg-emerald-500',
  'In Progress': 'bg-brand-500',
  'Non-Compliant': 'bg-red-500',
};

const STATUS_ACTIVE: Record<LGPDStatus, string> = {
  'Compliant': 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-500/40',
  'In Progress': 'bg-brand-100 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-300 dark:ring-brand-500/40',
  'Non-Compliant': 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-500/40',
};

export default function LGPD({ items, onChange }: LGPDProps) {
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const reload = useCallback(() => { onChange(); }, [onChange]);

  const updateStatus = async (item: LgpdItem, newStatus: LGPDStatus) => {
    if (item.status === newStatus || saving.has(item.id)) return;
    const previous = item.status;
    const now = new Date().toISOString();
    setSaving((s) => new Set(s).add(item.id));
    // Optimistic update via onChange reload pattern
    const { error } = await supabase.from('grc_lgpd_items').update({ status: newStatus, updated_at: now }).eq('id', item.id);
    setSaving((s) => { const next = new Set(s); next.delete(item.id); return next; });
    if (error) return;
    reload();
  };

  const toggleCat = (cat: string) => {
    setOpenCats((s) => {
      const next = new Set(s);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const compliant = items.filter((i) => i.status === 'Compliant').length;
  const pct = items.length > 0 ? Math.round((compliant / items.length) * 100) : 0;

  const searched = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter((i) => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [items, search]);

  const categories = useMemo(() => [...new Set(searched.map((i) => i.category))], [searched]);

  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; compliant: number }> = {};
    items.forEach((i) => {
      if (!map[i.category]) map[i.category] = { total: 0, compliant: 0 };
      map[i.category].total++;
      if (i.status === 'Compliant') map[i.category].compliant++;
    });
    return map;
  }, [items]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight text-ink-900 dark:text-white">Checklist LGPD</h1>
        <p className="text-sm text-ink-500 dark:text-slate-400 mt-0.5">Acompanhe e atualize o status de cada exigência.</p>
      </div>

      {/* Progress */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-sm font-display font-bold text-ink-900 dark:text-white">Conformidade Geral</span>
              <p className="text-xs text-ink-400 dark:text-slate-500">{compliant} de {items.length} itens</p>
            </div>
          </div>
          <span className="text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{pct}%</span>
        </div>
        <div className="h-2.5 bg-ink-100 dark:bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs">
          {LGPD_STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', STATUS_DOT[s])} />
              <span className="text-ink-500 dark:text-slate-400">{STATUS_SHORT[s]}</span>
              <span className="font-semibold text-ink-700 dark:text-slate-300 tabular-nums">{items.filter((i) => i.status === s).length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar item..." className="input-base pl-10 pr-9" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-slate-300 transition-colors"><X className="w-4 h-4" /></button>
        )}
      </div>

      {/* Accordion by category */}
      {categories.length === 0 ? (
        <div className="glass-card rounded-2xl py-12 text-center">
          <p className="text-sm text-ink-400 dark:text-slate-500">{search ? `Nenhum resultado para "${search}"` : 'Nenhum item no checklist.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const catItems = searched.filter((i) => i.category === category);
            const stat = categoryStats[category] ?? { total: 0, compliant: 0 };
            const catPct = stat.total > 0 ? Math.round((stat.compliant / stat.total) * 100) : 0;
            const isOpen = openCats.has(category);
            const hasNonCompliant = catItems.some((i) => i.status === 'Non-Compliant');
            return (
              <div key={category} className="glass-card rounded-2xl overflow-hidden">
                <button onClick={() => toggleCat(category)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-ink-50/50 dark:hover:bg-surface-2/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <ChevronDown className={cn('w-4 h-4 text-ink-400 transition-transform', isOpen && 'rotate-180')} />
                    <span className="text-sm font-semibold text-ink-800 dark:text-slate-200">{category}</span>
                    {hasNonCompliant && <span className="w-2 h-2 rounded-full bg-red-500" title="Contém itens não conformes" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-400 dark:text-slate-500">{catItems.length} {catItems.length === 1 ? 'item' : 'itens'}</span>
                    <span className={cn('text-xs font-semibold tabular-nums', catPct >= 67 ? 'text-emerald-600 dark:text-emerald-400' : catPct >= 34 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400')}>{catPct}%</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="divide-y divide-ink-50 dark:divide-slate-700/30">
                    {catItems.map((item) => {
                      const isSaving = saving.has(item.id);
                      return (
                        <div key={item.id} className={cn('px-4 py-3 flex items-start gap-3', item.status === 'Non-Compliant' && 'bg-red-50/30 dark:bg-red-500/5')}>
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                            item.status === 'Compliant' ? 'bg-emerald-50 dark:bg-emerald-500/15' :
                            item.status === 'Non-Compliant' ? 'bg-red-50 dark:bg-red-500/15' :
                            'bg-brand-50 dark:bg-brand-600/15'
                          )}>
                            {isSaving ? <Loader2 className={cn('w-4 h-4 animate-spin', item.status === 'Compliant' ? 'text-emerald-600' : item.status === 'Non-Compliant' ? 'text-red-600' : 'text-brand-600')} /> :
                              item.status === 'Compliant' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> :
                              item.status === 'Non-Compliant' ? <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" /> :
                              <Loader2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink-900 dark:text-white">{item.title}</p>
                            {item.description && <p className="text-xs text-ink-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.description}</p>}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {LGPD_STATUSES.map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateStatus(item, status)}
                                  disabled={isSaving}
                                  className={cn(
                                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 disabled:cursor-wait',
                                    item.status === status ? STATUS_ACTIVE[status] : 'bg-ink-50 dark:bg-surface-2 text-ink-500 dark:text-slate-400 hover:bg-ink-100 dark:hover:bg-surface-3'
                                  )}
                                >
                                  {STATUS_SHORT[status]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
