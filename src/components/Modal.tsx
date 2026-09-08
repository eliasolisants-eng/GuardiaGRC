import { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open && !visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className={cn('absolute inset-0 backdrop-soft transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        className={cn(
          'relative glass-modal w-full max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl',
          'transition-all duration-350 ease-spring',
          open ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95',
          maxWidth
        )}
        onAnimationEnd={() => { if (!open) setVisible(false); }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/30 dark:border-white/5 sticky top-0 z-10 rounded-t-3xl sm:rounded-t-2xl" style={{ background: 'inherit' }}>
          <h2 className="text-lg font-display font-bold text-ink-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-ink-400 dark:text-slate-400 hover:text-ink-700 dark:hover:text-white hover:bg-ink-100/50 dark:hover:bg-surface-2/50 transition-all duration-200 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
