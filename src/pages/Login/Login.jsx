import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Carousel from '../../components/Carousel.jsx'
import '../../styles/Login.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  function handleSubmit(e) {
    e.preventDefault()
    const res = login({ username, password })
    if (res.ok) {
      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    } else {
      setError(res.error || 'Falha no login')
    }
  }

  function handleEsqueciSenha() {
       navigate('/esqueci-senha')
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
                value={username}
                onChange={e => setUsername(e.target.value)}
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
            <button className="button primary" type="submit">Entrar</button>
            <button
              type="button"
              className="button ghost"
              onClick={handleEsqueciSenha}
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
