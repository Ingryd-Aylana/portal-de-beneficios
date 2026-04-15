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
    const headers = [
      'cnpj_condominio',
      'nome_condominio',
      'tipo_local_condominio',
      'endereco_condominio',
      'numero_condominio',
      'complemento_condominio',
      'bairro_condominio',
      'cidade_condominio',
      'estado_condominio',
      'cep_condominio',
      'cpf_funcionario',
      'matricula_funcionario',
      'nome_funcionario',
      'funcao_funcionario',
      'data_nascimento_funcionario',
      'sexo_funcionario',
      'codigo_produto',
      'nome_produto',
      'data_competencia',
      'valor_beneficio(total)',
      'quantidade_dias',
    ]

    const linhas = [
      [
        '03468044000139',
        'CONDOMINIO EDIFICIO LUFFICIO',
        'CONDOMINIO',
        'RUA EXEMPLO',
        '123',
        'BLOCO A',
        'CENTRO',
        'SAO PAULO',
        'SP',
        '01001000',
        '71823131468',
        '1001',
        'AGUINALDO PEREIRA DE LIMA',
        'ZELADOR',
        '1980-05-10',
        'M',
        '60113',
        'VALE REFEICAO - TICKET',
        '2026-04-01',
        '465.40',
        '26',
      ],
      [
        '03468044000139',
        'CONDOMINIO EDIFICIO LUFFICIO',
        'CONDOMINIO',
        'RUA EXEMPLO',
        '123',
        'BLOCO A',
        'CENTRO',
        'SAO PAULO',
        'SP',
        '01001000',
        '71823131468',
        '1001',
        'AGUINALDO PEREIRA DE LIMA',
        'ZELADOR',
        '1980-05-10',
        'M',
        '05000',
        'VALE ALIMENTACAO - TICKET',
        '2026-04-01',
        '552.08',
        '1',
      ],
      [
        '03468044000139',
        'CONDOMINIO EDIFICIO LUFFICIO',
        'CONDOMINIO',
        'RUA EXEMPLO',
        '123',
        'BLOCO A',
        'CENTRO',
        'SAO PAULO',
        'SP',
        '01001000',
        '79241972572',
        '1002',
        'ODAILSON DAMASCENO RIBEIRO',
        'PORTEIRO NOTURNO',
        '1987-11-21',
        'M',
        '01274',
        'CARTAO - TOP',
        '2026-04-01',
        '397.80',
        '52',
      ],
      [
        '03468044000139',
        'CONDOMINIO EDIFICIO LUFFICIO',
        'CONDOMINIO',
        'RUA EXEMPLO',
        '123',
        'BLOCO A',
        'CENTRO',
        'SAO PAULO',
        'SP',
        '01001000',
        '79241972572',
        '1002',
        'ODAILSON DAMASCENO RIBEIRO',
        'PORTEIRO NOTURNO',
        '1987-11-21',
        'M',
        '02002',
        'SP-TRANS-ONIBUS MUNIC. - BILHETE UNICO',
        '2026-04-01',
        '302.64',
        '52',
      ],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...linhas])

    worksheet['!cols'] = [
      { wch: 18 }, // cnpj_condominio
      { wch: 38 }, // nome_condominio
      { wch: 22 }, // tipo_local_condominio
      { wch: 28 }, // endereco_condominio
      { wch: 18 }, // numero_condominio
      { wch: 22 }, // complemento_condominio
      { wch: 22 }, // bairro_condominio
      { wch: 20 }, // cidade_condominio
      { wch: 18 }, // estado_condominio
      { wch: 16 }, // cep_condominio
      { wch: 18 }, // cpf_funcionario
      { wch: 20 }, // matricula_funcionario
      { wch: 34 }, // nome_funcionario
      { wch: 24 }, // funcao_funcionario
      { wch: 24 }, // data_nascimento_funcionario
      { wch: 16 }, // sexo_funcionario
      { wch: 18 }, // codigo_produto
      { wch: 40 }, // nome_produto
      { wch: 20 }, // data_competencia
      { wch: 22 }, // valor_beneficio(total)
      { wch: 18 }, // quantidade_dias
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

    if (!/\.(csv|txt|xlsx)$/i.test(file.name)) {
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
          accept=".txt,.csv., .xlsx"
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