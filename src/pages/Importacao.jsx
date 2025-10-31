import React, { useMemo, useState } from 'react'
import FileUpload from '../components/FileUpload'
import { PencilLine, Trash2, Check, X as XIcon } from 'lucide-react'
import '../styles/Importacao.css'

const importacoesRecentes = [
  { id: 'IMP-001', arquivo: 'folha_janeiro.txt', registros: 1250, status: 'sucesso', tipo: 'compra', data: '2025-10-10' },
  { id: 'IMP-002', arquivo: 'folha_fevereiro.txt', registros: 980, status: 'erro', tipo: 'faturamento', data: '2025-10-08' },
  { id: 'IMP-003', arquivo: 'folha_marco.csv', registros: 1340, status: 'sucesso', tipo: 'compra', data: '2025-10-05' },
  { id: 'IMP-004', arquivo: 'folha_abril.txt', registros: 760, status: 'processando', tipo: 'faturamento', data: '2025-10-03' }
]

const condominiosCadastrados = new Set([
  'Solar das Rosas',
  'Jardim de Sulacap',
  'Edificio São João',
  'Condominio Parque Onix'
])

function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

const MESES = [
  { label: 'Janeiro', value: '01' },
  { label: 'Fevereiro', value: '02' },
  { label: 'Março', value: '03' },
  { label: 'Abril', value: '04' },
  { label: 'Maio', value: '05' },
  { label: 'Junho', value: '06' },
  { label: 'Julho', value: '07' },
  { label: 'Agosto', value: '08' },
  { label: 'Setembro', value: '09' },
  { label: 'Outubro', value: '10' },
  { label: 'Novembro', value: '11' },
  { label: 'Dezembro', value: '12' }
]

function rangeAnos(qtd = 6) {
  const anoAtual = new Date().getFullYear()
    return Array.from({ length: qtd }, (_, i) => anoAtual - 2 + i)
}

export default function Importacao() {
  const [items, setItems] = useState(importacoesRecentes)

    const [lote, setLote] = useState({
    id: null,
    arquivo: null,
    tipo: null,
    rows: [],
    excluidosPorColab: new Set()
  })

  // edição 
  const [editingIndex, setEditingIndex] = useState(null)
  const [editValue, setEditValue] = useState('')

  // modal envio
  const [modalOpen, setModalOpen] = useState(false)
  const [formEnvio, setFormEnvio] = useState({
    periodoInicio: '',
    periodoFim: '',
    competenciaMes: '',
    competenciaAno: String(new Date().getFullYear()),
    vencimento: ''
  })

  function fakeParseRows(file) {
    const nomes = ['Solar das Rosas', 'Condominio Parque Onix', 'Residencial Atlântico', 'Village das Palmeiras', 'Edificio São João']
    const colabs = ['Ana Lima', 'Carlos Souza', 'João Pedro', 'Maria Fernanda']
    const n = 24 + Math.floor(Math.random() * 26)
    return Array.from({ length: n }).map(() => {
      const condominio = nomes[Math.floor(Math.random() * nomes.length)]
      const colaborador = colabs[Math.floor(Math.random() * colabs.length)]
      const base = 1200 + Math.floor(Math.random() * 1800)
      const valor = Math.random() < 0.2 ? (2600 + Math.floor(Math.random() * 1500)) : base
      return { condominio, colaborador, valor }
    })
  }

  function handleResult({ status, file, rows }) {
    const id = 'IMP-' + (1000 + Math.floor(Math.random() * 9000))
    const tipo = file.name.toLowerCase().includes('fat') ? 'faturamento' : 'compra'
    const parsed = Array.isArray(rows) && rows.length ? rows : fakeParseRows(file)
    setLote({ id, arquivo: file.name, tipo, rows: parsed, excluidosPorColab: new Set() })
    setEditingIndex(null)
    setEditValue('')
  }

  // linhas ativas
  const rowsAtivas = useMemo(() => {
    if (!lote?.rows?.length) return []
    if (!lote.excluidosPorColab?.size) return lote.rows
    return lote.rows.filter(r => !lote.excluidosPorColab.has(r.colaborador))
  }, [lote])

  // validação (> 2500 bloqueia)
  const linhasValidadas = useMemo(() =>
    rowsAtivas.map(r => ({ ...r, bloqueado: Number(r.valor) > 2500 }))
  , [rowsAtivas])


  const totalBloqueios = useMemo(
    () => linhasValidadas.filter(r => r.bloqueado).length,
    [linhasValidadas]
  )

  // totais condomínios antigos e novos
  const { totalCondUnicos, totalCondNovos } = useMemo(() => {
    const unicos = new Set()
    for (const r of linhasValidadas) unicos.add(r.condominio)
    let novos = 0
    unicos.forEach(c => { if (!condominiosCadastrados.has(c)) novos += 1 })
    return { totalCondUnicos: unicos.size, totalCondNovos: novos }
  }, [linhasValidadas])

  const podeEnviar = linhasValidadas.length > 0 && totalBloqueios === 0

  // ações
  const excluirColaborador = (colab) => {
    const novo = new Set(lote.excluidosPorColab)
    novo.add(colab)
    setLote(prev => ({ ...prev, excluidosPorColab: novo }))
    if (editingIndex !== null) { setEditingIndex(null); setEditValue('') }
  }

  const iniciarEdicao = (idx, valorAtual) => {
    setEditingIndex(idx)
    setEditValue(String(valorAtual).replace(',', '.'))
  }

  const salvarEdicao = (idx) => {
    const v = Number(editValue)
    if (Number.isNaN(v) || v <= 0) return
    const linha = linhasValidadas[idx]
    const originalIndex = lote.rows.findIndex(r =>
      r.condominio === linha.condominio &&
      r.colaborador === linha.colaborador &&
      r.valor === linha.valor
    )
    if (originalIndex >= 0) {
      const clone = [...lote.rows]
      clone[originalIndex] = { ...clone[originalIndex], valor: v }
      setLote(prev => ({ ...prev, rows: clone }))
    }
    setEditingIndex(null)
    setEditValue('')
  }

  const cancelarEdicao = () => {
    setEditingIndex(null)
    setEditValue('')
  }

  const limparLote = () => {
    setLote({ id: null, arquivo: null, tipo: null, rows: [], excluidosPorColab: new Set() })
    setFormEnvio({
      periodoInicio: '',
      periodoFim: '',
      competenciaMes: '',
      competenciaAno: String(new Date().getFullYear()),
      vencimento: ''
    })
    setModalOpen(false)
    setEditingIndex(null)
    setEditValue('')
  }

  const abrirModalEnvio = () => setModalOpen(true)

  const confirmarEnvio = (e) => {
    e.preventDefault()
    const { periodoInicio, periodoFim, competenciaMes, competenciaAno, vencimento } = formEnvio
    if (!periodoInicio || !periodoFim || !competenciaMes || !competenciaAno || !vencimento) return

    const competencia = `${competenciaAno}-${competenciaMes}`

    const novo = {
      id: lote.id,
      arquivo: lote.arquivo,
      registros: linhasValidadas.length,
      status: 'sucesso',
      tipo: lote.tipo,
      data: new Date().toISOString().slice(0, 10),
      competencia,
      periodo: `${periodoInicio} a ${periodoFim}`,
      vencimento
    }
    setItems([novo, ...items])
    limparLote()
  }

  const totalCompras = items.filter(i => i.tipo === 'compra').length
  const totalFaturamento = items.filter(i => i.tipo === 'faturamento').length

  return (
    <div className="importacao-container">
      <FileUpload onResult={handleResult} />

      {/* KPIs do histórico */}
      <div className="importacao-totais">
        <div className="importacao-card compra">
          <h3>Compras de Benefícios</h3>
          <p className="valor">{totalCompras}</p>
        </div>
        <div className="importacao-card faturamento">
          <h3>Faturamento dos Benefícios</h3>
          <p className="valor">{totalFaturamento}</p>
        </div>
      </div>

      {/* Lote atual */}
      {lote.id && (
        <div className="lote-card">
          <div className="lote-header">
            <div>
              <h3>Pré-validação do Lote</h3>
              <small>Arquivo: <strong>{lote.arquivo}</strong> • Tipo: <strong>{lote.tipo}</strong></small>
            </div>
            <button className="btn-ghost" onClick={limparLote}>Descartar lote</button>
          </div>

          {/* KPIs do lote */}
          <div className="lote-kpis">
            <div className="kpi">
              <span className="kpi-label">Condomínios importados</span>
              <span className="kpi-value">{totalCondUnicos}</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Condomínios novos</span>
              <span className="kpi-value">{totalCondNovos}</span>
            </div>
            <div className={`kpi ${totalBloqueios > 0 ? 'kpi-alert' : ''}`}>
              <span className="kpi-label">Registros bloqueados (&gt; R$ 2.500)</span>
              <span className="kpi-value">{totalBloqueios}</span>
            </div>
          </div>

          {/* Tabela */}
          <div className="tabela-wrapper">
            <table className="tabela-importacao">
              <thead>
                <tr>
                  <th>Condomínio</th>
                  <th>Colaborador</th>
                  <th className="col-valor">Valor</th>
                  <th className="col-status">Status</th>
                  <th className="col-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                {linhasValidadas.map((r, idx) => {
                  const isEditing = editingIndex === idx
                  return (
                    <tr key={idx} className={r.bloqueado ? 'row-bloqueado' : ''}>
                      <td>{r.condominio}</td>
                      <td>{r.colaborador}</td>
                      <td className="col-valor">
                        {!isEditing ? (
                          <>R$ {Number(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                        ) : (
                          <div className="edit-inline">
                            <span>R$</span>
                            <input
                              className="input-valor"
                              type="number"
                              step="0.01"
                              min="0"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              autoFocus
                            />
                          </div>
                        )}
                      </td>
                      <td className="col-status">
                        {r.bloqueado ? <span className="tag tag-danger">Bloqueado</span> : <span className="tag tag-ok">OK</span>}
                      </td>
                      <td className="col-acoes">
                        {!isEditing ? (
                          <div className="acoes-inline">
                            {r.bloqueado && (
                              <>
                                <button
                                  className="btn-sm btn-outline btn-icon"
                                  title="Editar valor"
                                  onClick={() => iniciarEdicao(idx, r.valor)}
                                >
                                  <PencilLine size={16} />
                                  <span className="btn-text">Editar</span>
                                </button>

                                <button
                                  className="btn-sm btn-outline btn-icon danger"
                                  title={`Excluir colaborador ${r.colaborador}`}
                                  onClick={() => excluirColaborador(r.colaborador)}
                                >
                                  <Trash2 size={16} />
                                  <span className="btn-text">Excluir</span>
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="edit-actions">
                            <button
                              className="btn-sm btn-primary btn-icon"
                              title="Salvar"
                              onClick={() => salvarEdicao(idx)}
                            >
                              <Check size={16} />
                              <span className="btn-text">Salvar</span>
                            </button>
                            <button
                              className="btn-sm btn-ghost btn-icon"
                              title="Cancelar"
                              onClick={cancelarEdicao}
                            >
                              <XIcon size={16} />
                              <span className="btn-text">Cancelar</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Ações */}
          <div className="lote-actions">
            <button className="btn-primary" disabled={!podeEnviar} onClick={abrirModalEnvio}>
              Enviar para importação
            </button>
            {!podeEnviar && <span className="hint">Resolva os bloqueios para habilitar o envio.</span>}
          </div>
        </div>
      )}

      {/* Modal de envio */}
      <Modal open={modalOpen} title="Informações obrigatórias" onClose={() => setModalOpen(false)}>
        <form onSubmit={confirmarEnvio} className="form-grid">
          {/* Período de utilização  */}
          <div className="form-row two-cols">
            <label>
              <span>Período de Utilização — Início</span>
              <input
                type="date"
                value={formEnvio.periodoInicio}
                onChange={e => setFormEnvio(prev => ({ ...prev, periodoInicio: e.target.value }))}
                required
              />
            </label>
            <label>
              <span>Período de Utilização — Fim</span>
              <input
                type="date"
                min={formEnvio.periodoInicio || undefined}
                value={formEnvio.periodoFim}
                onChange={e => setFormEnvio(prev => ({ ...prev, periodoFim: e.target.value }))}
                required
              />
            </label>
          </div>

          {/* Competência */}
          <div className="form-row two-cols">
            <label>
              <span>Competência — Mês</span>
              <select
                value={formEnvio.competenciaMes}
                onChange={e => setFormEnvio(prev => ({ ...prev, competenciaMes: e.target.value }))}
                required
              >
                <option value="" disabled>Selecione o mês</option>
                {MESES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>
            
          </div>

          {/* Vencimento */}
          <label>
            <span>Vencimento</span>
            <input
              type="date"
              value={formEnvio.vencimento}
              onChange={e => setFormEnvio(prev => ({ ...prev, vencimento: e.target.value }))}
              required
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Confirmar envio</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
