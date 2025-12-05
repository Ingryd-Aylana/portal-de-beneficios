
const API_BASE_URL = 'https://vr-beneficios-backend-fedcorp-y5bg8.ondigitalocean.app/api'; 
const ACCESS_TOKEN_KEY = 'accessToken'; 

/**
 * Realiza uma requisição à API.
 * @param {string} endpoint - O caminho da API (ex: '/auth/me/').
 * @param {object} options - Opções de fetch (method, body, headers, etc.).
 * @returns {Promise<object>} - O objeto de resposta parseado em JSON ou um objeto vazio para 204.
 */
export const apiFetch = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    
    const isFormData = options.body instanceof FormData;

   
    let finalHeaders = {
        ...options.headers, 
    };
    
    if (token && !finalHeaders.Authorization) {
        finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData && !finalHeaders['Content-Type']) {
        finalHeaders['Content-Type'] = 'application/json';
    }

    const finalOptions = {
        ...options,
        headers: finalHeaders, 
    };
    if (finalOptions.body && typeof finalOptions.body !== 'string' && !isFormData) {
        finalOptions.body = JSON.stringify(finalOptions.body);
    }
    
    try {
        const response = await fetch(url, finalOptions);

        if (!response.ok) {
            let errorData = { detail: 'Erro desconhecido.' };
            try {
                
                errorData = await response.json(); 
            } catch (e) {
               
                errorData.detail = response.statusText || 'Erro de rede ou servidor.';
            }

            const errorMessage = errorData.detail || JSON.stringify(errorData);
            throw new Error(`[${response.status} ${response.statusText}] API Error: ${errorMessage}`);
        }

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return {};
        }

        if (response.status === 401){
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            window.location.href = '/login/';
        }

        return await response.json();

    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};