import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { Contracts } from './pages/Contracts'
import { Suppliers } from './pages/Suppliers'
import { Wallet } from './pages/Wallet'
import { AIAssistant } from './pages/AIAssistant'
import { Sidebar } from './components/Sidebar'

function Shell() {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-violet-300/70">Cargando…</div>
  if (!session) return <AuthPage />
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <Routes>
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/contracts/*" element={<Contracts />} />
          <Route path="/app/suppliers" element={<Suppliers />} />
          <Route path="/app/wallet" element={<Wallet />} />
          <Route path="/app/ai" element={<AIAssistant />} />
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
