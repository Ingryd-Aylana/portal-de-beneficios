import { apiFetch } from './api'

export const uploadService = {
  async uploadFile(file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('file_type', 'RB')

      const data = await apiFetch('/upload/', {
        method: 'POST',
        body: formData,
        headers: {},
      })

      console.log('Upload e Parsing concluídos:', data)
      return data
    } catch (error) {
      console.error('Erro no upload do arquivo:', error)
      throw error
    }
  },

  async confirmUpload(payload) {
    try {
      const data = await apiFetch('/upload/confirm/', {
        method: 'POST',
        body: payload,
      })

      console.log('Confirmação e Gravação final concluídas:', data)
      return data
    } catch (error) {
      console.error('Erro na confirmação do upload:', error)
      throw error
    }
  },
}