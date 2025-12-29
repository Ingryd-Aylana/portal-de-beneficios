import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'

import Dashboard from './pages/Client/Dashboard.jsx'
import Importacao from './pages/Client/Importacao.jsx'
import Faturamento from './pages/Client/Faturamento.jsx'
import Pendentes from './pages/Comuns/Pendentes.jsx'
import Historico from './pages/Comuns/Historico.jsx'
import Login from './pages/Comuns/Login/Login.jsx'
import ConfiguracaoCondominios from './pages/Client/Configuracoes.jsx'
import RelatoriosBeneficios from './pages/Client/RelatoriosBeneficios.jsx'

import ColaboradorDashboard from './pages/Interno/ColaboradorDashboard.jsx'
import ImportacaoDocs from './pages/Interno/ImportacaoDocs.jsx'

import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'

function Layout() {
  const location = useLocation()

  const titles = {
    '/': 'Início',
    '/importacao': 'Importação',
    '/faturamento': 'Faturamento',
    '/pendentes': 'Pendências',
    '/historico': 'Histórico',
    '/configuracoes': 'Configurações',
    '/relatorios': 'Relatórios de Benefícios',

    // Colaborador
    '/colaborador/dashboard': 'Dashboard Fedcorp',
    '/colaborador/importacaoDocs': 'Importação Fedcorp',
  }

  const title = titles[location.pathname] ?? 'Portal de Benefícios'

  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        <Header title={title} />

        <div className="page">
          <Routes>
            {/* CLIENTE */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/importacao" element={<Importacao />} />
            <Route path="/faturamento" element={<Faturamento />} />
            <Route path="/pendentes" element={<Pendentes />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/configuracoes" element={<ConfiguracaoCondominios />} />
            <Route path="/relatorios" element={<RelatoriosBeneficios />} />
            <Route path="/colaborador/dashboard" element={<ColaboradorDashboard />} />
            <Route path="/colaborador/importacaoDocs" element={< ImportacaoDocs/>} />

            {/* COLABORADOR FEDCORP */}
            <Route
              path="/colaborador/dashboard"
              element={
                <ProtectedRoute allowedRoles={['colaborador_fedcorp']}>
                  <ColaboradorDashboard />
                </ProtectedRoute>
              }
            />

            {/* FALLBACK */}
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

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
