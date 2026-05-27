import { useUiStore } from '@/store/uiStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useUiStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="rounded px-2 py-1 text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? '☀' : '☾'}
    </button>
  )
}
