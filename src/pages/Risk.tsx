import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Badge, SectionTitle } from '../components/ui'
import { Gauge, Sparkles, RefreshCw } from 'lucide-react'
import { cn, formatCurrency } from '../lib/utils'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

export function Risk() {
  const [companies, setCompanies] = useState<any[]>([])
  const [investors, setInvestors] = useState<any[]>([])
  const [insurers, setInsurers] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [wallet, setWallet] = useState<any[]>([])
  const [assessments, setAssessments] = useState<any[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data: c } = await supabase.from('companies').select('*')
    if (c) setCompanies(c)
    const { data: i } = await supabase.from('investors').select('*')
    if (i) setInvestors(i)
    const { data: ins } = await supabase.from('insurers').select('*')
    if (ins) setInsurers(ins)
    const { data: ct } = await supabase.from('contracts').select('*')
    if (ct) setContracts(ct)
    const { data: w } = await supabase.from('wallet_transactions').select('*')
    if (w) setWallet(w)
    const { data: a } = await supabase.from('risk_assessments').select('*').order('created_at', { ascending: false }).limit(5)
    if (a) setAssessments(a)
  }

  const ownCapital = companies.reduce((s, c) => s + (c.financial_capacity || 0) + (c.credit_lines || 0), 0)
  const investorCapital = investors.reduce((s, i) => s + (i.available_capital || 0), 0)
  const insuredCapital = insurers.reduce((s, i) => s + (i.available_capital || 0), 0)
  const liquidity = wallet.reduce((s, t) => s + t.amount, 0)
  const committed = contracts.filter((c) => ['won','applied','review'].includes(c.status)).reduce((s, c) => s + (c.total_value || 0), 0)

  const available = ownCapital + investorCapital + insuredCapital + liquidity
  const maxBid = Math.round(available * 0.85)
  const recommended = Math.round(available * 0.6)
  const utilization = available > 0 ? Math.min(100, Math.round((committed / available) * 100)) : 0
  const riskLevel = utilization < 40 ? 'Bajo' : utilization < 70 ? 'Medio' : 'Alto'
  const riskTone = riskLevel === 'Bajo' ? 'success' : riskLevel === 'Medio' ? 'warning' : 'error'

  const recommendations = [
    utilization < 40 ? 'Tu capacidad está holgada. Puedes asumir más licitaciones.' : utilization < 70 ? 'Estás en zona media. Evalúa cada nueva licitación con cuidado.' : 'Alta exposición. Reduce nuevas propuestas hasta liberar capital comprometido.',
    investorCapital > 0 ? `Tienes ${formatCurrency(investorCapital)} de capital de inversionistas disponible.` : 'Considera incorporar inversionistas para ampliar capacidad.',
    insuredCapital > 0 ? `Aseguradoras respaldan ${formatCurrency(insuredCapital)} en capital.` : 'Añadir aseguradoras puede reducir tu riesgo de incumplimiento.',
    `Capital propio + líneas: ${formatCurrency(ownCapital)}. Mantén reservas de liquidez para entregas.`,
  ]

  async function saveAssessment() {
    await supabase.from('risk_assessments').insert({
      max_bid_capacity: maxBid, recommended_capacity: recommended,
      available_capital: available, committed_capital: committed,
      risk_level: riskLevel,
      recommendation: recommendations.join(' | '),
    })
    load()
  }

  const gaugeData = [{ name: 'Uso', value: utilization, fill: riskLevel === 'Bajo' ? '#16a34a' : riskLevel === 'Medio' ? '#eab308' : '#dc2626' }]
  const sources = [
    { name: 'Propio', value: ownCapital },
    { name: 'Inversionistas', value: investorCapital },
    { name: 'Asegurado', value: insuredCapital },
    { name: 'Liquidez', value: Math.max(0, liquidity) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="gold" onClick={saveAssessment}><RefreshCw size={15} /> Guardar evaluación</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1">
          <SectionTitle title="Semáforo de Riesgo" />
          <div className="flex flex-col items-center">
            <div className="relative w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={gaugeData} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={20} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={cn('w-4 h-4 rounded-full mb-1', riskLevel === 'Bajo' ? 'bg-teal-400' : riskLevel === 'Medio' ? 'bg-amber-400' : 'bg-rose-400')} />
                <div className="font-display text-2xl font-bold text-violet-100">{riskLevel}</div>
                <div className="text-xs text-violet-300/70">{utilization}% usado</div>
              </div>
            </div>
            <Badge tone={riskTone as any}>{riskLevel === 'Bajo' ? '🟢 Bajo' : riskLevel === 'Medio' ? '🟡 Medio' : '🔴 Alto'}</Badge>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <SectionTitle title="Capacidad de Licitación" subtitle="Calculada por el motor de riesgo" />
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-violet-500/10">
              <div className="text-xs text-violet-300/70">Capacidad máxima</div>
              <div className="font-display text-2xl font-bold text-violet-100">{formatCurrency(maxBid)}</div>
            </div>
            <div className="p-4 rounded-xl bg-fuchsia-500/10">
              <div className="text-xs text-violet-300/70">Recomendada</div>
              <div className="font-display text-2xl font-bold text-violet-100">{formatCurrency(recommended)}</div>
            </div>
            <div className="p-4 rounded-xl border border-violet-400/15">
              <div className="text-xs text-violet-300/70">Capital disponible</div>
              <div className="font-display text-xl font-bold text-violet-100">{formatCurrency(available)}</div>
            </div>
            <div className="p-4 rounded-xl border border-violet-400/15">
              <div className="text-xs text-violet-300/70">Capital comprometido</div>
              <div className="font-display text-xl font-bold text-violet-100">{formatCurrency(committed)}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <SectionTitle title="Fuentes de Capital" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sources} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#a78bda" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#a78bda" width={90} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid rgba(168,85,247,0.3)', background: '#1a0b2e', color: '#f5f3ff' }} />
              <Bar dataKey="value" fill="#a855f7" radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-fuchsia-400" />
            <h3 className="font-semibold text-violet-100">Recomendaciones de IA</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <div key={i} className="flex gap-3 text-sm text-violet-200">
                <span className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-xs font-semibold text-fuchsia-400 shrink-0 neon-border">{i+1}</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {assessments.length > 0 && (
        <Card className="p-6">
          <SectionTitle title="Historial de Evaluaciones" />
          <div className="space-y-2">
            {assessments.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-violet-400/15 text-sm">
                <span className="text-violet-200">{formatCurrency(a.recommended_capacity)} recomendado</span>
                <Badge tone={a.risk_level === 'Bajo' ? 'success' : a.risk_level === 'Medio' ? 'warning' : 'error'}>{a.risk_level}</Badge>
                <span className="text-violet-300/70">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
