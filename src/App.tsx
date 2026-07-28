import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { I18nProvider } from './lib/i18n'
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
import { Capital } from './pages/Capital'
import { Profile } from './pages/Profile'
import { ContractDetail } from './pages/ContractDetail'
import { Tools } from './pages/Tools'
import { Documents } from './pages/Documents'
import { Risk } from './pages/Risk'
import { NetTerms } from './pages/NetTerms'

function Shell() {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-violet-300/70">Loading…</div>
  const authorized = !!session
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
          <Route index element={<Dashboard />} />
          <Route path="contracts/*" element={<Contracts />} />
          <Route path="contracts/:id" element={<ContractDetail />} />
          <Route path="flow" element={<ContractFlow />} />
          <Route path="pool-opportunities" element={<PoolOpportunities />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="bid-pages" element={<BidPages />} />
          <Route path="private-bidding" element={<PrivateBidding />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="capital" element={<Capital />} />
          <Route path="investors" element={<Investors />} />
          <Route path="insurers" element={<Insurers />} />
          <Route path="company" element={<Company />} />
          <Route path="profile" element={<Profile />} />
          <Route path="tools" element={<Tools />} />
          <Route path="documents" element={<Documents />} />
          <Route path="risk" element={<Risk />} />
          <Route path="net-terms" element={<NetTerms />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </I18nProvider>
  )
}
