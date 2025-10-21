import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, FileText, AlertCircle, DollarSign, Calendar, Filter, X } from 'lucide-react'
import '../styles/Dashboard.css'

const importacoesRecentes = [
  { id: 'IMP-001', arquivo: 'folha_janeiro.txt', status: 'sucesso', data: '2025-10-10' },
  { id: 'IMP-002', arquivo: 'folha_fevereiro.txt', status: 'erro', data: '2025-10-08' },
  { id: 'IMP-003', arquivo: 'folha_marco.txt', status: 'processando', data: '2025-10-05' },
  { id: 'IMP-004', arquivo: 'folha_abril.txt', status: 'erro', data: '2025-10-03' }
]

const acordosFaturamento = [
  { id: 1, beneficio: 'Alelo', valor: 15000, status: 'Aberto', vencimento: '2025-10-20' },
  { id: 2, beneficio: 'Vale Alimentação', valor: 22000, status: 'Fechado', vencimento: '2025-10-15' },
  { id: 3, beneficio: 'Vale Transporte', valor: 18500, status: 'Aberto', vencimento: '2025-10-25' },
  { id: 4, beneficio: 'Pluxee', valor: 30000, status: 'Aberto', vencimento: '2025-10-30' }
]

const StatusBadge = ({ status }) => {
  const statusStyles = {
    sucesso: 'bg-green',
    erro: 'bg-red',
    processando: 'bg-blue',
    Aberto: 'bg-amber',
    Fechado: 'bg-gray'
  }
  return (
    <span className={`badge ${statusStyles[status] || 'bg-gray'}`}>
      {status}
    </span>
  )
}

const DashboardCard = ({ title, value, subtitle, icon: Icon, colorClass, onClick, trend }) => {
  return (
    <div className={`dashboard-card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="card-header">
        <div className={`card-icon-wrapper ${colorClass}`}>
          <Icon className="card-icon" />
        </div>
        <h3 className="card-title">{title}</h3>
      </div>

      <div className="card-value">{value}</div>

      {subtitle && <div className="card-subtitle subtitle-line">{subtitle}</div>}

      {trend && (
        <div className="card-trend">
          <TrendingUp size={14} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  )
}

const FilterPanel = ({ filters, onFilterChange, onClearFilters }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="filter-container">
      <button className="filter-toggle" onClick={() => setIsOpen(!isOpen)}>
        <Filter size={18} />
        <span>Filtros</span>
        {Object.values(filters).some(v => v) && <span className="filter-badge">●</span>}
      </button>

      {isOpen && (
        <div className="filter-panel">
          <div className="filter-header">
            <h4>Filtrar Dashboard</h4>
            <button onClick={() => setIsOpen(false)} className="filter-close">
              <X size={18} />
            </button>
          </div>

          <div className="filter-content">
            <div className="filter-group">
              <label>Período</label>
              <select
                value={filters.periodo}
                onChange={(e) => onFilterChange('periodo', e.target.value)}
                className="filter-select"
              >
                <option value="">Todos</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Última semana</option>
                <option value="mes">Último mês</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">Todos</option>
                <option value="Aberto">Aberto</option>
                <option value="Fechado">Fechado</option>
                <option value="sucesso">Sucesso</option>
                <option value="erro">Erro</option>
              </select>
            </div>

            <button onClick={onClearFilters} className="filter-clear">
              Limpar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ periodo: '', status: '' })

  const filteredImportacoes = importacoesRecentes.filter(imp => {
    if (filters.status && imp.status !== filters.status) return false
    if (filters.periodo === 'hoje') {
      const hoje = new Date().toISOString().split('T')[0]
      return imp.data === hoje
    }
    if (filters.periodo === 'semana') {
      const semanaAtras = new Date()
      semanaAtras.setDate(semanaAtras.getDate() - 7)
      return new Date(imp.data) >= semanaAtras
    }
    return true
  })

  const filteredAcordos = acordosFaturamento.filter(a => {
    if (filters.status && a.status !== filters.status) return false
    return true
  })

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const handleClearFilters = () => setFilters({ periodo: '', status: '' })

  const totalAberto = filteredAcordos.filter(a => a.status !== 'Fechado').length
  const ultImp = filteredImportacoes[0]
  const erros = filteredImportacoes.filter(i => i.status === 'erro').length
  const faturamentoTotal = filteredAcordos.reduce((s, a) => s + a.valor, 0)

  const goImportacao = () => navigate('/importacao')
  const goPendentes = () => navigate('/pendentes')
  const goHistorico = () => navigate('/historico')
  const goFaturamento = () => navigate('/faturamento')


  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      <div className="card-grid">
        <DashboardCard
          title="Última Importação"
          value={ultImp?.id || '-'}
          subtitle={
            <div className="subtitle-line">
              <StatusBadge status={ultImp?.status} />
              <span>{ultImp?.arquivo}</span>
            </div>
          }
          icon={FileText}
          colorClass="icon--blue"
          onClick={goImportacao}
        />

        <DashboardCard
          title="Pagamentos em Aberto"
          value={totalAberto}
          subtitle="Aguardando processamento"
          icon={Calendar}
          colorClass="icon--amber"
          onClick={goPendentes}

        />

        <DashboardCard
          title="Erros de Importação"
          value={erros}
          subtitle="Últimos 7 dias"
          icon={AlertCircle}
          colorClass="icon--red"
          onClick={goHistorico}
        />

        <DashboardCard
          title="Faturamento Acumulado"
          value={`R$ ${faturamentoTotal.toLocaleString('pt-BR')}`}
          subtitle="Outubro 2025"
          icon={DollarSign}
          colorClass="icon--green"
          onClick={goFaturamento}
        />
      </div>

    </div>
  )
}
