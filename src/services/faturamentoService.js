import { apiFetch, API_BASE_URL, ACCESS_TOKEN_KEY } from './api'

const API_BASE_URL = 'https://vr-beneficios-backend-fedcorp-y5bg8.ondigitalocean.app/api'

function getAuthToken() {
  try {
    const rawAuth =
      localStorage.getItem('auth') ||
      sessionStorage.getItem('auth')

    if (rawAuth) {
      const parsed = JSON.parse(rawAuth)
      if (parsed?.access) return parsed.access
      if (parsed?.token) return parsed.token
    }
  } catch {
    // ignora parse inválido
  }

  return (
    localStorage.getItem('access') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('access') ||
    sessionStorage.getItem('token') ||
    ''
  )
}

function extractFilenameFromDisposition(contentDisposition) {
  if (!contentDisposition) return null

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const basicMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  return basicMatch?.[1] || null
}

function inferExtension(contentType) {
  const type = (contentType || '').toLowerCase()

  if (type.includes('spreadsheetml')) return 'xlsx'
  if (type.includes('ms-excel')) return 'xls'
  if (type.includes('csv')) return 'csv'
  if (type.includes('json')) return 'json'
  if (type.includes('pdf')) return 'pdf'
  if (type.includes('zip')) return 'zip'

  return 'bin'
}

export const faturamentoService = {
  async uploadFaturamento({ importacaoId, competencia, arquivoBoleto, arquivoNotaDebito, arquivoNotaFiscal }) {
    const formData = new FormData()
    formData.append('importacao_id', importacaoId)
    formData.append('competencia', competencia)

    if (arquivoBoleto) {
      formData.append('arquivo_boleto', arquivoBoleto)
    }
    if (arquivoNotaDebito) {
      formData.append('arquivo_nota_debito', arquivoNotaDebito)
    }
    if (arquivoNotaFiscal) {
      formData.append('arquivo_nota_fiscal', arquivoNotaFiscal)
    }

    return apiFetch('/upload/faturamento/upload/', {
      method: 'POST',
      body: formData,
    })
  },

  async getStatusFaturamento(faturamentoId) {
    return apiFetch(`/upload/faturamento/${faturamentoId}/status/`, {
      method: 'GET',
    })
  },

  async verificarProgresso(faturamentoId, onProgress) {
    return new Promise((resolve, reject) => {
      let pollCount = 0
      const maxAttempts = 60

      const poll = async () => {
        try {
          pollCount++
          const data = await apiFetch(`/upload/faturamento/${faturamentoId}/status/`, {
            method: 'GET',
          })

          if (onProgress) {
            onProgress(data)
          }

          if (data.status === 'COMPLETED') {
            resolve(data)
          } else if (data.status === 'FAILED') {
            reject(new Error('Processamento falhou'))
          } else if (data.status === 'PENDING' || data.status === 'PROCESSING') {
            if (pollCount >= maxAttempts) {
              reject(new Error('Tempo limite exceeded'))
            } else {
              setTimeout(poll, 2000)
            }
          } else {
            resolve(data)
          }
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  },

  async listarImportacoes() {
    return apiFetch('/beneficios/importacoes/', {
      method: 'GET',
    })
  },

  async getImportacaoUltima() {
    return apiFetch('/beneficios/importacoes/ultima/', {
      method: 'GET',
    })
  },

  async getImportacaoDetail(id) {
    return apiFetch(`/beneficios/importacoes/${id}/`, {
      method: 'GET',
    })
  },

  async listarFaturamentos() {
    return apiFetch('/upload/faturamento/', {
      method: 'GET',
    })
  },

  async getFaturamentoDetail(faturamentoId) {
    return apiFetch(`/upload/faturamento/${faturamentoId}/`, {
  async uploadDocumentos(pedidoId, arquivos = []) {
    return this.importarDocumentos(pedidoId, arquivos)
  },

  async listarPedidosFuncionario() {
    return apiFetch('/upload/list-confirmed/', {
      method: 'GET',
    })
  },

  async deleteFaturamento(faturamentoId) {
    return apiFetch(`/upload/faturamento/${faturamentoId}/`, {
      method: 'DELETE',
    })
  },

  async uploadExcel(file) {
    const formData = new FormData()
    formData.append('file', file)

    return apiFetch('/upload/', {
      method: 'POST',
      body: formData,
    })
  },

  async confirmarImportacao(data) {
    return apiFetch('/upload/confirm/', {
      method: 'POST',
      body: data,
    })
  },

  async importarDocumentos({ importacaoId, competencia, arquivoBoleto, arquivoNotaDebito, arquivoNotaFiscal }) {
    return this.uploadFaturamento({ importacaoId, competencia, arquivoBoleto, arquivoNotaDebito, arquivoNotaFiscal })
  },

  async downloadFaturamento(faturamentoId, tipo = 'todos') {
    const statusData = await apiFetch(`/upload/faturamento/${faturamentoId}/status/`, {
      method: 'GET',
    })

    if (statusData.status === 'FAILED') {
      throw new Error('Processamento falhou')
    }

    if (statusData.status === 'PENDING' || statusData.status === 'PROCESSING') {
      await this.verificarProgresso(faturamentoId, () => {})
    }

    const url = `/upload/faturamento/${faturamentoId}/download/${tipo}/`
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem(ACCESS_TOKEN_KEY)}`,
  async listarDocumentos() {
    return this.listarPedidosFuncionario()
  },

  async listarDocumentosPorPedido(pedidoId) {
    const pedidos = await this.listarPedidosFuncionario()

    if (!Array.isArray(pedidos)) return null

    return pedidos.find((pedido) => String(pedido.id) === String(pedidoId)) || null
  },

  getExportFaturamentoUrl(params = {}) {
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value)
      }
    })

    const queryString = query.toString()
    return `${API_BASE_URL}/upload/export/faturamento/${queryString ? `?${queryString}` : ''}`
  },

  async baixarExportFaturamento(params = {}, nomeBase = 'faturamento') {
    const url = this.getExportFaturamentoUrl(params)
    const token = getAuthToken()

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao baixar: ${response.status}`)
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get('content-disposition')
    let filename = `faturamento-${faturamentoId}-${tipo}.zip`
    
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match) {
        filename = match[1].replace(/['"]/g, '')
      }
    }

    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
      let errorMessage = 'Não foi possível baixar o arquivo de faturamento.'

      try {
        const errorData = await response.json()
        if (errorData?.detail) errorMessage = errorData.detail
      } catch {
        // ignora
      }

      throw new Error(errorMessage)
    }

    const contentType = response.headers.get('content-type') || ''
    const contentDisposition = response.headers.get('content-disposition') || ''

    const blob = await response.blob()

    // Ajuda a diagnosticar no console
    console.log('Export faturamento content-type:', contentType)
    console.log('Export faturamento content-disposition:', contentDisposition)
    console.log('Export faturamento blob size:', blob.size)

    const filenameFromHeader = extractFilenameFromDisposition(contentDisposition)
    const extension = inferExtension(contentType)
    const finalName =
      filenameFromHeader ||
      `${nomeBase}.${extension}`

    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = blobUrl
    link.download = finalName
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(blobUrl)

    return {
      filename: finalName,
      contentType,
      size: blob.size,
    }
  },
}