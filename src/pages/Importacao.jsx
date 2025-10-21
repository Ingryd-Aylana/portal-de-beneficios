import React, { useState } from 'react'
import FileUpload from '../components/FileUpload'
import '../styles/Importacao.css'

const importacoesRecentes = [
  { id: 'IMP-001', arquivo: 'folha_janeiro.txt', registros: 1250, status: 'sucesso', tipo: 'compra', data: '2025-10-10' },
  { id: 'IMP-002', arquivo: 'folha_fevereiro.txt', registros: 980, status: 'erro', tipo: 'faturamento', data: '2025-10-08' },
  { id: 'IMP-003', arquivo: 'folha_marco.csv', registros: 1340, status: 'sucesso', tipo: 'compra', data: '2025-10-05' },
  { id: 'IMP-004', arquivo: 'folha_abril.txt', registros: 760, status: 'processando', tipo: 'faturamento', data: '2025-10-03' }
]

export default function Importacao() {
  const [items, setItems] = useState(importacoesRecentes)

  function handleResult({ status, file }) {
    const id = 'IMP-' + (1000 + Math.floor(Math.random() * 9000))
    const tipo = file.name.toLowerCase().includes('fat') ? 'faturamento' : 'compra'
    const novo = {
      id,
      arquivo: file.name,
      registros: Math.floor(Math.random() * 1500) + 100,
      status,
      tipo,
      data: new Date().toISOString().slice(0, 10)
    }
    setItems([novo, ...items])
  }

  const totalCompras = items.filter(i => i.tipo === 'compra').length
  const totalFaturamento = items.filter(i => i.tipo === 'faturamento').length

  return (
    <div className="importacao-container">
      <FileUpload onResult={handleResult} />

      <div className="importacao-totais">
        <div className="importacao-card compra">
          <h3>Compras de Benefícios</h3>
          <p className="valor">{totalCompras}</p>
        </div>

        <div className="importacao-card faturamento">
          <h3>Faturamento dos Benefícios</h3>
          <p className="valor">{totalFaturamento}</p>
        </div>
      </div>
    </div>
  )
}
