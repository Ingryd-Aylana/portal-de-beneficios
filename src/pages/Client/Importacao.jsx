import React, { useMemo, useState } from 'react'
import FileUpload from '../../components/FileUpload'
import { PencilLine, Trash2, Check, X as XIcon, Eye } from 'lucide-react'
import '../../styles/Importacao.css'
import { uploadService } from '../../services/uploadService'

function Modal({ open, title, onClose, children }) {
  if (!open) return null

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-ghost" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

const MESES = [
  { label: 'Janeiro', value: '01' },
  { label: 'Fevereiro', value: '02' },
  { label: 'Março', value: '03' },
  { label: 'Abril', value: '04' },
  { label: 'Maio', value: '05' },
  { label: 'Junho', value: '06' },
  { label: 'Julho', value: '07' },
  { label: 'Agosto', value: '08' },
  { label: 'Setembro', value: '09' },
  { label: 'Outubro', value: '10' },
  { label: 'Novembro', value: '11' },
  { label: 'Dezembro', value: '12' },
]

function getNomeColaborador(row) {
  return row?.nome_funcionario || row?.nome_func || row?.colaborador || row?.nome || row?.funcionario || row?.nome_funcionário || ''
}

function getValorRow(row) {
  return Number(row?.valor_total || row?.valor || row?.valor_recarga_bene || row?.valor_beneficio || row?.valorTotal || row?.ValorTotal || 0)
}

function getCondominio(row) {
  return row?.condominio || row?.nome_condominio || row?.condominio_nome || row?.NomeCondominio || ''
}

function getCpf(row) {
  return String(row?.cpf || row?.cpf_func || row?.cpf_funcionario || row?.CPF || '').trim()
}


function getRowKey(row) {
  const cpf = getCpf(row)
  if (cpf) return `${getCondominio(row)}::${getNomeColaborador(row)}::${cpf}`
  return `${getCondominio(row)}::${getNomeColaborador(row)}`
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function isValidCPF(value) {
  const cpf = onlyDigits(value)

  if (!cpf || cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i)
  }

  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== Number(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0

  return remainder === Number(cpf[10])
}


function getNomeProduto(item) {
  return (
    item?.nome_produto ||
    item?.produto_nome ||
    item?.produto ||
    item?.nome_beneficio ||
    item?.beneficio_nome ||
    item?.beneficio ||
    item?.descricao_produto ||
    item?.descricao ||
    ''
  )
}

function getCodigoProduto(item) {
  return String(
    item?.codigo_produto ||
      item?.produto_codigo ||
      item?.cod_produto ||
      item?.codigo ||
      ''
  ).trim()
}

function getValorProduto(item) {
  return Number(
    item?.valor_recarga_bene ||
      item?.valor_total ||
      item?.valor ||
      item?.valor_unitario ||
      0
  )
}

function getNomeMov(item) {
  return item?.nome_funcionario || item?.nome_func || item?.colaborador || item?.nome || item?.funcionario || item?.nome_funcionário || ''
}

function getCondominioMov(item) {
  return item?.condominio || item?.nome_condominio || item?.condominio_nome || item?.NomeCondominio || ''
}

function getCpfMov(item) {
  return String(item?.cpf || item?.cpf_func || item?.cpf_funcionario || item?.CPF || '').trim()
}

function buildBenefitsIndexes(movimentacoes = []) {
  const byCondominioNomeCpf = new Map()
  const byNomeCpf = new Map()
  const byCondominioNome = new Map()

  movimentacoes.forEach((item) => {
    const nome = normalizeText(getNomeMov(item))
    const condominio = normalizeText(getCondominioMov(item))
    const cpf = onlyDigits(getCpfMov(item))

    const beneficio = {
      codigo: getCodigoProduto(item),
      nome: getNomeProduto(item),
      valor: getValorProduto(item),
    }

    if (!beneficio.nome) return

    const keyCondominioNomeCpf = `${condominio}::${nome}::${cpf}`
    const keyNomeCpf = `${nome}::${cpf}`
    const keyCondominioNome = `${condominio}::${nome}`

    if (cpf) {
      if (!byCondominioNomeCpf.has(keyCondominioNomeCpf)) {
        byCondominioNomeCpf.set(keyCondominioNomeCpf, [])
      }
      byCondominioNomeCpf.get(keyCondominioNomeCpf).push(beneficio)

      if (!byNomeCpf.has(keyNomeCpf)) {
        byNomeCpf.set(keyNomeCpf, [])
      }
      byNomeCpf.get(keyNomeCpf).push(beneficio)
    }

    if (!byCondominioNome.has(keyCondominioNome)) {
      byCondominioNome.set(keyCondominioNome, [])
    }
    byCondominioNome.get(keyCondominioNome).push(beneficio)
  })

  return {
    byCondominioNomeCpf,
    byNomeCpf,
    byCondominioNome,
  }
}

function enrichRowsWithBenefits(rows = [], movimentacoes = []) {
  const indexes = buildBenefitsIndexes(movimentacoes)

  return rows.map((row) => {
    const nome = normalizeText(getNomeColaborador(row))
    const condominio = normalizeText(getCondominio(row))
    const cpf = onlyDigits(getCpf(row))

    const keyCondominioNomeCpf = `${condominio}::${nome}::${cpf}`
    const keyNomeCpf = `${nome}::${cpf}`
    const keyCondominioNome = `${condominio}::${nome}`

    const beneficios =
      (cpf && indexes.byCondominioNomeCpf.get(keyCondominioNomeCpf)) ||
      (cpf && indexes.byNomeCpf.get(keyNomeCpf)) ||
      indexes.byCondominioNome.get(keyCondominioNome) ||
      []

    return {
      ...row,
      beneficios,
    }
  })
}

function getQuantidadeDias(row) {
  return Number(row?.quantidade_dias || row?.quantidade || row?.dias || row?.dias_trabalhados || row?.quantidadeDias || 0)
}

function getRowValidation(row) {
  const erros = []

  const nome = getNomeColaborador(row)
  const condominio = getCondominio(row)
  const cpf = getCpf(row)
  const valor = getValorRow(row)

  if (!normalizeText(nome)) {
    erros.push('Nome do colaborador não informado')
  }

  if (!normalizeText(condominio)) {
    erros.push('Condomínio não informado')
  }

  if (!cpf) {
    erros.push('CPF não informado')
  } else if (!isValidCPF(cpf)) {
    erros.push('CPF inválido')
  }

  if (Number(valor) <= 0) {
    erros.push('Valor inválido')
  }

  const bloqueadoPorValor = Number(valor) > 2500

  return {
    erros,
    bloqueadoPorValor,
    bloqueado: erros.length > 0 || bloqueadoPorValor,
  }
}

function buildPreviewRowsFromMovimentacoes(movimentacoes = []) {
  const mapa = new Map()

  movimentacoes.forEach((item) => {
    const nome = getNomeColaborador(item)
    const condominio = getCondominio(item)
    const cpf = getCpf(item)
    const key = cpf
      ? `${condominio}::${nome}::${cpf}`
      : `${condominio}::${nome}`

    const valor = getValorRow(item)
    const quantidadeDias = getQuantidadeDias(item)

    if (!mapa.has(key)) {
      mapa.set(key, {
        ...item,
        condominio,
        nome_funcionario: nome,
        cpf_funcionario: cpf,
        valor_total: 0,
        quantidade_dias: 0,
      })
    }

    const atual = mapa.get(key)

    atual.valor_total += Number(valor || 0)
    atual.quantidade_dias += Number(quantidadeDias || 0)

    mapa.set(key, atual)
  })

  return Array.from(mapa.values())
}

function formatDateToBackend(dateValue) {
  if (!dateValue) return ''

  const value = String(dateValue).trim()

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }

  if (value.includes('T')) {
    const onlyDate = value.split('T')[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(onlyDate)) {
      const [y, m, d] = onlyDate.split('-')
      return `${d}/${m}/${y}`
    }
  }

  return ''
}

function getProdutoCodigoBackend(item) {
  return String(
    item?.produto_codigo ||
      item?.codigo_produto ||
      item?.cod_produto ||
      item?.codigo ||
      ''
  ).trim()
}

function getProdutoBackend(item) {
  return (
    item?.produto ||
    item?.nome_produto ||
    item?.produto_nome ||
    item?.beneficio ||
    item?.beneficio_nome ||
    item?.nome_beneficio ||
    item?.descricao_produto ||
    item?.descricao ||
    ''
  )
}

function getDepartamentoBackend(item) {
  return (
    item?.departamento ||
    item?.setor ||
    item?.area ||
    item?.condominio ||
    item?.nome_condominio ||
    'GERAL'
  )
}

function getQuantidadeBackend(item) {
  return Number(item?.quantidade || item?.quantidade_dias || item?.dias || 0)
}

export default function Importacao() {
  const [data, setData] = useState(null)

  const [lote, setLote] = useState({
    id: null,
    arquivo: null,
    tipo: null,
    rows: [],
    excluidosPorColab: new Set(),
  })

  const [editingIndex, setEditingIndex] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [mostrarSomenteAcima2500, setMostrarSomenteAcima2500] = useState(false)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsTitle, setDetailsTitle] = useState('')
  const [detailsBenefits, setDetailsBenefits] = useState([])

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [colaboradorParaExcluir, setColaboradorParaExcluir] = useState(null)

  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewData, setReviewData] = useState({
    totalFuncionarios: 0,
    totalMovimentacoes: 0,
    valorTotalBeneficios: 0,
    periodoInicio: '',
    periodoFim: '',
    competenciaMes: '',
    competenciaAno: '',
    vencimento: '',
  })

  const [formEnvio, setFormEnvio] = useState({
    periodoInicio: '',
    periodoFim: '',
    competenciaMes: '',
    competenciaAno: String(new Date().getFullYear()),
    vencimento: '',
  })

  async function handleResult({ file }) {
  try {
    const response = await uploadService.uploadFile(file)
    console.log('UPLOAD RESPONSE:', response)

    const id = 'IMP-' + (response?.file_upload_id || Date.now())
    const tipo = file.name.toLowerCase().includes('fat') ? 'faturamento' : 'compra'

    const movimentacoes =
      response?.data_to_backend?.movimentacoes_detalhada ||
      response?.movimentacoes_detalhada ||
      response?.movimentacoes ||
      []

    console.log('movimentacoes_detalhada:', movimentacoes)

    const previewRowsBackend =
      response?.summary?.total_por_beneficiario ||
      response?.data_to_backend?.summary?.total_por_beneficiario ||
      response?.total_por_beneficiario ||
      response?.resumo ||
      response?.preview ||
      []

    console.log('previewRowsBackend:', previewRowsBackend)

    const previewRows =
      Array.isArray(previewRowsBackend) && previewRowsBackend.length > 0
        ? previewRowsBackend
        : Array.isArray(movimentacoes) && movimentacoes.length > 0
        ? buildPreviewRowsFromMovimentacoes(movimentacoes)
        : []

    console.log('previewRows final:', previewRows)

    const parsed = enrichRowsWithBenefits(previewRows, movimentacoes)
    console.log('parsed rows:', parsed)

    const errosImportacao =
      response?.errors ||
      response?.invalid_rows ||
      response?.rejeitados ||
      response?.linhas_com_erro ||
      response?.summary?.errors ||
      response?.data_to_backend?.summary?.errors ||
      []

    const semPreview = !Array.isArray(parsed) || parsed.length === 0

    if (semPreview) {
      console.warn('Importação sem preview. Possíveis erros:', errosImportacao)

      setData(response)
      setLote({
        id: null,
        arquivo: null,
        tipo: null,
        rows: [],
        excluidosPorColab: new Set(),
      })

      setEditingIndex(null)
      setEditValue('')
      setDetailsOpen(false)
      setDetailsTitle('')
      setDetailsBenefits([])
      setConfirmDeleteOpen(false)
      setColaboradorParaExcluir(null)
      setReviewOpen(false)
      setMostrarSomenteAcima2500(false)
      setReviewData({
        totalFuncionarios: 0,
        totalMovimentacoes: 0,
        valorTotalBeneficios: 0,
        periodoInicio: '',
        periodoFim: '',
        competenciaMes: '',
        competenciaAno: '',
        vencimento: '',
      })

      let mensagemErro =
        response?.detail ||
        response?.message ||
        response?.error ||
        'Nenhum registro válido foi encontrado no arquivo. Verifique CPF e demais campos obrigatórios.'

      if (Array.isArray(errosImportacao) && errosImportacao.length > 0) {
        const primeiroErro =
          typeof errosImportacao[0] === 'string'
            ? errosImportacao[0]
            : errosImportacao[0]?.message ||
              errosImportacao[0]?.erro ||
              JSON.stringify(errosImportacao[0])

        mensagemErro = `Importação rejeitada. ${primeiroErro}`
      }

      return {
        success: false,
        message: mensagemErro,
      }
    }

    setData(response)

    setLote({
      id,
      arquivo: file.name,
      tipo,
      rows: parsed,
      excluidosPorColab: new Set(),
    })

    setEditingIndex(null)
    setEditValue('')
    setDetailsOpen(false)
    setDetailsTitle('')
    setDetailsBenefits([])
    setConfirmDeleteOpen(false)
    setColaboradorParaExcluir(null)
    setReviewOpen(false)
    setMostrarSomenteAcima2500(false)
    setReviewData({
      totalFuncionarios: 0,
      totalMovimentacoes: 0,
      valorTotalBeneficios: 0,
      periodoInicio: '',
      periodoFim: '',
      competenciaMes: '',
      competenciaAno: '',
      vencimento: '',
    })

    return {
      success: true,
      message: response?.detail || 'Importação concluída com sucesso.',
    }
  } catch (error) {
    const errorMessage = error.message.includes('API Error')
      ? error.message.split('API Error: ')[1]
      : 'Erro desconhecido na comunicação com o servidor.'

    console.error('Erro no processamento da importação:', error)

    return {
      success: false,
      message: errorMessage,
    }
  }
}

  const rowsAtivas = useMemo(() => {
    if (!lote?.rows?.length) return []
    if (!lote.excluidosPorColab?.size) return lote.rows

    return lote.rows.filter((r) => !lote.excluidosPorColab.has(getNomeColaborador(r)))
  }, [lote])

  const linhasValidadas = useMemo(() => {
    return rowsAtivas.map((r) => {
      const validacao = getRowValidation(r)

      return {
        ...r,
        bloqueado: validacao.bloqueado,
        bloqueadoPorValor: validacao.bloqueadoPorValor,
        errosValidacao: validacao.erros,
      }
    })
  }, [rowsAtivas])

  const totalBloqueios = useMemo(
    () => linhasValidadas.filter((r) => r.bloqueado).length,
    [linhasValidadas]
  )

  const linhasExibidas = useMemo(() => {
    if (mostrarSomenteAcima2500) {
      return linhasValidadas.filter((r) => r.bloqueado)
    }

    return linhasValidadas
  }, [linhasValidadas, mostrarSomenteAcima2500])

  const podeEnviar = linhasValidadas.length > 0 && totalBloqueios === 0

  const abrirConfirmacaoExclusao = (row) => {
    setColaboradorParaExcluir(row)
    setConfirmDeleteOpen(true)
  }

  const confirmarExclusaoColaborador = () => {
    if (!colaboradorParaExcluir) return

    const colaboradorKey = getNomeColaborador(colaboradorParaExcluir)

    if (!colaboradorKey) {
      console.error('Chave do colaborador não encontrada para exclusão.')
      setConfirmDeleteOpen(false)
      setColaboradorParaExcluir(null)
      return
    }

    const novo = new Set(lote.excluidosPorColab)
    novo.add(colaboradorKey)

    setLote((prev) => ({ ...prev, excluidosPorColab: novo }))

    if (editingIndex !== null) {
      setEditingIndex(null)
      setEditValue('')
    }

    setConfirmDeleteOpen(false)
    setColaboradorParaExcluir(null)
  }

  const cancelarExclusaoColaborador = () => {
    setConfirmDeleteOpen(false)
    setColaboradorParaExcluir(null)
  }

  const iniciarEdicao = (row, valorAtual) => {
    setEditingIndex(getRowKey(row))
    setEditValue(String(valorAtual).replace(',', '.'))
  }

  const salvarEdicao = (row) => {
    const v = Number(editValue)

    if (Number.isNaN(v) || v <= 0) return

    const linhaKey = getRowKey(row)
    const originalIndex = lote.rows.findIndex((r) => getRowKey(r) === linhaKey)

    if (originalIndex >= 0) {
      const clone = [...lote.rows]

      const valorKey = Object.prototype.hasOwnProperty.call(clone[originalIndex], 'valor_total')
        ? 'valor_total'
        : Object.prototype.hasOwnProperty.call(clone[originalIndex], 'valor_recarga_bene')
        ? 'valor_recarga_bene'
        : 'valor'

      clone[originalIndex] = {
        ...clone[originalIndex],
        [valorKey]: v,
      }

      setLote((prev) => ({ ...prev, rows: clone }))
    } else {
      console.error('Linha original não encontrada para edição.')
    }

    setEditingIndex(null)
    setEditValue('')
  }

  const cancelarEdicao = () => {
    setEditingIndex(null)
    setEditValue('')
  }

  const limparLote = () => {
    setLote({
      id: null,
      arquivo: null,
      tipo: null,
      rows: [],
      excluidosPorColab: new Set(),
    })

    setFormEnvio({
      periodoInicio: '',
      periodoFim: '',
      competenciaMes: '',
      competenciaAno: String(new Date().getFullYear()),
      vencimento: '',
    })

    setModalOpen(false)
    setEditingIndex(null)
    setEditValue('')
    setData(null)
    setDetailsOpen(false)
    setDetailsTitle('')
    setDetailsBenefits([])
    setConfirmDeleteOpen(false)
    setColaboradorParaExcluir(null)
    setReviewOpen(false)
    setMostrarSomenteAcima2500(false)
    setReviewData({
      totalFuncionarios: 0,
      totalMovimentacoes: 0,
      valorTotalBeneficios: 0,
      periodoInicio: '',
      periodoFim: '',
      competenciaMes: '',
      competenciaAno: '',
      vencimento: '',
    })
  }

  const abrirModalEnvio = () => setModalOpen(true)

  const abrirDetalhes = (row) => {
    setDetailsTitle(getNomeColaborador(row))
    setDetailsBenefits(row?.beneficios || [])
    setDetailsOpen(true)
  }

  const abrirModalRevisao = (e) => {
    e.preventDefault()

    if (!data || !data.data_to_backend) {
      console.error('Dados de envio (data.data_to_backend) não estão disponíveis.')
      return
    }

    const excluidosManualmenteSet = lote.excluidosPorColab || new Set()
    const listaOriginal = data.data_to_backend.movimentacoes_detalhada || []

    const previewMap = new Map(
      linhasValidadas.map((item) => {
        const nome = getNomeColaborador(item)
        const condominio = getCondominio(item)
        const cpf = getCpf(item)
        const chave = cpf
          ? `${nome}::${condominio}::${cpf}`
          : `${nome}::${condominio}`

        return [
          chave,
          {
            nome,
            condominio,
            cpf,
            valor: getValorRow(item),
          },
        ]
      })
    )

    const listaFiltrada = listaOriginal
      .filter((item) => {
        const nome = item.nome_func || item.colaborador || item.nome_funcionario || item.nome
        return nome && !excluidosManualmenteSet.has(nome)
      })
      .map((item) => {
        const nome = item.nome_func || item.colaborador || item.nome_funcionario || item.nome
        const condominio = item.condominio || item.nome_condominio || ''
        const cpf = String(item.cpf || item.cpf_func || item.cpf_funcionario || '').trim()

        const chaveComCpf = cpf
          ? `${nome}::${condominio}::${cpf}`
          : `${nome}::${condominio}`

        const chaveSemCpf = `${nome}::${condominio}`

        const previewItem = previewMap.get(chaveComCpf) || previewMap.get(chaveSemCpf)

        if (!previewItem) return item

        const valorEditado = previewItem.valor

        if ('valor_recarga_bene' in item) {
          return { ...item, valor_recarga_bene: valorEditado }
        }

        if ('valor_total' in item) {
          return { ...item, valor_total: valorEditado }
        }

        return { ...item, valor: valorEditado }
      })

    let totalMovimentacoes = 0
    let valorTotalBeneficios = 0
    const funcionariosUnicos = new Set()

    listaFiltrada.forEach((item) => {
      totalMovimentacoes += 1
      const valor = Number(item.valor_recarga_bene || item.valor_total || item.valor || 0)
      valorTotalBeneficios += valor
      funcionariosUnicos.add(item.nome_func || item.colaborador || item.nome_funcionario || item.nome)
    })

    setReviewData({
      totalFuncionarios: funcionariosUnicos.size,
      totalMovimentacoes,
      valorTotalBeneficios: Number(valorTotalBeneficios.toFixed(2)),
      periodoInicio: formEnvio.periodoInicio,
      periodoFim: formEnvio.periodoFim,
      competenciaMes: formEnvio.competenciaMes,
      competenciaAno: formEnvio.competenciaAno,
      vencimento: formEnvio.vencimento,
    })

    setModalOpen(false)
    setReviewOpen(true)
  }

  const confirmarEnvio = async () => {
    if (!data || !data.data_to_backend) {
      console.error('Dados de envio (data.data_to_backend) não estão disponíveis.')
      return
    }

    const dataParaEnvio = JSON.parse(JSON.stringify(data))
    const excluidosManualmenteSet = lote.excluidosPorColab || new Set()

    const listaOriginal = dataParaEnvio.data_to_backend.movimentacoes_detalhada || []
    const listaNovosFuncionariosOriginal =
      dataParaEnvio.data_to_backend.novos_registros?.funcionarios || []

    const previewMap = new Map(
      linhasValidadas.map((item) => {
        const nome = getNomeColaborador(item)
        const condominio = getCondominio(item)
        const cpf = getCpf(item)
        const chave = cpf
          ? `${nome}::${condominio}::${cpf}`
          : `${nome}::${condominio}`

        return [
          chave,
          {
            nome,
            condominio,
            cpf,
            valor: getValorRow(item),
            quantidade: getQuantidadeDias(item),
          },
        ]
      })
    )

    const vencimentoFormatado = formatDateToBackend(formEnvio.vencimento)

    console.log('formEnvio.vencimento:', formEnvio.vencimento)
    console.log('vencimentoFormatado:', vencimentoFormatado)
    console.log('PRIMEIRA MOVIMENTACAO ORIGINAL:', listaOriginal?.[0])

    if (!vencimentoFormatado) {
      alert('Preencha um vencimento válido antes de confirmar o envio.')
      return
    }

    const listaFiltrada = listaOriginal
      .filter((item) => {
        const nome = item.nome_func || item.colaborador || item.nome_funcionario || item.nome
        return nome && !excluidosManualmenteSet.has(nome)
      })
      .map((item) => {
        const nome = item.nome_func || item.colaborador || item.nome_funcionario || item.nome
        const condominio = item.condominio || item.nome_condominio || ''
        const cpf = String(item.cpf || item.cpf_func || item.cpf_funcionario || '').trim()

        const chaveComCpf = cpf
          ? `${nome}::${condominio}::${cpf}`
          : `${nome}::${condominio}`

        const chaveSemCpf = `${nome}::${condominio}`

        const previewItem = previewMap.get(chaveComCpf) || previewMap.get(chaveSemCpf)
        const valorEditado = previewItem?.valor
        const quantidadeEditada = previewItem?.quantidade

        const itemNormalizado = { ...item }

        const produtoCodigo = getProdutoCodigoBackend(item)
        const produtoNome = getProdutoBackend(item)
        const vencimentoItem = formatDateToBackend(item?.vencimento)

        itemNormalizado.produto_codigo = produtoCodigo || 'SEM_CODIGO'
        itemNormalizado.produto = produtoNome || 'BENEFICIO'
        itemNormalizado.departamento = getDepartamentoBackend(item)
        itemNormalizado.quantidade = getQuantidadeBackend(item) || quantidadeEditada || 0
        itemNormalizado.vencimento = vencimentoItem || vencimentoFormatado

        if ('valor_recarga_bene' in itemNormalizado) {
          itemNormalizado.valor_recarga_bene =
            valorEditado ?? itemNormalizado.valor_recarga_bene
        } else if ('valor_total' in itemNormalizado) {
          itemNormalizado.valor_total = valorEditado ?? itemNormalizado.valor_total
        } else {
          itemNormalizado.valor = valorEditado ?? itemNormalizado.valor
        }

        return itemNormalizado
      })

    dataParaEnvio.data_to_backend.movimentacoes_detalhada = listaFiltrada

    if (dataParaEnvio.data_to_backend.novos_registros?.funcionarios) {
      dataParaEnvio.data_to_backend.novos_registros.funcionarios =
        listaNovosFuncionariosOriginal.filter((f) => {
          const nome = f.nome_func || f.nome || f.nome_funcionario || f.colaborador
          return nome && !excluidosManualmenteSet.has(nome)
        })

      dataParaEnvio.data_to_backend.novos_registros['Total de funcionários novos'] =
        dataParaEnvio.data_to_backend.novos_registros.funcionarios.length
    }

    let totalMovimentacoes = 0
    let valorTotalBeneficios = 0
    const funcionariosUnicos = new Set()

    listaFiltrada.forEach((item) => {
      totalMovimentacoes += 1
      const valor = Number(item.valor_recarga_bene || item.valor_total || item.valor || 0)
      valorTotalBeneficios += valor
      funcionariosUnicos.add(item.nome_func || item.colaborador || item.nome_funcionario || item.nome)
    })

    if (dataParaEnvio.data_to_backend.summary) {
      dataParaEnvio.data_to_backend.summary.total_funcionarios = funcionariosUnicos.size
      dataParaEnvio.data_to_backend.summary.total_movimentacoes = totalMovimentacoes
      dataParaEnvio.data_to_backend.summary.valor_total_beneficios = Number(
        valorTotalBeneficios.toFixed(2)
      )
    }

    dataParaEnvio.data_to_backend.periodo_inicio = formEnvio.periodoInicio
    dataParaEnvio.data_to_backend.periodo_fim = formEnvio.periodoFim
    dataParaEnvio.data_to_backend.competencia_mes = formEnvio.competenciaMes
    dataParaEnvio.data_to_backend.competencia_ano = formEnvio.competenciaAno
    dataParaEnvio.data_to_backend.vencimento = vencimentoFormatado
    dataParaEnvio.data_to_backend.tipo_processamento = lote.tipo
    dataParaEnvio.data_to_backend.origem = 'importacao_faturamento'

    console.log('PAYLOAD FINAL ENVIO:', dataParaEnvio.data_to_backend)
    console.log(
      'PRIMEIRA MOVIMENTACAO FINAL:',
      dataParaEnvio.data_to_backend.movimentacoes_detalhada?.[0]
    )

    try {
      const responseEnvio = await uploadService.confirmUpload(dataParaEnvio.data_to_backend)
      console.log('Envio concluído:', responseEnvio)
      setReviewOpen(false)
      setModalOpen(false)
      window.location.href = '/'
    } catch (error) {
      console.error('Erro no envio do lote:', error)
      alert(`Erro no envio do lote: ${error.message}`)
    }
  }

  const totalCompras = rowsAtivas.length
  const totalFaturamento = rowsAtivas.length

  return (
    <div className="importacao-container">
      <FileUpload onUpload={handleResult} />

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

      {lote.id && (
        <div className="lote-card">
          <div className="lote-header">
            <div>
              <h3>Pré-validação do Lote</h3>
              <small>
                Arquivo: <strong>{lote.arquivo}</strong> • Tipo: <strong>{lote.tipo}</strong>
              </small>
            </div>

            <button className="btn-ghost" onClick={limparLote} type="button">
              Descartar lote
            </button>
          </div>

          <div className="lote-kpis">
            <div className="kpi">
              <span className="kpi-label">Condomínios importados</span>
              <span className="kpi-value">
                {data?.summary?.total_condominios || linhasValidadas.length}
              </span>
            </div>

            <div className="kpi">
              <span className="kpi-label">Condomínios novos</span>
              <span className="kpi-value">
                {data?.summary?.novos_registros?.['Total de condomínios novos'] || 0}
              </span>
            </div>

            <button
              type="button"
              className={`kpi kpi-button ${totalBloqueios > 0 ? 'kpi-alert' : ''} ${
                mostrarSomenteAcima2500 ? 'kpi-active' : ''
              }`}
              onClick={() => {
                if (totalBloqueios > 0) {
                  setMostrarSomenteAcima2500((prev) => !prev)
                }
              }}
              disabled={totalBloqueios === 0}
              title={
                totalBloqueios > 0
                  ? mostrarSomenteAcima2500
                    ? 'Mostrar todos os registros'
                    : 'Filtrar registros bloqueados'
                  : 'Nenhum registro bloqueado'
              }
            >
              <span className="kpi-label">
                {mostrarSomenteAcima2500
                  ? 'Mostrando registros com bloqueio'
                  : 'Filtrar registros com bloqueio'}
              </span>
              <span className="kpi-value">{totalBloqueios}</span>
            </button>
          </div>

          <div className="tabela-wrapper">
            <table className="tabela-importacao">
              <thead>
                <tr>
                  <th>Condomínio</th>
                  <th>Colaborador</th>
                  <th className="col-valor">Valor</th>
                  <th className="col-status">Status</th>
                  <th className="col-acoes">Ações</th>
                </tr>
              </thead>

              <tbody>
                {linhasExibidas.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                      Nenhum registro encontrado para pré-visualização.
                    </td>
                  </tr>
                ) : (
                  linhasExibidas.map((r, idx) => {
                    const isEditing = editingIndex === getRowKey(r)
                    const valorExibicao = getValorRow(r)
                    const nomeColaborador = getNomeColaborador(r)

                    return (
                      <tr
                        key={`${getRowKey(r)}-${idx}`}
                        className={r.bloqueado ? 'row-bloqueado' : ''}
                      >
                        <td>{getCondominio(r)}</td>
                        <td>{nomeColaborador}</td>

                        <td className="col-valor">
                          {!isEditing ? (
                            <>
                              R${' '}
                              {Number(valorExibicao).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </>
                          ) : (
                            <div className="edit-inline">
                              <span>R$</span>
                              <input
                                className="input-valor"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                              />
                            </div>
                          )}
                        </td>

                        <td className="col-status">
                          {r.bloqueado ? (
                            <div className="status-stack">
                              <span className="tag tag-danger">Bloqueado</span>

                              {r.errosValidacao?.length > 0 ? (
                                <small className="status-detail">
                                  {r.errosValidacao.join(' • ')}
                                </small>
                              ) : r.bloqueadoPorValor ? (
                                <small className="status-detail">
                                  Valor acima de R$ 2.500,00
                                </small>
                              ) : null}
                            </div>
                          ) : (
                            <span className="tag tag-ok">OK</span>
                          )}
                        </td>

                        <td className="col-acoes">
                          {!isEditing ? (
                            <div className="acoes-inline">
                              <button
                                className="btn-sm btn-outline btn-icon"
                                title={`Detalhes de ${nomeColaborador}`}
                                onClick={() => abrirDetalhes(r)}
                                type="button"
                              >
                                <Eye size={16} />
                                <span className="btn-text">Detalhes</span>
                              </button>

                              {r.bloqueado && (
                                <button
                                  className="btn-sm btn-outline btn-icon"
                                  title="Editar valor"
                                  onClick={() => iniciarEdicao(r, valorExibicao)}
                                  type="button"
                                >
                                  <PencilLine size={16} />
                                  <span className="btn-text">Editar</span>
                                </button>
                              )}

                              <button
                                className="btn-sm btn-outline btn-icon danger"
                                title={`Excluir colaborador ${nomeColaborador}`}
                                onClick={() => abrirConfirmacaoExclusao(r)}
                                type="button"
                              >
                                <Trash2 size={16} />
                                <span className="btn-text">Excluir</span>
                              </button>
                            </div>
                          ) : (
                            <div className="edit-actions">
                              <button
                                className="btn-sm btn-primary btn-icon"
                                title="Salvar"
                                onClick={() => salvarEdicao(r)}
                                type="button"
                              >
                                <Check size={16} />
                                <span className="btn-text">Salvar</span>
                              </button>

                              <button
                                className="btn-sm btn-ghost btn-icon"
                                title="Cancelar"
                                onClick={cancelarEdicao}
                                type="button"
                              >
                                <XIcon size={16} />
                                <span className="btn-text">Cancelar</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="lote-actions">
            <button
              className="btn-primary"
              disabled={!podeEnviar}
              onClick={abrirModalEnvio}
              type="button"
            >
              Enviar para importação
            </button>

            {!podeEnviar && (
              <span className="hint">Resolva os bloqueios para habilitar o envio.</span>
            )}
          </div>
        </div>
      )}

      <Modal open={modalOpen} title="Informações obrigatórias" onClose={() => setModalOpen(false)}>
        <form onSubmit={abrirModalRevisao} className="form-grid">
          <div className="form-row two-cols">
            <label>
              <span>Período de Utilização — Início</span>
              <input
                type="date"
                value={formEnvio.periodoInicio}
                onChange={(e) =>
                  setFormEnvio((prev) => ({ ...prev, periodoInicio: e.target.value }))
                }
                required
              />
            </label>

            <label>
              <span>Período de Utilização — Fim</span>
              <input
                type="date"
                min={formEnvio.periodoInicio || undefined}
                value={formEnvio.periodoFim}
                onChange={(e) =>
                  setFormEnvio((prev) => ({ ...prev, periodoFim: e.target.value }))
                }
                required
              />
            </label>
          </div>

          <div className="form-row two-cols">
            <label>
              <span>Competência — Mês</span>
              <select
                value={formEnvio.competenciaMes}
                onChange={(e) =>
                  setFormEnvio((prev) => ({ ...prev, competenciaMes: e.target.value }))
                }
                required
              >
                <option value="" disabled>
                  Selecione o mês
                </option>
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Vencimento</span>
            <input
              type="date"
              value={formEnvio.vencimento}
              onChange={(e) =>
                setFormEnvio((prev) => ({ ...prev, vencimento: e.target.value }))
              }
              required
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>

            <button type="submit" className="btn-primary">
              Continuar
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={confirmDeleteOpen}
        title="Confirmar exclusão"
        onClose={cancelarExclusaoColaborador}
      >
        <div className="confirm-delete-content">
          <p className="confirm-delete-text">
            Tem certeza que deseja excluir o colaborador{' '}
            <strong>{getNomeColaborador(colaboradorParaExcluir)}</strong>
            {getCondominio(colaboradorParaExcluir)
              ? ` do condomínio ${getCondominio(colaboradorParaExcluir)}`
              : ''}
            ?
          </p>

          <p className="confirm-delete-warning">
            Essa ação remove o colaborador da pré-validação atual.
          </p>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={cancelarExclusaoColaborador}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn-outline btn-danger"
              onClick={confirmarExclusaoColaborador}
            >
              Confirmar exclusão
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={reviewOpen}
        title="Confirmar envio do lote"
        onClose={() => setReviewOpen(false)}
      >
        <div className="review-summary">
          <div className="review-grid">
            <div className="review-card">
              <span className="review-label">Total de colaboradores</span>
              <strong className="review-value">{reviewData.totalFuncionarios}</strong>
            </div>

            <div className="review-card">
              <span className="review-label">Total de movimentações</span>
              <strong className="review-value">{reviewData.totalMovimentacoes}</strong>
            </div>

            <div className="review-card review-card-highlight">
              <span className="review-label">Valor total dos benefícios</span>
              <strong className="review-value">
                {formatCurrency(reviewData.valorTotalBeneficios)}
              </strong>
            </div>
          </div>

          <div className="review-details">
            <div>
              <strong>Período:</strong> {reviewData.periodoInicio} até {reviewData.periodoFim}
            </div>
            <div>
              <strong>Competência:</strong> {reviewData.competenciaMes}/{reviewData.competenciaAno}
            </div>
            <div>
              <strong>Vencimento:</strong> {reviewData.vencimento}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setReviewOpen(false)
                setModalOpen(true)
              }}
            >
              Voltar
            </button>

            <button type="button" className="btn-primary" onClick={confirmarEnvio}>
              Confirmar envio
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={detailsOpen}
        title={`Benefícios - ${detailsTitle}`}
        onClose={() => setDetailsOpen(false)}
      >
        <div className="details-benefits-list">
          {detailsBenefits.length === 0 ? (
            <div className="details-empty-state">
              Nenhum benefício encontrado para este colaborador.
            </div>
          ) : (
            detailsBenefits.map((beneficio, index) => (
              <div
                key={`${beneficio.codigo}-${beneficio.nome}-${index}`}
                className="details-benefit-card"
              >
                <div className="details-benefit-info">
                  <strong className="details-benefit-name">{beneficio.nome}</strong>
                  {beneficio.codigo && (
                    <span className="details-benefit-code">Código: {beneficio.codigo}</span>
                  )}
                </div>

                <div className="details-benefit-value">
                  {formatCurrency(beneficio.valor)}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}