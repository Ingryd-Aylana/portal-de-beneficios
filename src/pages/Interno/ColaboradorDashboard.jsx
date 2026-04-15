import React, { useMemo, useRef, useState, useEffect } from 'react'
import {
  Download, Search, CalendarDays, FileSpreadsheet,
  X, Upload, FileText, Trash2, Info,
  CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react'

import '../../styles/ColaboradorDashboard.css'
import { faturamentoService } from '../../services/faturamentoService'

const pedidosAprovadosMock = [
  { id:'FAT-2025-001', status:'aprovado',        dataVencimento:'18-10-2025', mesUtilizacao:'Dezembro/2025',  quantidadeDias:22, excelUrl:'/mock/pedidos/FAT-2025-001.xlsx', aprovadoEm:'10-12-2025' },
  { id:'FAT-2025-002', status:'aprovado',        dataVencimento:'10-12-2025', mesUtilizacao:'Dezembro/2025',  quantidadeDias:20, excelUrl:'/mock/pedidos/FAT-2025-002.xlsx', aprovadoEm:'05-10-2025' },
  { id:'FAT-2025-003', status:'em_faturamento',  dataVencimento:'20-12-2025', mesUtilizacao:'Fevereiro/2025', quantidadeDias:21, excelUrl:'/mock/pedidos/FAT-2025-003.xlsx', aprovadoEm:'10-12-2025' },
]

const fmtDate = (s) => {
  if (!s) return '-'
  const [d,m,y] = s.split('-')
  return y ? `${d}/${m}/${y}` : s
}
const norm = (s) =>
  (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()

function Toasts({ toasts, onClose }) {
  return (
    <div className="cf-toast-stack" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`cf-toast ${t.type}`}>
          <div className="cf-toast-icon">
            {t.type==='success' ? <CheckCircle2 size={16}/> :
             t.type==='error'   ? <XCircle size={16}/> :
             t.type==='warning' ? <AlertTriangle size={16}/> :
                                  <Info size={16}/>}
          </div>
          <div>
            {t.title   && <div className="cf-toast-title">{t.title}</div>}
            <div className="cf-toast-message">{t.message}</div>
          </div>
          <button className="cf-toast-close" onClick={() => onClose(t.id)}><X size={14}/></button>
        </div>
      ))}
    </div>
  )
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="cf-overlay" onMouseDown={e => e.target.classList.contains('cf-overlay') && onCancel()}>
      <div className="cf-modal" role="dialog" aria-modal="true" style={{maxWidth:400}}>
        <div className="cf-modal-header">
          <div>
            <div className="cf-modal-title">{title}</div>
          </div>
          <button className="cf-modal-close" onClick={onCancel}><X size={18}/></button>
        </div>
        <div className="cf-modal-body">
          <p className="cf-confirm-msg">{message}</p>
        </div>
        <div className="cf-modal-footer">
          <button className="cf-btn secondary" onClick={onCancel}>Cancelar</button>
          <button className="cf-btn primary" onClick={onConfirm} style={{background:'#ef4444',borderColor:'#ef4444'}}>
            Remover
          </button>
        </div>
      </div>
    </div>
  )
}

const statusLabel = { aprovado:'Aprovado', em_faturamento:'Em faturamento', faturado:'Faturado' }

export default function ColaboradorDashboard() {
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('todos')
  const [pedidos,       setPedidos]       = useState(pedidosAprovadosMock)
  const [downloadingId, setDownloadingId] = useState(null)

  const [importOpen,     setImportOpen]     = useState(false)
  const [selectedPedido, setSelectedPedido] = useState(null)
  const [docs,           setDocs]           = useState([])
  const fileRef = useRef(null)

  const [toasts,  setToasts]  = useState([])
  const [confirm, setConfirm] = useState({ open:false, title:'', message:'', onConfirm:null })

  const pushToast = ({ type='info', title='', message='', duration=3500 }) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts(p => [...p, { id, type, title, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration)
  }
  const closeToast = id => setToasts(p => p.filter(t => t.id !== id))

  const stats = useMemo(() => ({
    total:    pedidos.length,
    aprovados: pedidos.filter(p => p.status==='aprovado').length,
    emFat:    pedidos.filter(p => p.status==='em_faturamento').length,
  }), [pedidos])

  const filtered = useMemo(() => {
    const q = norm(search)
    return pedidos.filter(p => {
      const hay = norm(`${p.id} ${p.mesUtilizacao} ${p.dataVencimento}`)
      return (!q || hay.includes(q)) && (statusFilter==='todos' || p.status===statusFilter)
    })
  }, [pedidos, search, statusFilter])

  async function handleDownload(pedido) {
    try {
      setDownloadingId(pedido.id)
      setPedidos(p => p.map(x => x.id===pedido.id ? {...x, status:'em_faturamento'} : x))
      const res = await fetch(pedido.excelUrl)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `${pedido.id}.xlsx`
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
      pushToast({ type:'success', title:'Download iniciado', message:`Planilha ${pedido.id} sendo baixada.` })
    } catch {
      pushToast({ type:'error', title:'Falha no download', message:'Verifique se o arquivo existe em public/mock/pedidos.', duration:5000 })
    } finally {
      setDownloadingId(null)
    }
  }

  const openImport  = (p) => { setSelectedPedido(p); setDocs([]); setImportOpen(true) }
  const closeImport = ()  => { setImportOpen(false); setSelectedPedido(null); setDocs([]) }

  function handleFiles(list) {
    const allowed=[], rejected=[]
    for (const f of Array.from(list||[])) {
      /\.(pdf|xml|png|jpg|jpeg)$/i.test(f.name) ? allowed.push(f) : rejected.push(f)
    }
    if (rejected.length)
      pushToast({ type:'warning', title:'Arquivos ignorados', message:`Formatos aceitos: PDF, XML, PNG, JPG. Ignorados: ${rejected.slice(0,3).map(r=>r.name).join(', ')}`, duration:6000 })
    setDocs(prev => {
      const keys = new Set(prev.map(f=>`${f.name}-${f.size}`))
      return [...prev, ...allowed.filter(f => !keys.has(`${f.name}-${f.size}`))]
    })
  }

  function requestRemove(idx) {
    const file = docs[idx]
    setConfirm({
      open:true,
      title:'Remover documento',
      message:`Remover "${file?.name}" da lista?`,
      onConfirm: () => {
        setDocs(p => p.filter((_,i) => i!==idx))
        setConfirm({ open:false, title:'', message:'', onConfirm:null })
        pushToast({ type:'info', title:'Removido', message:'Documento removido da lista.' })
      }
    })
  }

  async function handleUpload() {
    if (!docs.length) {
      pushToast({ type:'warning', title:'Nada para enviar', message:'Selecione pelo menos um documento.', duration:5000 })
      return
    }
    console.log('UPLOAD (mock):', { pedido:selectedPedido?.id, arquivos:docs.map(d=>d.name) })
    pushToast({ type:'success', title:'Upload concluído', message:`Documentos enviados para ${selectedPedido?.id}.` })
    closeImport()
  }

  useEffect(() => {
    const fn = e => {
      if (e.key!=='Escape') return
      if (confirm.open) { setConfirm({open:false,title:'',message:'',onConfirm:null}); return }
      if (importOpen) closeImport()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [importOpen, confirm.open])

  return (
    <div className="cf-root">
      <Toasts toasts={toasts} onClose={closeToast} />

      <div className="cf-page-header">
        <div>
          <div className="cf-page-title">Faturamento</div>
          <div className="cf-page-sub">Gerencie pedidos aprovados e importe documentos</div>
        </div>
        <button
          className="cf-btn"
          onClick={() => pushToast({ type:'info', title:'Dica', message:'Após faturar, vá em "Importar" e anexe os documentos gerados.', duration:6500 })}
        >
          <Info size={14}/> Ajuda
        </button>
      </div>

      <div className="cf-stats">
        <div className="cf-stat" style={{'--stat-color':'#111827'}}>
          <div className="cf-stat-label">Total de pedidos</div>
          <div className="cf-stat-value">{stats.total}</div>
        </div>
        <div className="cf-stat" style={{'--stat-color':'#16a34a'}}>
          <div className="cf-stat-label">Aprovados</div>
          <div className="cf-stat-value">{stats.aprovados}</div>
        </div>
        <div className="cf-stat" style={{'--stat-color':'#d97706'}}>
          <div className="cf-stat-label">Em faturamento</div>
          <div className="cf-stat-value">{stats.emFat}</div>
        </div>
      </div>

      <div className="cf-filters">
        <div className="cf-search">
          <Search size={15}/>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar por pedido, mês de utilização..."
          />
          {search && (
            <button className="cf-search-clear" onClick={()=>setSearch('')}>
              <X size={14}/>
            </button>
          )}
        </div>

        <select className="cf-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="todos">Todos os status</option>
          <option value="aprovado">Aprovados</option>
          <option value="em_faturamento">Em faturamento</option>
          <option value="disponivel_para_funcionario">
            Disponíveis para funcionário
          </option>
          <option value="faturado">Faturados</option>
        </select>
      </div>

      <div className="cf-table-wrap">
        <table className="cf-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Vencimento</th>
              <th>Mês de utilização</th>
              <th>Dias</th>
              <th>Status</th>
              <th>Excel</th>
              <th>Documentos</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0 ? (
              <tr><td colSpan={7} className="cf-empty">Nenhum pedido encontrado.</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="cf-id-main">{p.id}</div>
                  <div className="cf-id-sub">Aprovado em {fmtDate(p.aprovadoEm)}</div>
                </td>
                <td>
                  <div className="cf-inline"><CalendarDays size={14}/>{fmtDate(p.dataVencimento)}</div>
                </td>
                <td style={{fontSize:13}}>{p.mesUtilizacao}</td>
                <td style={{fontFamily:'var(--mono)',fontSize:12}}>{p.quantidadeDias}</td>
                <td>
                  <span className={`cf-badge ${p.status}`}>
                    <span className="cf-badge-dot"/>
                    {statusLabel[p.status] || p.status}
                  </span>
                </td>
                <td>
                  <button className="cf-btn" onClick={()=>handleDownload(p)} disabled={downloadingId===p.id}>
                    <Download size={14}/>
                    {downloadingId===p.id ? 'Baixando…' : 'Baixar'}
                  </button>
                </td>
                <td>
                  <button className="cf-btn" onClick={()=>openImport(p)}>
                    <FileSpreadsheet size={14}/> Importar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {importOpen && selectedPedido && (
        <div className="cf-overlay" onMouseDown={e=>e.target.classList.contains('cf-overlay')&&closeImport()}>
          <div className="cf-modal" role="dialog" aria-modal="true">
            <div className="cf-modal-header">
              <div>
                <div className="cf-modal-title">Importar documentos</div>
                <div className="cf-modal-sub">Pedido {selectedPedido.id} · {selectedPedido.mesUtilizacao}</div>
              </div>
              <button className="cf-modal-close" onClick={closeImport}><X size={18}/></button>
            </div>

            <div className="cf-modal-body">
              {/* Resumo */}
              <div className="cf-resumo">
                <div className="cf-resumo-item">
                  <div className="cf-resumo-label">Vencimento</div>
                  <div className="cf-resumo-val">{fmtDate(selectedPedido.dataVencimento)}</div>
                </div>
                <div className="cf-resumo-item">
                  <div className="cf-resumo-label">Dias trabalhados</div>
                  <div className="cf-resumo-val">{selectedPedido.quantidadeDias}</div>
                </div>
                <div className="cf-resumo-item">
                  <div className="cf-resumo-label">Status</div>
                  <span className={`cf-badge ${selectedPedido.status}`} style={{marginTop:2}}>
                    <span className="cf-badge-dot"/>
                    {statusLabel[selectedPedido.status]}
                  </span>
                </div>
              </div>

              <div
                className="cf-dropzone"
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files)}}
                onClick={()=>fileRef.current?.click()}
              >
                <div className="cf-dropzone-icon"><Upload size={16}/></div>
                <div>
                  <div className="cf-dropzone-title">Arraste ou clique para selecionar</div>
                  <div className="cf-dropzone-hint">PDF, XML, PNG, JPG · múltiplos arquivos</div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".pdf,.xml,.png,.jpg,.jpeg"
                  className="cf-file-input"
                  onChange={e=>handleFiles(e.target.files)}
                />
              </div>

              <div>
                {docs.length===0
                  ? <div className="cf-files-empty">Nenhum documento selecionado ainda.</div>
                  : <div className="cf-files-list">
                      {docs.map((f,i) => (
                        <div key={`${f.name}-${f.size}-${i}`} className="cf-file-row">
                          <div className="cf-file-left">
                            <FileText size={15}/>
                            <div>
                              <div className="cf-file-name">{f.name}</div>
                              <div className="cf-file-sub">{(f.size/1024).toFixed(1)} KB · {f.type||'tipo desconhecido'}</div>
                            </div>
                          </div>
                          <button className="cf-file-remove" onClick={()=>requestRemove(i)} title="Remover">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>

            <div className="cf-modal-footer">
              <button className="cf-btn secondary" onClick={closeImport}>Cancelar</button>
              <button className="cf-btn primary" onClick={handleUpload} disabled={!docs.length}>
                <Upload size={14}/> Enviar documentos
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onCancel={()=>setConfirm({open:false,title:'',message:'',onConfirm:null})}
        onConfirm={()=>confirm.onConfirm && confirm.onConfirm()}
      />
    </div>
  )
}