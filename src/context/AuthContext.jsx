import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 Importamos o useNavigate
import { userService } from '../services/userService.js'; 

// Criação do Contexto
const AuthContext = createContext();

/**
 * Hook customizado para usar o Auth Context.
 */
export const useAuth = () => {
    return useContext(AuthContext);
};

/**
 * Componente Provedor de Autenticação.
 */
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null); 
    const [isLoading, setIsLoading] = useState(true); 
    
    // Inicializa o hook de navegação
    const navigate = useNavigate(); 
    
    // =========================================================
    // 1. Efeito de Inicialização: Verifica a sessão na montagem
    // =========================================================
    useEffect(() => {
        const fetchAndSetUser = async () => {
            try {
                const userData = await userService.getUserData();
                setUser(userData);
                setIsAuthenticated(true);
                return true;
            } catch (error) {
                // Se o token falhar, limpa o estado
                setUser(null);
                setIsAuthenticated(false);
                return false;
            }
        };

        const checkInitialAuth = async () => {
            const hasAccessToken = userService.isAuthenticated();

            if (hasAccessToken) {
                try {
                    // Tenta buscar os dados com o token atual
                    await fetchAndSetUser(); 
                } catch (error) {
                    // Se a busca falhar, o token expirou. Tenta renovar.
                    try {
                        await handleRefreshToken();
                        await fetchAndSetUser(); // Busca dados após o refresh
                    } catch (refreshError) {
                        // Se o refresh falhar, o usuário está deslogado.
                        console.error("Sessão expirada. Redirecionando para login.");
                        setIsAuthenticated(false);
                        setUser(null);
                    }
                }
            }
            setIsLoading(false); // Finaliza o carregamento inicial
        };

        checkInitialAuth();
    }, []); // Executa apenas na montagem

    // =========================================================
    // 2. Funções de Manipulação de Sessão
    // =========================================================

    const handleLogin = async (username, password, redirectTo = '/') => {
        setIsLoading(true);
        try {
            await userService.login(username, password); 
            
            const userData = await userService.getUserData();
            setUser(userData); 

            setIsAuthenticated(true);
            
            // 👈 REDIRECIONAMENTO APÓS SUCESSO
            navigate(redirectTo, { replace: true }); 
            
            return userData;
        } catch (error) {
            console.error('Falha no Login:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = (redirectTo = '/login') => {
        userService.logout();
        setIsAuthenticated(false);
        setUser(null); 
        
        // 👈 REDIRECIONAMENTO APÓS LOGOUT
        navigate(redirectTo, { replace: true });
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
            throw error; // Propaga o erro para que o useEffect lide com ele, se necessário
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

    if (isLoading) {
        return <div>Carregando autenticação...</div>; 
    }

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// =========================================================
// 4. Componente Wrapper para usar o AuthProvider
// =========================================================

/*
 * Este componente garante que o AuthProvider tenha acesso ao hook useNavigate,
 * pois ele será chamado dentro do BrowserRouter.
 */
export const AuthProviderWrapper = ({ children }) => {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    )
}