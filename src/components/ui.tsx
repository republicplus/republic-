import { cn } from '../lib/utils'
import type { ReactNode } from 'react'

export function Card({ className, children, hover }: { className?: string; children: ReactNode; hover?: boolean }) {
  return <div className={cn('card', hover && 'card-hover', className)}>{children}</div>
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="text-xl font-bold text-violet-100">{title}</h2>
        {subtitle && <p className="text-sm text-violet-300/70 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'gold' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-violet-500/10 text-violet-200 border-violet-400/30',
    success: 'bg-teal-500/10 text-teal-300 border-teal-400/30',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-400/30',
    error: 'bg-rose-500/10 text-rose-300 border-rose-400/30',
    info: 'bg-sky-500/10 text-sky-300 border-sky-400/30',
    gold: 'bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-400/30',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border', tones[tone])}>
      {children}
    </span>
  )
}

export function Button({
  children, onClick, variant = 'primary', size = 'md', className, type = 'button', disabled,
}: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger';
  size?: 'sm' | 'md' | 'lg'; className?: string; type?: 'button' | 'submit'; disabled?: boolean;
}) {
  const variants: Record<string, string> = {
    primary: 'bg-violet-600 text-white hover:bg-violet-500 border-violet-500',
    secondary: 'bg-white/5 text-violet-100 hover:bg-white/10 border-violet-400/30',
    ghost: 'bg-transparent text-violet-200 hover:bg-white/5 border-transparent',
    gold: 'bg-fuchsia-500 text-white hover:bg-fuchsia-400 border-fuchsia-400 font-semibold shadow-[0_0_14px_rgba(217,70,239,0.4)]',
    danger: 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-400/30',
  }
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={cn('inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  )
}

export function Input({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-violet-300/80 mb-1.5">{label}</span>}
      <input
        {...props}
        className={cn('w-full px-3.5 py-2.5 rounded-xl border border-violet-400/20 bg-violet-950/40 text-sm text-violet-50 placeholder:text-violet-400/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400/50 transition', props.className)}
      />
    </label>
  )
}

export function Textarea({ label, ...props }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-violet-300/80 mb-1.5">{label}</span>}
      <textarea
        {...props}
        className={cn('w-full px-3.5 py-2.5 rounded-xl border border-violet-400/20 bg-violet-950/40 text-sm text-violet-50 placeholder:text-violet-400/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400/50 transition resize-y min-h-20', props.className)}
      />
    </label>
  )
}

export function Select({ label, children, ...props }: { label?: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-violet-300/80 mb-1.5">{label}</span>}
      <select
        {...props}
        className={cn('w-full px-3.5 py-2.5 rounded-xl border border-violet-400/20 bg-violet-950/40 text-sm text-violet-50 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400/50 transition', props.className)}
      >
        {children}
      </select>
    </label>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
    >
      <span className={cn('relative w-9 h-5 rounded-full transition-colors', checked ? 'bg-fuchsia-500' : 'bg-violet-900')}>
        <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
      </span>
      {label && <span className="text-sm text-violet-200">{label}</span>}
    </button>
  )
}

export function EmptyState({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400 mb-4 neon-border">{icon}</div>}
      <h3 className="text-base font-semibold text-violet-100">{title}</h3>
      {subtitle && <p className="text-sm text-violet-300/70 mt-1 max-w-sm">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-violet-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative card w-full max-h-[90vh] overflow-y-auto no-scrollbar', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="sticky top-0 glass flex items-center justify-between px-6 py-4 border-b border-violet-400/20">
          <h3 className="font-semibold text-violet-100">{title}</h3>
          <button onClick={onClose} className="text-violet-300 hover:text-fuchsia-400 transition text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
