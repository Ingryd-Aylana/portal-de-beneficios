import { apiFetch } from './api'

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

  async listarPedidosFuncionario() {
    return apiFetch('/upload/list-confirmed/', {
      method: 'GET',
    })
  },
}