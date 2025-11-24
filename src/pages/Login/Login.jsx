import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Carousel from '../../components/Carousel.jsx'
import '../../styles/Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // MUDANÇA 1: Função agora é assíncrona
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoggingIn(true) 

    try {

      await login(email, password)

      // MUDANÇA 3: Navegação na rota de sucesso
      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      // MUDANÇA 3: Tratamento de erro no 'catch'
      console.error('Erro de Login:', err)
      const message = err.message.includes('401') || err.message.includes('credenciais')
        ? 'Credenciais inválidas. Verifique o usuário e a senha.'
        : 'Falha ao conectar. Tente novamente mais tarde.'

      setError(message)
    } finally {
      setIsLoggingIn(false) // Finaliza o estado de carregamento/login
    }
  }

  // Função para simular o clique no esqueci a senha, evitando o alert()
  const handleForgotPassword = () => {
      setError('Fluxo de recuperação de senha ainda não implementado.')
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-left">
          <div className="login-brand">
            <img
              src="https://i.postimg.cc/Gh597vbr/LOGO.png"
              alt="Fedcorp Logo"
              className="logoImg"
            />
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="field">
              <label>Login</label>
              <input
                className="input"
                placeholder="Usuário"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Senha</label>
              <input
                className="input"
                placeholder="Senha"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {error && <div className="status erro">{error}</div>}
            <button className="button primary" type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => alert('Fluxo de recuperação de senha ainda não implementado.')}
            >
              Esqueci a Senha
            </button>
          </form>
        </div>

        <div className="login-right">
          <Carousel interval={3500} />
        </div>
      </div>
    </div>
  )
}