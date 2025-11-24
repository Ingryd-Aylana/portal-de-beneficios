import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Bell } from 'lucide-react'
import '../styles/Header.css'

export default function Header({ title }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  // notificações de exemplo — depois pode trocar por chamadas reais
  const notificacoes = [
    { id: 1, texto: 'Importação concluída com sucesso', data: '13/10/2025' },
    { id: 2, texto: 'Faturamento disponível para pagamento', data: '12/10/2025' },
    { id: 3, texto: 'Novo condomínio cadastrado', data: '11/10/2025' },
  ]

  return (
    <header className="header">
      <h2 className="header-title">{title}</h2>

      <div className="header-right">
        {/* Notificações */}
        <div className="notif-wrapper">
          <button
            className="notif-btn"
            onClick={() => setOpen(o => !o)}
            aria-label="Notificações"
          >
            <Bell className="notif-icon" />
            {notificacoes.length > 0 && (
              <span className="notif-dot">{notificacoes.length}</span>
            )}
          </button>

          {open && (
            <div className="notif-dropdown">
              <div className="notif-head">Notificações</div>
              {notificacoes.length === 0 ? (
                <p className="notif-empty">Nenhuma notificação</p>
              ) : (
                notificacoes.map(n => (
                  <div key={n.id} className="notif-item">
                    <p className="notif-text">{n.texto}</p>
                    <span className="notif-date">{n.data}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Saudação */}
        <div className="header-user">
          <span className="user-muted">Bem-vindo(a),</span>
          <strong className="user-name">{user?.username ?? 'Usuário'}</strong>
      
        </div>
      </div>
    </header>
  )
}
