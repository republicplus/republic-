import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { Layout } from './components/Layout'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { Companies } from './pages/Companies'
import { Contracts } from './pages/Contracts'
import { ContractDetail } from './pages/ContractDetail'
import { Wallet } from './pages/Wallet'
import { Tools } from './pages/Tools'
import { Suppliers } from './pages/Suppliers'
import { Capital } from './pages/Capital'
import { Investors } from './pages/Investors'
import { Insurers } from './pages/Insurers'
import { Risk } from './pages/Risk'
import { Pools } from './pages/Pools'

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted">Cargando…</div>
  if (!session) return <Navigate to="/auth" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/app" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="companies" element={<Companies />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="tools" element={<Tools />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="capital" element={<Capital />} />
        <Route path="investors" element={<Investors />} />
        <Route path="insurers" element={<Insurers />} />
        <Route path="risk" element={<Risk />} />
        <Route path="pools" element={<Pools />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}
