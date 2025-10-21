import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/Sidebar.css'

export default function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      
      <div className="logo-sidebar">
        <img
          src="https://i.postimg.cc/286V70R2/logo2.png"
          alt="Fedcorp Logo"
          className="logoImg"
        />
      </div>
       <div className="logout-section"></div>

      <nav className="nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>Início</NavLink>
        <NavLink to="/importacao" className={({ isActive }) => (isActive ? 'active' : '')}>Importação</NavLink>
        <NavLink to="/faturamento" className={({ isActive }) => (isActive ? 'active' : '')}>Faturamento</NavLink>
        <NavLink to="/pendentes" className={({ isActive }) => (isActive ? 'active' : '')}>Pendentes</NavLink>
        <NavLink to="/historico" className={({ isActive }) => (isActive ? 'active' : '')}>Histórico</NavLink>
        <NavLink to="/configuracoes" className={({ isActive }) => (isActive ? 'active' : '')}>Configurações</NavLink>

        <div className="logout-section">
          <a onClick={handleLogout} role="button" className="logout-link">Sair</a>
        </div>
      </nav>
    </aside>
  )
}
