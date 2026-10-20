import { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Server,
  AlertTriangle,
  Gauge,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import {
  GrcAsset, LgpdItem, Credential, AuditLog, RiskHistoryPoint,
  AUDIT_STATUS_COLORS, SEVERITY_COLORS,
} from '@/types';
import { calculateRiskScore, getAlertCount } from '@/lib/risk';
import { relativeTime, cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';
import Badge from '@/components/Badge';

interface DashboardProps {
  assets: GrcAsset[];
  lgpdItems: LgpdItem[];
  credentials: Credential[];
  auditLogs: AuditLog[];
  onNavigate: (view: 'assets' | 'lgpd' | 'credentials' | 'audits') => void;
}

export default function Dashboard({ assets, lgpdItems, credentials, auditLogs, onNavigate }: DashboardProps) {
  const [riskHistory, setRiskHistory] = useState<RiskHistoryPoint[]>([]);
  const { theme } = useTheme();

  const loadHistory = useCallback(async () => {
    const { data: rh } = await supabase.from('grc_risk_history').select('*').order('calculated_at', { ascending: true });
    if (rh) setRiskHistory(rh as RiskHistoryPoint[]);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const risk = calculateRiskScore(assets, lgpdItems, credentials, auditLogs);
  const alertCount = getAlertCount(credentials, auditLogs, lgpdItems);
  const lgpdCompliant = lgpdItems.filter((l) => l.status === 'Compliant').length;
  const lgpdPct = lgpdItems.length > 0 ? Math.round((lgpdCompliant / lgpdItems.length) * 100) : 0;
  const highRiskAlerts = auditLogs.filter((a) => a.severity === 'High' && a.status !== 'Resolved').length;
  const openActions = auditLogs.filter((a) => a.status !== 'Resolved').slice(0, 6);

  const chartData = riskHistory.map((h) => ({
    date: new Date(h.calculated_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
    score: h.score,
  }));

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const axisColor = isDark ? '#64748b' : '#94a3b8';
  const tooltipBg = isDark ? '#1a2236' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipText = isDark ? '#e2e8f0' : '#1f2531';

  const indicators = [
    { label: 'Conformidade', value: `${risk.score}%`, icon: <Gauge className="w-4 h-4" />, color: risk.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : risk.score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400', bg: 'bg-brand-50 dark:bg-brand-600/15' },
    { label: 'Ativos', value: assets.length, icon: <Server className="w-4 h-4" />, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/15' },
    { label: 'Checklist LGPD', value: `${lgpdPct}%`, icon: <ShieldCheck className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/15' },
    { label: 'Incidentes Urgentes', value: highRiskAlerts, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/15' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Indicator strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {indicators.map((ind, i) => (
          <div key={ind.label} className="glass-card rounded-xl p-4 stagger-item" style={{ '--stagger': i } as React.CSSProperties}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', ind.bg)}>
                <span className={ind.color}>{ind.icon}</span>
              </div>
              <span className="text-xs text-ink-500 dark:text-slate-400 font-medium">{ind.label}</span>
            </div>
            <p className={cn('text-2xl font-display font-bold tabular-nums', ind.color)}>{ind.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Chart */}
        <div className="glass-card rounded-2xl p-5 lg:col-span-3">
          <h2 className="text-sm font-display font-bold text-ink-900 dark:text-white mb-3">Evolução da Conformidade</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3366ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3366ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="date" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', color: tooltipText, fontSize: '12px' }}
                labelStyle={{ color: axisColor, fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="score" stroke="#3366ff" strokeWidth={2.5} fill="url(#scoreGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Deductions */}
        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-sm font-display font-bold text-ink-900 dark:text-white mb-3">Pontos Deduzidos</h2>
          <div className="space-y-3">
            {[
              { label: 'Alta severidade em aberto', val: risk.deductions.highVulns, color: 'from-red-500 to-red-600', text: 'text-red-600 dark:text-red-400' },
              { label: 'Média severidade em aberto', val: risk.deductions.mediumVulns, color: 'from-amber-500 to-amber-600', text: 'text-amber-600 dark:text-amber-400' },
              { label: 'Credenciais vencidas', val: risk.deductions.expiredCreds, color: 'from-red-500 to-rose-600', text: 'text-red-600 dark:text-red-400' },
              { label: 'Itens LGPD não conformes', val: risk.deductions.unresolvedLgpd, color: 'from-amber-500 to-orange-600', text: 'text-amber-600 dark:text-amber-400' },
            ].map((d) => (
              <div key={d.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-ink-500 dark:text-slate-400">{d.label}</span>
                  <span className={cn('font-semibold', d.text)}>-{d.val}%</span>
                </div>
                <div className="mini-bar-track">
                  <div className={cn('mini-bar-fill bg-gradient-to-r', d.color)} style={{ width: `${Math.min(d.val * 3, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority incidents */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-display font-bold text-ink-900 dark:text-white">Atenção Necessária</h2>
          <button onClick={() => onNavigate('audits')} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-medium hover:text-brand-500 transition-colors group">
            Ver todos <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
        {openActions.length === 0 ? (
          <div className="py-6 text-center text-ink-400 dark:text-slate-500 text-sm">
            <ShieldCheck className="w-7 h-7 mx-auto mb-2 opacity-30" />
            Nenhum problema pendente.
          </div>
        ) : (
          <div className="space-y-2">
            {openActions.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl glass-panel hover:shadow-soft transition-all duration-200">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  item.severity === 'High' ? 'bg-red-50 dark:bg-red-500/15' :
                  item.severity === 'Medium' ? 'bg-amber-50 dark:bg-amber-500/15' :
                  'bg-emerald-50 dark:bg-emerald-500/15'
                )}>
                  <AlertTriangle className={cn(
                    'w-4 h-4',
                    item.severity === 'High' ? 'text-red-600 dark:text-red-400' :
                    item.severity === 'Medium' ? 'text-amber-600 dark:text-amber-400' :
                    'text-emerald-600 dark:text-emerald-400'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 dark:text-slate-200 truncate">{item.title}</p>
                  <p className="text-xs text-ink-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {relativeTime(item.incident_date)}
                    {item.assigned_to && <span> · {item.assigned_to}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={SEVERITY_COLORS[item.severity]}>{item.severity}</Badge>
                  <Badge className={AUDIT_STATUS_COLORS[item.status]}>{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
