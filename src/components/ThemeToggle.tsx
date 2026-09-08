import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="relative p-2 rounded-lg text-ink-500 hover:text-ink-800 dark:text-slate-400 dark:hover:text-white hover:glass-panel transition-all duration-300 active:scale-90"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );
}
