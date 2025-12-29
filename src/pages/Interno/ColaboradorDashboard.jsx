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

const pedidosAprovadosMock = [
  {
    id: 'FAT-2025-001',
    status: 'aprovado',
    dataVencimento: '18-10-2025',
    mesUtilizacao: 'Dezembro/2025',
    quantidadeDias: 22,
    excelUrl: '/mock/pedidos/FAT-2025-001.xlsx',
    aprovadoEm: '10-12-2025',
  },
  {
    id: 'FAT-2025-002',
    status: 'aprovado',
    dataVencimento: '10-12-2025',
    mesUtilizacao: 'Dezembro/2025',
    quantidadeDias: 20,
    excelUrl: '/mock/pedidos/FAT-2025-002.xlsx',
    aprovadoEm: '05-10-2025',
  },
  {
    id: 'FAT-2025-003',
    status: 'em_faturamento',
    dataVencimento: '20-12-2025',
    mesUtilizacao: 'Fevereiro/2025',
    quantidadeDias: 21,
    excelUrl: '/mock/pedidos/FAT-2025-003.xlsx',
    aprovadoEm: '10-12-2025',
  },
]

function formatDateBR(dateStr) {
  if (!dateStr) return '-'
  const [d, m, y] = dateStr.split('-')
  if (!y || !m || !d) return dateStr
  return `${d}/${m}/${y}`
}

function normalizeText(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function Toasts({ toasts, onClose }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-icon">
            {t.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : t.type === 'error' ? (
              <XCircle size={18} />
            ) : t.type === 'warning' ? (
              <AlertTriangle size={18} />
            ) : (
              <Info size={18} />
            )}
          </div>

          <div className="toast-content">
            {t.title && <div className="toast-title">{t.title}</div>}
            <div className="toast-message">{t.message}</div>
          </div>

          <button className="toast-close" onClick={() => onClose(t.id)} title="Fechar">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

function ConfirmModal({ open, title, message, confirmText, cancelText, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="modal-overlay" onMouseDown={(e) => {
      if (e.target.classList.contains('modal-overlay')) onCancel()
    }}>
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h3>{title}</h3>
          </div>
          <button className="modal-close" onClick={onCancel} title="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>

        <div className="modal-footer">
          <button className="colab-btn secondary" onClick={onCancel}>
            {cancelText || 'Cancelar'}
          </button>
          <button className="colab-btn primary" onClick={onConfirm}>
            {confirmText || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ColaboradorDashboard() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [pedidos, setPedidos] = useState(pedidosAprovadosMock)
  const [downloadingId, setDownloadingId] = useState(null)

  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState(null)
  const [docs, setDocs] = useState([])
  const fileInputRef = useRef(null)

  const [toasts, setToasts] = useState([])

  const [confirm, setConfirm] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  function pushToast({ type = 'info', title = '', message = '', duration = 3500 }) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, type, title, message }])

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }

  function closeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const stats = useMemo(() => {
    const total = pedidos.length
    const aprovados = pedidos.filter((p) => p.status === 'aprovado').length
    const emFat = pedidos.filter((p) => p.status === 'em_faturamento').length
    const faturados = pedidos.filter((p) => p.status === 'faturado').length
    return { total, aprovados, emFat, faturados }
  }, [pedidos])

  const filtered = useMemo(() => {
    const q = normalizeText(search)
    return pedidos.filter((p) => {
      const haystack = normalizeText(
        `${p.id} ${p.condominio} ${p.cnpj} ${p.mesUtilizacao} ${p.dataVencimento}`
      )
      const matchesSearch = !q || haystack.includes(q)
      const matchesStatus = statusFilter === 'todos' ? true : p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [pedidos, search, statusFilter])

  async function handleDownloadExcel(pedido) {
    try {
      setDownloadingId(pedido.id)

      setPedidos((prev) =>
        prev.map((p) => (p.id === pedido.id ? { ...p, status: 'em_faturamento' } : p))
      )

      const res = await fetch(pedido.excelUrl)
      if (!res.ok) throw new Error(`Falha ao buscar arquivo: ${res.status} ${res.statusText}`)

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `${pedido.id}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(url)

      pushToast({
        type: 'success',
        title: 'Download iniciado',
        message: `Planilha do pedido ${pedido.id} sendo baixada.`,
      })
    } catch (err) {
      console.error('Erro ao baixar Excel:', err)
      pushToast({
        type: 'error',
        title: 'Falha no download',
        message:
          'Não foi possível baixar o arquivo. Verifique se ele existe em public/mock/pedidos.',
        duration: 5000,
      })
    } finally {
      setDownloadingId(null)
    }
  }

  function handleOpenImportModal(pedido) {
    setSelectedPedido(pedido)
    setDocs([])
    setIsImportModalOpen(true)
  }

  function handleCloseImportModal() {
    setIsImportModalOpen(false)
    setSelectedPedido(null)
    setDocs([])
  }

  function handleFiles(fileList) {
    const incoming = Array.from(fileList || [])
    if (incoming.length === 0) return

    const allowed = []
    const rejected = []

    for (const f of incoming) {
      if (/\.(pdf|xml|png|jpg|jpeg)$/i.test(f.name)) allowed.push(f)
      else rejected.push(f)
    }

    if (rejected.length > 0) {
      pushToast({
        type: 'warning',
        title: 'Alguns arquivos foram ignorados',
        message: `Formatos aceitos: PDF, XML, PNG, JPG. Ignorados: ${rejected
          .slice(0, 3)
          .map((r) => r.name)
          .join(', ')}${rejected.length > 3 ? '...' : ''}`,
        duration: 6000,
      })
    }

    setDocs((prev) => {
      const key = (f) => `${f.name}-${f.size}`
      const prevKeys = new Set(prev.map(key))
      const merged = [...prev]
      for (const f of allowed) {
        if (!prevKeys.has(key(f))) merged.push(f)
      }
      return merged
    })
  }

  function requestRemoveFile(idx) {
    const file = docs[idx]
    setConfirm({
      open: true,
      title: 'Remover documento',
      message: `Tem certeza que deseja remover "${file?.name}" da lista?`,
      onConfirm: () => {
        setDocs((prev) => prev.filter((_, i) => i !== idx))
        setConfirm({ open: false, title: '', message: '', onConfirm: null })
        pushToast({ type: 'info', title: 'Removido', message: 'Documento removido da lista.' })
      },
    })
  }

  async function handleUploadDocs() {
    if (!selectedPedido) return

    if (docs.length === 0) {
      pushToast({
        type: 'warning',
        title: 'Nada para enviar',
        message: 'Selecione pelo menos um documento antes de enviar.',
        duration: 5000,
      })
      return
    }

    try {
      console.log('UPLOAD (mock):', {
        pedido: selectedPedido.id,
        arquivos: docs.map((d) => ({ name: d.name, size: d.size, type: d.type })),
      })

      pushToast({
        type: 'success',
        title: 'Upload concluído',
        message: `Documentos enviados com sucesso para o pedido ${selectedPedido.id}.`,
      })

      handleCloseImportModal()
    } catch (err) {
      console.error('Erro upload:', err)
      pushToast({
        type: 'error',
        title: 'Falha no upload',
        message: 'Não foi possível enviar os documentos. Tente novamente.',
        duration: 6000,
      })
    }
  }

  function showHint() {
    pushToast({
      type: 'info',
      title: 'Dica rápida',
      message:
        'Depois de faturar, vá em "Importar Faturamento" e anexe os documentos gerados.',
      duration: 6500,
    })
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        if (confirm.open) {
          setConfirm({ open: false, title: '', message: '', onConfirm: null })
          return
        }
        if (isImportModalOpen) handleCloseImportModal()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isImportModalOpen, confirm.open])

  return (
    <div className="dashboard-container">
      <div className="detail-view colaborador-dashboard">
        <div className="detail-header">
          <h2>Dashboard Faturamento</h2>

        </div>

        {/* Toasts */}
        <Toasts toasts={toasts} onClose={closeToast} />

        {/* Filtros */}
        <div className="colab-filters">
          <div className="colab-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por pedido, mês..."
            />
          </div>

          <select
            className="colab-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="aprovado">Somente aprovados</option>
            <option value="em_faturamento">Somente em faturamento</option>
            <option value="faturado">Somente faturados</option>
          </select>
        </div>

        {/* Cards de resumo */}
        <div className="colab-stats">
          <div className="colab-stat-card">
            <div className="colab-stat-title">Total</div>
            <div className="colab-stat-value">{stats.total}</div>
          </div>
          <div className="colab-stat-card">
            <div className="colab-stat-title">Aprovados</div>
            <div className="colab-stat-value">{stats.aprovados}</div>
          </div>
          <div className="colab-stat-card">
            <div className="colab-stat-title">Em faturamento</div>
            <div className="colab-stat-value">{stats.emFat}</div>
          </div>
        </div>

        {/* Lista/Tabela */}
        <div className="colab-table-wrap">
          <table className="colab-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Vencimento</th>
                <th>Mês de utilização</th>
                <th>Dias</th>
                <th>Status</th>
                <th>Excel</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="colab-empty">
                    Nenhum pedido encontrado com esses filtros.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="colab-id">
                      <div className="colab-id-main">{p.id}</div>
                      <div className="colab-id-sub">
                        Aprovado em {formatDateBR(p.aprovadoEm)}
                      </div>
                    </td>

                    <td>
                      <div className="colab-inline">
                        <CalendarDays size={16} />
                        <span>{formatDateBR(p.dataVencimento)}</span>
                      </div>
                    </td>

                    <td>{p.mesUtilizacao}</td>
                    <td>{p.quantidadeDias}</td>

                    <td>
                      <span className={`colab-badge ${p.status}`}>
                        {p.status === 'aprovado'
                          ? 'Aprovado'
                          : p.status === 'em_faturamento'
                            ? 'Em faturamento'
                            : 'Faturado'}
                      </span>
                    </td>

                    <td>
                      <button
                        className="colab-btn"
                        onClick={() => handleDownloadExcel(p)}
                        disabled={downloadingId === p.id}
                        title="Baixar planilha do pedido"
                      >
                        <Download size={16} />
                        {downloadingId === p.id ? 'Baixando...' : 'Baixar'}
                      </button>
                    </td>

                    <td>
                      <button
                        className="colab-btn"
                        onClick={() => handleOpenImportModal(p)}
                        title="Importar documentos"
                      >
                        <FileSpreadsheet size={16} />
                        Importar
                      </button>
                    </td>
                  </tr>
                ))
              )}
              <br />
              <button className="colab-btn secondary" onClick={showHint} title="Ver dica">
                <Info size={16} />
                Dica
              </button>
            </tbody>
          </table>
        </div>

        {/* MODAL IMPORTAÇÃO */}
        {isImportModalOpen && selectedPedido && (
          <div
            className="modal-overlay"
            onMouseDown={(e) => {
              if (e.target.classList.contains('modal-overlay')) handleCloseImportModal()
            }}
          >
            <div className="modal-card" role="dialog" aria-modal="true">
              <div className="modal-header">
                <div>
                  <h3>Importar documentos</h3>
                  <br />
                  <p className="modal-subtitle">
                    Pedido: <strong>{selectedPedido.id}</strong>
                  </p>
                  <p className="modal-subtitle">
                    Ven: {formatDateBR(selectedPedido.dataVencimento)}
                  </p>
                  <p className="modal-subtitle">
                    Mês de utilização: {selectedPedido.mesUtilizacao}
                  </p>
                </div>

                <button className="modal-close" onClick={handleCloseImportModal} title="Fechar">
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="pedido-resumo">
                  <div className="resumo-item">
                    <span className="label">Dias</span>
                    <span className="value">{selectedPedido.quantidadeDias}</span>
                  </div>
                  <div className="resumo-item">
                    <span className="label">Status</span>
                    <span className={`value badge-mini ${selectedPedido.status}`}>
                      {selectedPedido.status}
                    </span>
                  </div>
                </div>

                <div
                  className="dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFiles(e.dataTransfer.files)
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={18} />
                  <div>
                    <div className="dropzone-title">
                      Arraste arquivos aqui ou clique para selecionar
                    </div>
                    <div className="dropzone-hint">PDF, XML, PNG, JPG • múltiplos arquivos</div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.xml,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>

                <div className="files-list">
                  {docs.length === 0 ? (
                    <div className="files-empty">Nenhum documento selecionado.</div>
                  ) : (
                    docs.map((f, idx) => (
                      <div key={`${f.name}-${f.size}-${idx}`} className="file-row">
                        <div className="file-left">
                          <FileText size={16} />
                          <div className="file-meta">
                            <div className="file-name">{f.name}</div>
                            <div className="file-sub">
                              {(f.size / 1024).toFixed(1)} KB • {f.type || 'tipo desconhecido'}
                            </div>
                          </div>
                        </div>

                        <button
                          className="file-remove"
                          onClick={() => requestRemoveFile(idx)}
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button className="colab-btn secondary" onClick={handleCloseImportModal}>
                  Cancelar
                </button>

                <button
                  className="colab-btn primary"
                  onClick={handleUploadDocs}
                  disabled={docs.length === 0}
                  title={docs.length === 0 ? 'Selecione arquivos para enviar' : 'Enviar'}
                >
                  Enviar documentos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM MODAL */}
        <ConfirmModal
          open={confirm.open}
          title={confirm.title}
          message={confirm.message}
          confirmText="Remover"
          cancelText="Cancelar"
          onCancel={() => setConfirm({ open: false, title: '', message: '', onConfirm: null })}
          onConfirm={() => confirm.onConfirm && confirm.onConfirm()}
        />
      </div>
    </div>
  )
}
