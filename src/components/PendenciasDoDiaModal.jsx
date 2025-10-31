import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Calendar, X, ChevronDown, ChevronUp } from 'lucide-react'

export default function PendenciasDoDiaModal({ items = [], onGoToPendentes, title = 'Pendências de pagamento para hoje' }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const dialogRef = useRef(null)

  const todayStr = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  const hasToday = items && items.length > 0

  useEffect(() => {
    const dismissedAt = localStorage.getItem('pendencias.dismissedAt')
    if (hasToday && dismissedAt !== todayStr) {
      setOpen(true)
    }
  }, [hasToday, todayStr])

  // Esc para fechar
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const close = (dismissForToday = false) => {
    if (dismissForToday) {
      localStorage.setItem('pendencias.dismissedAt', todayStr)
    }
    setOpen(false)
  }

  if (!open) return null

  const total = items.reduce((s, a) => s + (a.valor || 0), 0)

  const formatCurrency = (n) =>
    `R$ ${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="pb-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
      <div
        className="pb-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pb-modal-title"
        ref={dialogRef}
      >
        <div className="pb-modal-header">
          <div className="pb-modal-title-wrap">
            <div className="pb-modal-icon">
              <AlertCircle size={18} />
            </div>
            <h3 id="pb-modal-title">{title}</h3>
          </div>
          <button className="pb-modal-close" aria-label="Fechar" onClick={() => close(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="pb-modal-subheader">
          <div className="pb-badge pb-badge--amber">
            <Calendar size={14} />
            <span>Hoje</span>
          </div>
          <div className="pb-modal-kpis">
            <span><strong>{items.length}</strong> pendência(s)</span>
            <span className="pb-dot">•</span>
            <span>Total: <strong>{formatCurrency(total)}</strong></span>
          </div>
        </div>

        <div className="pb-accordion">
          <button
            className="pb-accordion-toggle"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
            aria-controls="pb-accordion-panel"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>Detalhes</span>
          </button>

          {expanded && (
            <div id="pb-accordion-panel" className="pb-list">
              {items.map((a) => (
                <div key={a.id} className="pb-list-item">
                  <div className="pb-list-main">
                    <div className="pb-list-title">
                       <div className="pb-condominio">{a.condominio}</div>
                      {a.beneficio}
                     
                    </div>
                    <div className="pb-list-sub">Vencimento: {a.vencimento}</div>
                  </div>
                  <div className="pb-list-right">
                    <span className={`pb-chip ${a.status === 'Aberto' ? 'pb-chip--amber' : 'pb-chip--gray'}`}>
                      {a.status}
                    </span>
                    <span className="pb-money">{formatCurrency(a.valor)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pb-modal-actions">
          <button className="pb-btn pb-btn--primary" onClick={() => { close(true); onGoToPendentes?.() }}>
            Ver pendências
          </button>
          <button className="pb-btn" onClick={() => close(false)}>
            Lembrar depois
          </button>
          <button className="pb-btn pb-btn--ghost" onClick={() => close(true)}>
            Ignorar hoje
          </button>
        </div>
      </div>
    </div>
  )
}
