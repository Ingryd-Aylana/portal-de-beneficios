import React, { useState, useRef } from 'react'
import {
  Building2, Plus, Upload, Download, Save, X,
  CheckCircle, AlertCircle, FileSpreadsheet, Users, MapPin, Phone, Trash2
} from 'lucide-react'
import '../styles/Configuracao.css'

async function ensureXLSX() {
  if (window.XLSX) return window.XLSX
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
  return window.XLSX
}

export default function ConfiguracaoCondominios() {
  const [modoAtivo, setModoAtivo] = useState('lista')
  const [condominios, setCondominios] = useState([
    {
      id: 1, nome: 'Condomínio Sol Nascente', cnpj: '12.345.678/0001-90',
      endereco: 'Rua das Flores, 123', bairro: 'Centro', cidade: 'Rio de Janeiro',
      estado: 'RJ', cep: '20000-000', telefone: '(21) 3333-4444',
      email: 'contato@solnascente.com.br', responsavel: 'João Silva',
      qtdFuncionarios: 45, ativo: true
    },
    {
      id: 2, nome: 'Residencial Ipanema', cnpj: '98.765.432/0001-10',
      endereco: 'Av. Atlântica, 456', bairro: 'Ipanema', cidade: 'Rio de Janeiro',
      estado: 'RJ', cep: '22000-000', telefone: '(21) 2222-3333',
      email: 'admin@residencialipanema.com.br', responsavel: 'Maria Santos',
      qtdFuncionarios: 32, ativo: true
    }
  ])

  const [formData, setFormData] = useState({
    nome: '', cnpj: '', endereco: '', bairro: '', cidade: '', estado: '',
    cep: '', telefone: '', email: '', responsavel: '', qtdFuncionarios: '',
    ativo: true
  })

  const [editandoId, setEditandoId] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null) 
  const [uploadedFile, setUploadedFile] = useState(null)
  const [errosUpload, setErrosUpload] = useState([])

  const [confirm, setConfirm] = useState({ open: false, id: null, nome: '' })

  // --- TOAST ---
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })
  const toastTimer = useRef(null)
  const showToast = (message, type = 'success') => {
    setToast({ open: true, message, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast({ open: false, message: '', type: 'success' }), 2500)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const resetForm = () => {
    setFormData({
      nome: '', cnpj: '', endereco: '', bairro: '', cidade: '', estado: '',
      cep: '', telefone: '', email: '', responsavel: '', qtdFuncionarios: '', ativo: true
    })
    setEditandoId(null)
  }

  const handleSubmit = () => {
    if (editandoId) {
      setCondominios(prev => prev.map(c => c.id === editandoId ? { ...formData, id: editandoId } : c))
      showToast('Cadastro Realizado com Sucesso')
    } else {
      const novoCondominio = {
        ...formData,
        id: Date.now(),
        qtdFuncionarios: parseInt(formData.qtdFuncionarios) || 0
      }
      setCondominios(prev => [...prev, novoCondominio])
      showToast('Cadastro Realizado com Sucesso')
    }
    resetForm()
    setModoAtivo('lista')
  }

  const handleEditar = (condominio) => {
    setFormData(condominio)
    setEditandoId(condominio.id)
    setModoAtivo('form')
  }

  // Modal
  const solicitarExcluir = (cond) => setConfirm({ open: true, id: cond.id, nome: cond.nome })
  const confirmarExclusao = () => {
    setCondominios(prev => prev.filter(c => c.id !== confirm.id))
    setConfirm({ open: false, id: null, nome: '' })
    showToast('Condomínio excluído com sucesso', 'danger')
  }
  const cancelarExclusao = () => setConfirm({ open: false, id: null, nome: '' })

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setUploadStatus('error'); setErrosUpload(['Formato de arquivo inválido. Use CSV ou XLSX.']); return
    }
    setUploadedFile(file); setUploadStatus('processing'); setErrosUpload([])
    setTimeout(() => {
      const novosCondominios = [
        {
          id: Date.now() + 1, nome: 'Edifício Central Plaza', cnpj: '11.222.333/0001-44',
          endereco: 'Av. Paulista, 1000', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP',
          cep: '01310-100', telefone: '(11) 3333-5555', email: 'contato@centralplaza.com.br',
          responsavel: 'Pedro Oliveira', qtdFuncionarios: 50, ativo: true
        },
        {
          id: Date.now() + 2, nome: 'Condomínio Boa Vista', cnpj: '22.333.444/0001-55',
          endereco: 'Rua das Acácias, 234', bairro: 'Jardim Botânico', cidade: 'Rio de Janeiro', estado: 'RJ',
          cep: '22460-000', telefone: '(21) 2555-6666', email: 'admin@boavista.com.br',
          responsavel: 'Ana Costa', qtdFuncionarios: 28, ativo: true
        }
      ]
      setCondominios(prev => [...prev, ...novosCondominios])
      setUploadStatus('success')
      setTimeout(() => { setModoAtivo('lista'); setUploadStatus(null); setUploadedFile(null) }, 2000)
    }, 2000)
  }

  const downloadModelo = async () => {
    const XLSX = await ensureXLSX()
    const dados = [[
      'Nome', 'CNPJ', 'Endereco', 'Bairro', 'Cidade', 'Estado', 'CEP', 'Telefone', 'Email', 'Responsavel', 'QtdFuncionarios', 'Ativo', 'Funcionarios'
    ], [
      'Condomínio Exemplo', '12.345.678/0001-90', 'Rua Exemplo 123', 'Centro', 'Rio de Janeiro', 'RJ',
      '20000-000', '(21) 3333-4444', 'contato@exemplo.com.br', 'João Silva', 45, true, 'Joe Doe'
    ]]
    const ws = XLSX.utils.aoa_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo')
    XLSX.writeFile(wb, 'modelo_condominios.xlsx')
  }

  const ModalConfirm = ({ open, nome, onConfirm, onCancel }) => {
    if (!open) return null
    return (
      <div className="modal-backdrop">
        <div className="modal">
          <div className="modal-head">
            <div className="modal-title">
              <Trash2 className="ico danger" />
              <h3>Excluir condomínio</h3>
            </div>
            <button className="icon-btn" onClick={onCancel}><X className="ico" /></button>
          </div>
          <div className="modal-body">
            Tem certeza que deseja excluir <strong>{nome}</strong>? Esta ação não pode ser desfeita.
          </div>
          <div className="modal-actions">
            <button className="btn btn-light" onClick={onCancel}>Cancelar</button>
            <button className="btn btn-danger" onClick={onConfirm}>Excluir</button>
          </div>
        </div>
      </div>
    )
  }

  const ListaAcoes = () => (
    <div className="cfg-actions">
      <button onClick={() => setModoAtivo('form')} className="btn btn-primary">
        <Plus className="ico" /><span>Novo Condomínio</span>
      </button>
      <button onClick={() => setModoAtivo('upload')} className="btn btn-success">
        <Upload className="ico" /><span>Importar Planilha</span>
      </button>
      <button onClick={downloadModelo} className="btn btn-dark">
        <Download className="ico" /><span>Baixar Modelo</span>
      </button>
    </div>
  )

  const Tabela = () => (
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Condomínio</th><th>CNPJ</th><th>Localização</th>
              <th>Contato</th><th>Funcionários</th><th>Status</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {condominios.map(cond => (
              <tr key={cond.id}>
                <td>
                  <div className="cell-flex">
                    <Building2 className="ico brand" />
                    <div>
                      <div className="cell-title">{cond.nome}</div>
                      <div className="cell-sub">{cond.responsavel}</div>
                    </div>
                  </div>
                </td>
                <td className="muted">{cond.cnpj}</td>
                <td className="muted">
                  <div>{cond.cidade} - {cond.estado}</div>
                  <div className="cell-sub">{cond.bairro}</div>
                </td>
                <td className="muted">
                  <div>{cond.telefone}</div>
                  <div className="cell-sub">{cond.email}</div>
                </td>
                <td className="muted">{cond.qtdFuncionarios}</td>
                <td>
                  <span className={'pill ' + (cond.ativo ? 'pill-green' : 'pill-red')}>
                    {cond.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="text-right">
                  <button className="link link-blue" onClick={() => handleEditar(cond)}>Editar</button>
                  <button className="link link-red" onClick={() => solicitarExcluir(cond)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {condominios.length === 0 && (
        <div className="empty">
          <Building2 className="ico xl muted" />
          <p>Nenhum condomínio cadastrado</p>
        </div>
      )}
    </div>
  )

  const Formulario = () => (
    <div className="card pad">
      <div className="card-head">
        <h2 className="card-title">{editandoId ? 'Editar Condomínio' : 'Novo Condomínio'}</h2>
        <button className="icon-btn" onClick={() => { resetForm(); setModoAtivo('lista') }}>
          <X className="ico" />
        </button>
      </div>

      <div className="grid">
        <div className="grid-full section-title">
          <Building2 className="ico" /><span>Dados Básicos</span>
        </div>

        <div className="field">
          <label>Nome do Condomínio *</label>
          <input name="nome" value={formData.nome} onChange={handleInputChange} />
        </div>

        <div className="field">
          <label>CNPJ *</label>
          <input name="cnpj" value={formData.cnpj} onChange={handleInputChange} placeholder="00.000.000/0000-00" />
        </div>

        <div className="grid-full section-title mt">
          <MapPin className="ico" /><span>Endereço</span>
        </div>

        <div className="field grid-full">
          <label>Endereço Completo *</label>
          <input name="endereco" value={formData.endereco} onChange={handleInputChange} />
        </div>

        <div className="field">
          <label>Bairro *</label>
          <input name="bairro" value={formData.bairro} onChange={handleInputChange} />
        </div>

        <div className="field">
          <label>CEP *</label>
          <input name="cep" value={formData.cep} onChange={handleInputChange} placeholder="00000-000" />
        </div>

        <div className="field">
          <label>Cidade *</label>
          <input name="cidade" value={formData.cidade} onChange={handleInputChange} />
        </div>

        <div className="field">
          <label>Estado *</label>
          <select name="estado" value={formData.estado} onChange={handleInputChange}>
            <option value="">Selecione...</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="SP">São Paulo</option>
            <option value="MG">Minas Gerais</option>
            <option value="ES">Espírito Santo</option>
          </select>
        </div>

        <div className="grid-full section-title mt">
          <Phone className="ico" /><span>Contato</span>
        </div>

        <div className="field">
          <label>Telefone *</label>
          <input name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 0000-0000" />
        </div>

        <div className="field">
          <label>E-mail *</label>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
        </div>

        <div className="grid-full section-title mt">
          <Users className="ico" /><span>Informações Adicionais</span>
        </div>

        <div className="field">
          <label>Responsável *</label>
          <input name="responsavel" value={formData.responsavel} onChange={handleInputChange} />
        </div>

        <div className="field">
          <label>Quantidade de Funcionários *</label>
          <input type="number" min="0" name="qtdFuncionarios" value={formData.qtdFuncionarios} onChange={handleInputChange} />
        </div>

        <div className="grid-full">
          <label className="check">
            <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleInputChange} />
            <span>Condomínio ativo</span>
          </label>
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-primary lg" onClick={handleSubmit}>
          <Save className="ico" /><span>{editandoId ? 'Atualizar' : 'Cadastrar'}</span>
        </button>
        <button className="btn btn-light lg" onClick={() => { resetForm(); setModoAtivo('lista') }}>
          Cancelar
        </button>
      </div>
    </div>
  )

  const UploadPlanilha = () => (
    <div className="card pad">
      <div className="card-head">
        <h2 className="card-title">Importar Condomínios</h2>
        <button className="icon-btn" onClick={() => { setModoAtivo('lista'); setUploadStatus(null); setUploadedFile(null) }}>
          <X className="ico" />
        </button>
      </div>

      <div className="tips">
        <h3>Instruções:</h3>
        <ol>
          <li>Baixe o modelo de planilha</li>
          <li>Preencha os dados seguindo o formato</li>
          <li>Salve em CSV ou XLSX</li>
          <li>Faça o upload do arquivo</li>
        </ol>
        <button className="btn btn-dark" onClick={downloadModelo}>
          <Download className="ico" /><span>Baixar Modelo de Planilha</span>
        </button>
      </div>

      <div className="drop">
        <input id="planilha-upload" type="file" accept=".csv,.xlsx" onChange={handleFileUpload} />
        <label htmlFor="planilha-upload" className="drop-area">
          <FileSpreadsheet className="ico xl" />
          <p className="drop-title">Clique para selecionar a planilha</p>
          <p className="drop-sub">Arquivos CSV ou XLSX (máx. 10MB)</p>
        </label>
      </div>

      {uploadStatus && (
        <div className={'alert ' + uploadStatus}>
          {uploadStatus === 'success' && <CheckCircle className="ico" />}
          {uploadStatus === 'error' && <AlertCircle className="ico" />}
          {uploadStatus === 'processing' && <span className="spinner" />}
          <div className="alert-text">
            <p className="alert-title">
              {uploadStatus === 'success' ? 'Condomínios importados com sucesso!' :
                uploadStatus === 'error' ? 'Erro ao processar arquivo' :
                  'Processando planilha...'}
            </p>
            {uploadedFile && <p className="alert-file">{uploadedFile.name}</p>}
          </div>
        </div>
      )}

      {errosUpload.length > 0 && (
        <div className="errors">
          <p className="errors-title">Erros encontrados:</p>
          <ul>{errosUpload.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
    </div>
  )

  return (
    <div className="cfg-page">
      {modoAtivo === 'lista' && <div className="cfg-header"><h1>Configurações de Condomínios</h1><p>Gerencie os condomínios cadastrados na plataforma</p></div>}
      {modoAtivo === 'lista' && <ListaAcoes />}
      {modoAtivo === 'lista' && <Tabela />}
      {modoAtivo === 'form' && <Formulario />}
      {modoAtivo === 'upload' && <UploadPlanilha />}

      <ModalConfirm
        open={confirm.open}
        nome={confirm.nome}
        onConfirm={confirmarExclusao}
        onCancel={cancelarExclusao}
      />

      <div className={`cfg-toast-wrap ${toast.open ? 'show' : ''}`} role="status" aria-live="polite">
        <div className={`cfg-toast ${toast.type === 'danger' ? 'cfg-toast-danger' : 'cfg-toast-success'}`}>
          {toast.type === 'danger' ? (
            <Trash2 className="cfg-toast-ico" />
          ) : (
            <CheckCircle className="cfg-toast-ico" />
          )}
          <span>{toast.message}</span>
        </div>
      </div>

    </div>
  )
}
