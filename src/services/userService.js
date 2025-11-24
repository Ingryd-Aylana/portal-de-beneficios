import { apiFetch } from './api.js';

/**
 * Constantes para as chaves de armazenamento.
 */
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
};

/**
 * Serviço para gerenciamento de autenticação do usuário.
 */
export const userService = {
    /**
     * Realiza a autenticação do usuário e salva ambos os tokens.
     * @param {string} email - Nome de usuário (ou email).
     * @param {string} password - Senha.
     * @returns {Promise<object>} - Dados do usuário após o login.
     */
    login: async (email, password) => {
        const payload = { email, password };

        try {
            // O endpoint de login deve ser adaptado ao seu backend Django (ex: /api/auth/token/)
            const data = await apiFetch('/auth/token/', { // Endpoint comum para JWT
                method: 'POST',
                body: payload,
                // Garantimos que não enviamos Authorization header para o endpoint de login
                headers: { 'Authorization': '' } 
            });

            // ALTERAÇÃO: Assumimos que o backend retorna { access: "...", refresh: "..." }
            const accessToken = data.access;
            const refreshToken = data.refresh;
            
            if (accessToken && refreshToken) {
                // Armazenamento de ambos os tokens
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
                
                console.log('Login bem-sucedido. Tokens armazenados.');
                return data; 
            } else {
                throw new Error('Tokens de autenticação não recebidos.');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    },

    /**
     * Usa o refresh token para obter um novo access token.
     * Útil para manter a sessão ativa sem exigir novo login.
     * @returns {Promise<string>} - O novo access token.
     */
    refreshToken: async () => {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
            throw new Error("Refresh token não encontrado. Necessário novo login.");
        }

        try {
            // Endpoint para atualizar o token (comum em bibliotecas JWT do Django)
            const data = await apiFetch('/auth/token/refresh/', {
                method: 'POST',
                body: { refresh: refreshToken },
                // Garantimos que não enviamos um access token expirado no header para este endpoint
                headers: { 'Authorization': '' } 
            });

            const newAccessToken = data.access;

            if (newAccessToken) {
                // Salva o novo access token
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
                console.log('Access token atualizado com sucesso.');
                return newAccessToken;
            } else {
                throw new Error('Novo access token não recebido.');
            }

        } catch (error) {
            console.error('Erro ao tentar atualizar o token:', error);
            // Em caso de falha no refresh, forçamos o logout
            userService.logout(); 
            throw new Error('Sessão expirada ou refresh token inválido. Usuário deslogado.');
        }
    },
    
    /**
     * Busca os dados do usuário logado usando o access token.
     * * NOTA DE CORREÇÃO: apiFetch agora lida com o token lido do localStorage, 
     * o que resolve o "ReferenceError: accessToken is not defined".
     * * @returns {Promise<object>} - Dados do usuário (ex: {id: 1, email: "..."}).
     */
    getUserData: async () => {
        try {
            // O apiFetch adicionará o Authorization header automaticamente
            const userData = await apiFetch('/users/me/', { method: 'GET' }); 
            console.log('Dados do usuário buscados:', userData);
            return userData;
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            throw error;
        }
    },

    /**
     * Remove ambos os tokens de autenticação (logout).
     */
    logout: () => {
        // ALTERAÇÃO: Removendo ambos os tokens
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        // apiFetch('/auth/logout/', { method: 'POST' }); // Chamar endpoint de backend, se existir
        console.log('Logout realizado. Tokens removidos.');
    },

    /**
     * Verifica se o usuário está autenticado (tem um access token válido).
     * @returns {boolean}
     */
    isAuthenticated: () => {
        // ALTERAÇÃO: Verifica a existência do access token
        return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
};