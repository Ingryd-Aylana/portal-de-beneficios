import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PendenciasDoDiaModal from '../../components/PendenciasDoDiaModal'
import { entebenService } from '../../services/entebenService'

import '../../styles/dashboard.css'

const API_BASE_URL = 'https://vr-beneficios-backend-fedcorp-ju482.ondigitalocean.app/api'

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

const toArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.results)) return value.results
  if (Array.isArray(value?.data)) return value.data
  return []
}

const IconWrap = ({ children }) => <span className="dbi-icon">{children}</span>

const Ico = ({ d }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
)

const IcoDollar = () => <Ico d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
const IcoCalendar = () => <Ico d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
const IcoFile = () => <Ico d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6" />
const IcoImport = () => <Ico d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M7 10l5 5 5-5M12 15V3" />
const IcoList = () => <Ico d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
const IcoDownload = () => <Ico d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
const IcoSearch = () => <Ico d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
const IcoCheck = () => <Ico d="M20 6 9 17l-5-5" />

export default function Dashboard() {
  const navigate = useNavigate()

  const [movimentacoes, setMovimentacoes] = useState([])
  const [condoModalOpen, setCondoModalOpen] = useState(false)
  const [acordos, setAcordos] = useState([])
  const [loading, setLoading] = useState(true)

  const [condoQuery, setCondoQuery] = useState('')
  const [selectedCondo, setSelectedCondo] = useState(null)

  useEffect(() => {
    ; (async () => {
      try {
        const [ultimaImportacao, historicoImportacoes, acordosData] = await Promise.all([
          entebenService.getUltimaImportacao(),
          entebenService.getImportacoes(),
          entebenService.getcondominios(),
        ])

        const historico = toArray(historicoImportacoes)
        const metaUltima = historico[0] || null

        const ultimaCompleta = ultimaImportacao || metaUltima
          ? {
            ...(ultimaImportacao || {}),
            ...(metaUltima || {}),
            condominios: ultimaImportacao?.condominios || [],
          }
          : null

        setMovimentacoes(ultimaCompleta ? [ultimaCompleta, ...historico.slice(1)] : historico)
        setAcordos(toArray(acordosData))
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

    return acordos
      .filter((c) => {
        const nome =
          c.nome || c.condominio || c.razao_social || c.fantasia || c.nome_condominio || ''
        const cnpj = c.cnpj || c.cnpj_condominio || c.documento || c.cgc || ''

        return normTxt(nome).includes(qTxt) || (qDigits && onlyDigits(cnpj).includes(qDigits))
      })
      .slice(0, 8)
  }, [acordos, condoQuery])

  const ultImp = movimentacoes?.[0]
  const totalImportacoes = movimentacoes.length

  const getCondominiosImportacao = (i) =>
    Array.isArray(i?.condominios) ? i.condominios : []

  const getFuncionariosImportacao = (i) =>
    getCondominiosImportacao(i).flatMap((condo) =>
      Array.isArray(condo?.funcionarios) ? condo.funcionarios : []
    )

  const getMovimentacoesImportacao = (i) =>
    getFuncionariosImportacao(i).flatMap((func) =>
      Array.isArray(func?.movimentacoes) ? func.movimentacoes : []
    )

  const getImportTotalValue = (i) =>
    getMovimentacoesImportacao(i).reduce(
      (sum, mov) => sum + Number(mov?.valor || 0),
      0
    )

  const getImportFuncionarios = (i) =>
    getFuncionariosImportacao(i).length || i?.registros_processados || 0

  const getImportMovimentacoes = (i) =>
    getMovimentacoesImportacao(i).length || i?.registros_processados || 0

  const getImportCondominios = (i) =>
    getCondominiosImportacao(i).length

  const getImportDate = (i) =>
    i?.data_importacao ||
    i?.processed_at ||
    i?.created_at ||
    i?.data ||
    i?.updated_at

  const getImportName = (i) =>
    `IMP-${i?.id || i?.file_upload_id || 'última'}`

  const getImportStatus = (i) => {
    const status = i?.status || 'processado'

    if (status === 'COMPLETED') return 'sucesso'
    if (status === 'PENDING') return 'processando'
    if (status === 'FAILED') return 'erro'

    return status
  }

  const importacaoId = ultImp?.id || ultImp?.file_upload_id || null
  const excelUrl = `${API_BASE_URL}/upload/export/faturamento/`

  const faturamentoTotal =
    getImportTotalValue(ultImp) ||
    acordos.reduce((s, a) => s + Number(a.valor || 0), 0)

  const totalAberto = acordos.filter((a) => a.status !== 'Fechado').length
  const totalCondominios =
    getImportCondominios(ultImp) || acordos.length

  const getCondoNome = (c) =>
    c?.nome ||
    c?.condominio ||
    c?.razao_social ||
    c?.fantasia ||
    c?.nome_condominio ||
    `Condomínio #${c?.id}`

  const getCondoCnpj = (c) =>
    c?.cnpj || c?.cnpj_condominio || c?.documento || c?.cgc || '—'

  const getCondoEndereco = (c) =>
    c?.endereco ||
    c?.logradouro ||
    c?.endereco_completo ||
    [c?.rua, c?.numero, c?.bairro].filter(Boolean).join(', ') ||
    '—'

  const getCondoContato = (c) =>
    c?.telefone || c?.contato || c?.email || '—'

  const getQtdFuncionarios = (c) =>
    c?.quantidade_funcionarios ||
    c?.total_funcionarios ||
    c?.qtd_funcionarios ||
    c?.funcionarios_count ||
    c?.funcionarios?.length ||
    '—'

  const getUltimoFaturamento = (c) =>
    c?.ultimo_faturamento ||
    c?.valor_ultimo_faturamento ||
    c?.ultimo_valor_faturado ||
    c?.faturamento ||
    c?.valor ||
    null

  const getVencimento = (c) =>
    c?.vencimento ||
    c?.data_vencimento ||
    c?.proximo_vencimento ||
    '—'

  const closeCondoModal = () => {
    setCondoModalOpen(false)
    setSelectedCondo(null)
    setCondoQuery('')
  }

  if (loading) {
    return (
      <div className="dbi-root">
        <div className="dbi-loading">
          <div className="dbi-spinner" />
          Carregando dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="dbi-root">
      <PendenciasDoDiaModal items={pendencias} onGoToPendentes={() => navigate('/pendentes')} />

      <main className="dbi-body">
        <section className="dbi-hero">
          <div>
            <p className="dbi-eyebrow">Portal de Benefícios</p>
            <h1 className="dbi-title">Visão geral operacional</h1>
            <p className="dbi-subtitle">
              Acompanhe importações, faturamento, pendências e documentos em um só lugar.
            </p>
          </div>

          <div className="dbi-hero-actions">
            <button className="dbi-btn primary" onClick={() => navigate('/importacao')}>
              <IconWrap><IcoImport /></IconWrap>
              Nova importação
            </button>

            <button className="dbi-btn secondary" onClick={() => navigate('/faturamento')}>
              <IconWrap><IcoDollar /></IconWrap>
              Ir para faturamento
            </button>
          </div>
        </section>

        <section className="dbi-kpis">
          <button className="dbi-kpi-card" onClick={() => navigate('/faturamento')}>
            <div className="dbi-kpi-top">
              <IconWrap><IcoDollar /></IconWrap>
              <span className="dbi-kpi-label">Faturamento total</span>
            </div>
            <div className="dbi-kpi-value">{formatCurrency(faturamentoTotal)}</div>
            <div className="dbi-kpi-foot">Base da última importação</div>
          </button>

          <button className="dbi-kpi-card" onClick={() => navigate('/pendentes')}>
            <div className="dbi-kpi-top">
              <IconWrap><IcoCalendar /></IconWrap>
              <span className="dbi-kpi-label">Extrato de Pagamentos</span>
            </div>
            <div className="dbi-kpi-value">{totalAberto}</div>
            <div className="dbi-kpi-foot">
              {pendencias.length > 0
                ? `${pendencias.length} vencido${pendencias.length > 1 ? 's' : ''}`
                : 'Nenhuma pendência hoje'}
            </div>
          </button>

          <button className="dbi-kpi-card" onClick={() => navigate('/importacao')}>
            <div className="dbi-kpi-top">
              <IconWrap><IcoFile /></IconWrap>
              <span className="dbi-kpi-label">Importações</span>
            </div>
            <div className="dbi-kpi-value">{totalImportacoes}</div>
            <div className="dbi-kpi-foot">
              {ultImp ? `Última: ${getImportName(ultImp)}` : 'Sem importações'}
            </div>
          </button>

          <div className="dbi-kpi-card">
            <div className="dbi-kpi-top">
              <IconWrap><IcoList /></IconWrap>
              <span className="dbi-kpi-label">Condomínios</span>
            </div>
            <div className="dbi-kpi-value">{totalCondominios}</div>
            <div className="dbi-kpi-foot">Base monitorada</div>
          </div>
        </section>

        <section className="dbi-grid-main">
          <div className="dbi-panel dbi-panel-highlight">
            <div className="dbi-panel-head">
              <div>
                <p className="dbi-panel-eyebrow">Importação</p>
                <h2 className="dbi-panel-title">Última movimentação</h2>
              </div>
            </div>

            {ultImp ? (
              <>
                <div className="dbi-import-main">
                  <div className="dbi-import-icon">
                    <IcoFile />
                  </div>

                  <div className="dbi-import-content">
                    <div className="dbi-import-name">
                      {getImportName(ultImp)}
                    </div>

                    <div className="dbi-import-meta">
                      <span>
                        {getImportDate(ultImp)
                          ? new Date(getImportDate(ultImp)).toLocaleDateString('pt-BR')
                          : '—'}
                      </span>

                      <span
                        className={`dbi-badge ${getImportStatus(ultImp) === 'sucesso'
                            ? 'success'
                            : getImportStatus(ultImp) === 'erro'
                              ? 'danger'
                              : 'info'
                          }`}
                      >
                        {getImportStatus(ultImp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="dbi-import-stats">
                  <div className="dbi-mini-stat">
                    <span className="dbi-mini-label">Valor total</span>
                    <strong>{formatCurrency(getImportTotalValue(ultImp))}</strong>
                  </div>

                  <div className="dbi-mini-stat">
                    <span className="dbi-mini-label">Colaboradores</span>
                    <strong>{getImportFuncionarios(ultImp)}</strong>
                  </div>

                  <div className="dbi-mini-stat">
                    <span className="dbi-mini-label">Movimentações</span>
                    <strong>{getImportMovimentacoes(ultImp)}</strong>
                  </div>

                  <div className="dbi-mini-stat">
                    <span className="dbi-mini-label">Condomínios</span>
                    <strong>{getImportCondominios(ultImp)}</strong>
                  </div>
                </div>

                <div className="dbi-panel-actions">
                  <button
                    className="dbi-btn success"
                    onClick={() => window.open(excelUrl, '_blank')}
                  >
                    <IconWrap><IcoDownload /></IconWrap>
                    Baixar Excel
                  </button>

                  <button className="dbi-btn secondary" onClick={() => navigate('/importacao')}>
                    <IconWrap><IcoImport /></IconWrap>
                    Nova importação
                  </button>
                </div>
              </>
            ) : (
              <div className="dbi-empty-state">
                <IcoFile />
                <p>Nenhuma importação encontrada.</p>
              </div>
            )}
          </div>

          <div className="dbi-side-stack">
            <div className="dbi-panel">
              <div className="dbi-panel-head">
                <div>
                  <p className="dbi-panel-eyebrow">Busca rápida</p>
                  <h2 className="dbi-panel-title">Condomínio</h2>
                </div>
              </div>

              <div className="dbi-search-box">
                <span className="dbi-search-icon">
                  <IcoSearch />
                </span>

                <input
                  value={condoQuery}
                  onChange={(e) => {
                    setCondoQuery(e.target.value)
                    setSelectedCondo(null)
                  }}
                  placeholder="Pesquisar por nome ou CNPJ"
                />

                {condoQuery && (
                  <button
                    className="dbi-search-clear"
                    onClick={() => {
                      setCondoQuery('')
                      setSelectedCondo(null)
                    }}
                    type="button"
                    aria-label="Limpar busca"
                  >
                    ×
                  </button>
                )}
              </div>

              {condoQuery && !selectedCondo && condoResults.length > 0 && (
                <div className="dbi-search-results">
                  {condoResults.map((c) => {
                    const nome = getCondoNome(c)
                    const cnpj = c.cnpj || c.cnpj_condominio || c.documento || c.cgc || ''

                    return (
                      <button
                        key={c.id ?? `${nome}-${cnpj}`}
                        type="button"
                        className="dbi-search-item"
                        onClick={() => {
                          setSelectedCondo(c)
                          setCondoQuery(nome)
                          setCondoModalOpen(true)
                        }}
                      >
                        <strong>{nome}</strong>
                        <span>{cnpj ? `CNPJ: ${cnpj}` : 'CNPJ não informado'}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {condoQuery && !selectedCondo && condoResults.length === 0 && (
                <div className="dbi-empty-inline">Nenhum condomínio encontrado.</div>
              )}
            </div>

            <div className="dbi-panel">
              <div className="dbi-panel-head">
                <div>
                  <p className="dbi-panel-eyebrow">Ações</p>
                  <h2 className="dbi-panel-title">Atalhos rápidos</h2>
                </div>
              </div>

              <div className="dbi-quick-actions">
                <button className="dbi-quick-btn" onClick={() => navigate('/importacao')}>
                  <IconWrap><IcoImport /></IconWrap>
                  <div>
                    <strong>Nova importação</strong>
                    <span>Importe planilhas e arquivos</span>
                  </div>
                </button>

                <button
                  className="dbi-quick-btn"
                  onClick={() =>
                    navigate('/faturamento/repetir', {
                      state: {
                        importacaoId,
                        faturamentoId: importacaoId,
                        ultimaImportacao: ultImp,
                      },
                    })
                  }
                  disabled={!importacaoId}
                >
                  <IconWrap><IcoFile /></IconWrap>
                  <div>
                    <strong>Repetir faturamento</strong>
                    <span>{importacaoId ? 'Use a base anterior' : 'Sem base anterior'}</span>
                  </div>
                </button>

                <button className="dbi-quick-btn" onClick={() => navigate('/pendentes')}>
                  <IconWrap><IcoCalendar /></IconWrap>
                  <div>
                    <strong>Ver pendências</strong>
                    <span>Acompanhe vencimentos</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="dbi-panel">
          <div className="dbi-panel-head">
            <div>
              <p className="dbi-panel-eyebrow">Financeiro</p>
              <h2 className="dbi-panel-title">Pendências vencidas</h2>
            </div>

            {pendencias.length > 0 && (
              <button className="dbi-link-btn" onClick={() => navigate('/pendentes')}>
                Ver todos
              </button>
            )}
          </div>

          {pendencias.length === 0 ? (
            <div className="dbi-empty-state">
              <IcoCheck />
              <p>Nenhuma pendência vencida. Tudo em dia.</p>
            </div>
          ) : (
            <div className="dbi-table-wrap">
              <table className="dbi-table">
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
                      <tr key={a.id} onClick={() => navigate('/pendentes')}>
                        <td>{a.nome || a.condominio || `Acordo #${a.id}`}</td>
                        <td>
                          {venc.toLocaleDateString('pt-BR')}
                          {dias > 0 && (
                            <span className="dbi-badge danger inline">{dias}d atraso</span>
                          )}
                        </td>
                        <td>{formatCurrency(a.valor)}</td>
                        <td>
                          <span className="dbi-badge warning">{a.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {condoModalOpen && selectedCondo && (
        <div
          className="dbi-modal-overlay"
          onMouseDown={(e) => {
            if (e.target.classList.contains('dbi-modal-overlay')) {
              closeCondoModal()
            }
          }}
        >
          <div className="dbi-modal" role="dialog" aria-modal="true">
            <div className="dbi-modal-header">
              <div>
                <p className="dbi-panel-eyebrow">Condomínio</p>
                <h2 className="dbi-modal-title">{getCondoNome(selectedCondo)}</h2>
              </div>

              <button className="dbi-modal-close" onClick={closeCondoModal}>
                ×
              </button>
            </div>

            <div className="dbi-modal-body">
              <div className="dbi-modal-status-row">
                <span className={`dbi-badge ${selectedCondo.status === 'Fechado' ? 'success' : 'warning'}`}>
                  {selectedCondo.status || 'Ativo'}
                </span>
              </div>

              <div className="dbi-modal-grid">
                <div className="dbi-modal-info">
                  <span className="dbi-mini-label">CNPJ</span>
                  <strong>{getCondoCnpj(selectedCondo)}</strong>
                </div>

                <div className="dbi-modal-info">
                  <span className="dbi-mini-label">Cidade / UF</span>
                  <strong>
                    {selectedCondo.cidade || '—'}
                    {selectedCondo.uf ? ` / ${selectedCondo.uf}` : ''}
                  </strong>
                </div>

                <div className="dbi-modal-info full">
                  <span className="dbi-mini-label">Endereço</span>
                  <strong>{getCondoEndereco(selectedCondo)}</strong>
                </div>

                {selectedCondo.bairro && (
                  <div className="dbi-modal-info">
                    <span className="dbi-mini-label">Bairro</span>
                    <strong>{selectedCondo.bairro}</strong>
                  </div>
                )}

                {selectedCondo.cep && (
                  <div className="dbi-modal-info">
                    <span className="dbi-mini-label">CEP</span>
                    <strong>{selectedCondo.cep}</strong>
                  </div>
                )}

                <div className="dbi-modal-info">
                  <span className="dbi-mini-label">Contato</span>
                  <strong>{getCondoContato(selectedCondo)}</strong>
                </div>

                <div className="dbi-modal-info">
                  <span className="dbi-mini-label">Quantidade de funcionários</span>
                  <strong>{getQtdFuncionarios(selectedCondo)}</strong>
                </div>

                <div className="dbi-modal-info">
                  <span className="dbi-mini-label">Último faturamento registrado</span>
                  <strong>
                    {getUltimoFaturamento(selectedCondo) != null
                      ? formatCurrency(getUltimoFaturamento(selectedCondo))
                      : '—'}
                  </strong>
                </div>

                <div className="dbi-modal-info">
                  <span className="dbi-mini-label">Vencimento</span>
                  <strong>{getVencimento(selectedCondo)}</strong>
                </div>

                {selectedCondo.email && (
                  <div className="dbi-modal-info">
                    <span className="dbi-mini-label">E-mail</span>
                    <strong>{selectedCondo.email}</strong>
                  </div>
                )}
              </div>

              <div className="dbi-modal-actions">
                <button className="dbi-btn secondary" onClick={() => navigate('/faturamento')}>
                  Ver faturamento
                </button>

                <button className="dbi-btn primary" onClick={closeCondoModal}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}