export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`w-full h-2 rounded-full bg-navy-100 overflow-hidden ${className || ''}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
