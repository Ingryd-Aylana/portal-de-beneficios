import { apiFetch } from './api'

export const entebenService = {
  getMovimentacoes: async () => {
    try {
      return await apiFetch('/beneficios/movimentacoes/', {
        method: 'GET',
      })
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error)
      throw error
    }
  },

  getcondominios: async () => {
    try {
      return await apiFetch('/entidades/condominios/', {
        method: 'GET',
      })
    } catch (error) {
      console.error('Erro ao buscar condomínios:', error)
      throw error
    }
  },

  getImportacoes: async () => {
    try {
      return await apiFetch('/beneficios/importacoes/', {
        method: 'GET',
      })
    } catch (error) {
      console.error('Erro ao buscar importações:', error)
      throw error
    }
  },

 getUltimaImportacao: async () => {
  try {
    return await apiFetch('/beneficios/importacoes/ultima/', {
      method: 'GET',
    })
  } catch (error) {
    const message = String(error?.message || '')

    if (
      message.includes('404') ||
      message.includes('Nenhuma importação encontrada')
    ) {
      return null
    }

    console.error('Erro ao buscar última importação:', error)
    throw error
  }
},

 repetirUltimoFaturamento: async () => {
  try {
    const [ultima, importacoes] = await Promise.all([
      apiFetch('/beneficios/importacoes/ultima/', {
        method: 'GET',
      }),
      apiFetch('/beneficios/importacoes/', {
        method: 'GET',
      }),
    ])

    const historico = Array.isArray(importacoes)
      ? importacoes
      : importacoes?.results || []

    const metaUltima = historico[0] || {}

    return {
      ...ultima,
      ...metaUltima,
      importacao_id: metaUltima?.id || ultima?.id,
      faturamento_id: metaUltima?.id || ultima?.id,
      competencia: metaUltima?.vigencia_inicio
        ? metaUltima.vigencia_inicio.slice(0, 7)
        : '',
      referencia: metaUltima?.vigencia_inicio && metaUltima?.vigencia_fim
        ? `${metaUltima.vigencia_inicio} até ${metaUltima.vigencia_fim}`
        : '',
      data_vencimento: metaUltima?.data_vencimento || '',
      vigencia_inicio: metaUltima?.vigencia_inicio || '',
      vigencia_fim: metaUltima?.vigencia_fim || '',
      condominios: ultima?.condominios || [],
      registros: ultima?.condominios || [],
      raw: {
        ultima,
        metaUltima,
      },
    }
  } catch (error) {
    const message = String(error?.message || '')

    if (
      message.includes('404') ||
      message.includes('Nenhuma importação encontrada')
    ) {
      return null
    }

    console.error('Erro ao repetir último faturamento:', error)
    throw error
  }
},
}