import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import Carousel from '../../components/Carousel.jsx'
import '../../styles/Login.css'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()

    if (!email) return

    setEnviado(true)
    setTimeout(() => setEnviado(false), 3500)
  }

  function handleVoltar() {
    navigate('/login')
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
           

            <h2 className="login-title">Recuperar senha</h2>
            <p className="login-subtitle">
              Informe o e-mail cadastrado para enviarmos as instruções.
            </p>

            <div className="field">
              <label>E-mail</label>
              <div className="input-group">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className="input"
                  placeholder="seuemail@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="button primary">
              Enviar instruções
            </button>

             <button
              type="button"
              className="voltar-btn"
              onClick={handleVoltar}
            >
              <ArrowLeft size={16} />
              Voltar
            </button>

            {enviado && (
              <div className="feedback success">
                E-mail enviado! Verifique sua caixa de entrada.
              </div>
            )}
          </form>
        </div>

        <div className="login-right">
          <Carousel interval={3500} />
        </div>
      </div>
    </div>
  )
}
