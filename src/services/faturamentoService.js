import { apiFetch, API_BASE_URL, ACCESS_TOKEN_KEY } from './api'

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
  },
}