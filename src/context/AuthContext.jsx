import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/userService.js'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

const normalizeUser = (userData) => {
  if (!userData) return null

  const rawRole =
    userData.role ??
    userData.perfil ??
    userData.tipo ??
    userData.userRole ??
    null

  const role = rawRole || 'cliente'

  return {
    ...userData,
    role,
  }
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const navigate = useNavigate()

  const hasRole = (allowedRoles = []) => {
    if (!allowedRoles?.length) return true
    const currentRole = user?.role
    return !!currentRole && allowedRoles.includes(currentRole)
  }

  const isColaboradorFedcorp = user?.role === 'colaborador_fedcorp'
  const isCliente = user?.role === 'cliente'

  useEffect(() => {
    let isMounted = true

    const fetchAndSetUser = async () => {
      const userData = await userService.getUserData()
      const normalized = normalizeUser(userData)

      if (!isMounted) return normalized

      setUser(normalized)
      setIsAuthenticated(true)
      return normalized
    }

    const checkInitialAuth = async () => {
      try {
        const hasAccessToken = userService.isAuthenticated()

        if (hasAccessToken) {
          try {
            await fetchAndSetUser()
          } catch (error) {
            await handleRefreshToken()
            await fetchAndSetUser()
          }
        }
      } catch (err) {

        if (isMounted) {
          setIsAuthenticated(false)
          setUser(null)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    checkInitialAuth()

    return () => {
      isMounted = false
    }

  }, [])
  const handleLogin = async (username, password, redirectTo) => {
    setIsLoading(true)
    try {
      await userService.login(username, password)

      const userData = await userService.getUserData()
      const normalized = normalizeUser(userData)

      setUser(normalized)
      setIsAuthenticated(true)

      const defaultRedirect =
        normalized?.role === 'colaborador_fedcorp'
          ? '/colaborador/dashboard'
          : '/'

      navigate(redirectTo || defaultRedirect, { replace: true })

      return normalized
    } catch (error) {
      console.error('Falha no Login:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = (redirectTo = '/login') => {
    userService.logout()
    setIsAuthenticated(false)
    setUser(null)
    navigate(redirectTo, { replace: true })
  }

  const handleRefreshToken = async () => {
    try {
      await userService.refreshToken()
      const userData = await userService.getUserData()
      const normalized = normalizeUser(userData)

      setUser(normalized)
      setIsAuthenticated(true)
      return true
    } catch (error) {
      setIsAuthenticated(false)
      setUser(null)
      console.error('Falha no Refresh Token. Usuário deslogado.')
      throw error
    }
  }

  const reloadUser = async () => {
    try {
      const userData = await userService.getUserData()
      const normalized = normalizeUser(userData)
      setUser(normalized)
      return normalized
    } catch (error) {
      console.error('Falha ao recarregar usuário:', error)
      throw error
    }
  }

  const authContextValue = useMemo(
    () => ({
      isAuthenticated,
      user,
      isLoading,
      hasRole,
      isColaboradorFedcorp,
      isCliente,
      login: handleLogin,
      logout: handleLogout,
      refreshToken: handleRefreshToken,
      reloadUser,
    }),
    [isAuthenticated, user, isLoading]
  )

  if (isLoading) {
    return (
      <div style={{ padding: 16 }}>
        Carregando autenticação…
      </div>
    )
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const AuthProviderWrapper = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>
}
