import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  subtext?: string;
  delay?: number;
}

export default function StatCard({ label, value, icon, iconBg, iconColor, subtext, delay = 0 }: StatCardProps) {
  return (
    <div
      className="glass-card rounded-2xl p-5 card-lift stagger-item"
      style={{ '--stagger': delay } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110', iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <p className="text-3xl font-display font-bold text-ink-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs text-ink-500 dark:text-slate-400 mt-1">{label}</p>
      {subtext && <p className="text-[11px] text-ink-400 dark:text-slate-500 mt-0.5">{subtext}</p>}
    </div>
  );
}
