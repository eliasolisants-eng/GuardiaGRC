import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, AlertCircle, Loader2, CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LgpdItem, LGPDStatus, LGPD_STATUSES, LGPD_STATUS_COLORS } from '@/types';
import { cn } from '@/lib/utils';
import Reveal from '@/components/Reveal';
import Badge from '@/components/Badge';

export default function LGPD() {
  const [items, setItems] = useState<LgpdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('grc_lgpd_items').select('*').order('title');
    if (data) setItems(data as LgpdItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (item: LgpdItem, newStatus: LGPDStatus) => {
    if (item.status === newStatus) return;
    setUpdating(item.id);
    await supabase.from('grc_lgpd_items').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', item.id);
    setUpdating(null);
    load();
  };

  const compliant = items.filter((i) => i.status === 'Compliant').length;
  const inProgress = items.filter((i) => i.status === 'In Progress').length;
  const nonCompliant = items.filter((i) => i.status === 'Non-Compliant').length;
  const pct = items.length > 0 ? Math.round((compliant / items.length) * 100) : 0;

  const categories = [...new Set(items.map((i) => i.category))];

  const statusIcon: Record<LGPDStatus, typeof CheckCircle2> = {
    'Compliant': CheckCircle2,
    'In Progress': Loader2,
    'Non-Compliant': AlertCircle,
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="h-24 skeleton rounded-2xl" />
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <Reveal>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-ink-900 dark:text-white tracking-tight">Checklist de Conformidade LGPD</h1>
          <p className="text-sm text-ink-500 dark:text-slate-400 mt-1">Acompanhamento de conformidade com a Lei Geral de Proteção de Dados</p>
        </div>
      </Reveal>

      {/* Progress bar */}
      <Reveal delay={80}>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-display font-bold text-ink-900 dark:text-white">Conformidade Geral</span>
            </div>
            <span className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{pct}%</span>
          </div>
          <div className="h-2.5 bg-ink-100 dark:bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full liquid-progress transition-all duration-700 ease-spring"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> {compliant} Em conformidade</span>
            <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400"><Loader2 className="w-3.5 h-3.5" /> {inProgress} Em andamento</span>
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400"><AlertCircle className="w-3.5 h-3.5" /> {nonCompliant} Não conforme</span>
          </div>
        </div>
      </Reveal>

      {/* Checklist items grouped by category */}
      {categories.map((category, catIdx) => (
        <Reveal key={category} delay={100 + catIdx * 60}>
          <div>
            <h2 className="text-xs font-semibold text-ink-400 dark:text-slate-500 uppercase tracking-wider mb-3">{category}</h2>
            <div className="space-y-3">
              {items.filter((i) => i.category === category).map((item, i) => {
                const Icon = statusIcon[item.status];
                return (
                  <div
                    key={item.id}
                    className="glass-card rounded-2xl p-5 card-lift stagger-item"
                    style={{ '--stagger': i } as React.CSSProperties}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300',
                        item.status === 'Compliant' ? 'bg-emerald-50 dark:bg-emerald-500/15' :
                        item.status === 'In Progress' ? 'bg-brand-50 dark:bg-brand-600/15' :
                        'bg-red-50 dark:bg-red-500/15'
                      )}>
                        <Icon className={cn(
                          'w-5 h-5',
                          item.status === 'Compliant' ? 'text-emerald-600 dark:text-emerald-400' :
                          item.status === 'In Progress' ? 'text-brand-600 dark:text-brand-400' :
                          'text-red-600 dark:text-red-400',
                          item.status === 'In Progress' && 'animate-spin'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-bold text-ink-900 dark:text-white">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-ink-500 dark:text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          {updating === item.id ? (
                            <Loader2 className="w-4 h-4 text-ink-400 animate-spin" />
                          ) : (
                            <div className="flex gap-1.5">
                              {LGPD_STATUSES.map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateStatus(item, status)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95',
                                    item.status === status
                                      ? status === 'Compliant' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                        : status === 'In Progress' ? 'bg-brand-100 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300'
                                        : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                                      : 'bg-ink-50 dark:bg-surface-2 text-ink-500 dark:text-slate-400 hover:bg-ink-100 dark:hover:bg-surface-3'
                                  )}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={LGPD_STATUS_COLORS[item.status]}>{item.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
