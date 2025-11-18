import React, { useMemo, useState } from 'react'
import DataTable from '../components/DataTable.jsx'
import { historico as base } from '../utils/fakeData.js'
import '../styles/Historico.css'

export default function Historico() {
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [tipo, setTipo] = useState('')
  const [status, setStatus] = useState('') 
  const [q, setQ] = useState('')

  const itens = useMemo(() => {
    let data = base.slice()

    if (inicio) data = data.filter(i => i.data >= inicio)
    if (fim) data = data.filter(i => i.data <= fim)
    if (tipo) data = data.filter(i => i.tipo === tipo)
    if (status) data = data.filter(i => String(i.status).toLowerCase() === status.toLowerCase())

    if (q.trim()) {
      const query = q.trim().toLowerCase()
      data = data.filter(row =>
        Object.values(row).some(v => String(v).toLowerCase().includes(query))
      )
    }

    data.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : String(a.id).localeCompare(String(b.id))))
    return data
  }, [inicio, fim, tipo, status, q])

  const total = itens.length
  const totalSucesso = itens.filter(i => String(i.status).toLowerCase() === 'sucesso').length
  const totalErro = itens.filter(i => String(i.status).toLowerCase() === 'erro').length
  const totalProc = itens.filter(i => String(i.status).toLowerCase() === 'processando').length

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'tipo', label: 'Tipo', render: (v) => <span className={`chip chip--${String(v).toLowerCase()}`}>{v}</span> },
    { key: 'referencia', label: 'Referência' },
    { key: 'data', label: 'Data', render: (v) => new Date(v).toLocaleDateString('pt-BR') },
    { key: 'status', label: 'Status', render: (v) => <span className={`status ${String(v).toLowerCase()}`}>{v}</span> },
  ]

  const setHoje = () => {
    const d = new Date().toISOString().slice(0, 10)
    setInicio(d); setFim(d)
  }
  const set7d = () => {
    const end = new Date()
    const start = new Date(); start.setDate(start.getDate() - 7)
    setInicio(start.toISOString().slice(0, 10))
    setFim(end.toISOString().slice(0, 10))
  }
  const set30d = () => {
    const end = new Date()
    const start = new Date(); start.setDate(start.getDate() - 30)
    setInicio(start.toISOString().slice(0, 10))
    setFim(end.toISOString().slice(0, 10))
  }
  const limpar = () => { setInicio(''); setFim(''); setTipo(''); setStatus(''); setQ('') }

  
  return (
    <div className="historico-page">
      <div className="historico-header">
        
        <div className="filters">
          <div className="field">
            <label>Início</label>
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
          </div>
          <div className="field">
            <label>Fim</label>
            <input type="date" value={fim} onChange={e => setFim(e.target.value)} />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="Importação">Importação</option>
              <option value="Faturamento">Faturamento</option>
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="sucesso">Sucesso</option>
              <option value="processando">Processando</option>
              <option value="erro">Erro</option>
              <option value="Aberto">Aberto</option>
              <option value="Fechado">Fechado</option>
            </select>
          </div>

          <div className="field grow">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="ID, referência, status..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>

          <div className="actions">
            <button className="button" onClick={limpar}>Limpar</button>
          </div>
        </div>
      </div>

      <div className="hist-cards">
        <div className="hist-card">
          <div className="hist-card-title">Registros</div>
          <div className="hist-card-value">{total}</div>
        </div>
        <div className="hist-card">
          <div className="hist-card-title">Sucesso</div>
          <div className="hist-card-value text-success">{totalSucesso}</div>
        </div>
        <div className="hist-card">
          <div className="hist-card-title">Processando</div>
          <div className="hist-card-value text-info">{totalProc}</div>
        </div>
        <div className="hist-card">
          <div className="hist-card-title">Erro</div>
          <div className="hist-card-value text-danger">{totalErro}</div>
        </div>
      </div>

      <DataTable columns={columns} data={itens} />
    </div>
  )
}
