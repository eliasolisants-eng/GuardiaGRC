import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 shadow-soft shadow-brand-600/20 hover:shadow-soft-md',
  secondary: 'bg-white dark:bg-surface-2 text-ink-700 dark:text-slate-200 border border-ink-200 dark:border-slate-700 hover:bg-ink-50 dark:hover:bg-surface-3',
  ghost: 'text-ink-600 dark:text-slate-300 hover:bg-ink-100 dark:hover:bg-surface-2',
  danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 shadow-soft shadow-red-600/20',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({ variant = 'primary', size = 'md', loading = false, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-smooth',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.97]',
        variantStyles[variant], sizeStyles[size], className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
