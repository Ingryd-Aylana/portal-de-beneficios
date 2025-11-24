import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/userService.js'; 

// Criação do Contexto
const AuthContext = createContext();

/**
 * Hook customizado para usar o Auth Context.
 * Simplifica o acesso ao estado e às funções de autenticação.
 */
export const useAuth = () => {
    return useContext(AuthContext);
};

/**
 * Componente Provedor de Autenticação.
 * Gerencia o estado de autenticação, o carregamento e as funções de login/logout/refresh.
 */
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null); // Aqui você pode armazenar dados do usuário (id, email)
    const [isLoading, setIsLoading] = useState(true); // Indica se a verificação inicial terminou

    // =========================================================
    // 1. Efeito de Inicialização: Verifica a sessão na montagem
    // =========================================================
    useEffect(() => {
        // Função auxiliar para buscar os dados do usuário e atualizar o estado
        const fetchAndSetUser = async () => {
            try {
                const userData = await userService.getUserData();
                setUser(userData);
                setIsAuthenticated(true);
                return true;
            } catch (error) {
                // Se falhar (token inválido), o usuário será forçado a deslogar ou atualizar
                setUser(null);
                setIsAuthenticated(false);
                throw error;
            }
        };

        const checkInitialAuth = async () => {
            const hasAccessToken = userService.isAuthenticated();

            if (hasAccessToken) {
                try {
                    // MUDANÇA: Tenta buscar os dados do usuário para validar o token
                    await fetchAndSetUser(); 
                } catch (error) {
                    console.warn("Access Token inválido na inicialização. Tentando Refresh...");
                    try {
                        // Tenta refresh se o access token falhar
                        await handleRefreshToken();
                        // Se o refresh for bem-sucedido, busca os dados novamente com o novo token
                        await fetchAndSetUser();
                    } catch (refreshError) {
                         // Se o refresh falhar, o logout já é chamado em handleRefreshToken
                        setIsAuthenticated(false);
                        setUser(null);
                    }
                }
            }
            setIsLoading(false); // Finaliza o carregamento inicial
        };

        checkInitialAuth();
    }, []);

    // =========================================================
    // 2. Funções de Manipulação de Sessão
    // =========================================================

    const handleLogin = async (username, password) => {
        setIsLoading(true);
        try {
            // 1. Faz o Login e salva os tokens
            await userService.login(username, password); 
            
            // 2. MUDANÇA: Busca e salva os dados do usuário após o login
            const userData = await userService.getUserData();
            setUser(userData); 

            setIsAuthenticated(true);
            return userData;
        } catch (error) {
            console.error('Falha no Login:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        userService.logout();
        setIsAuthenticated(false);
        setUser(null); 
    };

    const handleRefreshToken = async () => {
        try {
            await userService.refreshToken();
            const userData = await userService.getUserData();
            setUser(userData); 
            
            setIsAuthenticated(true);
            return true;
        } catch (error) {
            // O userService.refreshToken já chama o logout interno em caso de falha.
            setIsAuthenticated(false);
            setUser(null);
            console.error("Falha no Refresh Token. Usuário deslogado.");
            throw error;
        }
    };

    // =========================================================
    // 3. Estrutura do Contexto
    // =========================================================

    const authContextValue = {
        isAuthenticated,
        user,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        refreshToken: handleRefreshToken, 
    };

    // Retorna o provedor com o valor do contexto
    if (isLoading) {
        // Você pode retornar um componente de Loading global aqui
        return <div>Carregando autenticação...</div>; 
    }

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Exemplo de como envolver sua aplicação:
/*
<AuthProvider>
  <AppRoutes />
</AuthProvider>
*/