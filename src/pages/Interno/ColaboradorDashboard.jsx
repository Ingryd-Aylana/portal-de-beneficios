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

const fmtMoney = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

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
  aprovado: 'Aprovado',
  em_faturamento: 'Em faturamento',
  faturado: 'Faturado',
  cancelado: 'Cancelado',
}

const getStatusClass = (status) => {
  if (status === 'faturado') return 'faturado'
  if (status === 'cancelado') return 'cancelado'
  if (status === 'em_faturamento') return 'em_faturamento'
  return 'aprovado'
}

const extrairResumoPedido = (pedidoApi) => {
  const dadosReq = pedidoApi?.dadosRequisicao || pedidoApi?.dados_requisicao || {}

  const movsDetalhadas = Array.isArray(dadosReq.movimentacoes_detalhada)
    ? dadosReq.movimentacoes_detalhada
    : []

  const novos = dadosReq.novos_registros || {}
  const funcionariosNovos = Array.isArray(novos.funcionarios) ? novos.funcionarios : []
  const condominiosNovos = Array.isArray(novos.condominios) ? novos.condominios : []

  const condominiosResumo = Array.isArray(dadosReq.condominios) ? dadosReq.condominios : []
  const summary = dadosReq.summary || {}

  const primeiroMov = movsDetalhadas[0] || {}
  const primeiroCondominioNovo = condominiosNovos[0] || {}
  const primeiroCondominioResumo = condominiosResumo[0] || {}

  const usandoFormatoDetalhado = movsDetalhadas.length > 0
  const usandoFormatoResumo = condominiosResumo.length > 0

  let valorTotal = 0
  let totalFuncionarios = 0
  let nomeCondominio = '-'
  let cnpj = '-'
  let cidade = '-'
  let uf = '-'
  let dataVencimento = '-'
  let quantidadeDias = '-'
  let mesUtilizacao = '-'

  if (usandoFormatoDetalhado) {
    valorTotal = movsDetalhadas.reduce(
      (acc, item) => acc + Number(item.valor_recarga_bene || 0),
      0
    )

    const funcionariosUnicos = [
      ...new Set(movsDetalhadas.map((m) => m.nome_func).filter(Boolean)),
    ]

    totalFuncionarios = funcionariosUnicos.length || funcionariosNovos.length

    nomeCondominio =
      primeiroCondominioNovo.razao_social ||
      primeiroMov.departamento ||
      primeiroMov.cnpj ||
      '-'

    cnpj = primeiroMov.cnpj || primeiroCondominioNovo.cnpj || '-'
    cidade = primeiroMov.cidade || primeiroCondominioNovo.cidade || '-'
    uf = primeiroMov.uf || primeiroCondominioNovo.uf || '-'

    dataVencimento =
      primeiroMov.vencimento ||
      dadosReq.vencimento ||
      '-'

    quantidadeDias = Math.max(
      ...movsDetalhadas.map((m) => Number(m.quantidade || 0)),
      0
    ) || '-'

    const competenciaBruta =
      primeiroMov.periodo2 ||
      primeiroMov.periodos ||
      dadosReq.competencia ||
      dadosReq.vencimento ||
      pedidoApi.processed_at

    if (competenciaBruta) {
      const data = new Date(competenciaBruta)
      if (!Number.isNaN(data.getTime())) {
        mesUtilizacao = data.toLocaleDateString('pt-BR', {
          month: '2-digit',
          year: 'numeric',
        })
      } else {
        mesUtilizacao = fmtDate(competenciaBruta)
      }
    }
  } else if (usandoFormatoResumo) {
    console.log('DEBUG VENCIMENTO', {
      id: pedidoApi.id,
      vencimentoCondominio: primeiroCondominioResumo?.vencimento,
      vencimentoFuncionario: primeiroCondominioResumo?.funcionarios?.[0]?.vencimento,
      vencimentoMovimentacao: primeiroCondominioResumo?.funcionarios?.[0]?.movimentacoes?.[0]?.vencimento,
      vencimentoSummary: summary?.vencimento,
      vencimentoDadosReq: dadosReq?.vencimento,
      primeiroCondominioResumo,
    })
    valorTotal =
      condominiosResumo.reduce(
        (acc, cond) => acc + Number(cond.valor_condo || 0),
        0
      ) || Number(summary.valor_total_beneficios || 0)

    totalFuncionarios = condominiosResumo.reduce(
      (acc, cond) => acc + (Array.isArray(cond.funcionarios) ? cond.funcionarios.length : 0),
      0
    )

    nomeCondominio = primeiroCondominioResumo.nome || '-'
    cnpj = primeiroCondominioResumo.cnpj || summary.primeiro_cnpj_processado || '-'

    const vencimentoCondominio =
      primeiroCondominioResumo?.vencimento

    const vencimentoFuncionario =
      primeiroCondominioResumo?.funcionarios?.[0]?.vencimento

    const vencimentoMovimentacao =
      primeiroCondominioResumo?.funcionarios?.[0]?.movimentacoes?.[0]?.vencimento

    const vencimentoSummary =
      summary?.vencimento

    dataVencimento =
      vencimentoCondominio ||
      vencimentoFuncionario ||
      vencimentoMovimentacao ||
      vencimentoSummary ||
      dadosReq.vencimento ||
      '-'

    quantidadeDias = '-'

    const competenciaBruta =
      summary.data_competencia_arquivo ||
      dadosReq.competencia ||
      pedidoApi.processed_at

    if (competenciaBruta) {
      const data = new Date(competenciaBruta)
      if (!Number.isNaN(data.getTime())) {
        mesUtilizacao = data.toLocaleDateString('pt-BR', {
          month: '2-digit',
          year: 'numeric',
        })
      } else {
        mesUtilizacao = fmtDate(competenciaBruta)
      }
    }
  }

  return {
    id: pedidoApi.id,
    fileId: pedidoApi.file || dadosReq.file_upload_id || null,
    status: pedidoApi.status || 'aprovado',
    dataVencimento,
    mesUtilizacao,
    quantidadeDias,
    aprovadoEm: pedidoApi.aprovadoEm || pedidoApi.aprovado_em || pedidoApi.processed_at || '-',
    canceladoEm: pedidoApi.canceladoEm || pedidoApi.cancelado_em || null,
    motivoCancelamento: pedidoApi.motivoCancelamento || pedidoApi.motivo_cancelamento || '',
    documentosImportados:
      pedidoApi.documentosImportados || pedidoApi.documentos_importados || [],
    importadoEm: pedidoApi.importadoEm || pedidoApi.importado_em || pedidoApi.processed_at || null,
    excelUrl: pedidoApi.excelUrl || pedidoApi.excel_url || null,
    dadosRequisicao: dadosReq,
    valorTotal,
    nomeCondominio,
    cnpj,
    cidade,
    uf,
    totalFuncionarios,
  }
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

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsPedido, setDetailsPedido] = useState(null)

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

      const response = await faturamentoService.listarPedidosFuncionario()

      const lista = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.pedidos)
            ? response.pedidos
            : []

      const pedidosFormatados = lista.map(extrairResumoPedido)
      setPedidos(pedidosFormatados)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)

      pushToast({
        type: 'error',
        title: 'Erro ao carregar',
        message: 'Não foi possível carregar os pedidos do dashboard.',
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
      const hay = norm(
        [
          p.id,
          p.mesUtilizacao,
          p.dataVencimento,
          p.nomeCondominio,
          p.cnpj,
          p.cidade,
          p.uf,
        ].join(' ')
      )

      return (
        (!q || hay.includes(q)) &&
        (statusFilter === 'todos' || p.status === statusFilter)
      )
    })
  }, [pedidos, search, statusFilter])

  async function handleDownload(pedido) {
    if (pedido.status === 'cancelado') {
      pushToast({
        type: 'warning',
        title: 'Pedido cancelado',
        message: 'Não é possível baixar o faturamento de um pedido cancelado.',
      })
      return
    }

    try {
      setDownloadingId(pedido.id)

      setPedidos((prev) =>
        prev.map((item) =>
          item.id === pedido.id
            ? { ...item, status: 'em_faturamento' }
            : item
        )
      )

      await faturamentoService.baixarExportFaturamento(
        {
          id: pedido.id,
          file_upload_id: pedido.fileId,
        },
        `pedido-${pedido.id}.xlsx`
      )

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
    if (newStatus === 'cancelado') {
      openCancelModal(pedido)
      return
    }

    setPedidos((prev) =>
      prev.map((item) =>
        item.id === pedido.id
          ? {
            ...item,
            status: newStatus,
            ...(newStatus !== 'cancelado'
              ? { motivoCancelamento: '', canceladoEm: null }
              : {}),
          }
          : item
      )
    )

    pushToast({
      type: 'info',
      title: 'Status atualizado',
      message: `Pedido ${pedido.id} alterado para "${statusLabel[newStatus]}".`,
    })
  }

  function openImport(pedido) {
    if (pedido.status === 'aprovado') {
      pushToast({
        type: 'warning',
        title: 'Faturamento não iniciado',
        message: 'Baixe o faturamento antes de importar documentos.',
        duration: 5000,
      })
      return
    }

    if (pedido.status === 'cancelado') {
      pushToast({
        type: 'info',
        title: 'Importação bloqueada',
        message: 'Este pedido está cancelado.',
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

    try {
      setUploading(true)

      const response = await faturamentoService.importarDocumentos(
        selectedPedido.id,
        docs
      )

      setPedidos((prev) =>
        prev.map((item) =>
          item.id === selectedPedido.id
            ? {
              ...item,
              status: response?.status,
              documentosImportados: response?.documentosImportados || [],
              importadoEm:
                response?.importadoEm ||
                new Date().toLocaleDateString('pt-BR'),
            }
            : item
        )
      )

      pushToast({
        type: 'success',
        title: 'Upload concluído',
        message: `Documentos enviados para ${selectedPedido.id}.`,
      })

      setConfirmFinalize({
        open: false,
        title: '',
        message: '',
        onConfirm: null,
      })

      closeImport()
      await carregarPedidos()
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
        return
      }

      if (detailsOpen) {
        setDetailsOpen(false)
      }
    }

    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [importOpen, confirm.open, confirmFinalize.open, cancelOpen, uploading, detailsOpen])

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

        <div className="cf-stats-mini">
          <div className="cf-stat-mini" style={{ '--mini-color': '#16a34a' }}>
            <span className="cf-stat-mini-value">{stats.aprovados}</span>
            <span className="cf-stat-mini-label">Aprovados</span>
          </div>
          <div className="cf-stat-mini" style={{ '--mini-color': '#d97706' }}>
            <span className="cf-stat-mini-value">{stats.emFat}</span>
            <span className="cf-stat-mini-label">Em Faturamento</span>
          </div>
          <div className="cf-stat-mini" style={{ '--mini-color': '#3a49ed' }}>
            <span className="cf-stat-mini-value">{stats.faturados}</span>
            <span className="cf-stat-mini-label">Faturados</span>
          </div>
        </div>
      </div>

      <div className="cf-filters">
        <div className="cf-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por pedido, condomínio, CNPJ..."
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
          <option value="aprovado">Aprovados</option>
          <option value="em_faturamento">Em faturamento</option>

          <option value="faturado">Faturados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      <div className="cf-table-wrap">
        <table className="cf-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Vencimento</th>
              <th>Competência</th>
              <th>Qtd. funcionários</th>
              <th>Valor Total</th>
              <th>Status</th>
              <th>Timeline</th>
              <th>Excel</th>
              <th>Documentos</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="cf-empty">
                  Carregando pedidos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="cf-empty">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cf-id-main">Pedido #{p.id}</div>



                    {p.importadoEm && (
                      <div className="cf-id-sub" style={{ marginTop: 4 }}>
                        Processado: {fmtDate(p.importadoEm)}
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
                    {p.totalFuncionarios}
                  </td>

                  <td style={{ fontWeight: 600, color: '#16a34a' }}>
                    {fmtMoney(p.valorTotal)}
                  </td>

                  <td>
                    <div className="cf-status-select">
                      <select
                        value={p.status}
                        onChange={(e) => handleChangeStatus(p, e.target.value)}
                      >
                        <option value="aprovado">Aprovado</option>
                        <option value="em_faturamento">Em faturamento</option>

                        <option value="faturado">Faturado</option>
                        <option value="cancelado">Cancelar</option>
                      </select>
                    </div>
                  </td>

                  <td>
                    <button
                      className="cf-btn cf-btn-sm"
                      onClick={() => {
                        setDetailsPedido(p)
                        setDetailsOpen(true)
                      }}
                      title="Ver timeline"
                    >
                      <Info size={14} />
                      Ver
                    </button>
                  </td>

                  <td>
                    <button
                      className="cf-btn"
                      onClick={() => handleDownload(p)}
                      disabled={downloadingId === p.id || p.status === 'cancelado'}
                      title={
                        p.status === 'cancelado'
                          ? 'Pedido cancelado'
                          : 'Baixar faturamento'
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
                      disabled={p.status === 'cancelado'}
                      title={
                        p.status === 'cancelado'
                          ? 'Pedido cancelado'
                          : 'Importar documentos'
                      }
                    >
                      <FileSpreadsheet size={14} />
                      Importar
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
                  Pedido {selectedPedido.id} · {selectedPedido.nomeCondominio}
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
                  <div className="cf-resumo-label">Funcionários</div>
                  <div className="cf-resumo-val">{selectedPedido.totalFuncionarios}</div>
                </div>

                <div className="cf-resumo-item">
                  <div className="cf-resumo-label">Status</div>
                  <span
                    className={`cf-badge ${getStatusClass(selectedPedido.status)}`}
                    style={{ marginTop: 2 }}
                  >
                    <span className="cf-badge-dot" />
                    {statusLabel[selectedPedido.status] || selectedPedido.status}
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
                {uploading ? 'Enviando...' : 'Enviar documentos'}
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

      {detailsOpen && detailsPedido && (
        <div
          className="cf-overlay"
          onMouseDown={(e) =>
            e.target.classList.contains('cf-overlay') && setDetailsOpen(false)
          }
        >
          <div className="cf-modal cf-modal-details" role="dialog" aria-modal="true">
            <div className="cf-modal-header">
              <div>
                <div className="cf-modal-title">Detalhes do Pedido</div>
                <div className="cf-modal-sub">
                  {detailsPedido.id} · {detailsPedido.mesUtilizacao}
                </div>
              </div>

              <button
                className="cf-modal-close"
                onClick={() => setDetailsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cf-modal-body">
              <div className="cf-details-grid">
                <div className="cf-details-card">
                  <div className="cf-details-label">Valor Total</div>
                  <div className="cf-details-value cf-value-green">
                    {fmtMoney(detailsPedido.valorTotal)}
                  </div>
                </div>

                <div className="cf-details-card">
                  <div className="cf-details-label">Dias Trabalhados</div>
                  <div className="cf-details-value">{detailsPedido.quantidadeDias}</div>
                </div>

                <div className="cf-details-card">
                  <div className="cf-details-label">Vencimento</div>
                  <div className="cf-details-value">
                    {fmtDate(detailsPedido.dataVencimento)}
                  </div>
                </div>

                <div className="cf-details-card">
                  <div className="cf-details-label">Status</div>
                  <div className="cf-details-value">
                    <span className={`cf-badge ${getStatusClass(detailsPedido.status)}`}>
                      <span className="cf-badge-dot" />
                      {statusLabel[detailsPedido.status] || detailsPedido.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cf-timeline-section">
                <div className="cf-timeline-title">Timeline</div>
                <div className="cf-timeline">
                  <div className="cf-timeline-item cf-timeline-done">
                    <div className="cf-timeline-dot" />
                    <div className="cf-timeline-content">
                      <div className="cf-timeline-label">Importado</div>
                      <div className="cf-timeline-date">
                        {detailsPedido.importadoEm ? fmtDate(detailsPedido.importadoEm) : '-'}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`cf-timeline-item ${['aprovado', 'em_faturamento', 'faturado'].includes(detailsPedido.status)
                      ? 'cf-timeline-done'
                      : ''
                      }`}
                  >
                    <div className="cf-timeline-dot" />
                    <div className="cf-timeline-content">
                      <div className="cf-timeline-label">Aprovado</div>
                      <div className="cf-timeline-date">
                        {detailsPedido.aprovadoEm ? fmtDate(detailsPedido.aprovadoEm) : '-'}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`cf-timeline-item ${['em_faturamento', 'faturado'].includes(detailsPedido.status)
                      ? 'cf-timeline-done'
                      : ''
                      }`}
                  >
                    <div className="cf-timeline-dot" />
                    <div className="cf-timeline-content">
                      <div className="cf-timeline-label">Em Faturamento</div>
                      <div className="cf-timeline-date">-</div>
                    </div>
                  </div>

                  <div
                    className={`cf-timeline-item ${detailsPedido.status === 'faturado' ? 'cf-timeline-done' : ''
                      }`}
                  >
                    <div className="cf-timeline-dot" />
                    <div className="cf-timeline-content">
                      <div className="cf-timeline-label">Faturado</div>
                      <div className="cf-timeline-date">-</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cf-import-info">
                <div className="cf-import-title">Dados da Importação</div>
                <div className="cf-import-grid">

                  <div className="cf-import-item">
                    <span className="cf-import-label">Competência</span>
                    <span className="cf-import-value">{detailsPedido.mesUtilizacao}</span>
                  </div>

                  <div className="cf-import-item">
                    <span className="cf-import-label">Funcionários</span>
                    <span className="cf-import-value">{detailsPedido.totalFuncionarios}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="cf-modal-footer">
              <button className="cf-btn secondary" onClick={() => setDetailsOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}