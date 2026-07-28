import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { AuthPage } from './pages/AuthPage'
import { LandingPage } from './pages/LandingPage'
import { Dashboard } from './pages/Dashboard'
import { Contracts } from './pages/Contracts'
import { Suppliers } from './pages/Suppliers'
import { Wallet } from './pages/Wallet'
import { Sidebar } from './components/Sidebar'
import { PrivateBidding } from './pages/PrivateBidding'
import { BidPages } from './pages/BidPages'
import { ContractFlow } from './pages/ContractFlow'
import { PoolOpportunities } from './pages/PoolOpportunities'
import { Company } from './pages/Company'
import { Investors } from './pages/Investors'
import { Insurers } from './pages/Insurers'
import { ContractDetail } from './pages/ContractDetail'
import { Tools } from './pages/Tools'
import { Documents } from './pages/Documents'
import { Risk } from './pages/Risk'

function Shell() {
  const { session, loading, isAdmin } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-violet-300/70">Cargando…</div>
  const authorized = session || isAdmin
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={authorized ? <Navigate to="/app" replace /> : <AuthPage />} />
      <Route path="/app/*" element={authorized ? <AppShell /> : <Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppShell() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <Routes>
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/contracts/*" element={<Contracts />} />
          <Route path="/app/contracts/:id" element={<ContractDetail />} />
          <Route path="/app/flow" element={<ContractFlow />} />
          <Route path="/app/pool-opportunities" element={<PoolOpportunities />} />
          <Route path="/app/suppliers" element={<Suppliers />} />
          <Route path="/app/bid-pages" element={<BidPages />} />
          <Route path="/app/private-bidding" element={<PrivateBidding />} />
          <Route path="/app/wallet" element={<Wallet />} />
          <Route path="/app/investors" element={<Investors />} />
          <Route path="/app/insurers" element={<Insurers />} />
          <Route path="/app/company" element={<Company />} />
          <Route path="/app/tools" element={<Tools />} />
          <Route path="/app/documents" element={<Documents />} />
          <Route path="/app/risk" element={<Risk />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
