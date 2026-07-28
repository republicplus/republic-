import { useState } from 'react'
import { Card, Button, Badge, SectionTitle } from './ui'
import { formatCurrency, formatDate, cn } from '../lib/utils'
import { Sparkles, Loader as Loader2, Upload, Save, Send, FileText, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Circle as XCircle, CircleHelp as HelpCircle, ChevronRight, X, ShieldCheck, Truck, DollarSign, Scale, TrendingUp, OctagonAlert as AlertOctagon, Info } from 'lucide-react'

export type Flow = {
  id: string
  contract_name: string | null
  contract_type: string
  status: string
  input_text: string | null
  extracted_data: any
  suppliers_data: any
  cost_analysis: any
  compliance_data: any
  quote_data: any
  recommended_price: number | null
  estimated_cost: number | null
  estimated_profit: number | null
  margin: number | null
  compliance_level: string | null
  close_date: string | null
  created_at: string
  solicitation_number?: string | null
  agency?: string | null
  naics?: string | null
  due_date?: string | null
  award_date?: string | null
  delivery_date?: string | null
  total_value?: number | null
  executive_analysis?: any
  technical_requirements?: any
  supplier_review?: any
  financial_analysis?: any
  risk_decision?: any
}

const COMPLIANCE_TONE: Record<string, any> = { cumple: 'success', cumple_parcial: 'warning', no_cumple: 'error', revision: 'info' }
const COMPLIANCE_LABEL: Record<string, string> = { cumple: 'Compliant', cumple_parcial: 'Partially Compliant', no_cumple: 'Non-Compliant', revision: 'Manual Review' }

const TECH_STATUS_ICON: Record<string, any> = {
  Complete: CheckCircle2, Missing: XCircle, 'Needs Review': HelpCircle, 'Not Applicable': Info,
}
const TECH_STATUS_TONE: Record<string, string> = {
  Complete: 'success', Missing: 'error', 'Needs Review': 'warning', 'Not Applicable': 'neutral',
}

const RISK_TONE: Record<string, string> = { Low: 'success', Medium: 'warning', High: 'error' }

const FINAL_TONE: Record<string, string> = {
  'Recommended to Bid': 'success',
  'Recommended with Conditions': 'gold',
  'Needs More Information': 'warning',
  'Not Recommended': 'error',
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#fb7185'
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="5" />
          <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${(score / 100) * 176} 176`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-violet-50">{score}</div>
      </div>
      <span className="text-[10px] text-violet-300/70 mt-1">{label}</span>
    </div>
  )
}

function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl h-full bg-[#1a0b2e] border-l border-violet-400/20 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-violet-400/15 sticky top-0 bg-[#1a0b2e] z-10">
          <h2 className="font-semibold text-violet-100">{title}</h2>
          <button onClick={onClose} className="text-violet-300 hover:text-fuchsia-400 transition"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: any }) {
  if (value == null || value === '' || value === false) return null
  return (
    <div>
      <div className="text-[11px] text-violet-300/60 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-violet-100 mt-0.5">{typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}</div>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const Icon = TECH_STATUS_ICON[status] || HelpCircle
  const tone = TECH_STATUS_TONE[status] || 'neutral'
  return <Badge tone={tone}><Icon size={11} /> {status}</Badge>
}

export function ContractFlowPanel({
  flow,
  busy,
  onAnalyze,
  onUpload,
  onSave,
  onMoveToContracts,
  onReject,
  onSaveForLater,
}: {
  flow: Flow
  busy: boolean
  onAnalyze: () => void
  onUpload: () => void
  onSave: () => void
  onMoveToContracts: () => void
  onReject: () => void
  onSaveForLater: () => void
}) {
  const [drawer, setDrawer] = useState<string | null>(null)
  const [acknowledgedRisks, setAcknowledgedRisks] = useState(false)

  const e = flow.extracted_data || {}
  const exec = flow.executive_analysis || {}
  const tech = flow.technical_requirements || {}
  const supRev = flow.supplier_review || {}
  const fin = flow.financial_analysis || {}
  const risk = flow.risk_decision || {}
  const comp = flow.compliance_data || {}

  const hasExec = exec && Object.keys(exec).length > 0
  const hasTech = tech && Object.keys(tech).length > 0
  const hasSupRev = supRev && Object.keys(supRev).length > 0
  const hasFin = fin && Object.keys(fin).length > 0
  const hasRisk = risk && Object.keys(risk).length > 0

  const finResults = fin.results || {}
  const finCapital = fin.capital || {}

  const canMoveToContracts =
    (flow.due_date || e.due_date) &&
    (flow.estimated_cost != null || finResults.total_estimated_cost != null) &&
    (flow.margin != null || finResults.net_margin != null) &&
    (finCapital.total_available_capital != null || finCapital.capital_required != null) &&
    (supRev.selected_supplier || (flow.suppliers_data?.length > 0)) &&
    acknowledgedRisks

  return (
    <div className="space-y-5">
      {/* 1. Contract Overview */}
      <Card className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-violet-100">{flow.contract_name || e.contract_name || 'Nuevo análisis'}</h2>
            <p className="text-sm text-violet-300/70 mt-0.5">{flow.agency || e.agency || 'Agencia no identificada'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onUpload}><Upload size={14} /> Upload</Button>
            <Button variant="gold" size="sm" onClick={onAnalyze} disabled={busy}>
              {busy ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : <><Sparkles size={14} /> Analyze with AI</>}
            </Button>
            <Button variant="secondary" size="sm" onClick={onSave}><Save size={14} /> Save</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Field label="Solicitation #" value={flow.solicitation_number || e.solicitation_number} />
          <Field label="Contract Type" value={flow.contract_type || e.contract_type} />
          <Field label="Product / Service" value={e.product_name || e.service_type} />
          <Field label="NAICS" value={flow.naics || e.naics} />
          <Field label="Due Date" value={formatDate(flow.due_date || e.due_date)} />
          <Field label="Award Date" value={formatDate(flow.award_date || e.award_date)} />
          <Field label="Delivery Date" value={formatDate(flow.delivery_date || e.delivery_date)} />
          <Field label="Est. Contract Value" value={formatCurrency(flow.total_value || e.total_value)} />
          <Field label="Status" value={flow.status} />
        </div>
      </Card>

      {/* 2. AI Executive Analysis + 3. Technical Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* AI Executive Analysis */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-fuchsia-400" />
            <SectionTitle title="AI Executive Analysis" />
          </div>
          {hasExec ? (
            <div className="space-y-4">
              <div className="flex items-center justify-around">
                <ScoreRing score={exec.opportunity_score || 0} label="Opportunity" />
                <ScoreRing score={exec.win_probability || 0} label="Win Prob." />
                <ScoreRing score={risk.overall_risk_score || 0} label="Risk" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-violet-300/60">Eligibility:</span> <Badge tone={exec.eligibility === 'Eligible' ? 'success' : exec.eligibility === 'Review' ? 'warning' : 'error'}>{exec.eligibility || '—'}</Badge></div>
                <div><span className="text-violet-300/60">Risk Level:</span> <Badge tone={RISK_TONE[exec.risk_level] || 'neutral'}>{exec.risk_level || '—'}</Badge></div>
                <div><span className="text-violet-300/60">Difficulty:</span> <span className="text-violet-100">{exec.preparation_difficulty || '—'}</span></div>
                <div><span className="text-violet-300/60">Prep Time:</span> <span className="text-violet-100">{exec.estimated_preparation_time || '—'}</span></div>
              </div>
              {Array.isArray(exec.summary) && exec.summary.length > 0 && (
                <div className="space-y-1.5">
                  {exec.summary.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-violet-200/80">
                      <ChevronRight size={12} className="text-fuchsia-400 shrink-0 mt-0.5" /> {s}
                    </div>
                  ))}
                </div>
              )}
              <Button variant="secondary" size="sm" onClick={() => setDrawer('exec')}><FileText size={13} /> View Full AI Analysis</Button>
            </div>
          ) : (
            <p className="text-sm text-violet-400/50">Run AI analysis to see executive summary.</p>
          )}
        </Card>

        {/* Technical Requirements */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-teal-400" />
            <SectionTitle title="Technical Requirements" />
          </div>
          {hasTech ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Scope" value={tech.scope?.product_service} />
                <Field label="Quantity" value={tech.scope?.quantity ? `${tech.scope.quantity} ${tech.scope.unit || ''}` : null} />
                <Field label="Brand / Model" value={tech.scope?.brand_model_required} />
                <Field label="Equivalents" value={tech.scope?.equivalents_allowed ? 'Allowed' : 'Not Allowed'} />
                <Field label="Certifications" value={tech.scope?.required_certifications} />
                <Field label="Licenses" value={tech.scope?.required_licenses} />
              </div>
              {Array.isArray(tech.compliance) && tech.compliance.length > 0 && (
                <div className="space-y-1.5">
                  {tech.compliance.slice(0, 4).map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-violet-200">{c.criterion}</span>
                      <StatusChip status={c.status} />
                    </div>
                  ))}
                </div>
              )}
              <Button variant="secondary" size="sm" onClick={() => setDrawer('tech')}><FileText size={13} /> Open Technical Checklist</Button>
            </div>
          ) : (
            <p className="text-sm text-violet-400/50">Run AI analysis to see technical requirements.</p>
          )}
        </Card>
      </div>

      {/* 4. Supplier Review + Risk Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Supplier Review */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={18} className="text-sky-400" />
            <SectionTitle title="Supplier & Execution Review" />
          </div>
          {hasSupRev ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Selected Supplier" value={supRev.selected_supplier} />
                <Field label="Quote Amount" value={formatCurrency(supRev.quote_amount)} />
                <Field label="Availability" value={supRev.product_availability} />
                <Field label="Lead Time" value={supRev.lead_time} />
                <Field label="Shipping Method" value={supRev.shipping_method} />
                <Field label="Shipping Cost" value={formatCurrency(supRev.shipping_cost)} />
                <Field label="Delivery Address" value={supRev.delivery_address} />
                <Field label="Est. Delivery" value={formatDate(supRev.estimated_delivery_date)} />
                <Field label="Subcontractor" value={supRev.subcontractor_required} />
                <Field label="Labor Required" value={supRev.labor_required} />
                <Field label="Installation" value={supRev.installation_required} />
              </div>
              {Array.isArray(supRev.risks) && supRev.risks.length > 0 && (
                <div className="space-y-1">
                  {supRev.risks.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-300/80"><AlertTriangle size={11} className="shrink-0 mt-0.5" /> {r}</div>
                  ))}
                </div>
              )}
              <Button variant="secondary" size="sm" onClick={() => setDrawer('suppliers')}>Compare Suppliers</Button>
            </div>
          ) : Array.isArray(flow.suppliers_data) && flow.suppliers_data.length > 0 ? (
            <div className="space-y-2">
              {flow.suppliers_data.slice(0, 3).map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-violet-100">{s.name}</span>
                  <span className="text-violet-300/70">{formatCurrency(s.unit_price)}</span>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setDrawer('suppliers')}>Compare Suppliers</Button>
            </div>
          ) : (
            <p className="text-sm text-violet-400/50">Run AI analysis to see supplier review.</p>
          )}
        </Card>

        {/* Risk Summary */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon size={18} className="text-rose-400" />
            <SectionTitle title="Risk & Final Decision" />
          </div>
          {hasRisk ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                {(risk.risks || []).map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-violet-200">{r.category}</span>
                    <Badge tone={RISK_TONE[r.level] || 'neutral'}>{r.level}</Badge>
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="text-violet-300/60 text-xs">Overall Risk Score</div>
                <div className="text-2xl font-bold text-violet-50">{risk.overall_risk_score ?? '—'}/100</div>
              </div>
              {risk.final_recommendation && (
                <div className="text-center">
                  <Badge tone={FINAL_TONE[risk.final_recommendation] || 'neutral'} className="text-sm px-4 py-1.5">{risk.final_recommendation}</Badge>
                </div>
              )}
              <Button variant="secondary" size="sm" onClick={() => setDrawer('risk')}>View Full Risk Analysis</Button>
            </div>
          ) : (
            <p className="text-sm text-violet-400/50">Run AI analysis to see risk assessment.</p>
          )}
        </Card>
      </div>

      {/* 5. Financial Analysis */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={18} className="text-teal-400" />
          <SectionTitle title="Financial Analysis" />
        </div>
        {hasFin ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Field label="Contract Value" value={formatCurrency(fin.revenue?.estimated_contract_value)} />
              <Field label="Proposed Bid" value={formatCurrency(fin.revenue?.proposed_bid_amount)} />
              <Field label="Award Amount" value={formatCurrency(fin.revenue?.expected_award_amount)} />
              <Field label="Payment Terms" value={fin.revenue?.payment_terms} />
              <Field label="Est. Payment Date" value={formatDate(fin.revenue?.estimated_payment_date)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Direct Costs */}
              <div className="rounded-xl border border-violet-400/15 p-4">
                <h4 className="text-xs font-semibold text-violet-300/70 uppercase mb-2">Direct Costs</h4>
                <div className="space-y-1">
                  {(fin.direct_costs || []).map((c: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs"><span className="text-violet-200">{c.label}</span><span className="text-violet-100">{formatCurrency(c.amount)}</span></div>
                  ))}
                  <div className="flex justify-between text-xs font-medium pt-1 border-t border-violet-400/10"><span className="text-violet-200">Total Direct</span><span className="text-violet-50">{formatCurrency(finResults.total_direct_cost)}</span></div>
                </div>
              </div>
              {/* Indirect Costs */}
              <div className="rounded-xl border border-violet-400/15 p-4">
                <h4 className="text-xs font-semibold text-violet-300/70 uppercase mb-2">Indirect Costs</h4>
                <div className="space-y-1">
                  {(fin.indirect_costs || []).map((c: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs"><span className="text-violet-200">{c.label}</span><span className="text-violet-100">{formatCurrency(c.amount)}</span></div>
                  ))}
                  <div className="flex justify-between text-xs font-medium pt-1 border-t border-violet-400/10"><span className="text-violet-200">Total Indirect</span><span className="text-violet-50">{formatCurrency(finResults.total_indirect_cost)}</span></div>
                </div>
              </div>
              {/* Results */}
              <div className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-4">
                <h4 className="text-xs font-semibold text-fuchsia-300/70 uppercase mb-2">Financial Results</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-violet-200">Total Est. Cost</span><span className="text-violet-100">{formatCurrency(finResults.total_estimated_cost)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-violet-200">Gross Profit</span><span className="text-teal-300">{formatCurrency(finResults.gross_profit)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-violet-200">Net Profit</span><span className="text-teal-300">{formatCurrency(finResults.net_profit)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-violet-200">Gross Margin</span><span className="text-violet-100">{finResults.gross_margin != null ? `${finResults.gross_margin}%` : '—'}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-violet-200">Net Margin</span><span className="text-violet-100">{finResults.net_margin != null ? `${finResults.net_margin}%` : '—'}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-violet-200">ROI</span><span className="text-violet-100">{finResults.roi != null ? `${finResults.roi}%` : '—'}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-violet-200">Break-Even</span><span className="text-violet-100">{formatCurrency(finResults.break_even_amount)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-violet-200">Working Capital</span><span className="text-violet-100">{formatCurrency(finResults.required_working_capital)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-violet-200">Capital Gap</span><span className="text-rose-300">{formatCurrency(finResults.capital_gap)}</span></div>
                </div>
              </div>
            </div>

            {/* Capital Availability */}
            <div>
              <h4 className="text-xs font-semibold text-violet-300/70 uppercase mb-2">Capital Availability</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Field label="Company Capital" value={formatCurrency(finCapital.company_capital)} />
                <Field label="Credit Available" value={formatCurrency(finCapital.credit_available)} />
                <Field label="Investor Capital" value={formatCurrency(finCapital.investor_capital)} />
                <Field label="Capital Backer" value={finCapital.capital_backer} />
                <Field label="Supplier Net Terms" value={finCapital.supplier_net_terms} />
                <Field label="Total Available" value={formatCurrency(finCapital.total_available_capital)} />
                <Field label="Capital Required" value={formatCurrency(finCapital.capital_required)} />
                <Field label="Capital Remaining" value={formatCurrency(finCapital.capital_remaining)} />
              </div>
            </div>

            {/* Cash Flow Timeline */}
            {Array.isArray(fin.cash_flow) && fin.cash_flow.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-violet-300/70 uppercase mb-2">Cash-Flow Timeline</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-violet-400/15 text-left text-xs text-violet-300/70">
                      <th className="py-2 font-medium">Stage</th><th className="py-2 font-medium">Amount</th><th className="py-2 font-medium">Est. Date</th>
                    </tr></thead>
                    <tbody>
                      {fin.cash_flow.map((c: any, i: number) => (
                        <tr key={i} className="border-b border-violet-400/10">
                          <td className="py-2 text-violet-200">{c.stage}</td>
                          <td className="py-2 text-violet-100">{formatCurrency(c.amount)}</td>
                          <td className="py-2 text-violet-300/70">{formatDate(c.estimated_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Warnings */}
            {Array.isArray(fin.warnings) && fin.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 space-y-1">
                {fin.warnings.map((w: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-300/80"><AlertTriangle size={11} className="shrink-0 mt-0.5" /> {w}</div>
                ))}
              </div>
            )}

            <Button variant="secondary" size="sm" onClick={() => setDrawer('financial')}><TrendingUp size={13} /> View Financial Breakdown</Button>
          </div>
        ) : (flow.cost_analysis && Object.keys(flow.cost_analysis).length > 0) ? (
          <div className="space-y-2">
            {(flow.cost_analysis.items || []).map((i: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2 rounded-xl border border-violet-400/15 text-sm">
                <span className="text-violet-200">{i.label}</span><span className="text-violet-100">{formatCurrency(i.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-400/20 text-sm">
              <span className="text-rose-200 font-medium">Total Cost</span><span className="text-rose-100 font-bold">{formatCurrency(flow.cost_analysis.total_cost || flow.estimated_cost)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-violet-400/50">Run AI analysis to see financial breakdown.</p>
        )}
      </Card>

      {/* 6. Final Decision + Actions */}
      {hasRisk && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={18} className="text-fuchsia-400" />
            <SectionTitle title="Final Decision" />
          </div>
          <div className="space-y-4">
            {risk.main_risk && (
              <div className="text-sm"><span className="text-violet-300/60">Main Risk: </span><span className="text-rose-300">{risk.main_risk}</span></div>
            )}
            {risk.required_correction && (
              <div className="text-sm"><span className="text-violet-300/60">Required Correction: </span><span className="text-amber-300">{risk.required_correction}</span></div>
            )}
            {Array.isArray(risk.recommended_actions) && risk.recommended_actions.length > 0 && (
              <div className="space-y-1">
                {risk.recommended_actions.map((a: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-violet-200/80"><ChevronRight size={12} className="text-fuchsia-400 shrink-0 mt-0.5" /> {a}</div>
                ))}
              </div>
            )}

            {/* Risk acknowledgment */}
            <label className="flex items-center gap-2 cursor-pointer text-sm text-violet-200">
              <input type="checkbox" checked={acknowledgedRisks} onChange={(e) => setAcknowledgedRisks(e.target.checked)}
                className="w-4 h-4 rounded accent-fuchsia-500" />
              I acknowledge the risks identified in this analysis
            </label>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-violet-400/15">
              <Button variant="gold" onClick={onMoveToContracts} disabled={!canMoveToContracts}>
                <CheckCircle2 size={15} /> Move to Current Contracts
              </Button>
              <Button variant="secondary" onClick={onSaveForLater}><Save size={15} /> Save for Later</Button>
              <Button variant="danger" onClick={onReject}><XCircle size={15} /> Reject Opportunity</Button>
            </div>
            {!canMoveToContracts && acknowledgedRisks && (
              <p className="text-xs text-amber-300/70">Complete dates, costs, margin, capital review, and supplier selection before moving to contracts.</p>
            )}
          </div>
        </Card>
      )}

      {/* Drawers */}
      <Drawer open={drawer === 'exec'} onClose={() => setDrawer(null)} title="Full AI Analysis">
        <div className="space-y-3 text-sm">
          <Field label="Recommendation" value={exec.recommendation} />
          {Array.isArray(exec.summary) && exec.summary.map((s: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-violet-200/80 text-xs"><ChevronRight size={12} className="text-fuchsia-400 shrink-0 mt-0.5" /> {s}</div>
          ))}
        </div>
      </Drawer>

      <Drawer open={drawer === 'tech'} onClose={() => setDrawer(null)} title="Technical Checklist">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Scope Summary" value={tech.scope?.scope_summary} />
            <Field label="Technical Specs" value={tech.scope?.technical_specifications} />
            <Field label="Required Experience" value={tech.scope?.required_experience} />
            <Field label="Past Performance" value={tech.scope?.past_performance_required} />
          </div>
          <div className="space-y-2">
            {(tech.compliance || []).map((c: any, i: number) => (
              <div key={i} className="flex items-start justify-between gap-2 p-3 rounded-xl border border-violet-400/15">
                <div>
                  <div className="text-sm text-violet-100">{c.criterion}</div>
                  {c.explanation && <div className="text-xs text-violet-300/70 mt-0.5">{c.explanation}</div>}
                </div>
                <StatusChip status={c.status} />
              </div>
            ))}
          </div>
        </div>
      </Drawer>

      <Drawer open={drawer === 'suppliers'} onClose={() => setDrawer(null)} title="Supplier Comparison">
        <div className="space-y-3">
          {(flow.suppliers_data || []).map((s: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border border-violet-400/15">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-violet-100">{s.name || 'Proveedor'}</span>
                {s.recommendation && <Badge tone="gold">{s.recommendation}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Field label="Product" value={s.product} />
                <Field label="Unit Price" value={formatCurrency(s.unit_price)} />
                <Field label="Availability" value={s.availability} />
                <Field label="Delivery Time" value={s.delivery_time} />
                <Field label="Inventory" value={s.inventory} />
                <Field label="Shipping Cost" value={formatCurrency(s.shipping_cost)} />
              </div>
              {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="text-fuchsia-300 text-xs mt-2 inline-block">View product →</a>}
            </div>
          ))}
        </div>
      </Drawer>

      <Drawer open={drawer === 'financial'} onClose={() => setDrawer(null)} title="Financial Breakdown">
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="text-xs font-semibold text-violet-300/70 uppercase mb-2">Revenue</h4>
            <div className="grid grid-cols-2 gap-2"><Field label="Contract Value" value={formatCurrency(fin.revenue?.estimated_contract_value)} /><Field label="Proposed Bid" value={formatCurrency(fin.revenue?.proposed_bid_amount)} /><Field label="Award Amount" value={formatCurrency(fin.revenue?.expected_award_amount)} /><Field label="Payment Terms" value={fin.revenue?.payment_terms} /></div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-violet-300/70 uppercase mb-2">Direct Costs</h4>
            {(fin.direct_costs || []).map((c: any, i: number) => <div key={i} className="flex justify-between text-xs"><span className="text-violet-200">{c.label}</span><span className="text-violet-100">{formatCurrency(c.amount)}</span></div>)}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-violet-300/70 uppercase mb-2">Indirect Costs</h4>
            {(fin.indirect_costs || []).map((c: any, i: number) => <div key={i} className="flex justify-between text-xs"><span className="text-violet-200">{c.label}</span><span className="text-violet-100">{formatCurrency(c.amount)}</span></div>)}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-fuchsia-300/70 uppercase mb-2">Results</h4>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Total Cost" value={formatCurrency(finResults.total_estimated_cost)} />
              <Field label="Gross Profit" value={formatCurrency(finResults.gross_profit)} />
              <Field label="Net Profit" value={formatCurrency(finResults.net_profit)} />
              <Field label="ROI" value={finResults.roi != null ? `${finResults.roi}%` : null} />
              <Field label="Break-Even" value={formatCurrency(finResults.break_even_amount)} />
              <Field label="Capital Gap" value={formatCurrency(finResults.capital_gap)} />
            </div>
          </div>
        </div>
      </Drawer>

      <Drawer open={drawer === 'risk'} onClose={() => setDrawer(null)} title="Full Risk Analysis">
        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            {(risk.risks || []).map((r: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border border-violet-400/15">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-violet-100">{r.category}</span>
                  <Badge tone={RISK_TONE[r.level] || 'neutral'}>{r.level}</Badge>
                </div>
                {r.notes && <div className="text-xs text-violet-300/70">{r.notes}</div>}
              </div>
            ))}
          </div>
          <Field label="Main Risk" value={risk.main_risk} />
          <Field label="Required Correction" value={risk.required_correction} />
          <Field label="Final Recommendation" value={risk.final_recommendation} />
          {Array.isArray(risk.recommended_actions) && (
            <div className="space-y-1">{risk.recommended_actions.map((a: string, i: number) => <div key={i} className="flex items-start gap-2 text-xs text-violet-200/80"><ChevronRight size={12} className="text-fuchsia-400 shrink-0 mt-0.5" /> {a}</div>)}</div>
          )}
        </div>
      </Drawer>
    </div>
  )
}
