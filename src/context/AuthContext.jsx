import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(()=>{
    const raw = localStorage.getItem('auth_user')
    if (raw) setUser(JSON.parse(raw))
  }, [])

  function login({ username, password }) {
    // Autenticação simples (mock)
    if (username && password) {
      const u = { name: username, token: 'fake-token' }
      setUser(u)
      localStorage.setItem('auth_user', JSON.stringify(u))
      return { ok: true }
    }
    return { ok: false, error: 'Credenciais inválidas' }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('auth_user')
  }

  const value = { user, isAuthenticated: !!user, login, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}