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

const getCondominios = (data) =>
  Array.isArray(data?.condominios) ? data.condominios : []

const getFuncionarios = (data) =>
  getCondominios(data).flatMap((condo) =>
    Array.isArray(condo?.funcionarios) ? condo.funcionarios : []
  )

const getMovimentacoes = (data) =>
  getFuncionarios(data).flatMap((func) =>
    Array.isArray(func?.movimentacoes) ? func.movimentacoes : []
  )

const getValorTotal = (data) =>
  getMovimentacoes(data).reduce(
    (sum, mov) => sum + Number(mov?.valor || 0),
    0
  )

const getPreviewPeriodo = (data) => {
  if (data?.vigencia_inicio && data?.vigencia_fim) {
    return `${formatDateBR(data.vigencia_inicio)} até ${formatDateBR(data.vigencia_fim)}`
  }

  return '—'
}

const getPreviewId = (preview) =>
  preview?.id || preview?.file_upload_id || preview?.importacao_id || null

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

      const dadosRecebidos = location.state?.ultimaImportacao
      const dados =
        dadosRecebidos || (await entebenService.repetirUltimoFaturamento())

      if (!dados) {
        setError('Nenhuma movimentação anterior encontrada.')
        return
      }

      setPreview(dados)
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
      condominios: getCondominios(preview).length,
      colaboradores: getFuncionarios(preview).length,
      movimentacoes: getMovimentacoes(preview).length,
      valorTotal: getValorTotal(preview),
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

    if (!form.competencia.trim()) {
      return 'Preencha a competência.'
    }

    if (!form.referencia.trim()) {
      return 'Preencha a referência.'
    }

    if (!form.diasUteis.trim()) {
      return 'Preencha a quantidade de dias úteis.'
    }

    if (!form.vencimento.trim()) {
      return 'Preencha o vencimento.'
    }

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

        condominios: preview?.condominios || [],
      }

      console.log('PAYLOAD FINAL PARA BACKEND:', payload)

      /*
        Quando o backend confirmar o endpoint POST, entra aqui:

        await entebenService.criarFaturamento(payload)

        Exemplo no service:
        criarFaturamento: async (payload) => {
          return apiFetch('/ROTA_CONFIRMADA_PELO_BACKEND/', {
            method: 'POST',
            body: payload,
          })
        }
      */

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
                      <strong>
                        IMP-{getPreviewId(preview) || 'última'}
                      </strong>
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

                  {preview?.data_vencimento && (
                    <span>
                      Vencimento anterior:{' '}
                      <strong>{formatDateBR(preview.data_vencimento)}</strong>
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