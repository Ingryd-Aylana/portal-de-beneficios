import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PendenciasDoDiaModal from '../../components/PendenciasDoDiaModal'
import { entebenService } from '../../services/entebenService'

import '../../styles/dashboard.css'

const formatCurrency = (n) =>
  `R$ ${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

const normTxt = (s) =>
  (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const onlyDigits = (s) => (s || '').toString().replace(/\D/g, '')

const Ico = ({ d }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
)

const IcoDollar = () => <Ico d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
const IcoCalendar = () => <Ico d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
const IcoFile = () => <Ico d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6" />
const IcoArrow = () => <Ico d="M5 12h14M12 5l7 7-7 7" />
const IcoCheck = () => <Ico d="M20 6 9 17l-5-5" />
const IcoImport = () => <Ico d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M7 10l5 5 5-5M12 15V3" />
const IcoList = () => <Ico d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
const IcoDownload = () => <Ico d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />

export default function Dashboard() {
  const navigate = useNavigate()

  const [movimentacoes, setMovimentacoes] = useState([])
  const [acordos, setAcordos] = useState([])
  const [loading, setLoading] = useState(true)

  const [condoQuery, setCondoQuery] = useState('')
  const [selectedCondo, setSelectedCondo] = useState(null)

  useEffect(() => {
    ; (async () => {
      try {
        const [movData, acordosData] = await Promise.all([
          entebenService.getMovimentacoes(),
          entebenService.getcondominios(),
        ])
        setMovimentacoes(Array.isArray(movData) ? movData : [])
        setAcordos(Array.isArray(acordosData) ? acordosData : [])
      } catch (e) {
        console.error('Erro ao carregar dashboard:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
  }, [])

  const pendencias = useMemo(
    () => acordos.filter((a) => a.status !== 'Fechado' && a.vencimento <= todayStr),
    [acordos, todayStr]
  )

  const condoResults = useMemo(() => {
    const qTxt = normTxt(condoQuery)
    const qDigits = onlyDigits(condoQuery)

    if (!qTxt) return []

    return (acordos || [])
      .filter((c) => {
        const nome =
          c.nome || c.condominio || c.razao_social || c.fantasia || c.nome_condominio || ''
        const cnpj = c.cnpj || c.cnpj_condominio || c.documento || c.cgc || ''

        const nomeOk = normTxt(nome).includes(qTxt)
        const cnpjOk = qDigits && onlyDigits(cnpj).includes(qDigits)

        return nomeOk || cnpjOk
      })
      .slice(0, 8)
  }, [acordos, condoQuery])

  const faturamentoTotal = acordos.reduce((s, a) => s + (a.valor || 0), 0)
  const totalAberto = acordos.filter((a) => a.status !== 'Fechado').length
  const ultImp = movimentacoes?.[0]

  if (loading) {
    return (
      <div className="db-root">
        <div className="db-loading">
          <div className="db-spinner" /> Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="db-root">
      <PendenciasDoDiaModal items={pendencias} onGoToPendentes={() => navigate('/pendentes')} />

      <main className="db-body">
        <h1 className="db-section-label">Resumo Geral</h1>

        <div className="db-condo-search-wrap">
          <div className="db-condo-search">
            <input
              className="db-condo-input"
              value={condoQuery}
              onChange={(e) => {
                setCondoQuery(e.target.value)
                setSelectedCondo(null)
              }}
              placeholder="Pesquisar condomínio por CNPJ ou nome…"
            />
            {condoQuery && (
              <button
                className="db-condo-clear"
                onClick={() => {
                  setCondoQuery('')
                  setSelectedCondo(null)
                }}
                type="button"
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          {condoQuery && !selectedCondo && condoResults.length > 0 && (
            <div className="db-condo-results" role="listbox" aria-label="Resultados de condomínios">
              {condoResults.map((c) => {
                const nome =
                  c.nome ||
                  c.condominio ||
                  c.razao_social ||
                  c.fantasia ||
                  c.nome_condominio ||
                  `Condomínio #${c.id}`

                const cnpj = c.cnpj || c.cnpj_condominio || c.documento || c.cgc || ''

                return (
                  <button
                    key={c.id ?? `${nome}-${cnpj}`}
                    type="button"
                    className="db-condo-item"
                    onClick={() => {
                      setSelectedCondo(c)
                      setCondoQuery(nome)
                    }}
                  >
                    <div className="db-condo-item-title">{nome}</div>
                    <div className="db-condo-item-sub">
                      {cnpj ? `CNPJ: ${cnpj}` : 'CNPJ não informado'}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {selectedCondo && (
            <div className="db-condo-card">
              <div className="db-condo-card-header">
                <div className="db-condo-card-title">
                  {selectedCondo.nome ||
                    selectedCondo.condominio ||
                    selectedCondo.razao_social ||
                    selectedCondo.fantasia ||
                    selectedCondo.nome_condominio ||
                    `Condomínio #${selectedCondo.id}`}
                </div>
                <span className={`db-condo-status db-badge ${selectedCondo.status === 'Fechado' ? 'bg-green' : 'bg-amber'}`}>
                  {selectedCondo.status || 'Ativo'}
                </span>
              </div>

              <div className="db-condo-card-body">
                <div className="db-condo-info-grid">
                  <div className="db-condo-info-item">
                    <div className="db-condo-label">CNPJ</div>
                    <div className="db-condo-value">
                      {selectedCondo.cnpj ||
                        selectedCondo.cnpj_condominio ||
                        selectedCondo.documento ||
                        selectedCondo.cgc ||
                        '—'}
                    </div>
                  </div>

                  <div className="db-condo-info-item">
                    <div className="db-condo-label">Cidade/UF</div>
                    <div className="db-condo-value">
                      {selectedCondo.cidade || '—'}
                      {selectedCondo.uf ? ` / ${selectedCondo.uf}` : ''}
                    </div>
                  </div>

                  <div className="db-condo-info-item db-condo-span-2">
                    <div className="db-condo-label">Endereço</div>
                    <div className="db-condo-value">
                      {selectedCondo.endereco ||
                        selectedCondo.logradouro ||
                        selectedCondo.endereco_completo ||
                        '—'}
                    </div>
                  </div>

                  <div className="db-condo-info-item">
                    <div className="db-condo-label">Contato</div>
                    <div className="db-condo-value">
                      {selectedCondo.telefone || selectedCondo.contato || selectedCondo.email || '—'}
                    </div>
                  </div>

                  {selectedCondo.valor && (
                    <div className="db-condo-info-item">
                      <div className="db-condo-label">Valor</div>
                      <div className="db-condo-value db-condo-value-highlight">
                        {formatCurrency(selectedCondo.valor)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {condoQuery && !selectedCondo && condoResults.length === 0 && (
            <div className="db-condo-empty">Nenhum condomínio encontrado.</div>
          )}
        </div>

        <div className="db-kpi-row">
          <div className="db-kpi" style={{ '--kpi-accent': '#16a34a' }} onClick={() => navigate('/faturamento')}>
            <div className="db-kpi-icon" style={{ background: 'rgba(22,163,74,.1)' }}><IcoDollar /></div>
            <div className="db-kpi-eyebrow">Faturamento Total</div>
            <div className="db-kpi-value">{formatCurrency(faturamentoTotal)}</div>
            <div className="db-kpi-sub">
              <span className="db-badge bg-green">↑ Ver detalhes</span>
            </div>
          </div>

          <div className="db-kpi" style={{ '--kpi-accent': '#d97706' }} onClick={() => navigate('/pendentes')}>
            <div className="db-kpi-icon" style={{ background: 'rgba(217,119,6,.1)' }}><IcoCalendar /></div>
            <div className="db-kpi-eyebrow">Pagamentos em aberto</div>
            <div className="db-kpi-value" style={{ fontSize: 28 }}>{totalAberto}</div>
            <div className="db-kpi-sub">
              {pendencias.length > 0
                ? <span className="db-badge bg-amber">⚠ {pendencias.length} vencido{pendencias.length !== 1 ? 's' : ''} hoje</span>
                : <span className="db-badge bg-green">Em dia</span>
              }
            </div>
          </div>

          <div className="db-kpi" style={{ '--kpi-accent': '#2563eb' }} onClick={() => navigate('/importacao')}>
            <div className="db-kpi-icon" style={{ background: 'rgba(37,99,235,.1)' }}><IcoFile /></div>
            <div className="db-kpi-eyebrow">Última importação</div>
            <div className="db-kpi-value" style={{ fontSize: 22 }}>
              {ultImp ? `IMP-${ultImp.id}` : '—'}
            </div>
            <div className="db-kpi-sub">
              {ultImp
                ? <span className="db-badge bg-blue">{ultImp.status}</span>
                : 'Nenhuma importação ainda'}
            </div>
          </div>

          <div className="db-kpi" style={{ '--kpi-accent': '#7c3aed' }}>
            <div className="db-kpi-icon" style={{ background: 'rgba(124,58,237,.1)' }}><IcoList /></div>
            <div className="db-kpi-eyebrow">Total de condomínios</div>
            <div className="db-kpi-value" style={{ fontSize: 28 }}>{acordos.length}</div>
            <div className="db-kpi-sub">
              <span className="db-badge bg-blue">Ativos</span>
            </div>
          </div>
        </div>

        <h1 className="db-section-label">Ações rápidas</h1>

        <div className="db-actions-grid">
          <button className="db-action-card" onClick={() => navigate('/importacao')}>
            <div className="db-action-card-icon" style={{ '--icon-bg': 'rgba(37,99,235,.1)', '--icon-color': '#2563eb' }}>
              <IcoImport />
            </div>
            <div className="db-action-card-content">
              <div className="db-action-card-title">Nova Importação</div>
              <div className="db-action-card-desc">Importe arquivos .xlsx, .csv ou .txt</div>
            </div>
          </button>


          <button className="db-action-card" onClick={() => navigate('/faturamento/repetir')}>
            <div className="db-action-card-icon" style={{ '--icon-bg': 'rgba(124,58,237,.1)', '--icon-color': '#7c3aed' }}>
              <IcoFile />
            </div>
            <div className="db-action-card-content">
              <div className="db-action-card-title">Repetir Faturamento</div>
              <div className="db-action-card-desc">Use a base anterior</div>
            </div>
          </button>
        </div>

        <div className="db-pendencias-wrap">
          <div className="db-pendencias-head">
            <div className="db-pendencias-head-left">
              {pendencias.length > 0 && <div className="db-red-dot" />}
              Pendências vencidas
              {pendencias.length > 0 && <span className="db-badge bg-red">{pendencias.length}</span>}
            </div>

            {pendencias.length > 0 && (
              <button className="db-see-all" onClick={() => navigate('/pendentes')}>
                Ver todos →
              </button>
            )}
          </div>

          {pendencias.length === 0 ? (
            <div className="db-empty">
              <IcoCheck />
              Nenhuma pendência vencida. Tudo em dia!
            </div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Condomínio / Devedor</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendencias.slice(0, 8).map((a) => {
                  const venc = new Date(a.vencimento + 'T00:00:00')
                  const hoje = new Date(todayStr + 'T00:00:00')
                  const dias = Math.floor((hoje - venc) / 86400000)

                  return (
                    <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/pendentes')}>
                      <td style={{ fontWeight: 500 }}>
                        {a.nome || a.condominio || `Acordo #${a.id}`}
                      </td>
                      <td>
                        {venc.toLocaleDateString('pt-BR')}
                        {dias > 0 && (
                          <span className="db-badge bg-red" style={{ marginLeft: 8 }}>
                            {dias}d atraso
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                        {formatCurrency(a.valor)}
                      </td>
                      <td>
                        <span className="db-badge bg-amber">{a.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {ultImp && (
          <>
            <p className="db-section-label db-divider">Última importação</p>
            <div className="db-last-import">
              <div className="db-last-import-left">
                <div className="db-import-icon-wrap">
                  <IcoFile />
                </div>
                <div className="db-import-info">
                  <div className="db-import-title">{ultImp.arquivo || `IMP-${ultImp.id}`}</div>
                  <div className="db-import-meta">
                    <span>{ultImp.data ? new Date(ultImp.data).toLocaleDateString('pt-BR') : '—'}</span>
                    <span
                      className={`db-badge ${ultImp.status === 'sucesso' ? 'bg-green' : ultImp.status === 'erro' ? 'bg-red' : 'bg-blue'
                        }`}
                    >
                      {ultImp.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="db-last-import-details">
                {ultImp.valor_total && (
                  <div className="db-import-stat">
                    <span className="db-import-stat-label">Valor Total</span>
                    <span className="db-import-stat-value">{formatCurrency(ultImp.valor_total)}</span>
                  </div>
                )}
                {ultImp.total_funcionarios && (
                  <div className="db-import-stat">
                    <span className="db-import-stat-label">Colaboradores</span>
                    <span className="db-import-stat-value">{ultImp.total_funcionarios}</span>
                  </div>
                )}
                {ultImp.total_movimentacoes && (
                  <div className="db-import-stat">
                    <span className="db-import-stat-label">Movimentações</span>
                    <span className="db-import-stat-value">{ultImp.total_movimentacoes}</span>
                  </div>
                )}
                {ultImp.competencia_mes && (
                  <div className="db-import-stat">
                    <span className="db-import-stat-label">Competência</span>
                    <span className="db-import-stat-value">{ultImp.competencia_mes}/{ultImp.competencia_ano}</span>
                  </div>
                )}
              </div>

              <div className="db-last-import-actions">
                {ultImp.excel_url && (
                  <button
                    className="db-import-download-btn"
                    onClick={() => window.open(ultImp.excel_url, '_blank')}
                  >
                    <IcoDownload /> Baixar Excel
                  </button>
                )}
                <button className="db-go-btn" onClick={() => navigate('/importacao')}>
                  Gerenciar →
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}