import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import {useAuth} from "../../../context/AuthContext"; 
import logo from "../../../public/imagens/LOGO.png";

import "../../../styles/Login.css"
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

 const handleSubmit = async (event) => {
  event.preventDefault();
  setLoading(true);
  setError("");

  try {
    await login(String(email ?? "").trim(), String(password ?? ""), "/Home");
   
  } catch (err) {
    console.error("Erro de login no componente:", err);

    const msg = String(err?.message || err);
    const message =
      msg.includes("401") || msg.toLowerCase().includes("credenciais")
        ? "Credenciais inválidas. Verifique o usuário e a senha."
        : "Ocorreu um erro inesperado durante o login.";

    setError(message);
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <div className="gradient-bg"></div>

      <div className="login-wrapper">
        <div className="loginContainer">
          <div className="loginBox">
            <img src={logo} alt="Logo" className="logoImg" />

            <h2 className="titlePortal">Portal de Benefícios</h2>
            <p className="pPortal">Insira seus dados para acessar a plataforma</p>

            <form onSubmit={handleSubmit}>
              <div className="inputGroup">
                <label htmlFor="email">E-mail:</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="inputGroup senhaGroup">
                <label htmlFor="senha">Senha:</label>

                <div className="senhaWrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="senha"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="togglePassword"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" className="loginButton" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>

              <a href="/esqueci-senha" className="forgot-password">
                Esqueceu sua senha?
              </a>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;