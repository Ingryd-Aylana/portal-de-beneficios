import React, { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import StatusBadge from './StatusBadge'
import { Upload } from './icons/Upload.jsx'

export default function FileUpload({ onUpload }) {
  const inputRef = useRef()
  const [status, setStatus] = useState(null)
  const [message, setMessage] = useState('')
  const [fileName, setFileName] = useState('')

  const handlePick = () => inputRef.current?.click()

  const baixarModeloImportacao = () => {
    const linhas = [
      {
        cnpj: '03468044000139',
        condominio: 'CONDOMINIO EDIFICIO LUFFICIO',
        nome_funcionario: 'AGUINALDO PEREIRA DE LIMA',
        cpf: '718231314680',
        cargo: 'ZELADOR',
        codigo_produto: '60113',
        produto: 'VALE REFEICAO - TICKET',
        quantidade: 26,
        valor_unitario: 17.9
      },
      {
        cnpj: '03468044000139',
        condominio: 'CONDOMINIO EDIFICIO LUFFICIO',
        nome_funcionario: 'AGUINALDO PEREIRA DE LIMA',
        cpf: '718231314680',
        cargo: 'ZELADOR',
        codigo_produto: '05000',
        produto: 'VALE ALIMENTACAO - TICKET',
        quantidade: 1,
        valor_unitario: 552.08
      },
      {
        cnpj: '03468044000139',
        condominio: 'CONDOMINIO EDIFICIO LUFFICIO',
        nome_funcionario: 'ODAILSON DAMASCENO RIBEIRO',
        cpf: '792419725720',
        cargo: 'PORTEIRO NOTURNO',
        codigo_produto: '01274',
        produto: 'CARTAO - TOP',
        quantidade: 52,
        valor_unitario: 7.65
      },
      {
        cnpj: '03468044000139',
        condominio: 'CONDOMINIO EDIFICIO LUFFICIO',
        nome_funcionario: 'ODAILSON DAMASCENO RIBEIRO',
        cpf: '792419725720',
        cargo: 'PORTEIRO NOTURNO',
        codigo_produto: '02002',
        produto: 'SP-TRANS-ONIBUS MUNIC. - BILHETE UNICO',
        quantidade: 52,
        valor_unitario: 5.82
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(linhas)

    worksheet['!cols'] = [
      { wch: 18 }, // cnpj
      { wch: 38 }, // condominio
      { wch: 34 }, // nome_funcionario
      { wch: 16 }, // cpf
      { wch: 22 }, // cargo
      { wch: 16 }, // codigo_produto
      { wch: 40 }, // produto
      { wch: 12 }, // quantidade
      { wch: 14 }  // valor_unitario
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo Importacao')
    XLSX.writeFile(workbook, 'modelo_importacao_beneficios.xlsx')
  }

  const processUpload = async (file) => {
    setStatus('processando')
    setMessage('Processando arquivo...')
    setFileName(file.name)

    try {
      const result = await onUpload?.({ status: 'processando', file })

      if (result?.success) {
        setStatus('sucesso')
        setMessage(result.message)
      } else {
        setStatus('erro')
        setMessage(result?.message || 'Não foi possível processar o arquivo.')
      }
    } catch (error) {
      setStatus('erro')
      setMessage('Falha na comunicação: ' + error.message)
    }
  }

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!/\.(csv|txt)$/i.test(file.name)) {
      setStatus('erro')
      setMessage('Formato inválido. Selecione um arquivo .txt ou .csv')
      setFileName('')
      return
    }

    processUpload(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    if (!/\.(csv|txt)$/i.test(file.name)) {
      setStatus('erro')
      setMessage('Formato inválido. Selecione um arquivo .txt ou .csv')
      setFileName('')
      return
    }

    processUpload(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  return (
    <div className="upload-card">
      <div className="upload-header upload-header-between">
        <div className="upload-header-main">
          <div className="upload-icon-wrapper">
            <Upload size={24} />
          </div>

          <div>
            <h2 className="upload-title">Upload de Arquivo</h2>
            <p className="upload-subtitle">Importe arquivos .txt ou .csv</p>
          </div>
        </div>

        <button
          type="button"
          className="btn-outline upload-model-button"
          onClick={baixarModeloImportacao}
        >
          Baixar modelo Excel
        </button>
      </div>

      <div
        className="upload-area"
        onClick={handlePick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.csv"
          onChange={handleChange}
          hidden
        />

        <div className="upload-icon-large">
          <Upload size={48} />
        </div>

        <p className="upload-text">Clique para selecionar ou arraste o arquivo aqui</p>
        <p className="upload-formats">Formatos aceitos: .txt, .csv</p>
      </div>

      {status && (
        <div className={`upload-status ${status}`}>
          <StatusBadge status={status} />
          <div className="upload-status-content">
            <p className="upload-status-message">{message}</p>
            {fileName && <p className="upload-status-file">{fileName}</p>}
          </div>
        </div>
      )}
    </div>
  )
}