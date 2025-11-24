import { apiFetch } from './api';


export const uploadService = {
    /**
     * Realiza o upload do arquivo e o parsing inicial.
     * @param {File} file
     * @returns {Promise<object>}
     */
    uploadFile: async (file) => {

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('file_type', 'RB');

           
            const data = await apiFetch('/upload/', { 
                method: 'POST',
                body: formData,
                headers: {} 
            });

            console.log('Upload e Parsing concluídos:', data);
            // data deve conter { file_upload_id: ..., data_to_backend: {...} }
            return data;
        } catch (error) {
            console.error('Erro no upload do arquivo:', error);
            throw error;
        }
    },

    /**
     * Confirma os dados e inicia a gravação final no banco de dados.
     * @param {number} fileUploadId - ID do upload retornado no passo anterior.
     * @param {object} payload - O JSON com todas as movimentações detalhadas.
     * @returns {Promise<object>} - Confirmação de sucesso.
     */
    confirmUpload: async (payload) => {

        try {
            // O endpoint que criamos no backend Django
            const data = await apiFetch('/upload/confirm/', {
                method: 'POST',
                body: payload,
            });

            console.log('Confirmação e Gravação final concluídas:', data);
            return data;
        } catch (error) {
            console.error('Erro na confirmação do upload:', error);
            throw error;
        }
    }
};