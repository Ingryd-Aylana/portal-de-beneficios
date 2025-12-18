import React, { useMemo, useState } from 'react'
import {
  Download,
  Search,
  CalendarDays,
  FileSpreadsheet,
  Building2,
  TriangleAlert,
} from 'lucide-react'
import '../../styles/ColaboradorDashboard.css'

const pedidosAprovadosMock = [
  {
    id: 'FAT-2025-001',
    condominio: 'Condomínio Sol Nascente',
    cnpj: '01.234.567/0001-89',
    status: 'aprovado', // aprovado | em_faturamento | faturado
    dataVencimento: '18-10-2025',
    mesUtilizacao: 'Dezembro/2025',
    quantidadeDias: 22,
    excelUrl: '/mock/pedidos/FAT-2025-001.xlsx',
    aprovadoEm: '10-12-2025',
  },
  {
    id: 'FAT-2025-002',
    condominio: 'Condomínio Jardim Europa',
    cnpj: '45.678.901/0001-22',
    status: 'aprovado',
    dataVencimento: '10-12-2025',
    mesUtilizacao: 'Dezembro/2025',
    quantidadeDias: 20,
    excelUrl: '/mock/pedidos/FAT-2025-002.xlsx',
    aprovadoEm: '05-10-2025',
  },
  {
    id: 'FAT-2025-003',
    condominio: 'Condomínio Vista Azul',
    cnpj: '98.765.432/0001-10',
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

// remove acentos e normaliza busca
function normalizeText(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default function ColaboradorDashboard() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos') // todos | aprovado | em_faturamento | faturado
  const [pedidos, setPedidos] = useState(pedidosAprovadosMock)
  const [downloadingId, setDownloadingId] = useState(null)

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

      const matchesStatus =
        statusFilter === 'todos' ? true : p.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [pedidos, search, statusFilter])

  async function handleDownloadExcel(pedido) {
    try {
      setDownloadingId(pedido.id)

      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedido.id ? { ...p, status: 'em_faturamento' } : p
        )
      )

      const res = await fetch(pedido.excelUrl)

      if (!res.ok) {
        throw new Error(`Falha ao buscar arquivo: ${res.status} ${res.statusText}`)
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `${pedido.id}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao baixar Excel:', err)
      alert(
        'Não foi possível baixar o arquivo. Verifique se ele existe em public/mock/pedidos.'
      )
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="detail-view colaborador-dashboard">
        <div className="detail-header">
          <h2>Dashboard</h2>
        </div>

        {/* Filtros */}
        <div className="colab-filters">
          <div className="colab-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por pedido, condomínio, CNPJ, mês..."
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
          {/* se quiser manter só 3 cards, remove este */}
          {/* <div className="colab-stat-card">
            <div className="colab-stat-title">Faturados</div>
            <div className="colab-stat-value">{stats.faturados}</div>
          </div> */}
        </div>

        {/* Lista/Tabela */}
        <div className="colab-table-wrap">
          <table className="colab-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Condomínio</th>
                <th>Vencimento</th>
                <th>Mês de utilização</th>
                <th>Dias</th>
                <th>Status</th>
                <th>Excel</th>
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
                      <div className="colab-condominio">
                        <Building2 size={16} />
                        <div>
                          <div className="colab-condominio-name">{p.condominio}</div>
                          <div className="colab-condominio-sub">{p.cnpj}</div>
                        </div>
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
                        <FileSpreadsheet size={16} />
                        {downloadingId === p.id ? 'Baixando...' : 'Baixar'}
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="colab-hint">
          <div className="icon-dica">
            <TriangleAlert />
            <span>
              Dica: depois de faturar, vá em <strong>Importar Faturamento</strong> na
              sidebar e anexe os documentos gerados.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
