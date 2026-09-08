import { cn } from '@/lib/utils';

interface BadgeProps {
  children: string;
  className?: string;
}

export default function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('status-badge transition-colors duration-200', className)}>
      {children}
    </span>
  );
}
