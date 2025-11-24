import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { acordosFaturamento as seed } from '../utils/fakeData.js'
import '../styles/Faturamento.css'

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
  // Monta grupos por folha de pagamento (competência)
  const [groups, setGroups] = useState(() => {
    const map = new Map()

    seed.forEach((a, idx) => {
      const nome = a.acordo || a.beneficio || '-'
      const comp = a.competencia || a.referencia || a.periodo || '-'
      const valorNum = Number(a.valor ?? a.total ?? 0)
      const groupKey = comp || '-'

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          _key: groupKey,
          comp: groupKey,
          open: false,
          registros: []
        })
      }

      map.get(groupKey).registros.push({
        ...a,
        _itemKey: `${a.id}-${idx}`,
        nome,
        comp,
        valorNum
      })
    })

    return Array.from(map.values())
  })

  const [search, setSearch] = useState('')

  const toggle = (_key) =>
    setGroups((prev) =>
      prev.map((g) => (g._key === _key ? { ...g, open: !g.open } : g))
    )

  const gerarFaturaPDF = async (a) => {
    await makePdf(
      `${a.id}-fatura.pdf`,
      'FATURA',
      [
        ['Acordo', a.nome],
        ['ID', a.id],
        ['Competência', a.comp],
        [
          'Valor (R$)',
          a.valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        ],
        ['Status', a.status || '-']
      ]
    )
  }

  const gerarBoletoPDF = async (a) => {
    await makePdf(
      `${a.id}-boleto.pdf`,
      'BOLETO',
      [
        ['Beneficiário', a.nome],
        ['Nosso Número', a.nossoNumero || `NN-${a.id}`],
        ['Competência', a.comp],
        [
          'Valor (R$)',
          a.valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        ],
        ['Vencimento', a.vencimento || '-']
      ]
    )
  }

  const gerarNFPDF = async (a) => {
    await makePdf(
      `${a.id}-nota-fiscal.pdf`,
      'NOTA FISCAL (DANFE - Resumo)',
      [
        ['Cliente', a.nome],
        ['Chave de Acesso', a.chaveAcesso || `NFe-${a.id}`],
        ['Competência', a.comp],
        [
          'Valor Total (R$)',
          a.valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        ],
        ['Status', a.status || '-']
      ]
    )
  }

  const baixarTodos = async (a) => {
    // em faturamento não gera nada
    if (isEmFaturamento(a)) return
    await gerarFaturaPDF(a)
    await gerarBoletoPDF(a)
    await gerarNFPDF(a)
  }

  const searchLower = search.trim().toLowerCase()

  const normalizedGroups = groups
    .map((group) => {
      const registrosFiltrados = !searchLower
        ? group.registros
        : group.registros.filter((r) => {
          const text = [
            r.nome,
            r.id,
            r.condominio,
            r.status,
            r.comp
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return text.includes(searchLower)
        })

      if (!registrosFiltrados.length) return null

      const totalGroup = registrosFiltrados.reduce(
        (sum, r) => sum + r.valorNum,
        0
      )

      const statusSet = new Set(
        registrosFiltrados
          .map((r) => (r.status || '').toString().toLowerCase())
          .filter(Boolean)
      )

      let groupStatusLabel = 'Sem status'
      let groupStatusClass = 'badge-open'

      if (statusSet.size === 1) {
        const only = Array.from(statusSet)[0]
        groupStatusLabel = registrosFiltrados[0].status || 'Sem status'
        groupStatusClass = /fechado/.test(only) ? 'badge-closed' : 'badge-open'
      } else if (statusSet.size > 1) {
        groupStatusLabel = 'Misto'
        groupStatusClass = 'badge-open'
      }

      return {
        ...group,
        registrosFiltrados,
        totalGroup,
        groupStatusLabel,
        groupStatusClass
      }
    })
    .filter(Boolean)

  return (
    <div className="fat-page">
      {/* Barra de filtros */}
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
                placeholder="Busque por, benefício, competência..."
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
                    <div className="acc-title">Folha: {group.comp}</div>
                    <div className="acc-sub">
                      {group.registrosFiltrados.length} Benefício(s)
                    </div>
                  </div>
                </div>

                <div className="acc-col">
                  <span className="muted">Valor total (R$)</span>
                  <strong>
                    {group.totalGroup.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}
                  </strong>
                </div>

                <div className={'badge ' + group.groupStatusClass}>
                  {group.groupStatusLabel}
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
                      <div className="fat-row-title">{item.nome}</div>
                      <div className="fat-row-sub">
                        <span>ID: {item.id}</span>
                        {item.condominio && (
                          <span> • {item.condominio}</span>
                        )}
                      </div>
                    </div>

                    <div className="fat-row-col">
                      <span className="muted">Valor (R$)</span>
                      <strong>
                        {item.valorNum.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2
                        })}
                      </strong>
                    </div>

                    {!isEmFaturamento(item) && (
                      <div className="acc-actions">
                        <button
                          className="btn"
                          onClick={() => gerarFaturaPDF(item)}
                        >
                          <Download /> Fatura (PDF)
                        </button>

                        <button
                          className="btn"
                          onClick={() => gerarBoletoPDF(item)}
                        >
                          <Download /> Boleto (PDF)
                        </button>

                        <button
                          className="btn"
                          onClick={() => gerarNFPDF(item)}
                        >
                          <Download /> Nota Fiscal (PDF)
                        </button>
                        <button
                          className="btn primary"
                          onClick={() => baixarTodos(item)}
                        >
                          <Download /> Baixar todos (PDF)
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
            Nenhum registro encontrado para o filtro informado.
          </div>
        )}
      </div>
    </div>
  )
}
