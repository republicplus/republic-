import { cn } from '../lib/utils'

export function AIOrb({ size = 160, active = false, className }: { size?: number; active?: boolean; className?: string }) {
  return (
    <div
      className={cn('relative rounded-full orb-glow animate-orb flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600/40 via-fuchsia-600/30 to-violet-950 animate-pulse-soft" />
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-violet-900 via-violet-950 to-black" />
      {/* rotating ring */}
      <div className="absolute inset-0 rounded-full border border-fuchsia-400/40 animate-spin-slow" style={{ borderTopColor: 'rgba(217,70,239,0.8)' }} />
      {/* core */}
      <div className={cn('relative rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-500 transition-all duration-500', active ? 'w-2/3 h-2/3 opacity-100 shadow-[0_0_20px_rgba(217,70,239,0.8)]' : 'w-1/2 h-1/2 opacity-90')}>
        <div className="absolute inset-0 rounded-full bg-white/30 blur-md animate-pulse-soft" />
      </div>
      {/* orbiting dot */}
      <div className="absolute inset-0 animate-spin-slow">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-fuchsia-300 shadow-[0_0_10px_2px_rgba(217,70,239,0.7)]" />
      </div>
    </div>
  )
}
