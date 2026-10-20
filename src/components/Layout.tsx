import { ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  Server,
  ShieldCheck,
  KeyRound,
  FileSearch,
  Bell,
  Download,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

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

export default function Layout({ current, onNavigate, children, alertCount, onExport }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const NavButton = ({ item, active, onClick }: { item: typeof navItems[0]; active: boolean; onClick: () => void }) => {
    const Icon = item.icon;
    return (
      <button
        onClick={onClick}
        className={cn(
          'group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left',
          active
            ? 'glass-panel text-brand-700 dark:text-brand-300 shadow-soft'
            : 'text-ink-500 dark:text-slate-400 hover:glass-panel hover:text-ink-800 dark:hover:text-slate-200'
        )}
      >
        {active && <span className="absolute left-0 w-1 h-5 rounded-r-full bg-brand-600 dark:bg-brand-400" />}
        <Icon className={cn('w-[18px] h-[18px] shrink-0 transition-colors', active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400 dark:text-slate-500')} />
        <span>{item.label}</span>
      </button>
    );
  };

  const ThemeBtn = (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-ink-500 hover:text-ink-800 dark:text-slate-400 dark:hover:text-white hover:glass-panel transition-all duration-200 active:scale-90"
      aria-label="Alternar tema"
    >
      {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );

  return (
    <div className={cn('flex h-screen overflow-hidden relative', theme === 'dark' ? 'bg-surface-0' : 'bg-ink-50')}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col glass-sidebar z-10">
        <div className="px-5 py-4 border-b border-white/20 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-soft"
            />
            <div>
              <h1 className="text-sm font-display font-bold tracking-tight text-ink-900 dark:text-white">Apex Governance</h1>
              <p className="text-[10px] text-ink-400 dark:text-slate-500 font-medium">Conformidade LGPD</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavButton key={item.id} item={item} active={current === item.id} onClick={() => onNavigate(item.id)} />
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-white/20 dark:border-white/5 flex items-center justify-between">
          <span className="text-xs text-ink-400 dark:text-slate-500">v1.0</span>
          {ThemeBtn}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 backdrop-soft" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 h-full glass-sidebar flex flex-col animate-slide-in-right">
            <div className="px-5 py-4 border-b border-white/20 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-9 h-9 rounded-xl object-cover"
                />
                <h1 className="text-sm font-display font-bold text-ink-900 dark:text-white">Apex Governance</h1>
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

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="glass-topbar px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-ink-100/50 dark:hover:bg-surface-2/50 transition-colors">
              <Menu className="w-5 h-5 text-ink-600 dark:text-slate-300" />
            </button>
            <h2 className="text-sm font-display font-bold text-ink-900 dark:text-white">
              {navItems.find((n) => n.id === current)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button className="relative p-2 rounded-lg text-ink-500 dark:text-slate-400 hover:glass-panel transition-all duration-200 active:scale-90">
              <Bell className="w-[18px] h-[18px]" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-brand-600 text-white hover:bg-brand-500 transition-all duration-200 active:scale-95 shadow-soft shadow-brand-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Relatório</span>
            </button>
            <div className="hidden md:block">{ThemeBtn}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div key={current} className="view-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}