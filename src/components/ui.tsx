import { cn } from '../lib/utils'
import type { ReactNode } from 'react'

export function Card({ className, children, hover }: { className?: string; children: ReactNode; hover?: boolean }) {
  return <div className={cn('card', hover && 'card-hover', className)}>{children}</div>
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="text-xl font-bold text-navy-900">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'gold' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-navy-50 text-navy-700 border-navy-100',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    gold: 'bg-gold-50 text-gold-800 border-gold-200',
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
    primary: 'bg-navy-900 text-white hover:bg-navy-800 border-navy-900',
    secondary: 'bg-white text-navy-800 hover:bg-navy-50 border-navy-200',
    ghost: 'bg-transparent text-navy-700 hover:bg-navy-50 border-transparent',
    gold: 'bg-gold-400 text-navy-900 hover:bg-gold-300 border-gold-400 font-semibold',
    danger: 'bg-white text-error-600 hover:bg-red-50 border-red-200',
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
      {label && <span className="block text-xs font-medium text-muted mb-1.5">{label}</span>}
      <input
        {...props}
        className={cn('w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/40 focus:border-navy-300 transition', props.className)}
      />
    </label>
  )
}

export function Textarea({ label, ...props }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-muted mb-1.5">{label}</span>}
      <textarea
        {...props}
        className={cn('w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300/40 focus:border-navy-300 transition resize-y min-h-20', props.className)}
      />
    </label>
  )
}

export function Select({ label, children, ...props }: { label?: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-muted mb-1.5">{label}</span>}
      <select
        {...props}
        className={cn('w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-300/40 focus:border-navy-300 transition', props.className)}
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
      <span className={cn('relative w-9 h-5 rounded-full transition-colors', checked ? 'bg-gold-400' : 'bg-navy-200')}>
        <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
      </span>
      {label && <span className="text-sm text-navy-700">{label}</span>}
    </button>
  )
}

export function EmptyState({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && <div className="w-12 h-12 rounded-2xl bg-navy-50 flex items-center justify-center text-navy-400 mb-4">{icon}</div>}
      <h3 className="text-base font-semibold text-navy-900">{title}</h3>
      {subtitle && <p className="text-sm text-muted mt-1 max-w-sm">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative card w-full max-h-[90vh] overflow-y-auto no-scrollbar', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="sticky top-0 glass flex items-center justify-between px-6 py-4 border-b border-line">
          <h3 className="font-semibold text-navy-900">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-navy-900 transition text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
