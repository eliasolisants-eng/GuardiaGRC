import { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Server,
  AlertTriangle,
  Gauge,
  TrendingUp,
  TrendingDown,
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
import StatCard from '@/components/StatCard';
import RiskGauge from '@/components/RiskGauge';
import Badge from '@/components/Badge';
import Reveal from '@/components/Reveal';

interface DashboardProps {
  onNavigate: (view: 'assets' | 'lgpd' | 'credentials' | 'audits') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [assets, setAssets] = useState<GrcAsset[]>([]);
  const [lgpdItems, setLgpdItems] = useState<LgpdItem[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [riskHistory, setRiskHistory] = useState<RiskHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: a }, { data: l }, { data: c }, { data: au }, { data: rh }] = await Promise.all([
      supabase.from('grc_assets').select('*').order('name'),
      supabase.from('grc_lgpd_items').select('*').order('title'),
      supabase.from('grc_credentials').select('*').order('name'),
      supabase.from('grc_audit_logs').select('*').order('created_at', { ascending: false }),
      supabase.from('grc_risk_history').select('*').order('calculated_at', { ascending: true }),
    ]);
    if (a) setAssets(a as GrcAsset[]);
    if (l) setLgpdItems(l as LgpdItem[]);
    if (c) setCredentials(c as Credential[]);
    if (au) setAuditLogs(au as AuditLog[]);
    if (rh) setRiskHistory(rh as RiskHistoryPoint[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const risk = calculateRiskScore(assets, lgpdItems, credentials, auditLogs);
  const alertCount = getAlertCount(credentials, auditLogs, lgpdItems);
  const lgpdCompliant = lgpdItems.filter((l) => l.status === 'Compliant').length;
  const lgpdPct = lgpdItems.length > 0 ? Math.round((lgpdCompliant / lgpdItems.length) * 100) : 0;
  const highRiskAlerts = auditLogs.filter((a) => a.severity === 'High' && a.status !== 'Resolved').length;
  const openActions = auditLogs.filter((a) => a.status !== 'Resolved').slice(0, 5);

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

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
        <div className="h-80 skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <Reveal>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-ink-900 dark:text-white tracking-tight">Visão Geral</h1>
          <p className="text-sm text-ink-500 dark:text-slate-400 mt-1">Score de risco de conformidade, status dos ativos de TI e itens de ação urgentes</p>
        </div>
      </Reveal>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Reveal delay={0}>
          <div className="glass-card rounded-2xl p-5 card-lift stagger-item" style={{ '--stagger': 0 } as React.CSSProperties}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-600/15 flex items-center justify-center">
                <Gauge className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <p className="text-3xl font-display font-bold tabular-nums" style={{ color: risk.score >= 80 ? '#22c55e' : risk.score >= 50 ? '#f59e0b' : '#ef4444' }}>
              {risk.score}%
            </p>
            <p className="text-xs text-ink-500 dark:text-slate-400 mt-1">Score de Risco de Conformidade</p>
            <p className="text-[11px] text-ink-400 dark:text-slate-500 mt-0.5">{risk.score >= 80 ? 'Baixo Risco' : risk.score >= 50 ? 'Risco Médio' : 'Risco Crítico'}</p>
          </div>
        </Reveal>

        <StatCard label="Total de Ativos de TI" value={assets.length} icon={<Server className="w-5 h-5" />} iconBg="bg-sky-50 dark:bg-sky-500/15" iconColor="text-sky-600 dark:text-sky-400" subtext={`${assets.filter(a => a.status === 'Compliant').length} em conformidade`} delay={1} />
        <StatCard label="Conformidade LGPD" value={`${lgpdPct}%`} icon={<ShieldCheck className="w-5 h-5" />} iconBg="bg-accent-50 dark:bg-emerald-500/15" iconColor="text-emerald-600 dark:text-emerald-400" subtext={`${lgpdCompliant}/${lgpdItems.length} itens em conformidade`} delay={2} />
        <StatCard label="Alertas de Risco Alto Ativos" value={highRiskAlerts} icon={<AlertTriangle className="w-5 h-5" />} iconBg="bg-red-50 dark:bg-red-500/15" iconColor="text-red-600 dark:text-red-400" subtext={`${alertCount} alertas no total`} delay={3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Risk Score Gauge + Breakdown */}
        <Reveal delay={200}>
          <div className="glass-card rounded-2xl p-6 h-full">
            <h2 className="text-base font-display font-bold text-ink-900 dark:text-white mb-4">Score de Risco</h2>
            <div className="flex justify-center mb-5">
              <RiskGauge score={risk.score} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-500 dark:text-slate-400">Alta severidade em aberto</span>
                <span className="font-semibold text-red-600 dark:text-red-400">-{risk.deductions.highVulns}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-500 dark:text-slate-400">Média severidade em aberto</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">-{risk.deductions.mediumVulns}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-500 dark:text-slate-400">Credenciais vencidas</span>
                <span className="font-semibold text-red-600 dark:text-red-400">-{risk.deductions.expiredCreds}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-500 dark:text-slate-400">Itens LGPD não conformes</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">-{risk.deductions.unresolvedLgpd}%</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Risk Score Trend Chart */}
        <Reveal delay={300} className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-bold text-ink-900 dark:text-white">Tendência do Score de Risco</h2>
              <div className="flex items-center gap-1 text-xs text-ink-400 dark:text-slate-500">
                {risk.score > (chartData[chartData.length - 2]?.score ?? risk.score) ? (
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                )}
                Últimos 14 dias
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
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
        </Reveal>
      </div>

      {/* Quick Action Items */}
      <Reveal delay={100}>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-display font-bold text-ink-900 dark:text-white">Itens de Ação Urgentes</h2>
            <button
              onClick={() => onNavigate('audits')}
              className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-medium hover:text-brand-500 transition-colors group"
            >
              Ver todos
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
          {openActions.length === 0 ? (
            <div className="py-8 text-center text-ink-400 dark:text-slate-500 text-sm">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhum item de ação pendente
            </div>
          ) : (
            <div className="space-y-2">
              {openActions.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl glass-panel hover:shadow-soft transition-all duration-300 stagger-item"
                  style={{ '--stagger': i } as React.CSSProperties}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
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
      </Reveal>
    </div>
  );
}
