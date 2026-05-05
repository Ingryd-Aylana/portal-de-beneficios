import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { entebenService } from '../../services/entebenService'

import '../../styles/FaturamentoFormulario.css'

const initialState = {
  competencia: '',
  referencia: '',
  empresa: '',
  beneficio: '',
  diasUteis: '',
  vencimento: '',
  observacao: '',
}

const formatCurrency = (value) =>
  `R$ ${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  })}`

const formatDateBR = (dateStr) => {
  if (!dateStr) return '—'

  const onlyDate = String(dateStr).split('T')[0]

  if (/^\d{4}-\d{2}-\d{2}$/.test(onlyDate)) {
    const [year, month, day] = onlyDate.split('-')
    return `${day}/${month}/${year}`
  }

  const date = new Date(`${onlyDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('pt-BR')
}

const toArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.results)) return value.results
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.importacoes)) return value.importacoes
  return []
}

const parseMaybeJson = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const getDadosRequisicao = (data) =>
  parseMaybeJson(data?.dados_requisicao) ||
  parseMaybeJson(data?.raw?.ultima?.dados_requisicao) ||
  parseMaybeJson(data?.raw?.metaUltima?.dados_requisicao) ||
  {}

const getCondominios = (data) => {
  const dadosReq = getDadosRequisicao(data)

  if (Array.isArray(data?.condominios) && data.condominios.length) {
    return data.condominios
  }

  if (Array.isArray(dadosReq?.condominios) && dadosReq.condominios.length) {
    return dadosReq.condominios
  }

  if (Array.isArray(data?.raw?.ultima?.condominios) && data.raw.ultima.condominios.length) {
    return data.raw.ultima.condominios
  }

  if (
    Array.isArray(data?.raw?.metaUltima?.condominios) &&
    data.raw.metaUltima.condominios.length
  ) {
    return data.raw.metaUltima.condominios
  }

  return []
}

const getFuncionarios = (data) =>
  getCondominios(data).flatMap((condo) => {
    if (Array.isArray(condo?.funcionarios)) return condo.funcionarios
    if (Array.isArray(condo?.colaboradores)) return condo.colaboradores
    return []
  })

const getMovimentacoes = (data) =>
  getFuncionarios(data).flatMap((func) => {
    if (Array.isArray(func?.movimentacoes)) return func.movimentacoes
    if (Array.isArray(func?.beneficios)) return func.beneficios
    return []
  })

const getValorTotal = (data) => {
  const dadosReq = getDadosRequisicao(data)

  const totalMovimentacoes = getMovimentacoes(data).reduce(
    (sum, mov) =>
      sum +
      Number(
        mov?.valor ||
          mov?.valor_total ||
          mov?.valor_beneficio ||
          mov?.total ||
          0
      ),
    0
  )

  return Number(
    totalMovimentacoes ||
      data?.resumo_anterior?.valorTotal ||
      data?.resumo_anterior?.valor_total ||
      data?.valor_total ||
      data?.total ||
      data?.valor_total_beneficios ||
      data?.summary?.valor_total_beneficios ||
      data?.summary?.total ||
      data?.resumo?.valor_total_beneficios ||
      data?.resumo?.total ||
      dadosReq?.valor_total_beneficios ||
      dadosReq?.valor_total ||
      dadosReq?.total ||
      dadosReq?.total_geral ||
      dadosReq?.summary?.valor_total_beneficios ||
      dadosReq?.summary?.total ||
      dadosReq?.resumo?.valor_total_beneficios ||
      dadosReq?.resumo?.total ||
      data?.raw?.ultima?.valor_total ||
      data?.raw?.ultima?.total ||
      data?.raw?.ultima?.summary?.valor_total_beneficios ||
      data?.raw?.metaUltima?.valor_total ||
      data?.raw?.metaUltima?.total ||
      data?.raw?.metaUltima?.summary?.valor_total_beneficios ||
      0
  )
}

const getQtdCondominios = (data) => {
  const dadosReq = getDadosRequisicao(data)

  return Number(
    getCondominios(data).length ||
      data?.resumo_anterior?.condominios ||
      data?.total_condominios ||
      data?.qtd_condominios ||
      data?.summary?.total_condominios ||
      dadosReq?.total_condominios ||
      dadosReq?.qtd_condominios ||
      dadosReq?.summary?.total_condominios ||
      data?.raw?.metaUltima?.total_condominios ||
      0
  )
}

const getQtdColaboradores = (data) => {
  const dadosReq = getDadosRequisicao(data)

  return Number(
    getFuncionarios(data).length ||
      data?.resumo_anterior?.colaboradores ||
      data?.total_funcionarios ||
      data?.qtd_funcionarios ||
      data?.total_colaboradores ||
      data?.registros_processados ||
      data?.summary?.total_funcionarios ||
      data?.summary?.total_colaboradores ||
      dadosReq?.total_funcionarios ||
      dadosReq?.qtd_funcionarios ||
      dadosReq?.total_colaboradores ||
      dadosReq?.summary?.total_funcionarios ||
      dadosReq?.summary?.total_colaboradores ||
      data?.raw?.metaUltima?.registros_processados ||
      data?.raw?.ultima?.registros_processados ||
      0
  )
}

const getQtdMovimentacoes = (data) => {
  const dadosReq = getDadosRequisicao(data)

  return Number(
    getMovimentacoes(data).length ||
      data?.resumo_anterior?.movimentacoes ||
      data?.total_movimentacoes ||
      data?.qtd_movimentacoes ||
      data?.registros_processados ||
      data?.summary?.total_movimentacoes ||
      dadosReq?.total_movimentacoes ||
      dadosReq?.qtd_movimentacoes ||
      dadosReq?.summary?.total_movimentacoes ||
      data?.raw?.metaUltima?.registros_processados ||
      data?.raw?.ultima?.registros_processados ||
      0
  )
}

const getPreviewPeriodo = (data) => {
  const inicio =
    data?.vigencia_inicio ||
    data?.raw?.metaUltima?.vigencia_inicio ||
    data?.raw?.ultima?.vigencia_inicio

  const fim =
    data?.vigencia_fim ||
    data?.raw?.metaUltima?.vigencia_fim ||
    data?.raw?.ultima?.vigencia_fim

  if (inicio && fim) {
    return `${formatDateBR(inicio)} até ${formatDateBR(fim)}`
  }

  return '—'
}

const getPreviewVencimento = (data) =>
  data?.data_vencimento ||
  data?.vencimento ||
  data?.raw?.metaUltima?.data_vencimento ||
  data?.raw?.ultima?.data_vencimento ||
  ''

const getPreviewId = (preview) =>
  preview?.id ||
  preview?.file_upload_id ||
  preview?.importacao_id ||
  preview?.faturamento_id ||
  preview?.raw?.metaUltima?.id ||
  preview?.raw?.ultima?.id ||
  null

export default function FaturamentoFormulario({ modo = 'novo' }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState(initialState)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (modo === 'repetir') {
      carregarUltimoFaturamento()
    }
  }, [modo])

  async function carregarUltimoFaturamento() {
    try {
      setLoading(true)
      setError('')

      const dadosState = location.state?.ultimaImportacao || null

      const [ultimaImportacao, historicoData] = await Promise.all([
        entebenService.getUltimaImportacao(),
        entebenService.getImportacoes(),
      ])

      const historico = toArray(historicoData)
      const metaUltima = historico[0] || null

      const dados = {
        ...(dadosState || {}),
        ...(metaUltima || {}),
        ...(ultimaImportacao || {}),
        raw: {
          state: dadosState,
          metaUltima,
          ultima: ultimaImportacao,
        },
      }

      const condominios =
        getCondominios(ultimaImportacao).length > 0
          ? getCondominios(ultimaImportacao)
          : getCondominios(metaUltima).length > 0
            ? getCondominios(metaUltima)
            : getCondominios(dadosState)

      const dadosCompletos = {
        ...dados,
        condominios,
        resumo_anterior: {
          condominios:
            condominios.length ||
            getQtdCondominios(ultimaImportacao) ||
            getQtdCondominios(metaUltima) ||
            getQtdCondominios(dadosState),

          colaboradores:
            getQtdColaboradores({ ...dados, condominios }) ||
            getQtdColaboradores(ultimaImportacao) ||
            getQtdColaboradores(metaUltima) ||
            getQtdColaboradores(dadosState),

          movimentacoes:
            getQtdMovimentacoes({ ...dados, condominios }) ||
            getQtdMovimentacoes(ultimaImportacao) ||
            getQtdMovimentacoes(metaUltima) ||
            getQtdMovimentacoes(dadosState),

          valorTotal:
            getValorTotal({ ...dados, condominios }) ||
            getValorTotal(ultimaImportacao) ||
            getValorTotal(metaUltima) ||
            getValorTotal(dadosState),
        },
      }

      if (!ultimaImportacao && !metaUltima && !dadosState) {
        setError('Nenhuma movimentação anterior encontrada.')
        return
      }

      console.log('PREVIEW FATURAMENTO ANTERIOR:', dadosCompletos)
      setPreview(dadosCompletos)
    } catch (error) {
      console.error('Erro ao carregar última movimentação:', error)
      setError('Não foi possível carregar a última movimentação.')
    } finally {
      setLoading(false)
    }
  }

  const previewResumo = useMemo(() => {
    if (!preview) {
      return {
        condominios: 0,
        colaboradores: 0,
        movimentacoes: 0,
        valorTotal: 0,
      }
    }

    return {
      condominios:
        Number(preview?.resumo_anterior?.condominios) ||
        getQtdCondominios(preview),

      colaboradores:
        Number(preview?.resumo_anterior?.colaboradores) ||
        getQtdColaboradores(preview),

      movimentacoes:
        Number(preview?.resumo_anterior?.movimentacoes) ||
        getQtdMovimentacoes(preview),

      valorTotal:
        Number(preview?.resumo_anterior?.valorTotal) ||
        getValorTotal(preview),
    }
  }, [preview])

  function handleChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function validateForm() {
    if (!preview && modo === 'repetir') {
      return 'Nenhuma base de faturamento encontrada.'
    }

    if (!form.competencia.trim()) return 'Preencha a competência.'
    if (!form.referencia.trim()) return 'Preencha a referência.'
    if (!form.diasUteis.trim()) return 'Preencha a quantidade de dias úteis.'
    if (!form.vencimento.trim()) return 'Preencha o vencimento.'

    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')

      const validationError = validateForm()

      if (validationError) {
        setError(validationError)
        return
      }

      const importacaoId = getPreviewId(preview)

      const payload = {
        competencia: form.competencia,
        referencia: form.referencia,
        dias_uteis: form.diasUteis,
        data_vencimento: form.vencimento,
        observacao: form.observacao,

        importacao_id: importacaoId,
        faturamento_id: importacaoId,

        resumo_anterior: previewResumo,
        condominios: getCondominios(preview),
      }

      console.log('PAYLOAD FINAL PARA BACKEND:', payload)

      alert('Payload pronto para envio ao backend. Confira o console.')
    } catch (error) {
      console.error(error)
      setError('Não foi possível criar o faturamento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fat-form-page">
      <div className="fat-form-card">
        <div className="fat-form-header">
          <h1>
            {modo === 'repetir'
              ? 'Repetir último faturamento'
              : 'Novo faturamento'}
          </h1>

          <p className="fat-form-subtitle">
            {modo === 'repetir'
              ? 'Preencha os dados do novo faturamento usando a última movimentação apenas como base.'
              : 'Preencha os dados para criar um novo faturamento.'}
          </p>
        </div>

        {error && <div className="fat-form-alert error">{error}</div>}

        {loading ? (
          <div className="fat-form-loading">
            Carregando última movimentação...
          </div>
        ) : (
          <>
            {modo === 'repetir' && preview && (
              <div className="fat-preview-card">
                <div className="fat-preview-header">
                  <div>
                    <h3>Preview do mês anterior</h3>
                    <p>
                      Base:{' '}
                      <strong>IMP-{getPreviewId(preview) || 'última'}</strong>
                    </p>
                  </div>
                </div>

                <div className="fat-preview-grid">
                  <div className="fat-preview-item">
                    <span>Condomínios</span>
                    <strong>{previewResumo.condominios}</strong>
                  </div>

                  <div className="fat-preview-item">
                    <span>Colaboradores</span>
                    <strong>{previewResumo.colaboradores}</strong>
                  </div>

                  <div className="fat-preview-item">
                    <span>Movimentações</span>
                    <strong>{previewResumo.movimentacoes}</strong>
                  </div>

                  <div className="fat-preview-item">
                    <span>Valor total anterior</span>
                    <strong>{formatCurrency(previewResumo.valorTotal)}</strong>
                  </div>
                </div>

                <br />

                <div className="fat-preview-meta">
                  <span>
                    Vigência anterior:{' '}
                    <strong>{getPreviewPeriodo(preview)}</strong>
                  </span>

                  <br />
                  <br />

                  {getPreviewVencimento(preview) && (
                    <span>
                      Vencimento anterior:{' '}
                      <strong>{formatDateBR(getPreviewVencimento(preview))}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="fat-form">
              <div className="fat-form-grid">
                <div className="form-group">
                  <label htmlFor="competencia">Competência</label>
                  <input
                    id="competencia"
                    name="competencia"
                    value={form.competencia}
                    onChange={handleChange}
                    placeholder="Ex: 05/2026"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="referencia">Referência</label>
                  <input
                    id="referencia"
                    name="referencia"
                    value={form.referencia}
                    onChange={handleChange}
                    placeholder="Ex: Maio/2026"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="diasUteis">Quantidade de dias úteis</label>
                  <input
                    id="diasUteis"
                    name="diasUteis"
                    value={form.diasUteis}
                    onChange={handleChange}
                    placeholder="Ex: 20"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vencimento">Vencimento</label>
                  <input
                    id="vencimento"
                    name="vencimento"
                    value={form.vencimento}
                    onChange={handleChange}
                    placeholder="Ex: 2026-05-15"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="observacao">Observação</label>
                <textarea
                  id="observacao"
                  name="observacao"
                  value={form.observacao}
                  onChange={handleChange}
                  placeholder="Adicione uma observação, se necessário"
                  rows={5}
                />
              </div>

              <div className="fat-form-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => navigate('/faturamento')}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar faturamento'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}