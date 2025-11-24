import React, { use, useMemo, useState } from 'react'
import FileUpload from '../components/FileUpload'
import { PencilLine, Trash2, Check, X as XIcon } from 'lucide-react'
import '../styles/Importacao.css'
import { uploadService } from '../services/uploadService'

const importacoesRecentes = [
  { id: 'IMP-001', arquivo: 'folha_janeiro.txt', registros: 1250, status: 'sucesso', tipo: 'compra', data: '2025-10-10' },
  { id: 'IMP-002', arquivo: 'folha_fevereiro.txt', registros: 980, status: 'erro', tipo: 'faturamento', data: '2025-10-08' },
  { id: 'IMP-003', arquivo: 'folha_marco.csv', registros: 1340, status: 'sucesso', tipo: 'compra', data: '2025-10-05' },
  { id: 'IMP-004', arquivo: 'folha_abril.txt', registros: 760, status: 'processando', tipo: 'faturamento', data: '2025-10-03' }
]


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
  const [data, setData] = useState()
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

  async function handleResult({ status, file, rows }) {
   try {
        const response = await uploadService.uploadFile(file)
        setData(response)
       
       
        const id = 'IMP-' + response.file_upload_id
        const tipo = file.name.toLowerCase().includes('fat') ? 'faturamento' : 'compra'
        // [handleResult] Usa total_por_beneficiario da resposta, ou fallback para dados mockados
        const parsed = response.summary?.total_por_beneficiario || fakeParseRows(file)
        
        setLote({ id, arquivo: file.name, tipo, rows: parsed, excluidosPorColab: new Set() })
        setEditingIndex(null)
        setEditValue('')
        
        // [handleResult] Retorna o sucesso para o componente FileUpload atualizar o status
        return { success: true, message: response.detail || 'Importação concluída com sucesso.' };
        
    } catch (error) {
        
        const errorMessage = error.message.includes('API Error') ? error.message.split('API Error: ')[1] : 'Erro desconhecido na comunicação com o servidor.';
        console.error("Erro no processamento da importação:", error);

        // [handleResult] Retorna o erro para o componente FileUpload atualizar o status
        return { success: false, message: errorMessage };
    }
  }

  // [useMemo] linhas ativas
  const rowsAtivas = useMemo(() => {
    if (!lote?.rows?.length) return []
    if (!lote.excluidosPorColab?.size) return lote.rows
    
    return lote.rows.filter(r => !lote.excluidosPorColab.has(r.nome_funcionario || r.colaborador))
  }, [lote])

  // [useMemo] validação (> 2500 bloqueia)
  const linhasValidadas = useMemo(() =>
    // [useMemo] Usa r.valor_total ou r.valor para compatibilidade com dados mockados/reais
    rowsAtivas.map(r => ({ ...r, bloqueado: Number(r.valor_total || r.valor || r.valor_recarga_bene) > 2500 }))
 
  , [rowsAtivas])

  const totalBloqueios = useMemo(
    () => linhasValidadas.filter(r => r.bloqueado).length,
    [linhasValidadas]
  )


  const podeEnviar = linhasValidadas.length > 0 && totalBloqueios === 0

  const excluirColaborador = (idx, row) => {
    const colaboradorKey = row.nome_funcionario || row.colaborador; 
    
    if (!colaboradorKey) {
      console.error("Chave do colaborador não encontrada para exclusão.");
      return;
    }

    const novo = new Set(lote.excluidosPorColab)
    novo.add(colaboradorKey)
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

    const originalIndex = lote.rows.findIndex(r => {
      const originalKey = `${r.condominio}-${r.colaborador || r.nome_funcionario}-${r.valor || r.valor_total || r.valor_recarga_bene}`
      const currentKey = `${linha.condominio}-${linha.colaborador || linha.nome_funcionario}-${linha.valor || linha.valor_total || linha.valor_recarga_bene}`
      return originalKey === currentKey
    })

    if (originalIndex >= 0) {
      const clone = [...lote.rows]
      // [salvarEdicao] Determina a chave de valor para atualizar 
      const valorKey = clone[originalIndex].hasOwnProperty('valor_total') ? 'valor_total' : clone[originalIndex].hasOwnProperty('valor_recarga_bene') ? 'valor_recarga_bene' : 'valor';
      clone[originalIndex] = { ...clone[originalIndex], [valorKey]: v }
      setLote(prev => ({ ...prev, rows: clone }))
    } else {
      console.error("Linha original não encontrada para edição.");
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
    setData(null)
  }

  const abrirModalEnvio = () => setModalOpen(true)

  const confirmarEnvio = async (e) => { 
    e.preventDefault()
  
    // 1. Validação inicial
    if (!data || !data.data_to_backend) {
      console.error("Dados de envio (data.data_to_backend) não estão disponíveis.");
      return;
    }

    // 2. Clonar dados para manipulação
    const dataParaEnvio = JSON.parse(JSON.stringify(data)); 

    // --- 3. Identificar nomes a serem excluídos (Bloqueados pelo Usuário + Novos Funcionários) ---
    const excluidosManualmenteSet = lote.excluidosPorColab;

    // Nomes de novos funcionários (para serem removidos)
    const listaFuncionariosNovosOriginal = dataParaEnvio.data_to_backend.novos_registros?.funcionarios || [];
    const nomesFuncionariosNovosSet = new Set(
      listaFuncionariosNovosOriginal.map(f => f.nome_func || f.nome).filter(name => name)
    );
    
    // Total de nomes a serem excluídos das MOVIMENTACOES_DETALHADA
    const nomesExcluirTotal = new Set([
      ...excluidosManualmenteSet,
      ...nomesFuncionariosNovosSet 
    ]);
    
    // --- 4. Filtrar movimentacoes_detalhada ---
    const listaOriginal = dataParaEnvio.data_to_backend.movimentacoes_detalhada || []
    
    const listaFiltrada = listaOriginal.filter(item => {
      const colaboradorKey = item.nome_func || item.colaborador;
      return colaboradorKey && !nomesExcluirTotal.has(colaboradorKey);
    });

    dataParaEnvio.data_to_backend.movimentacoes_detalhada = listaFiltrada;

    // --- 5. Filtrar Novos Funcionários (Removendo do JSON de envio) ---
    dataParaEnvio.data_to_backend.novos_registros.funcionarios = listaFuncionariosNovosOriginal.filter(f => {
      const nomeNovo = f.nome_func || f.nome;
      return nomeNovo && !nomesFuncionariosNovosSet.has(nomeNovo); 
    });

    // Atualiza a contagem para 0
    if (dataParaEnvio.data_to_backend.novos_registros) {
      dataParaEnvio.data_to_backend.novos_registros["Total de funcionários novos"] = dataParaEnvio.data_to_backend.novos_registros.funcionarios.length;
    }
    
    // --- 6. Recalcular campos do Summary ---
    let totalMovimentacoes = 0;
    let valorTotalBeneficios = 0;
    const funcionariosUnicos = new Set();

    listaFiltrada.forEach(item => {
      totalMovimentacoes += 1;
      const valor = Number(item.valor_recarga_bene || item.valor_total || item.valor || 0); 
      valorTotalBeneficios += valor;
      funcionariosUnicos.add(item.nome_func || item.colaborador);
    });

    // Atualiza o summary
    if (dataParaEnvio.data_to_backend.summary) {
      dataParaEnvio.data_to_backend.summary.total_funcionarios = funcionariosUnicos.size;
      dataParaEnvio.data_to_backend.summary.total_movimentacoes = totalMovimentacoes;
      dataParaEnvio.data_to_backend.summary.valor_total_beneficios = valorTotalBeneficios.toFixed(2);
    }
    
    // --- 7. Adicionar dados do formulário ---
    dataParaEnvio.data_to_backend.periodo_inicio = formEnvio.periodoInicio
    dataParaEnvio.data_to_backend.periodo_fim = formEnvio.periodoFim
    dataParaEnvio.data_to_backend.competencia_mes = formEnvio.competenciaMes
    dataParaEnvio.data_to_backend.competencia_ano = formEnvio.competenciaAno
    dataParaEnvio.data_to_backend.vencimento = formEnvio.vencimento

    
    
    // --- 8. Chamada à Service para Confirmar o Upload (Adicionado) ---
    try {
        const responseEnvio = await uploadService.confirmUpload(dataParaEnvio.data_to_backend);
        console.log("Envio concluído:", responseEnvio);
        setModalOpen(false)
        window.location.href = "/"
        
    } catch (error) {
        console.error("Erro no envio do lote:", error);
        // Adicione aqui a lógica de erro (ex: mostrar modal de erro)
        setModalOpen(false)
        alert(`Erro no envio do lote.: ${error.message}`)
        
      }
    
    
  
  }


  const totalCompras = rowsAtivas.length
  const totalFaturamento = rowsAtivas.length

  return (
    <div className="importacao-container">
      <FileUpload onUpload={handleResult} />

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
              <span className="kpi-value">{data?.summary?.total_condominios || linhasValidadas.length}</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Condomínios novos</span>
              <span className="kpi-value">{data?.summary?.novos_registros?.["Total de condomínios novos"] || 0}</span>
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
                  const valorExibicao = r.valor_total || r.valor || r.valor_recarga_bene
                  const nomeColaborador = r.nome_funcionario || r.colaborador
                  
                  return (
                    <tr key={idx} className={r.bloqueado ? 'row-bloqueado' : ''}>
                      <td>{r.condominio}</td>
                      <td>{nomeColaborador}</td>
                      <td className="col-valor">
                        {!isEditing ? (
                          <>R$ {Number(valorExibicao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
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
                                  onClick={() => iniciarEdicao(idx, valorExibicao)}
                                >
                                  <PencilLine size={16} />
                                  <span className="btn-text">Editar</span>
                                </button>

                                <button
                                  className="btn-sm btn-outline btn-icon danger"
                                  title={`Excluir colaborador ${nomeColaborador}`}
                                  onClick={() => excluirColaborador(idx,r)}
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
          {/* Período de utilização  */}
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