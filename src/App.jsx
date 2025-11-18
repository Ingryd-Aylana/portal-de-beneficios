import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Importacao from './pages/Importacao.jsx'
import Faturamento from './pages/Faturamento.jsx'
import Pendentes from './pages/Pendentes.jsx'
import Historico from './pages/Historico.jsx'
import HistoricoCondominio from './pages/HistoricoCondominio.jsx'
import AdicionarColaboradores from './pages/AdicionarColaboradores.jsx'
import Login from './pages/Login/Login.jsx'
import EsqueciSenha from './pages/Login/EsqueciSenha.jsx'
import ConfiguracaoCondominios from './pages/Configuracoes.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'

function Layout() {
  const location = useLocation()
  const titles = {
    '/': 'Início',
    '/importacao': 'Importação',
    '/faturamento': 'Faturamento',
    '/pendentes': 'Pendências',
    '/historico': 'Histórico'
  }
  const title = titles[location.pathname] ?? 'Portal de Benefícios'
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Header title={title} />
        <div className="page">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/importacao" element={<Importacao />} />
            <Route path="/faturamento" element={<Faturamento />} />
            <Route path="/pendentes" element={<Pendentes />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/historico-condominio/:id" element={<HistoricoCondominio />} />
            <Route
              path="/historico-condominio/:id/colaboradores/adicionar"
              element={<AdicionarColaboradores />}
            />
            <Route path="/configuracoes" element={<ConfiguracaoCondominios />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/*" element={<Layout />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}