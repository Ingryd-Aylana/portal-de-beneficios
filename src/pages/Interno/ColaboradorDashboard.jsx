import React, { useMemo, useRef, useState, useEffect } from 'react'
import {
  Download,
  Search,
  CalendarDays,
  FileSpreadsheet,
  X,
  Upload,
  FileText,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

import '../../styles/ColaboradorDashboard.css'
import { faturamentoService } from '../../services/faturamentoService'

const fmtDate = (s) => {
  if (!s) return '-'

  const value = String(s)

  if (value.includes('/')) return value

  if (value.includes('T')) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR')
    }
  }

  const parts = value.split('-')

  if (parts.length === 3) {
    if (parts[0]?.length === 4) {
      const [y, m, d] = parts
      return `${d}/${m}/${y}`
    }

    const [d, m, y] = parts
    return y ? `${d}/${m}/${y}` : value
  }

  return value
}

const norm = (s) =>
  (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

function Toasts({ toasts, onClose }) {
  return (
    <div className="cf-toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`cf-toast ${t.type}`}>
          <div className="cf-toast-icon">
            {t.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : t.type === 'error' ? (
              <XCircle size={16} />
            ) : t.type === 'warning' ? (
              <AlertTriangle size={16} />
            ) : (
              <Info size={16} />
            )}
          </div>

          <div>
            {t.title && <div className="cf-toast-title">{t.title}</div>}
            <div className="cf-toast-message">{t.message}</div>
          </div>

          <button className="cf-toast-close" onClick={() => onClose(t.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  confirmColor = '#2563eb',
  loading = false,
}) {
  if (!open) return null

  return (
    <div
      className="cf-overlay"
      onMouseDown={(e) =>
        e.target.classList.contains('cf-overlay') && !loading && onCancel()
      }
    >
      <div
        className="cf-modal"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 400 }}
      >
        <div className="cf-modal-header">
          <div>
            <div className="cf-modal-title">{title}</div>
          </div>

          <button className="cf-modal-close" onClick={onCancel} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <div className="cf-modal-body">
          <p className="cf-confirm-msg">{message}</p>
        </div>

        <div className="cf-modal-footer">
          <button className="cf-btn secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>

          <button
            className="cf-btn primary"
            onClick={onConfirm}
            disabled={loading}
            style={{ background: confirmColor, borderColor: confirmColor }}
          >
            {loading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

const statusLabel = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
}

export default function ColaboradorDashboard() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)

  const [importOpen, setImportOpen] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState(null)
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const fileRef = useRef(null)

  const [toasts, setToasts] = useState([])
  const [confirm, setConfirm] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  const [confirmFinalize, setConfirmFinalize] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [cancelPedido, setCancelPedido] = useState(null)

  const pushToast = ({
    type = 'info',
    title = '',
    message = '',
    duration = 3500,
  }) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, type, title, message }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }

  const closeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  async function carregarPedidos() {
    try {
      setLoading(true)

      const response = await faturamentoService.listarImportacoes()

      const lista = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.results)
            ? response.results
            : []

      console.log('RAW API:', lista)

      const pedidosFormatados = lista.map((p) => ({
        id: p.id,
        dataVencimento: p.data_vencimento || p.dataVencimento || '-',
        mesUtilizacao: p.vigencia_inicio
          ? new Date(p.vigencia_inicio).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          : p.mesUtilizacao || '-',
        quantidadeDias: p.total_registros || p.registros_processados || '-',
        status: p.status?.toLowerCase() || 'pending',
        aprovadoEm: p.data_importacao || p.aprovadoEm || '-',
        canceladoEm: null,
        motivoCancelamento: '',
        documentosImportados: [],
        importadoEm: p.data_importacao || null,
        excelUrl: p.url || null,
        dadosRequisicao: p,
      }))

      console.log('FORMATADO:', pedidosFormatados)
      setPedidos(pedidosFormatados)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)

      pushToast({
        type: 'error',
        title: 'Erro ao carregar',
        message: 'Não foi possível carregar as importações do dashboard.',
        duration: 5000,
      })

      setPedidos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarPedidos()
  }, [])

  const stats = useMemo(
    () => ({
      total: pedidos.length,
      aprovados: pedidos.filter((p) => p.status === 'aprovado').length,
      emFat: pedidos.filter((p) => p.status === 'em_faturamento').length,

      faturados: pedidos.filter((p) => p.status === 'faturado').length,
      cancelados: pedidos.filter((p) => p.status === 'cancelado').length,
    }),
    [pedidos]
  )

  const filtered = useMemo(() => {
    const q = norm(search)

    return pedidos.filter((p) => {
      const hay = norm(`${p.id} ${p.mesUtilizacao} ${p.dataVencimento}`)
      return (
        (!q || hay.includes(q)) &&
        (statusFilter === 'todos' || p.status === statusFilter)
      )
    })
  }, [pedidos, search, statusFilter])

  async function handleDownload(pedido) {
    if (pedido.status === 'failed') {
      pushToast({
        type: 'warning',
        title: 'Importação falhou',
        message:
          'Não é possível baixar o arquivo de uma importação que falhou.',
      })
      return
    }

    if (!pedido.excelUrl) {
      pushToast({
        type: 'info',
        title: 'Arquivo não disponível',
        message: 'Esta importação ainda não possui arquivo para download.',
      })
      return
    }

    try {
      setDownloadingId(pedido.id)

      if (pedido.excelUrl) {
        const res = await fetch(pedido.excelUrl)
        if (!res.ok) throw new Error('Arquivo não encontrado')

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')

        a.href = url
        a.download = `${pedido.id}.xlsx`

        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }

      pushToast({
        type: 'success',
        title: 'Faturamento iniciado',
        message: `O pedido ${pedido.id} foi movido para "Em faturamento".`,
      })
    } catch (error) {
      console.error('Erro no download:', error)

      pushToast({
        type: 'error',
        title: 'Falha no download',
        message: 'Não foi possível baixar a planilha deste pedido.',
        duration: 5000,
      })
    } finally {
      setDownloadingId(null)
    }
  }

  function handleChangeStatus(pedido, newStatus) {
    pushToast({
      type: 'info',
      title: 'Status',
      message: 'O status é atualizado automaticamente pelo servidor.',
    })
  }

  function openImport(pedido) {
    if (pedido.status === 'failed') {
      pushToast({
        type: 'warning',
        title: 'Importação falhou',
        message: 'Não é possível importar documentos de uma importação que falhou.',
        duration: 5000,
      })
      return
    }

    if (pedido.status === 'completed') {
      pushToast({
        type: 'info',
        title: 'Importação concluída',
        message: 'Esta importação já foi concluída.',
        duration: 5000,
      })
      return
    }

    setSelectedPedido(pedido)
    setDocs([])
    setImportOpen(true)
  }

  function closeImport() {
    if (uploading) return
    setImportOpen(false)
    setSelectedPedido(null)
    setDocs([])
  }

  function handleFiles(list) {
    const allowed = []
    const rejected = []

    for (const f of Array.from(list || [])) {
      if (/\.(pdf|xml|png|jpg|jpeg)$/i.test(f.name)) {
        allowed.push(f)
      } else {
        rejected.push(f)
      }
    }

    if (rejected.length) {
      pushToast({
        type: 'warning',
        title: 'Arquivos ignorados',
        message: `Formatos aceitos: PDF, XML, PNG, JPG. Ignorados: ${rejected
          .slice(0, 3)
          .map((r) => r.name)
          .join(', ')}`,
        duration: 6000,
      })
    }

    setDocs((prev) => {
      const keys = new Set(prev.map((f) => `${f.name}-${f.size}`))
      return [
        ...prev,
        ...allowed.filter((f) => !keys.has(`${f.name}-${f.size}`)),
      ]
    })
  }

  function requestRemove(idx) {
    const file = docs[idx]

    setConfirm({
      open: true,
      title: 'Remover documento',
      message: `Remover "${file?.name}" da lista?`,
      onConfirm: () => {
        setDocs((prev) => prev.filter((_, i) => i !== idx))
        setConfirm({ open: false, title: '', message: '', onConfirm: null })

        pushToast({
          type: 'info',
          title: 'Removido',
          message: 'Documento removido da lista.',
        })
      },
    })
  }

  function requestFinalizeImport() {
    if (!docs.length) {
      pushToast({
        type: 'warning',
        title: 'Nada para enviar',
        message: 'Selecione pelo menos um documento.',
        duration: 5000,
      })
      return
    }

    setConfirmFinalize({
      open: true,
      title: 'Confirmar importação',
      message:
        'Ao importar a documentação, o pedido ficará disponível para o funcionário. Deseja continuar?',
      onConfirm: async () => {
        await handleUpload()
      },
    })
  }

  async function handleUpload() {
    if (!docs.length) {
      pushToast({
        type: 'warning',
        title: 'Nada para enviar',
        message: 'Selecione pelo menos um documento.',
        duration: 5000,
      })
      return
    }

    if (!selectedPedido?.id) {
      pushToast({
        type: 'error',
        title: 'Pedido inválido',
        message: 'Não foi possível identificar o pedido selecionado.',
        duration: 5000,
      })
      return
    }

    let arquivoBoleto = null
    let arquivoNotaDebito = null
    let arquivoNotaFiscal = null

    for (const file of docs) {
      const name = file.name.toUpperCase()
      if (name.includes('RECIBOQ') || name.includes('BOLETO')) {
        arquivoBoleto = file
      } else if (name.includes('DEBITO')) {
        arquivoNotaDebito = file
      } else if (name.includes('NF')) {
        arquivoNotaFiscal = file
      }
    }

    const competencia = selectedPedido.dataVencimento
      ? new Date(selectedPedido.dataVencimento.split('/').reverse().join('-')).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]

try {
      setUploadProgress(0)
      setUploadStatus('Enviando documentos...')
      setUploading(true)

      setConfirmFinalize({ open: false, title: '', message: '', onConfirm: null })

      const response = await faturamentoService.importarDocumentos({
        importacaoId: selectedPedido.id,
        competencia,
        arquivoBoleto,
        arquivoNotaDebito,
        arquivoNotaFiscal,
      })

      const faturamentoId = response?.faturamento_id || selectedPedido.id

      setUploadStatus('Processando...')

      try {
        await faturamentoService.verificarProgresso(faturamentoId, (statusData) => {
          if (statusData.progresso !== undefined) {
            setUploadProgress(statusData.progresso)
            setUploadStatus(statusData.status)
          }

          if (statusData.status === 'COMPLETED') {
            setUploadProgress(100)
            setUploadStatus('Concluído!')
          }

          if (statusData.status === 'FAILED') {
            setUploadStatus('Falhou')
          }
        })
      } catch (progressError) {
        console.error('Erro no progresso:', progressError)
        setUploadStatus('Erro ao monitorar')
      }

      setImportOpen(false)
      setSelectedPedido(null)
      setDocs([])
      setUploadProgress(0)
      setUploadStatus('')
      setUploading(false)
    } catch (error) {
      console.error('Erro ao importar:', error)

      pushToast({
        type: 'error',
        title: 'Erro ao importar',
        message:
          error?.message ||
          'Não foi possível concluir a importação dos documentos.',
        duration: 6000,
      })
    } finally {
      setUploading(false)
    }
  }

  function openCancelModal(pedido) {
    setCancelPedido(pedido)
    setCancelReason('')
    setCancelError('')
    setCancelOpen(true)
  }

  function closeCancelModal() {
    setCancelOpen(false)
    setCancelReason('')
    setCancelError('')
    setCancelPedido(null)
  }

  function handleCancelBilling() {
    const motivo = cancelReason.trim()

    if (!motivo) {
      setCancelError('Informe o motivo do cancelamento.')
      return
    }

    setPedidos((prev) =>
      prev.map((item) =>
        item.id === cancelPedido?.id
          ? {
            ...item,
            status: 'cancelado',
            motivoCancelamento: motivo,
            canceladoEm: new Date().toLocaleDateString('pt-BR'),
          }
          : item
      )
    )

    pushToast({
      type: 'warning',
      title: 'Faturamento cancelado',
      message: `O pedido ${cancelPedido?.id} foi marcado como cancelado.`,
      duration: 5000,
    })

    closeCancelModal()
  }

  useEffect(() => {
    const fn = (e) => {
      if (e.key !== 'Escape') return

      if (confirm.open) {
        setConfirm({ open: false, title: '', message: '', onConfirm: null })
        return
      }

      if (confirmFinalize.open && !uploading) {
        setConfirmFinalize({
          open: false,
          title: '',
          message: '',
          onConfirm: null,
        })
        return
      }

      if (cancelOpen) {
        closeCancelModal()
        return
      }

      if (importOpen && !uploading) {
        closeImport()
      }
    }

    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [importOpen, confirm.open, confirmFinalize.open, cancelOpen, uploading])

  return (
    <div className="cf-root">
      <Toasts toasts={toasts} onClose={closeToast} />

      <div className="cf-page-header">
        <div>
          <div className="cf-page-title">Faturamento</div>
          <div className="cf-page-sub">
            Gerencie pedidos aprovados e importe documentos
          </div>
        </div>

        <button
          className="cf-btn"
          onClick={() =>
            pushToast({
              type: 'info',
              title: 'Dica',
              message:
                'Você pode alterar o status do pedido diretamente na coluna de status. Para cancelar, selecione a opção no dropdown.',
              duration: 6500,
            })
          }
        >
          <Info size={14} /> Ajuda
        </button>
      </div>

      {/*
      <div className="cf-stats">
        <div className="cf-stat" style={{ '--stat-color': '#111827' }}>
          <div className="cf-stat-label">Total de pedidos</div>
          <div className="cf-stat-value">{stats.total}</div>
        </div>

        <div className="cf-stat" style={{ '--stat-color': '#16a34a' }}>
          <div className="cf-stat-label">Aprovados</div>
          <div className="cf-stat-value">{stats.aprovados}</div>
        </div>

        <div className="cf-stat" style={{ '--stat-color': '#d97706' }}>
          <div className="cf-stat-label">Em faturamento</div>
          <div className="cf-stat-value">{stats.emFat}</div>
        </div>

        <div className="cf-stat" style={{ '--stat-color': '#7c3aed' }}>
          <div className="cf-stat-label">Disponíveis p/ funcionário</div>
          <div className="cf-stat-value">{stats.disponiveisFuncionario}</div>
        </div>

        <div className="cf-stat" style={{ '--stat-color': '#2563eb' }}>
          <div className="cf-stat-label">Faturados</div>
          <div className="cf-stat-value">{stats.faturados}</div>
        </div>

        <div className="cf-stat" style={{ '--stat-color': '#dc2626' }}>
          <div className="cf-stat-label">Cancelados</div>
          <div className="cf-stat-value">{stats.cancelados}</div>
        </div>
      </div>
      */}

      <div className="cf-filters">
        <div className="cf-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por pedido, mês de utilização..."
          />
          {search && (
            <button className="cf-search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="cf-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="todos">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="processing">Processando</option>
          <option value="completed">Concluídos</option>
          <option value="failed">Falhos</option>
        </select>
      </div>

      <div className="cf-table-wrap">
        <table className="cf-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Vencimento</th>
              <th>Mês de utilização</th>
              <th>Registros</th>
              <th>Status</th>
              <th>Excel</th>
              <th>Documentos</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="cf-empty">
                  Carregando pedidos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="cf-empty">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cf-id-main">{p.id}</div>
                    <div className="cf-id-sub">
                      Aprovado em {fmtDate(p.aprovadoEm)}
                    </div>

                    {p.importadoEm && (
                      <div className="cf-id-sub" style={{ marginTop: 4 }}>
                        Importado em {fmtDate(p.importadoEm)}
                      </div>
                    )}

                    {p.status === 'cancelado' && p.motivoCancelamento && (
                      <div
                        className="cf-id-sub"
                        style={{ color: '#b91c1c', marginTop: 4 }}
                      >
                        Motivo: {p.motivoCancelamento}
                      </div>
                    )}
                  </td>

                  <td>
                    <div className="cf-inline">
                      <CalendarDays size={14} />
                      {fmtDate(p.dataVencimento)}
                    </div>
                  </td>

                  <td style={{ fontSize: 13 }}>{p.mesUtilizacao}</td>

                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                    {p.quantidadeDias}
                  </td>

                  <td>
                    {p.status === 'completed' ? (
                      <span className={`cf-badge ${p.status}`}>
                        <span className="cf-badge-dot" />
                        {statusLabel[p.status]}
                      </span>
                    ) : (
                      <div className="cf-status-select">
                        <select
                          value={p.status}
                          onChange={(e) => handleChangeStatus(p, e.target.value)}
                        >
                          <option value="pending">Pendente</option>
                          <option value="processing">Processando</option>
                          <option value="completed">Concluído</option>
                          <option value="failed">Falhou</option>
                        </select>
                        <span className="cf-status-arrow">▾</span>
                      </div>
                    )}
                  </td>

                  <td>
                    <button
                      className="cf-btn"
                      onClick={() => handleDownload(p)}
                      disabled={downloadingId === p.id}
                      title={
                        p.status === 'failed'
                          ? 'Importação falhou'
                          : !p.excelUrl
                            ? 'Arquivo não disponível'
                            : 'Baixar arquivo'
                      }
                    >
                      <Download size={14} />
                      {downloadingId === p.id ? 'Baixando…' : 'Baixar'}
                    </button>
                  </td>

                  <td>
                    <button
                      className="cf-btn"
                      onClick={() => openImport(p)}
                      disabled={
                        p.status === 'completed' || p.status === 'failed'
                      }
                      title={
                        p.status === 'completed'
                          ? 'Importação concluída.'
                          : p.status === 'failed'
                            ? 'Importação falhou.'
                            : 'Importar documentos'
                      }
                    >
                      <FileSpreadsheet size={14} />
                      {p.status === 'completed'
                        ? 'Encerrado'
                        : 'Importar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {importOpen && selectedPedido && (
        <div
          className="cf-overlay"
          onMouseDown={(e) =>
            e.target.classList.contains('cf-overlay') && !uploading && closeImport()
          }
        >
          <div className="cf-modal" role="dialog" aria-modal="true">
            <div className="cf-modal-header">
              <div>
                <div className="cf-modal-title">Importar documentos</div>
                <div className="cf-modal-sub">
                  Pedido {selectedPedido.id} · {selectedPedido.mesUtilizacao}
                </div>
              </div>

              <button
                className="cf-modal-close"
                onClick={closeImport}
                disabled={uploading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cf-modal-body">
              <div className="cf-resumo">
                <div className="cf-resumo-item">
                  <div className="cf-resumo-label">Vencimento</div>
                  <div className="cf-resumo-val">
                    {fmtDate(selectedPedido.dataVencimento)}
                  </div>
                </div>

                <div className="cf-resumo-item">
                  <div className="cf-resumo-label">Dias trabalhados</div>
                  <div className="cf-resumo-val">
                    {selectedPedido.quantidadeDias}
                  </div>
                </div>

                <div className="cf-resumo-item">
                  <div className="cf-resumo-label">Status</div>
                  <span
                    className={`cf-badge ${selectedPedido.status}`}
                    style={{ marginTop: 2 }}
                  >
                    <span className="cf-badge-dot" />
                    {statusLabel[selectedPedido.status]}
                  </span>
                </div>
              </div>

              <div
                className="cf-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (!uploading) handleFiles(e.dataTransfer.files)
                }}
                onClick={() => !uploading && fileRef.current?.click()}
              >
                <div className="cf-dropzone-icon">
                  <Upload size={16} />
                </div>

                <div>
                  <div className="cf-dropzone-title">
                    Arraste ou clique para selecionar
                  </div>
                  <div className="cf-dropzone-hint">
                    PDF, XML, PNG, JPG · múltiplos arquivos
                  </div>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".pdf,.xml,.png,.jpg,.jpeg"
                  className="cf-file-input"
                  onChange={(e) => handleFiles(e.target.files)}
                  disabled={uploading}
                />
              </div>

              <div>
                {docs.length === 0 ? (
                  <div className="cf-files-empty">
                    Nenhum documento selecionado ainda.
                  </div>
                ) : (
                  <div className="cf-files-list">
                    {docs.map((f, i) => (
                      <div
                        key={`${f.name}-${f.size}-${i}`}
                        className="cf-file-row"
                      >
                        <div className="cf-file-left">
                          <FileText size={15} />
                          <div>
                            <div className="cf-file-name">{f.name}</div>
                            <div className="cf-file-sub">
                              {(f.size / 1024).toFixed(1)} KB ·{' '}
                              {f.type || 'tipo desconhecido'}
                            </div>
                          </div>
                        </div>

                        <button
                          className="cf-file-remove"
                          onClick={() => requestRemove(i)}
                          title="Remover"
                          disabled={uploading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {uploading && (
                <div className="cf-progress-wrap">
                  <div className="cf-progress-bar">
                    <div 
                      className="cf-progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="cf-progress-text">
                    {uploadStatus} {uploadProgress}%
                  </div>
                </div>
              )}
            </div>

            <div className="cf-modal-footer">
              <button
                className="cf-btn secondary"
                onClick={closeImport}
                disabled={uploading}
              >
                Cancelar
              </button>

              <button
                className="cf-btn primary"
                onClick={requestFinalizeImport}
                disabled={!docs.length || uploading}
              >
                <Upload size={14} />
                {uploading ? `${uploadProgress}% - Enviando...` : 'Enviar documentos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelOpen && cancelPedido && (
        <div
          className="cf-overlay"
          onMouseDown={(e) =>
            e.target.classList.contains('cf-overlay') && closeCancelModal()
          }
        >
          <div
            className="cf-modal"
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: 520 }}
          >
            <div className="cf-modal-header">
              <div>
                <div className="cf-modal-title">Cancelar faturamento</div>
                <div className="cf-modal-sub">Pedido {cancelPedido.id}</div>
              </div>

              <button className="cf-modal-close" onClick={closeCancelModal}>
                <X size={18} />
              </button>
            </div>

            <div className="cf-modal-body">
              <p className="cf-confirm-msg">
                Informe o motivo do cancelamento deste faturamento.
              </p>

              <textarea
                className="cf-textarea"
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value)
                  if (cancelError) setCancelError('')
                }}
                placeholder="Descreva o motivo do cancelamento"
                rows={4}
              />

              {cancelError && (
                <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>
                  {cancelError}
                </div>
              )}
            </div>

            <div className="cf-modal-footer">
              <button className="cf-btn secondary" onClick={closeCancelModal}>
                Voltar
              </button>

              <button
                className="cf-btn primary"
                onClick={handleCancelBilling}
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
              >
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onCancel={() =>
          setConfirm({ open: false, title: '', message: '', onConfirm: null })
        }
        onConfirm={() => confirm.onConfirm && confirm.onConfirm()}
        confirmText="Remover"
        confirmColor="#ef4444"
      />

      <ConfirmModal
        open={confirmFinalize.open}
        title={confirmFinalize.title}
        message={confirmFinalize.message}
        onCancel={() =>
          !uploading &&
          setConfirmFinalize({
            open: false,
            title: '',
            message: '',
            onConfirm: null,
          })
        }
        onConfirm={() => confirmFinalize.onConfirm && confirmFinalize.onConfirm()}
        confirmText="Confirmar envio"
        confirmColor="#2563eb"
        loading={uploading}
      />
    </div>
  )
}