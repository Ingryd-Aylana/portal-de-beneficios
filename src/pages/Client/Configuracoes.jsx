import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Building2,
  Plus,
  Upload,
  Download,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Users,
  MapPin,
  Trash2,
  Search,
} from 'lucide-react'

import { entebenService } from '../../services/entebenService'
import '../../styles/Configuracao.css'

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

const toArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.results)) return value.results
  if (Array.isArray(value?.data)) return value.data
  return []
}

const somenteDigitos = (value) => String(value || '').replace(/\D/g, '')

const normalizarTexto = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const normalizarCondominio = (cond) => ({
  id: cond?.id,

  nome:
    cond?.nome ||
    cond?.condominio ||
    cond?.razao_social ||
    cond?.fantasia ||
    cond?.nome_condominio ||
    `Condomínio #${cond?.id}`,

  cnpj:
    cond?.cnpj ||
    cond?.cnpj_condominio ||
    cond?.documento ||
    cond?.cgc ||
    '',

  endereco:
    cond?.endereco ||
    cond?.logradouro ||
    cond?.endereco_completo ||
    [cond?.rua, cond?.numero, cond?.bairro].filter(Boolean).join(', '),

  bairro: cond?.bairro || '',
  cidade: cond?.cidade || '',
  estado: cond?.estado || cond?.uf || '',
  cep: cond?.cep || '',
  telefone: cond?.telefone || cond?.contato || '',
  email: cond?.email || '',

  responsavel:
    cond?.responsavel ||
    cond?.sindico ||
    cond?.gerente ||
    cond?.administradora_nome ||
    '',

  qtdFuncionarios:
    cond?.qtdFuncionarios ??
    cond?.quantidade_funcionarios ??
    cond?.total_funcionarios ??
    cond?.qtd_funcionarios ??
    cond?.funcionarios_count ??
    cond?.total_colaboradores ??
    cond?.quantidade_colaboradores ??
    cond?.colaboradores_count ??
    cond?.total_beneficiarios ??
    cond?.quantidade_beneficiarios ??
    cond?.beneficiarios_count ??
    cond?.funcionarios?.length ??
    cond?.colaboradores?.length ??
    cond?.beneficiarios?.length ??
    0,

  ativo: cond?.ativo ?? cond?.is_active ?? cond?.status !== 'Inativo',
})

function FiltroCondominios({ value, onChange, onClear }) {
  return (
    <div className="cfg-filter-bar">
      <div className="cfg-filter-search">
        <Search className="ico" />
        <input
          type="text"
          placeholder="Buscar condomínio por nome ou CNPJ"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        {value && (
          <button type="button" className="cfg-filter-clear" onClick={onClear}>
            <X className="ico" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function ConfiguracaoCondominios() {
  const [modoAtivo, setModoAtivo] = useState('lista')
  const [condominios, setCondominios] = useState([])
  const [loadingCondominios, setLoadingCondominios] = useState(true)
  const [erroCondominios, setErroCondominios] = useState('')

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    responsavel: '',
    qtdFuncionarios: '',
    ativo: true,
  })

  const [editandoId, setEditandoId] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [errosUpload, setErrosUpload] = useState([])
  const [confirm, setConfirm] = useState({ open: false, id: null, nome: '' })
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })
  const [busca, setBusca] = useState('')

  const toastTimer = useRef(null)

  useEffect(() => {
    carregarCondominios()
  }, [])

  async function carregarCondominios() {
    try {
      setLoadingCondominios(true)
      setErroCondominios('')

      const [condominiosData, funcionariosData] = await Promise.all([
        entebenService.getcondominios(),
        entebenService.getFuncionarios(),
      ])

      const condominiosRaw = toArray(condominiosData)
      const funcionariosRaw = toArray(funcionariosData)

        const funcionariosPorCondominio = funcionariosRaw.reduce((acc, funcionario) => {
        const condId =
          funcionario?.condominio_id ||
          funcionario?.condominio?.id ||
          (typeof funcionario?.condominio === 'number' ||
            typeof funcionario?.condominio === 'string'
            ? funcionario.condominio
            : null)

        const cnpj =
          somenteDigitos(funcionario?.condominio_cnpj) ||
          somenteDigitos(funcionario?.cnpj_condominio) ||
          somenteDigitos(funcionario?.condominio?.cnpj) ||
          somenteDigitos(funcionario?.condominio?.documento) ||
          somenteDigitos(funcionario?.cnpj)

        const nome =
          funcionario?.condominio_nome ||
          funcionario?.nome_condominio ||
          funcionario?.condominio?.nome ||
          funcionario?.condominio?.razao_social ||
          ''

        const chaveId = condId ? String(condId) : ''
        const chaveCnpj = cnpj
        const chaveNome = normalizarTexto(nome)

        if (chaveId) acc[chaveId] = (acc[chaveId] || 0) + 1
        if (chaveCnpj) acc[chaveCnpj] = (acc[chaveCnpj] || 0) + 1
        if (chaveNome) acc[chaveNome] = (acc[chaveNome] || 0) + 1

        return acc
      }, {})

      const lista = condominiosRaw.map((condominio) => {
        const condNormalizado = normalizarCondominio(condominio)

        const chaveId = String(condNormalizado.id || '')
        const chaveCnpj = somenteDigitos(condNormalizado.cnpj)
        const chaveNome = normalizarTexto(condNormalizado.nome)

        return {
          ...condNormalizado,
          qtdFuncionarios:
            funcionariosPorCondominio[chaveId] ||
            funcionariosPorCondominio[chaveCnpj] ||
            funcionariosPorCondominio[chaveNome] ||
            condNormalizado.qtdFuncionarios ||
            0,
        }
      })

      setCondominios(lista)
    } catch (err) {
      console.error('Erro ao carregar condomínios:', err)
      setErroCondominios('Não foi possível carregar os condomínios cadastrados.')
    } finally {
      setLoadingCondominios(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ open: true, message, type })

    if (toastTimer.current) clearTimeout(toastTimer.current)

    toastTimer.current = setTimeout(
      () => setToast({ open: false, message: '', type: 'success' }),
      2500
    )
  }

  const condominiosFiltrados = useMemo(() => {
    if (!busca.trim()) return condominios

    const term = normalizarTexto(busca)
    const digits = somenteDigitos(busca)

    return condominios.filter((c) => {
      const nome = normalizarTexto(c.nome)
      const cnpj = somenteDigitos(c.cnpj)

      return nome.includes(term) || (digits && cnpj.includes(digits))
    })
  }, [busca, condominios])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      endereco: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      telefone: '',
      email: '',
      responsavel: '',
      qtdFuncionarios: '',
      ativo: true,
    })

    setEditandoId(null)
  }

  const handleSubmit = () => {
    if (editandoId) {
      setCondominios((prev) =>
        prev.map((c) =>
          c.id === editandoId
            ? {
              ...formData,
              id: editandoId,
              qtdFuncionarios: parseInt(formData.qtdFuncionarios, 10) || 0,
            }
            : c
        )
      )

      showToast('Cadastro atualizado com sucesso')
    } else {
      const novoCondominio = {
        ...formData,
        id: Date.now(),
        qtdFuncionarios: parseInt(formData.qtdFuncionarios, 10) || 0,
      }

      setCondominios((prev) => [...prev, novoCondominio])
      showToast('Cadastro realizado com sucesso')
    }

    resetForm()
    setModoAtivo('lista')
  }

  const handleEditar = (condominio) => {
    setFormData(condominio)
    setEditandoId(condominio.id)
    setModoAtivo('form')
  }

  const solicitarExcluir = (cond) =>
    setConfirm({ open: true, id: cond.id, nome: cond.nome })

  const confirmarExclusao = () => {
    setCondominios((prev) => prev.filter((c) => c.id !== confirm.id))
    setConfirm({ open: false, id: null, nome: '' })
    showToast('Condomínio excluído com sucesso', 'danger')
  }

  const cancelarExclusao = () =>
    setConfirm({ open: false, id: null, nome: '' })

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setUploadStatus('error')
      setErrosUpload(['Formato de arquivo inválido. Use CSV ou XLSX.'])
      return
    }

    setUploadedFile(file)
    setUploadStatus('processing')
    setErrosUpload([])

    setTimeout(() => {
      setUploadStatus('success')

      setTimeout(() => {
        setModoAtivo('lista')
        setUploadStatus(null)
        setUploadedFile(null)
      }, 2000)
    }, 2000)
  }

  const downloadModelo = async () => {
    const XLSX = await ensureXLSX()

    const dados = [
      [
        'Nome',
        'CNPJ',
        'Endereco',
        'Bairro',
        'Cidade',
        'Estado',
        'CEP',
        'Telefone',
        'Email',
        'Responsavel',
        'QtdFuncionarios',
        'Ativo',
        'Funcionarios',
      ],
      [
        'Condomínio Exemplo',
        '12.345.678/0001-90',
        'Rua Exemplo 123',
        'Centro',
        'Rio de Janeiro',
        'RJ',
        '20000-000',
        '(21) 3333-4444',
        'contato@exemplo.com.br',
        'João Silva',
        45,
        true,
        'Joe Doe',
      ],
    ]

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

            <button className="icon-btn" onClick={onCancel}>
              <X className="ico" />
            </button>
          </div>

          <div className="modal-body">
            Tem certeza que deseja excluir <strong>{nome}</strong>? Esta ação não pode
            ser desfeita.
          </div>

          <div className="modal-actions">
            <button className="btn btn-light" onClick={onCancel}>
              Cancelar
            </button>

            <button className="btn btn-danger" onClick={onConfirm}>
              Excluir
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ListaAcoes = () => (
    <div className="cfg-actions">
      <button onClick={() => setModoAtivo('form')} className="btn btn-primary">
        <Plus className="ico" />
        <span>Novo Condomínio</span>
      </button>

      <button onClick={() => setModoAtivo('upload')} className="btn btn-success">
        <Upload className="ico" />
        <span>Importar Planilha</span>
      </button>

      <button onClick={downloadModelo} className="btn btn-dark">
        <Download className="ico" />
        <span>Baixar Modelo</span>
      </button>

      <button onClick={carregarCondominios} className="btn btn-light">
        <Building2 className="ico" />
        <span>Atualizar</span>
      </button>
    </div>
  )

  const Tabela = () => (
    <div className="card">
      {loadingCondominios ? (
        <div className="empty">
          <Building2 className="ico xl muted" />
          <p>Carregando condomínios...</p>
        </div>
      ) : erroCondominios ? (
        <div className="empty">
          <AlertCircle className="ico xl muted" />
          <p>{erroCondominios}</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Condomínio</th>
                  <th>CNPJ</th>
                  <th>Funcionários</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {condominiosFiltrados.map((cond) => (
                  <tr key={cond.id}>
                    <td>
                      <div className="cell-flex">
                        <Building2 className="ico brand" />

                        <div>
                          <div className="cell-title">{cond.nome}</div>
                        </div>
                      </div>
                    </td>

                    <td className="muted">{cond.cnpj || '—'}</td>

                    <td className="muted">{cond.qtdFuncionarios}</td>

                    <td>
                      <span className={'pill ' + (cond.ativo ? 'pill-green' : 'pill-red')}>
                        {cond.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="text-right">
                      <button className="link link-blue" onClick={() => handleEditar(cond)}>
                        Editar
                      </button>

                      <button className="link link-red" onClick={() => solicitarExcluir(cond)}>
                        Excluir
                      </button>
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

          {condominios.length > 0 && condominiosFiltrados.length === 0 && (
            <div className="empty">
              <Building2 className="ico xl muted" />
              <p>Nenhum condomínio encontrado para a busca</p>
            </div>
          )}
        </>
      )}
    </div>
  )

  const Formulario = () => (
    <div className="card pad">
      <div className="card-head">
        <h2 className="card-title">
          {editandoId ? 'Editar Condomínio' : 'Novo Condomínio'}
        </h2>

        <button
          className="icon-btn"
          onClick={() => {
            resetForm()
            setModoAtivo('lista')
          }}
        >
          <X className="ico" />
        </button>
      </div>

      <div className="grid">
        <div className="grid-full section-title">
          <Building2 className="ico" />
          <span>Dados Básicos</span>
        </div>

        <div className="field">
          <label>Nome do Condomínio *</label>
          <input name="nome" value={formData.nome} onChange={handleInputChange} />
        </div>

        <div className="field">
          <label>CNPJ *</label>
          <input name="cnpj" value={formData.cnpj} onChange={handleInputChange} />
        </div>

        <div className="grid-full section-title mt">
          <MapPin className="ico" />
          <span>Endereço</span>
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
          <input name="cep" value={formData.cep} onChange={handleInputChange} />
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

        <div className="field">
          <label>Telefone *</label>
          <input name="telefone" value={formData.telefone} onChange={handleInputChange} />
        </div>

        <div className="field">
          <label>E-mail *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>

        <div className="grid-full section-title mt">
          <Users className="ico" />
          <span>Informações Adicionais</span>
        </div>

        <div className="field">
          <label>Responsável *</label>
          <input
            name="responsavel"
            value={formData.responsavel}
            onChange={handleInputChange}
          />
        </div>

        <div className="field">
          <label>Quantidade de Funcionários *</label>
          <input
            type="number"
            min="0"
            name="qtdFuncionarios"
            value={formData.qtdFuncionarios}
            onChange={handleInputChange}
          />
        </div>

        <div className="grid-full">
          <label className="check">
            <input
              type="checkbox"
              name="ativo"
              checked={formData.ativo}
              onChange={handleInputChange}
            />
            <span>Condomínio ativo</span>
          </label>
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-primary lg" onClick={handleSubmit}>
          <Save className="ico" />
          <span>{editandoId ? 'Atualizar' : 'Cadastrar'}</span>
        </button>

        <button
          className="btn btn-light lg"
          onClick={() => {
            resetForm()
            setModoAtivo('lista')
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )

  const UploadPlanilha = () => (
    <div className="card pad">
      <div className="card-head">
        <h2 className="card-title">Importar Condomínios</h2>

        <button
          className="icon-btn"
          onClick={() => {
            setModoAtivo('lista')
            setUploadStatus(null)
            setUploadedFile(null)
          }}
        >
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
          <Download className="ico" />
          <span>Baixar Modelo de Planilha</span>
        </button>
      </div>

      <div className="drop">
        <input
          id="planilha-upload"
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileUpload}
        />

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
              {uploadStatus === 'success'
                ? 'Condomínios importados com sucesso!'
                : uploadStatus === 'error'
                  ? 'Erro ao processar arquivo'
                  : 'Processando planilha...'}
            </p>

            {uploadedFile && <p className="alert-file">{uploadedFile.name}</p>}
          </div>
        </div>
      )}

      {errosUpload.length > 0 && (
        <div className="errors">
          <p className="errors-title">Erros encontrados:</p>

          <ul>
            {errosUpload.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <div className="cfg-page">
      {modoAtivo === 'lista' && (
        <>
          <div className="cfg-header">
            <h1>Configurações de Condomínios</h1>
            <p>Gerencie os condomínios cadastrados na plataforma</p>
          </div>

          <FiltroCondominios
            value={busca}
            onChange={setBusca}
            onClear={() => setBusca('')}
          />

          <ListaAcoes />
          <Tabela />
        </>
      )}

      {modoAtivo === 'form' && <Formulario />}
      {modoAtivo === 'upload' && <UploadPlanilha />}

      <ModalConfirm
        open={confirm.open}
        nome={confirm.nome}
        onConfirm={confirmarExclusao}
        onCancel={cancelarExclusao}
      />

      <div
        className={`cfg-toast-wrap ${toast.open ? 'show' : ''}`}
        role="status"
        aria-live="polite"
      >
        <div
          className={`cfg-toast ${toast.type === 'danger' ? 'cfg-toast-danger' : 'cfg-toast-success'
            }`}
        >
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