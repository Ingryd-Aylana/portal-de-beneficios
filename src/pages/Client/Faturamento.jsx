import React, { useMemo, useState } from 'react'
import { Search, Download, FileText, CalendarDays, Receipt, Files } from 'lucide-react'
import { acordosFaturamento as seed } from '../../utils/fakeData.js'
import '../../styles/Faturamento.css'

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

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  })

const getImportacaoKey = (item, idx) =>
  item.importacaoId ||
  item.importacao_id ||
  item.file_upload_id ||
  item.lote_id ||
  item.lote ||
  item.upload_id ||
  item.processamento_id ||
  item.competencia ||
  `sem-importacao-${idx}`

const getImportacaoLabel = (item, idx) =>
  item.importacaoNome ||
  item.importacao_nome ||
  item.nome_importacao ||
  item.arquivo ||
  item.file_name ||
  item.nome_arquivo ||
  `Importação ${getImportacaoKey(item, idx)}`

const getImportacaoDate = (item) =>
  item.importadoEm ||
  item.importado_em ||
  item.processed_at ||
  item.created_at ||
  item.data_importacao ||
  item.data ||
  '-'

const getCompetencia = (item) =>
  item.competencia || item.referencia || item.periodo || '-'

const getRegistroNome = (item) =>
  item.acordo || item.beneficio || item.nome || '-'

export default function Faturamento() {
  const [search, setSearch] = useState('')

  const registros = useMemo(
    () =>
      (seed || []).map((item, idx) => ({
        ...item,
        _idx: idx,
        _importKey: getImportacaoKey(item, idx),
        _importLabel: getImportacaoLabel(item, idx),
        _importDate: getImportacaoDate(item),
        _competencia: getCompetencia(item),
        _nome: getRegistroNome(item),
        _valorNum: Number(item.valor ?? item.total ?? item.valor_total ?? 0),
      })),
    []
  )

  const importacoes = useMemo(() => {
    const map = new Map()

    registros.forEach((item) => {
      const key = item._importKey

      if (!map.has(key)) {
        map.set(key, {
          key,
          importacaoLabel: item._importLabel,
          importacaoDate: item._importDate,
          competencia: item._competencia,
          registros: [],
        })
      }

      map.get(key).registros.push(item)
    })

    const query = search.trim().toLowerCase()

    return Array.from(map.values())
      .map((group) => {
        const beneficios = group.registros.map((r) => r._nome).filter(Boolean)

        const total = group.registros.reduce((sum, r) => sum + r._valorNum, 0)

        const filtrado =
          !query ||
          [
            group.importacaoLabel,
            group.key,
            group.competencia,
            ...beneficios,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query)

        if (!filtrado) return null

        return {
          ...group,
          beneficios,
          total,
          quantidadeBeneficios: beneficios.length,
        }
      })
      .filter(Boolean)
      .sort((a, b) => String(b.importacaoDate).localeCompare(String(a.importacaoDate)))
  }, [registros, search])

  const gerarFaturaPDF = async (group) => {
    await makePdf(`${group.key}-fatura.pdf`, 'FATURA', [
      ['Importação', group.importacaoLabel],
      ['ID/Lote', group.key],
      ['Competência', group.competencia],
      ['Quantidade de benefícios', group.quantidadeBeneficios],
      ['Valor total (R$)', formatMoney(group.total)],
      ['Benefícios', group.beneficios.join(', ') || '-'],
    ])
  }

  const gerarBoletoPDF = async (group) => {
    await makePdf(`${group.key}-boleto.pdf`, 'BOLETO', [
      ['Importação', group.importacaoLabel],
      ['ID/Lote', group.key],
      ['Competência', group.competencia],
      ['Nosso Número', `NN-${group.key}`],
      ['Valor total (R$)', formatMoney(group.total)],
      ['Benefícios', group.beneficios.join(', ') || '-'],
    ])
  }

  const gerarNFPDF = async (group) => {
    await makePdf(`${group.key}-nota-fiscal.pdf`, 'NOTA FISCAL (Resumo)', [
      ['Importação', group.importacaoLabel],
      ['ID/Lote', group.key],
      ['Competência', group.competencia],
      ['Valor total (R$)', formatMoney(group.total)],
      ['Itens faturados', group.quantidadeBeneficios],
      ['Benefícios', group.beneficios.join(', ') || '-'],
    ])
  }

  const baixarTodos = async (group) => {
    await gerarFaturaPDF(group)
    await gerarBoletoPDF(group)
    await gerarNFPDF(group)
  }

  return (
    <div className="fatv2-page">
      <section className="fatv2-hero">
        <div>
          <p className="fatv2-eyebrow">Faturamento</p>
          <h1 className="fatv2-title">Documentos por importação</h1>
          <p className="fatv2-subtitle">
            Cada importação reúne os benefícios faturados em um único conjunto de documentos.
          </p>
        </div>
      </section>

      <section className="fatv2-toolbar">
        <div className="fatv2-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por importação, competência ou benefício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className="fatv2-list">
        {importacoes.map((group) => (
          <article key={group.key} className="fatv2-card">
            <div className="fatv2-card-top">
              <div className="fatv2-card-main">
                <div className="fatv2-icon">
                  <FileText size={18} />
                </div>

                <div className="fatv2-main-text">
                  <h2>{group.importacaoLabel}</h2>
                  <p>ID/Lote: {group.key}</p>
                </div>
              </div>

              <div className="fatv2-summary">
                <div className="fatv2-summary-item">
                  <span><CalendarDays size={14} /> Importação</span>
                  <strong>{group.importacaoDate}</strong>
                </div>

                <div className="fatv2-summary-item">
                  <span><Receipt size={14} /> Competência</span>
                  <strong>{group.competencia}</strong>
                </div>

                <div className="fatv2-summary-item">
                  <span><Files size={14} /> Benefícios</span>
                  <strong>{group.quantidadeBeneficios}</strong>
                </div>

                <div className="fatv2-summary-item">
                  <span><Download size={14} /> Total</span>
                  <strong>R$ {formatMoney(group.total)}</strong>
                </div>
              </div>
            </div>

            <div className="fatv2-card-body">
              <div className="fatv2-benefits">
                <span className="fatv2-label">Benefícios incluídos</span>
                <div className="fatv2-benefit-tags">
                  {group.beneficios.map((beneficio, index) => (
                    <span key={`${beneficio}-${index}`} className="fatv2-tag">
                      {beneficio}
                    </span>
                  ))}
                </div>
              </div>

              <div className="fatv2-docs">
                <button className="fatv2-btn" onClick={() => gerarFaturaPDF(group)}>
                  <Download size={14} />
                  Fatura
                </button>

                <button className="fatv2-btn" onClick={() => gerarBoletoPDF(group)}>
                  <Download size={14} />
                  Boleto
                </button>

                <button className="fatv2-btn" onClick={() => gerarNFPDF(group)}>
                  <Download size={14} />
                  NF
                </button>

                <button className="fatv2-btn fatv2-btn-primary" onClick={() => baixarTodos(group)}>
                  <Download size={14} />
                  Baixar todos
                </button>
              </div>
            </div>
          </article>
        ))}

        {importacoes.length === 0 && (
          <div className="fatv2-empty">
            Nenhuma importação encontrada para o filtro informado.
          </div>
        )}
      </section>
    </div>
  )
}