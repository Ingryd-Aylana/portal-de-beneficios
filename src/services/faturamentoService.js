import { apiFetch } from './api'

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
  async importarDocumentos(pedidoId, arquivos = []) {
    const formData = new FormData()
    formData.append('pedido_id', pedidoId)

    arquivos.forEach((arquivo) => {
      formData.append('arquivos', arquivo)
    })

    return apiFetch('/upload/faturamento-documentos/', {
      method: 'POST',
      body: formData,
    })
  },

  async uploadDocumentos(pedidoId, arquivos = []) {
    return this.importarDocumentos(pedidoId, arquivos)
  },

  async listarPedidosFuncionario() {
    return apiFetch('/beneficios/importacoes/', {
      method: 'GET',
    })
  },

  async listarPedidos() {
    return this.listarPedidosFuncionario()
  },

  async listarDocumentos() {
    return this.listarPedidosFuncionario()
  },

  async listarDocumentosPorPedido(pedidoId) {
    const response = await this.listarPedidosFuncionario()

    const pedidos = Array.isArray(response)
      ? response
      : Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.pedidos)
            ? response.pedidos
            : []

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

    return `${API_BASE_URL}/upload/export/faturamento/${
      queryString ? `?${queryString}` : ''
    }`
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