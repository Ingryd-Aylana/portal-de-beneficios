import React, { useState, useMemo } from 'react'
import { CheckCircle, XCircle, Clock, Send, Building2, Users, Calendar, Search } from 'lucide-react'
import '../styles/Pendentes.css'

const pendenciasKanban = [
  { id: 1, tipo: 'Vale Alimentação', descricao: 'Processamento mensal - Janeiro/2025', qtd: 45, origem: 'Condomínio Sol Nascente', condominio: 'Condomínio Sol Nascente', cnpj: '01.234.567/0001-89', data: '2025-01-15', valor: 'R$ 22.500,00', status: 'pendente' },
  { id: 2, tipo: 'Vale Transporte', descricao: 'Processamento mensal - Janeiro/2025', qtd: 45, origem: 'Condomínio Sol Nascente', condominio: 'Condomínio Sol Nascente', cnpj: '01.234.567/0001-89', data: '2025-01-15', valor: 'R$ 9.000,00', status: 'pendente' },
  { id: 3, tipo: 'Vale Alimentação', descricao: 'Processamento mensal - Dezembro/2024', qtd: 32, origem: 'Residencial Ipanema', condominio: 'Residencial Ipanema', cnpj: '01.234.567/0001-89', data: '2024-12-20', valor: 'R$ 16.000,00', status: 'pago' },
  { id: 4, tipo: 'Vale Transporte', descricao: 'Processamento mensal - Dezembro/2024', qtd: 32, origem: 'Residencial Ipanema', condominio: 'Residencial Ipanema', cnpj: '01.234.567/0001-89', data: '2024-12-20', valor: 'R$ 6.400,00', status: 'pago' },
  { id: 5, tipo: 'Vale Alimentação', descricao: 'Processamento mensal - Novembro/2024', qtd: 28, origem: 'Condomínio Vista Mar', condominio: 'Condomínio Vista Mar', cnpj: '01.234.567/0001-89', data: '2024-11-10', valor: 'R$ 14.000,00', status: 'cancelado' },
  { id: 6, tipo: 'Vale Refeição', descricao: 'Processamento mensal - Janeiro/2025', qtd: 50, origem: 'Edifício Central Plaza', condominio: 'Edifício Central Plaza', cnpj: '01.234.567/0001-89', data: '2025-01-18', valor: 'R$ 27.500,00', status: 'pago' },
  { id: 7, tipo: 'Vale Transporte', descricao: 'Ajuste de valores - Dezembro/2024', qtd: 15, origem: 'Condomínio Boa Vista', condominio: 'Condomínio Boa Vista', cnpj: '01.234.567/0001-89', data: '2024-12-05', valor: 'R$ 3.000,00', status: 'cancelado' },
  { id: 8, tipo: 'Vale Alimentação', descricao: 'Processamento mensal - Janeiro/2025', qtd: 38, origem: 'Residencial Jardins', condominio: 'Residencial Jardins', cnpj: '01.234.567/0001-89', data: '2025-01-22', valor: 'R$ 19.000,00', status: 'pendente' },
]

export default function Pendentes() {
  const [pendencias, setPendencias] = useState(pendenciasKanban)
  const [enviandoFaturamento, setEnviandoFaturamento] = useState(null)
  const [toast, setToast] = useState({ open: false, message: '' })
  const [search, setSearch] = useState('')

  const showToast = (message) => {
    setToast({ open: true, message })
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast({ open: false, message: '' }), 2500)
  }

  const searchLower = search.trim().toLowerCase()

  // aplica filtro de busca em todas as pendências
  const pendenciasFiltradas = useMemo(() => {
    if (!searchLower) return pendencias

    return pendencias.filter(p => {
      const text = [
        p.id,
        p.tipo,
        p.descricao,
        p.condominio,
        p.origem,
        p.cnpj,
        p.status,
        p.valor
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return text.includes(searchLower)
    })
  }, [pendencias, searchLower])

  // monta as colunas com base no resultado filtrado
  const colunas = useMemo(() => ({
    cancelado: pendenciasFiltradas.filter(p => p.status === 'cancelado'),
    pendente:  pendenciasFiltradas.filter(p => p.status === 'pendente'),
    pago:      pendenciasFiltradas.filter(p => p.status === 'pago'),
  }), [pendenciasFiltradas])

  const handleEnviarFaturamento = (id) => {
    setEnviandoFaturamento(id)
    setTimeout(() => {
      setEnviandoFaturamento(null)
      showToast('Enviado com sucesso')
    }, 1500)
  }

  const CardPendencia = ({ pendencia, mostrarBotaoFaturamento }) => (
    <div className="kp-card">
      <div className="kp-card-top">
        <div className="kp-tag">{pendencia.tipo}</div>
        <h3 className="kp-title">{pendencia.descricao}</h3>
      </div>

      <div className="kp-info">
        <div className="kp-row">
          <Building2 className="kp-ico" />
          <div>
            <div className="kp-strong">{pendencia.condominio}</div>
            <div className="kp-sub">{pendencia.cnpj}</div>
          </div>
        </div>

        <div className="kp-row">
          <Users className="kp-ico" />
          <span>{pendencia.qtd} beneficiários</span>
        </div>

        <div className="kp-row">
          <Calendar className="kp-ico" />
          <span>{new Date(pendencia.data).toLocaleDateString('pt-BR')}</span>
        </div>

        <div className="kp-total">
          <div className="kp-strong">{pendencia.valor}</div>
        </div>
      </div>

    </div>
  )

  const Coluna = ({ titulo, icone: Icon, tone, items, mostrarBotaoFaturamento }) => (
    <div className="kb-col">
      <div className={`kb-col-header ${tone}`}>
        <div className="kb-col-headline">
          <Icon className="kb-ico-head" />
          <h2>{titulo}</h2>
          <span className="kb-badge">{items.length}</span>
        </div>
      </div>
      <div className="kb-col-body">
        {items.length === 0 ? (
          <div className="kb-empty">Nenhum item nesta coluna</div>
        ) : (
          items.map(p => (
            <CardPendencia
              key={p.id}
              pendencia={p}
              mostrarBotaoFaturamento={mostrarBotaoFaturamento}
            />
          ))
        )}
      </div>
    </div>
  )

  return (
    <div className="kp-page">
      {/* Filtro de busca no topo */}
      <div className="kp-toolbar">
        <div className="filters-row">
          <div className="filter-group">
            <label>Buscar</label>
            <div className="input-with-icon">
              <span className="input-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Busque por condomínio, tipo, descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="kb-board">
        <Coluna
          titulo="Cancelados"
          icone={XCircle}
          tone="tone-red"
          items={colunas.cancelado}
          mostrarBotaoFaturamento={false}
        />
        <Coluna
          titulo="Pendentes"
          icone={Clock}
          tone="tone-yellow"
          items={colunas.pendente}
          mostrarBotaoFaturamento={false}
        />
        <Coluna
          titulo="Pagos"
          icone={CheckCircle}
          tone="tone-green"
          items={colunas.pago}
          mostrarBotaoFaturamento={true}
        />
      </div>

      <div className={`toast-wrap ${toast.open ? 'show' : ''}`} role="status" aria-live="polite">
        <div className="toast toast-success">
          <CheckCircle className="toast-ico" />
          <span>{toast.message}</span>
        </div>
      </div>
    </div>
  )
}
