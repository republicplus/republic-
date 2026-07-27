import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, useState } from 'react'
import { cn } from '../lib/utils'
import { X, Info } from 'lucide-react'

export function Card({ children, className, hover }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={cn('rounded-2xl bg-violet-950/40 border border-violet-400/15 backdrop-blur-sm', hover && 'hover:border-fuchsia-400/30 hover:bg-violet-500/5 transition', className)}>{children}</div>
}

export function Button({ children, variant = 'primary', size, className, ...props }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'gold' | 'danger'; size?: 'sm' | 'md' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<string, string> = {
    primary: 'bg-violet-900 hover:bg-violet-800 text-white border border-violet-500/40',
    secondary: 'bg-violet-950/50 hover:bg-violet-900/50 text-violet-200 border border-violet-400/20',
    gold: 'bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white',
    danger: 'bg-rose-950/50 hover:bg-rose-900/50 text-rose-200 border border-rose-400/20',
  }
  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
  }
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size || 'md'], className)} {...props}>{children}</button>
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button type="button" onClick={() => onChange(!checked)} className={cn('relative w-10 h-6 rounded-full transition', checked ? 'bg-fuchsia-500' : 'bg-violet-950 border border-violet-400/30')}>
        <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform', checked && 'translate-x-4')} />
      </button>
      {label && <span className="text-sm text-violet-200">{label}</span>}
    </label>
  )
}

export function Input({ label, className, ...props }: { label?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-violet-300/70 mb-1.5">{label}</span>}
      <input className={cn('w-full px-3.5 py-2.5 rounded-xl border border-violet-400/20 bg-violet-950/40 text-sm text-violet-50 placeholder:text-violet-400/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400/50 transition', className)} {...props} />
    </label>
  )
}

export function Textarea({ label, className, ...props }: { label?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-violet-300/70 mb-1.5">{label}</span>}
      <textarea className={cn('w-full px-3.5 py-2.5 rounded-xl border border-violet-400/20 bg-violet-950/40 text-sm text-violet-50 placeholder:text-violet-400/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400/50 transition resize-y min-h-[80px]', className)} {...props} />
    </label>
  )
}

export function Select({ label, className, children, ...props }: { label?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-violet-300/70 mb-1.5">{label}</span>}
      <select className={cn('w-full px-3.5 py-2.5 rounded-xl border border-violet-400/20 bg-violet-950/40 text-sm text-violet-50 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400/50 transition', className)} {...props}>{children}</select>
    </label>
  )
}

const TONES: Record<string, string> = {
  gold: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-400/20',
  success: 'bg-teal-500/10 text-teal-300 border-teal-400/20',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-400/20',
  error: 'bg-rose-500/10 text-rose-300 border-rose-400/20',
  info: 'bg-sky-500/10 text-sky-300 border-sky-400/20',
  neutral: 'bg-violet-500/10 text-violet-300 border-violet-400/20',
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: string; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border', TONES[tone] || TONES.neutral, className)}>{children}</span>
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={cn('w-full rounded-2xl bg-[#1a0b2e] border border-violet-400/20 shadow-2xl max-h-[90vh] overflow-y-auto', wide ? 'max-w-2xl' : 'max-w-md')} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-violet-400/15 sticky top-0 bg-[#1a0b2e] z-10">
          <h2 className="font-semibold text-violet-100">{title}</h2>
          <button onClick={onClose} className="text-violet-300 hover:text-fuchsia-400 transition"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle, action }: { icon: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-fuchsia-400 mb-4 neon-border">{icon}</div>
      <h3 className="font-semibold text-violet-100">{title}</h3>
      {subtitle && <p className="text-sm text-violet-300/70 mt-1 max-w-sm">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-display font-semibold text-violet-100">{title}</h3>
      {subtitle && <p className="text-xs text-violet-300/70 mt-0.5">{subtitle}</p>}
    </div>
  )
}

export function InfoNote({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div className="relative rounded-2xl border border-sky-400/20 bg-sky-950/30 p-4 pr-10">
      <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-sky-300/60 hover:text-sky-200 transition"><X size={15} /></button>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0 text-sky-300">
          <Info size={16} />
        </div>
        <div>
          <h3 className="font-semibold text-sky-100 text-sm">{title}</h3>
          <div className="text-xs text-sky-200/70 mt-1 leading-relaxed space-y-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
