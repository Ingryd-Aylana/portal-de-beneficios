// FileUpload.jsx
import React, { useRef, useState } from 'react'
import StatusBadge from './StatusBadge'
import { Upload } from './icons/Upload.jsx'

// Renomeado onResult para onUpload para refletir a ação que ele dispara
export default function FileUpload({ onUpload }) { // <--- onResult virou onUpload
  const inputRef = useRef()
  const [status, setStatus] = useState(null)
  const [message, setMessage] = useState('')
  const [fileName, setFileName] = useState('')

  const handlePick = () => inputRef.current?.click()

  // Função para processar o upload, que agora é assíncrona
  const processUpload = async (file) => { // <--- Agora é assíncrona e renomeada
    setStatus('processando')
    setMessage('Processando arquivo...')
    setFileName(file.name)

    // 💡 PASSO CRÍTICO: Chamar a função onUpload (que é o handleResult do Importacao.jsx)
    try {
      // Passa o arquivo e espera o resultado REAL da API
      // O onUpload (handleResult) deve retornar { success: boolean, message: string }
      const result = await onUpload?.({ status: 'processando', file }) 
      
      // Verifica o resultado retornado pelo handleResult
      if (result.success) {
        setStatus('sucesso')
        setMessage(result.message)
      } else {
        setStatus('erro')
        setMessage(result.message)
      }
    } catch (error) {
      // Caso haja uma falha no await (erro de rede, etc.)
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
    // Chama a nova função de processamento assíncrona
    processUpload(file) // <--- Chamada modificada
  }

  return (
    // ... (Restante do JSX permanece inalterado)
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