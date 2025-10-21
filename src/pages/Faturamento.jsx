import React, { useState } from 'react'
import { acordosFaturamento as seed } from '../utils/fakeData.js'
import '../styles/Faturamento.css'

const Chevron = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    className={'chevron' + (open ? ' open' : '')}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const Download = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
  doc.text(title, 14, y); y += 10

  doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
  fields.forEach(([k, v]) => {
    doc.text(`${k}: ${v}`, 14, y)
    y += 8
    if (y > 280) { doc.addPage(); y = 20 }
  })

  doc.save(filename)
}

export default function Faturamento() {
    const [items, setItems] = useState(
    seed.map((a, idx) => ({
      ...a,
      _key: `${a.id}-${idx}`,
      open: false
    }))
  )

  const normalized = items.map(a => ({
    ...a,
    nome: a.acordo || a.beneficio || '-',
    comp: a.competencia || a.referencia || a.periodo || '-',
    valorNum: Number(a.valor ?? a.total ?? 0)
  }))

  const toggle = (_key) =>
    setItems(prev => prev.map(i => i._key === _key ? ({ ...i, open: !i.open }) : i))

  const gerarFaturaPDF = async (a) => {
    await makePdf(
      `${a.id}-fatura.pdf`,
      'FATURA',
      [
        ['Acordo', a.nome],
        ['ID', a.id],
        ['Competência', a.comp],
        ['Valor (R$)', a.valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
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
        ['Valor (R$)', a.valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
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
        ['Valor Total (R$)', a.valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
        ['Status', a.status || '-']
      ]
    )
  }

  const baixarTodos = async (a) => {
    await gerarFaturaPDF(a)
    await gerarBoletoPDF(a)
    await gerarNFPDF(a)
  }

  return (
    <div className="fat-page">
      
      <div className="accordion">
        {normalized.map(item => (
          <div key={item._key} className="acc-item">
            <button className="acc-header" onClick={() => toggle(item._key)}>
              <div className="acc-main">
                
                <div className="acc-left">
                  <div className="acc-avatar">
                    {(item.nome || '-').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="acc-text">
                    <div className="acc-title">{item.nome}</div>
                    <div className="acc-sub">ID: {item.id}</div>
                  </div>
                </div>

                <div className="acc-col">
                  <span className="muted">Competência</span>
                  <strong>{item.comp}</strong>
                </div>

                <div className="acc-col">
                  <span className="muted">Valor (R$)</span>
                  <strong>{item.valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div className={'badge ' + (/fechado/i.test(item.status) ? 'badge-closed' : 'badge-open')}>
                  {item.status}
                </div>
              </div>
              <Chevron open={item.open} />
            </button>

            {item.open && (
              <div className="acc-body">
                <div className="acc-actions">
                  <button className="btn" onClick={() => gerarFaturaPDF(item)}>
                    <Download /> Fatura (PDF)
                  </button>
                  <button className="btn" onClick={() => gerarBoletoPDF(item)}>
                    <Download /> Boleto (PDF)
                  </button>
                  <button className="btn" onClick={() => gerarNFPDF(item)}>
                    <Download /> Nota Fiscal (PDF)
                  </button>
                  <button className="btn primary" onClick={() => baixarTodos(item)}>
                    <Download /> Baixar todos (PDF)
                  </button>
                </div>

              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
