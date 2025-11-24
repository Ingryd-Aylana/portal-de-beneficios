import {apiFetch} from'./api'

export const entebenService = {
     /**
     * @returns {Promise<object>}
     */
    getMovimentacoes: async () => {
        try {
            const data = await apiFetch('/beneficios/movimentacoes/', {
                method: 'GET',
            });
            return data;
        }catch (error) {
            console.error('Erro na confirmação do upload:', error);
            throw error;
    }},
    /**
     * @returns {Promise<object>}
     */

     getcondominios: async () => {
        try {
            const data = await apiFetch('/entidades/condominios/', {
                method: 'GET',
            });
            return data;
        }catch (error) {
            console.error('Erro na confirmação do upload:', error);
            throw error;
    }}

}

