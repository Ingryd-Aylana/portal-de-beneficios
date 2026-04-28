import React, { useState, useEffect } from 'react'
import { Search, FileText } from 'lucide-react'
import { apiFetch } from '../../services/api.js'
import { faturamentoService } from '../../services/faturamentoService.js'
import '../../styles/Faturamento.css'

const Chevron = ({ open }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24" fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={'chevron' + (open ? ' open' : '')}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const Download = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

async function ensureJsPDF() {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
  return window.jspdf.jsPDF
}

async function makePdf(filename, title, fields) {
  const jsPDF = await ensureJsPDF()
  const doc = new jsPDF()
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, 14, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  fields.forEach(([k, v]) => {
    doc.text(`${k}: ${v}`, 14, y)
    y += 8
    if (y > 280) {
      doc.addPage()
      y = 20
    }
  })

  doc.save(filename)
}

const isEmFaturamento = (item) =>
  /faturamento/i.test((item.status || '').toString())

export default function Faturamento() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const response = await apiFetch('/beneficios/importacoes/', { method: 'GET' })
        const lista = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : []

        const map = new Map()
        lista.forEach((a, idx) => {
          const comp = a.vigencia_inicio
            ? new Date(a.vigencia_inicio).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            : a.vigencia_fim
              ? new Date(a.vigencia_fim).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
              : '-'
          const groupKey = comp

          if (!map.has(groupKey)) {
            map.set(groupKey, {
              _key: groupKey,
              comp: groupKey,
              open: false,
              registros: []
            })
          }

          map.get(groupKey).registros.push({
            id: a.id,
            acordo: 'Vale Refeição',
            competencia: comp,
            valor: a.registros_processados || 0,
            status: a.status?.toLowerCase() || 'pending',
            _itemKey: `${a.id}-${idx}`
          })
        })

        setGroups(Array.from(map.values()))
      } catch (err) {
        console.error('Erro ao carregar:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const [search, setSearch] = useState('')

  const toggle = (_key) =>
    setGroups((prev) =>
      prev.map((g) => (g._key === _key ? { ...g, open: !g.open } : g))
    )

  const searchLower = search.trim().toLowerCase()

  const normalizedGroups = groups
    .map((group) => {
      const registrosFiltrados = !searchLower
        ? group.registros
        : group.registros.filter((r) => {
          const text = [
            r.acordo,
            r.id,
            r.status,
            r.competencia
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return text.includes(searchLower)
        })

      if (!registrosFiltrados.length) return null

      const totalGroup = registrosFiltrados.reduce(
        (sum, r) => sum + (r.valor || 0),
        0
      )

      return {
        ...group,
        registrosFiltrados,
        totalGroup
      }
    })
    .filter(Boolean)

  if (loading) {
    return <div className="fat-page">Carregando...</div>
  }

  return (
    <div className="fat-page">
      <div className="fat-toolbar">
        <div className="filters-row">
          <div className="filter-group">
            <label>Buscar</label>
            <div className="input-with-icon">
              <span className="input-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Busque por benefício, competência..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="accordion">
        {normalizedGroups.map((group) => (
          <div key={group._key} className="acc-item">
            <button className="acc-header" onClick={() => toggle(group._key)}>
              <div className="acc-main">
                <div className="acc-left">
                  <div className="acc-avatar">
                    {(group.comp || '-').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="acc-text">
                    <div className="acc-title">Competência: {group.comp}</div>
                    <div className="acc-sub">
                      {group.registrosFiltrados.length} Registro(s)
                    </div>
                  </div>
                  <div className="acc-col">
                    <span className="muted">Total</span>
                    <strong>{group.totalGroup}</strong>
                  </div>
                </div>
                <div className="acc-arrow">
                  <Chevron open={group.open} />
                </div>
              </div>
            </button>

            {group.open && (
              <div className="acc-body">
                {group.registrosFiltrados.map((item) => (
                  <div key={item._itemKey} className="fat-row">
                    <div className="fat-row-main">
                      <div className="fat-row-title">{item.acordo}</div>
                      <div className="fat-row-sub">
                        <span>ID: {item.id}</span>
                        <span> • {item.competencia}</span>
                      </div>
                    </div>
                    <div className="fat-row-col">
                      <span className="muted">Registros</span>
                      <strong>{item.valor}</strong>
                    </div>
                    {!isEmFaturamento(item) && (
                      <div className="acc-actions">
                        <button className="btn" onClick={() => faturamentoService.downloadFaturamento(item.id, 'todos')}>
                          <Download /> Todos
                        </button>
                        <button className="btn" onClick={() => faturamentoService.downloadFaturamento(item.id, 'boletos')}>
                          <FileText size={14} /> Boletos
                        </button>
                        <button className="btn" onClick={() => faturamentoService.downloadFaturamento(item.id, 'notas-debito')}>
                          <FileText size={14} /> Notas Débito
                        </button>
                        <button className="btn" onClick={() => faturamentoService.downloadFaturamento(item.id, 'notas-fiscais')}>
                          <FileText size={14} /> Notas Fiscais
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {normalizedGroups.length === 0 && (
          <div className="fat-empty">
            Nenhum registro encontrado.
          </div>
        )}
      </div>
    </div>
  )
}