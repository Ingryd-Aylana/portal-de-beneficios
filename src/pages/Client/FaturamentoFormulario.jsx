import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/FaturamentoFormulario.css'

const initialState = {
    competencia: '',
    referencia: '',
    empresa: '',
    beneficio: '',
    itens: [],
    observacao: '',
}

function gerarNovaCompetencia(comp) {
    if (!comp || !comp.includes('/')) return ''

    const [mes, ano] = comp.split('/')
    const mesNumero = Number(mes)
    const anoNumero = Number(ano)

    if (Number.isNaN(mesNumero) || Number.isNaN(anoNumero)) return ''

    const novaData = new Date(anoNumero, mesNumero, 1)

    return `${String(novaData.getMonth() + 1).padStart(2, '0')}/${novaData.getFullYear()}`
}

export default function FaturamentoFormulario({ modo = 'novo' }) {
    const navigate = useNavigate()

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

            const response = await fetch('/api/faturamento/ultimo')

            if (!response.ok) {
                throw new Error('Erro ao buscar último faturamento')
            }

            const data = await response.json()

            setForm({
                competencia: gerarNovaCompetencia(data.competencia),
                referencia: data.referencia || '',
                empresa: data.empresa || '',
                beneficio: data.beneficio || '',
                itens: data.itens || [],
                observacao: data.observacao || '',
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

            const response = await fetch('/api/faturamento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            if (!response.ok) {
                throw new Error('Erro ao salvar faturamento')
            }

            alert('Faturamento criado com sucesso!')
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
                                <label htmlFor="referencia">Quantidade de dias úteis</label>
                                <input
                                    id="diasUteis"
                                    name="diasUteis"
                                    value={form.diasUteis}
                                    onChange={handleChange}
                                    placeholder="Ex: 20"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="beneficio">Vencimento</label>
                                <input
                                    id="vencimento"
                                    name="vencimento"
                                    value={form.vencimento}
                                    onChange={handleChange}
                                    placeholder="Ex: 10"
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