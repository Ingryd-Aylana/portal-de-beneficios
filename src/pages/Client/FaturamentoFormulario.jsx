import React, { useEffect, useState } from 'react'
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
  itens: [],
  observacao: '',
}

function formatCompetenciaFromDate(dateStr) {
  if (!dateStr) return ''

  const [ano, mes] = dateStr.split('-')

  if (!ano || !mes) return ''

  return `${mes}/${ano}`
}

function formatReferencia(vigenciaInicio, vigenciaFim) {
  if (!vigenciaInicio || !vigenciaFim) return ''

  const inicio = new Date(`${vigenciaInicio}T00:00:00`).toLocaleDateString('pt-BR')
  const fim = new Date(`${vigenciaFim}T00:00:00`).toLocaleDateString('pt-BR')

  return `${inicio} até ${fim}`
}

function getFuncionariosFromCondominios(condominios = []) {
  return condominios.flatMap((condo) =>
    Array.isArray(condo?.funcionarios) ? condo.funcionarios : []
  )
}

function getMovimentacoesFromCondominios(condominios = []) {
  return getFuncionariosFromCondominios(condominios).flatMap((func) =>
    Array.isArray(func?.movimentacoes) ? func.movimentacoes : []
  )
}

export default function FaturamentoFormulario({ modo = 'novo' }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState(initialState)
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
      const dados = dadosRecebidos || await entebenService.repetirUltimoFaturamento()

      if (!dados) {
        setError('Nenhum faturamento anterior encontrado.')
        return
      }

      const condominios = Array.isArray(dados?.condominios) ? dados.condominios : []
      const movimentacoes = getMovimentacoesFromCondominios(condominios)

      setForm({
        competencia:
          dados?.competencia ||
          formatCompetenciaFromDate(dados?.vigencia_inicio) ||
          formatCompetenciaFromDate(dados?.data_vencimento),

        referencia:
          dados?.referencia ||
          formatReferencia(dados?.vigencia_inicio, dados?.vigencia_fim),

        empresa: dados?.empresa || '',
        beneficio: dados?.beneficio || '',
        diasUteis: dados?.diasUteis || '',
        vencimento: dados?.data_vencimento || dados?.vencimento || '',
        itens: condominios,
        observacao: `Base repetida da importação ${dados?.id ? `IMP-${dados.id}` : 'anterior'} com ${condominios.length} condomínio(s) e ${movimentacoes.length} movimentação(ões).`,
      })
    } catch (error) {
      console.error('Erro ao carregar último faturamento:', error)
      setError('Não foi possível carregar o último faturamento.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')

      console.log('FATURAMENTO PARA SALVAR:', form)

      alert('Faturamento preparado com sucesso!')
      navigate('/faturamento')
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
              ? 'Os dados do último faturamento foram carregados para edição.'
              : 'Preencha os dados para criar um novo faturamento.'}
          </p>
        </div>

        {error && <div className="fat-form-alert error">{error}</div>}

        {loading ? (
          <div className="fat-form-loading">
            Carregando dados do último faturamento...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="fat-form">
            <div className="fat-form-grid">
              <div className="form-group">
                <label htmlFor="competencia">Competência</label>
                <input
                  id="competencia"
                  name="competencia"
                  value={form.competencia}
                  onChange={handleChange}
                  placeholder="Ex: 04/2026"
                />
              </div>

              <div className="form-group">
                <label htmlFor="referencia">Referência</label>
                <input
                  id="referencia"
                  name="referencia"
                  value={form.referencia}
                  onChange={handleChange}
                  placeholder="Ex: Abril/2026"
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
        )}
      </div>
    </div>
  )
}