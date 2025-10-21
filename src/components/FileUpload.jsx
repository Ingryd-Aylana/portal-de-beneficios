import React, { useRef, useState } from 'react'
import StatusBadge from './StatusBadge'
import { Upload } from './icons/Upload.jsx'

export default function FileUpload({ onResult }) {
  const inputRef = useRef()
  const [status, setStatus] = useState(null)
  const [message, setMessage] = useState('')
  const [fileName, setFileName] = useState('')

  const handlePick = () => inputRef.current?.click()

  const simulateProcessing = (file) => {
    setStatus('processando')
    setMessage('Processando arquivo...')
    setFileName(file.name)

    setTimeout(() => {
      const ok = file.name.endsWith('.csv') || Math.random() > 0.2
      if (ok) {
        setStatus('sucesso')
        setMessage('Importação concluída com sucesso.')
        onResult?.({ status: 'sucesso', file })
      } else {
        setStatus('erro')
        setMessage('Falha na importação. Verifique o formato e tente novamente.')
        onResult?.({ status: 'erro', file })
      }
    }, 1500)
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
    simulateProcessing(file)
  }

  return (
    <div className="upload-card">
      <div className="upload-header">
        <div className="upload-icon-wrapper">
          <Upload size={24} />
        </div>
        <div>
          <h2 className="upload-title">Upload de Arquivo</h2>
          <p className="upload-subtitle">Importe arquivos .txt ou .csv</p>
        </div>
      </div>

      <div className="upload-area" onClick={handlePick}>
        <input ref={inputRef} type="file" accept=".txt,.csv" onChange={handleChange} hidden />
        <div className="upload-icon-large"><Upload size={48} /></div>
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
