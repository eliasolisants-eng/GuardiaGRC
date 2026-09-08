import { ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  Server,
  ShieldCheck,
  KeyRound,
  FileSearch,
  Shield,
  Bell,
  Download,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';
import ThemeToggle from '@/components/ThemeToggle';

export type View = 'dashboard' | 'assets' | 'lgpd' | 'credentials' | 'audits';

interface LayoutProps {
  current: View;
  onNavigate: (view: View) => void;
  children: ReactNode;
  alertCount: number;
  onExport: () => void;
}

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'assets', label: 'Ativos de TI', icon: Server },
  { id: 'lgpd', label: 'Checklist LGPD', icon: ShieldCheck },
  { id: 'credentials', label: 'Acessos & Vencimentos', icon: KeyRound },
  { id: 'audits', label: 'Auditoria & Ações', icon: FileSearch },
];

function NavButton({ item, active, onClick }: { item: { id: View; label: string; icon: typeof LayoutDashboard }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-spring active:scale-[0.98]',
        active
          ? 'glass-panel text-brand-700 dark:text-brand-300 shadow-soft'
          : 'text-ink-500 dark:text-slate-400 hover:glass-panel hover:text-ink-800 dark:hover:text-slate-200'
      )}
    >
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-brand-600 dark:bg-brand-400 transition-all duration-300 ease-spring" />}
      <Icon className={cn('w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110', active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400 dark:text-slate-500 group-hover:text-ink-600 dark:group-hover:text-slate-300')} />
      {item.label}
    </button>
  );
}

function LiquidBackground() {
  return (
    <div className="liquid-bg">
      <div className="liquid-blob animate-blob-1" style={{ width: '420px', height: '420px', top: '-10%', left: '60%', background: 'radial-gradient(circle, #3366ff, transparent 70%)' }} />
      <div className="liquid-blob animate-blob-2" style={{ width: '350px', height: '350px', bottom: '-5%', left: '10%', background: 'radial-gradient(circle, #22c55e, transparent 70%)' }} />
      <div className="liquid-blob animate-blob-3" style={{ width: '300px', height: '300px', top: '40%', left: '45%', background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
    </div>
  );
}

export default function Layout({ current, onNavigate, children, alertCount, onExport }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className={cn('flex h-screen overflow-hidden relative', theme === 'dark' ? 'bg-surface-0' : 'bg-ink-50')}>
      <LiquidBackground />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass-sidebar z-10">
        <div className="px-6 py-5 border-b border-white/20 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft shadow-brand-600/30">
              <Shield className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
            </div>
            <div>
              <h1 className="text-sm font-display font-bold text-ink-900 dark:text-white tracking-tight">GuardiaGRC</h1>
              <p className="text-[10px] text-ink-400 dark:text-slate-500 font-medium">Conformidade LGPD</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavButton key={item.id} item={item} active={current === item.id} onClick={() => onNavigate(item.id)} />
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/20 dark:border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400 dark:text-slate-500">v1.0 — Enterprise</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 backdrop-soft" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full glass-sidebar border-r border-white/20 dark:border-white/5 flex flex-col animate-slide-in-right">
            <div className="px-6 py-5 border-b border-white/20 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                </div>
                <h1 className="text-sm font-display font-bold text-ink-900 dark:text-white">GuardiaGRC</h1>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-ink-100/50 dark:hover:bg-surface-2/50 transition-colors">
                <X className="w-4 h-4 text-ink-500 dark:text-slate-400" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <NavButton key={item.id} item={item} active={current === item.id} onClick={() => { onNavigate(item.id); setMobileOpen(false); }} />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top bar */}
        <header className="glass-topbar px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-ink-100/50 dark:hover:bg-surface-2/50 transition-colors">
              <Menu className="w-5 h-5 text-ink-600 dark:text-slate-300" />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="hidden md:block text-sm font-display font-bold text-ink-900 dark:text-white">
              {navItems.find((n) => n.id === current)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button className="relative p-2 rounded-lg text-ink-500 dark:text-slate-400 hover:bg-ink-100/50 dark:hover:bg-surface-2/50 transition-all duration-200 active:scale-90">
                <Bell className="w-[18px] h-[18px]" />
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-scale-in">
                    {alertCount}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-brand-600 text-white hover:bg-brand-500 transition-all duration-200 active:scale-95 shadow-soft shadow-brand-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Relatório</span>
            </button>
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto noise-overlay">
          <div key={current} className="view-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
