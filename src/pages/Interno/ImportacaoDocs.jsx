import React, { useMemo, useState } from 'react'
import { UploadCloud, FileText, FileSpreadsheet, Trash2, CheckCircle, TriangleAlert } from 'lucide-react'
import '../../styles/ImportarFaturamento.css'

const pedidosMock = [
  { id: 'FAT-2025-001', status: 'em_faturamento' },
  { id: 'FAT-2025-002', status: 'aprovado' },
  { id: 'FAT-2025-003', status: 'em_faturamento' },
]

export default function ImportarFaturamento() {
  const [pedidoId, setPedidoId] = useState('')
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pedidosDisponiveis = useMemo(() => {
        return pedidosMock
  }, [])

  const selectedPedido = useMemo(
    () => pedidosDisponiveis.find((p) => p.id === pedidoId),
    [pedidoId, pedidosDisponiveis]
  )

  function onPickFiles(e) {
    const picked = Array.from(e.target.files || [])
    if (!picked.length) return

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`))
      const merged = [...prev]
      picked.forEach((f) => {
        const key = `${f.name}-${f.size}`
        if (!existing.has(key)) merged.push(f)
      })
      return merged
    })

    e.target.value = ''
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function prettySize(bytes) {
    if (!bytes && bytes !== 0) return '-'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  function iconByType(fileName) {
    const ext = (fileName.split('.').pop() || '').toLowerCase()
    if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet size={16} />
    return <FileText size={16} />
  }

  async function handleSubmit() {
    if (!pedidoId) {
      alert('Selecione um pedido antes de enviar os documentos.')
      return
    }
    if (files.length === 0) {
      alert('Adicione pelo menos 1 arquivo para enviar.')
      return
    }

    setIsSubmitting(true)
    try {
    
      await new Promise((r) => setTimeout(r, 800))

      alert('Documentos enviados com sucesso! ✅')
      setFiles([])
    
    } catch (err) {
      console.error(err)
      alert('Erro ao enviar documentos. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="detail-view importar-faturamento">
      
        <div className="imp-row">
          <div className="imp-field">
            <label>Pedido</label>
            <select value={pedidoId} onChange={(e) => setPedidoId(e.target.value)}>
              <option value="">Selecione um pedido...</option>
              {pedidosDisponiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}
                </option>
              ))}
            </select>

            {selectedPedido && (
              <div className="imp-selected">
                <CheckCircle size={16} />
                <span>
                  Selecionado: <strong>{selectedPedido.id}</strong> — {selectedPedido.condominio}
                </span>
              </div>
            )}
          </div>

          <div className="imp-field">
            <label>Adicionar arquivos</label>

            <label className="imp-drop">
              <UploadCloud size={18} />
              <span>
                Clique para selecionar arquivos <strong>(PDF, imagens)</strong>
              </span>
              <input
                type="file"
                multiple
                onChange={onPickFiles}
                accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
              />
            </label>

          </div>
        </div>

        <div className="imp-list">
          <div className="imp-list-header">
            <h3>Arquivos adicionados</h3>
            <span className="imp-count">{files.length} arquivo(s)</span>
          </div>

          {files.length === 0 ? (
            <div className="imp-empty">Nenhum arquivo adicionado ainda.</div>
          ) : (
            <div className="imp-files">
              {files.map((f, idx) => (
                <div className="imp-file" key={`${f.name}-${f.size}-${idx}`}>
                  <div className="imp-file-left">
                    <div className="imp-file-icon">{iconByType(f.name)}</div>
                    <div className="imp-file-meta">
                      <div className="imp-file-name" title={f.name}>{f.name}</div>
                      <div className="imp-file-sub">
                        {prettySize(f.size)}
                      </div>
                    </div>
                  </div>

                  <button
                    className="imp-remove"
                    onClick={() => removeFile(idx)}
                    title="Remover arquivo"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="imp-actions">
          <button
            className="imp-btn secondary"
            type="button"
            onClick={() => setFiles([])}
            disabled={files.length === 0 || isSubmitting}
          >
            Limpar arquivos
          </button>

          <button
            className="imp-btn primary"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar documentos'}
          </button>
        </div>
      </div>
    </div>
  )
}
