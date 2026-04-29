import React, { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Download,
  FileText,
  CalendarDays,
  Receipt,
  Files,
} from 'lucide-react'

import { entebenService } from '../../services/entebenService'
import '../../styles/Faturamento.css'

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  })

const formatDateBR = (value) => {
  if (!value) return '—'

  const onlyDate = String(value).split('T')[0]
  const [year, month, day] = onlyDate.split('-')

  if (!year || !month || !day) return value

  return `${day}/${month}/${year}`
}

const toArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.results)) return value.results
  if (Array.isArray(value?.data)) return value.data
  return []
}

const getStatusLabel = (status) => {
  const map = {
    PENDING: 'Pendente',
    PROCESSING: 'Processando',
    COMPLETED: 'Concluído',
    FAILED: 'Falhou',
    sucesso: 'Concluído',
    processado: 'Concluído',
  }

  return map[status] || status || '—'
}

const getStatusClass = (status) => {
  if (status === 'COMPLETED' || status === 'sucesso' || status === 'processado') {
    return 'success'
  }

  if (status === 'FAILED') return 'danger'
  if (status === 'PROCESSING') return 'warning'

  return 'info'
}

const getCompetencia = (item) => {
  if (item?.competencia) return formatDateBR(item.competencia)

  if (item?.vigencia_inicio) {
    const [year, month] = String(item.vigencia_inicio).split('-')
    if (year && month) return `${month}/${year}`
  }

  return '—'
}

const getCondominiosImportacao = (item) => {
  if (Array.isArray(item?.condominios)) return item.condominios
  if (Array.isArray(item?.dados_requisicao?.condominios)) {
    return item.dados_requisicao.condominios
  }
  return []
}

const getFuncionariosImportacao = (item) =>
  getCondominiosImportacao(item).flatMap((condo) =>
    Array.isArray(condo?.funcionarios) ? condo.funcionarios : []
  )

const getMovimentacoesImportacao = (item) =>
  getFuncionariosImportacao(item).flatMap((func) =>
    Array.isArray(func?.movimentacoes) ? func.movimentacoes : []
  )

const getValorTotal = (item) => {
  const totalMovimentacoes = getMovimentacoesImportacao(item).reduce(
    (sum, mov) => sum + Number(mov?.valor || 0),
    0
  )

  return Number(
    totalMovimentacoes ||
      item?.valor_total ||
      item?.total ||
      item?.valor_total_beneficios ||
      item?.summary?.valor_total_beneficios ||
      item?.dados_requisicao?.summary?.valor_total_beneficios ||
      item?.dados_requisicao?.valor_total_beneficios ||
      item?.dados_requisicao?.total ||
      item?.dados_requisicao?.total_geral ||
      item?.dados_requisicao?.resumo?.valor_total_beneficios ||
      item?.dados_requisicao?.resumo?.total ||
      0
  )
}

const getQuantidade = (item) =>
  Number(
    item?.registros_processados ||
      item?.total_registros ||
      item?.total_movimentacoes ||
      item?.summary?.total_movimentacoes ||
      0
  )

export default function Faturamento() {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [importacoes, setImportacoes] = useState([])

  useEffect(() => {
    carregarFaturamentos()
  }, [])

async function carregarFaturamentos() {
  try {
    setLoading(true)
    setError('')

    const [ultimaImportacao, historicoData] = await Promise.all([
      entebenService.getUltimaImportacao(),
      entebenService.getImportacoes(),
    ])

    const historico = toArray(historicoData)

    const historicoComUltimaCompleta = historico.map((item, index) => {
      const isPrimeira = index === 0

      if (isPrimeira && ultimaImportacao) {
        return {
          ...item,
          ...ultimaImportacao,
          id: item.id || ultimaImportacao.id,
          faturamento_id: item.faturamento_id || ultimaImportacao.faturamento_id,
        }
      }

      return item
    })

    const comStatus = await Promise.all(
      historicoComUltimaCompleta.map(async (item) => {
        try {
          const statusData = await entebenService.getFaturamentoStatus(item.id)

          return {
            ...item,
            faturamento_status: statusData?.status || item.status,
            faturamento_progresso: statusData?.progresso,
            faturamento_competencia: statusData?.competencia,
            criado_em: statusData?.criado_em,
          }
        } catch {
          return {
            ...item,
            faturamento_status: item.status,
          }
        }
      })
    )

    setImportacoes(comStatus)
  } catch (err) {
    console.error('Erro ao carregar faturamentos:', err)
    setError('Não foi possível carregar os faturamentos.')
  } finally {
    setLoading(false)
  }
}

  async function baixarDocumento(faturamentoId, tipo = '') {
    try {
      const token = localStorage.getItem('accessToken')

      const baseUrl = 'https://vr-beneficios-backend-fedcorp-ju482.ondigitalocean.app/api'
      const url = `${baseUrl}/upload/faturamento/${faturamentoId}/download/${tipo}`

      const response = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        console.error('Erro HTTP:', response.status, url)
        throw new Error('Erro ao baixar documento')
      }

      const blob = await response.blob()
      const fileURL = window.URL.createObjectURL(blob)

      const nomeArquivo = tipo
        ? `${tipo.replaceAll('/', '').replaceAll('-', '_')}-${faturamentoId}.pdf`
        : `faturamento-${faturamentoId}.pdf`

      const a = document.createElement('a')
      a.href = fileURL
      a.download = nomeArquivo
      document.body.appendChild(a)
      a.click()
      a.remove()

      window.URL.revokeObjectURL(fileURL)
    } catch (err) {
      console.error('Erro ao baixar documento:', err)
      alert('Erro ao baixar documento.')
    }
  }

  async function baixarExportacao() {
    const token = localStorage.getItem('accessToken')

    const response = await fetch(
      'https://vr-beneficios-backend-fedcorp-ju482.ondigitalocean.app/api/upload/faturamento/2/download/',
      {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    )

    if (!response.ok) {
      alert('Não foi possível baixar a exportação.')
      return
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'faturamento.xlsx'
    document.body.appendChild(a)
    a.click()
    a.remove()

    window.URL.revokeObjectURL(url)
  }

  const gruposFiltrados = useMemo(() => {
    const query = search.trim().toLowerCase()

    return importacoes
      .map((item) => {
        const key = item.faturamento_id || item.faturamento?.id || item.id
        const label = `Importação ${item.id}`
        const status = item.faturamento_status || item.status
        const total = getValorTotal(item)
        const quantidadeBeneficios = getQuantidade(item)

        return {
          ...item,
          key,
          importacaoLabel: label,
          importacaoDate: formatDateBR(item.data_importacao),
          competencia: getCompetencia(item),
          status,
          total,
          quantidadeBeneficios,
          beneficios: [
            `Registros processados: ${item.registros_processados || 0}`,
            `Vigência: ${formatDateBR(item.vigencia_inicio)} até ${formatDateBR(
              item.vigencia_fim
            )}`,
            `Vencimento: ${formatDateBR(item.data_vencimento)}`,
          ],
        }
      })
      .filter((group) => {
        if (!query) return true

        return [
          group.importacaoLabel,
          group.key,
          group.competencia,
          group.status,
          group.nome_usuario,
          ...group.beneficios,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      })
      .sort((a, b) =>
        String(b.data_importacao || '').localeCompare(String(a.data_importacao || ''))
      )
  }, [importacoes, search])

  return (
    <div className="fatv2-page">
      <section className="fatv2-hero">
        <div>
          <p className="fatv2-eyebrow">Faturamento</p>
          <h1 className="fatv2-title">Documentos por importação</h1>
          <p className="fatv2-subtitle">
            Cada importação reúne os benefícios faturados e seus documentos vinculados.
          </p>
        </div>

        {/* <button className="fatv2-btn fatv2-btn-primary" onClick={baixarExportacao}>
          <Download size={14} />
          Exportar faturamento
        </button> */}
      </section>

      <section className="fatv2-toolbar">
        <div className="fatv2-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por importação, competência ou status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* <button className="fatv2-btn" onClick={carregarFaturamentos}>
          Atualizar
        </button> */}
      </section>

      {error && <div className="fatv2-empty">{error}</div>}

      {loading ? (
        <div className="fatv2-empty">Carregando faturamentos...</div>
      ) : (
        <section className="fatv2-list">
          {gruposFiltrados.map((group) => (
            <article key={group.key} className="fatv2-card">
              <div className="fatv2-card-top">
                <div className="fatv2-card-main">
                  <div className="fatv2-icon">
                    <FileText size={18} />
                  </div>

                  <div className="fatv2-main-text">
                    <h2>{group.importacaoLabel}</h2>
                    <p>ID/Faturamento: {group.key}</p>
                  </div>
                </div>

                <div className="fatv2-summary">
                  <div className="fatv2-summary-item">
                    <span>
                      <CalendarDays size={14} /> Importação
                    </span>
                    <strong>{group.importacaoDate}</strong>
                  </div>

                  <div className="fatv2-summary-item">
                    <span>
                      <Download size={14} /> Competência
                    </span>
                    <strong>{group.competencia}</strong>
                  </div>

                  <div className="fatv2-summary-item">
                    <span>
                      <Files size={14} /> Registros
                    </span>
                    <strong>{group.quantidadeBeneficios}</strong>
                  </div>

                  <div className="fatv2-summary-item">
                    <span>
                      <Receipt size={14} /> Total
                    </span>
                    <strong>R$ {formatMoney(group.total)}</strong>
                  </div>
                </div>
              </div>

              <div className="fatv2-card-body">
                <div className="fatv2-benefits">
                  <span className="fatv2-label">Resumo</span>

                  <div className="fatv2-benefit-tags">
                    <span className={`fatv2-tag ${getStatusClass(group.status)}`}>
                      {getStatusLabel(group.status)}
                      {group.faturamento_progresso != null
                        ? ` - ${group.faturamento_progresso}%`
                        : ''}
                    </span>

                    {group.beneficios.map((beneficio, index) => (
                      <span key={`${beneficio}-${index}`} className="fatv2-tag">
                        {beneficio}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="fatv2-docs">
                  <button
                    className="fatv2-btn"
                    onClick={() => baixarDocumento(group.key, 'boletos/')}
                  >
                    <Download size={14} />
                    Boleto
                  </button>

                  <button
                    className="fatv2-btn"
                    onClick={() => baixarDocumento(group.key, 'notas-fiscais/')}
                  >
                    <Download size={14} />
                    NF
                  </button>

                  <button
                    className="fatv2-btn"
                    onClick={() => baixarDocumento(group.key, 'notas-debito/')}
                  >
                    <Download size={14} />
                    Nota Débito
                  </button>

                  <button
                    className="fatv2-btn fatv2-btn-primary"
                    onClick={() => baixarDocumento(group.key)}
                  >
                    <Download size={14} />
                    Baixar todos
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}