import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, UserPlus } from 'lucide-react'
import '../styles/AdicionarColaboradores.css'
import CadastroColaboradorModal from '../../components/CadastroColaboradorModal'

// Mock básico de benefícios por condomínio (use o mesmo do histórico)
const condominiosMock = [
  {
    id: 1,
    beneficios: [
      { id: 'B-101', tipo: 'Vale Alimentação', provedor: 'Alelo' },
      { id: 'B-102', tipo: 'Vale Refeição', provedor: 'Pluxee' },
      { id: 'B-103', tipo: 'Vale Transporte', provedor: 'SPTrans' },
    ]
  },
  {
    id: 2,
    beneficios: [
      { id: 'B-201', tipo: 'Plano de Saúde', provedor: 'Amil' },
      { id: 'B-202', tipo: 'Odontológico', provedor: 'Porto' }
    ]
  },
  {
    id: 3,
    beneficios: [
      { id: 'B-301', tipo: 'Vale Alimentação', provedor: 'VR' },
      { id: 'B-302', tipo: 'Seguro de Vida', provedor: 'SulAmérica' }
    ]
  }
]

export default function AdicionarColaboradores() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [openModal, setOpenModal] = useState(false)

  // Pega os benefícios corretos do condomínio
  const condominio = useMemo(
    () => condominiosMock.find(c => c.id === Number(id)),
    [id]
  )

  const beneficios = condominio?.beneficios || []

  return (
    <div className="dashboard-container">
      <div className="detail-view">

        {/* HEADER */}
        <div className="detail-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Voltar
          </button>

          <h2>Adicionar Colaboradores</h2>
          <p className="detail-subtitle">Condomínio ID: {id}</p>
        </div>

        {/* OPÇÕES DE IMPORTAÇÃO */}
        <div className="import-options">

          {/* Importação de Excel */}
          <div
            className="import-card"
            onClick={() => alert("Importar Excel ainda não implementado.")}
          >
            <Upload size={24} />
            <h3>Importar Planilha</h3>
            <p>Carregue uma planilha XLSX/CSV com os colaboradores.</p>
          </div>

          {/* Cadastro individual */}
          <div
            className="import-card"
            onClick={() => setOpenModal(true)}
          >
            <UserPlus size={24} />
            <h3>Cadastro Manual</h3>
            <p>Adicionar colaboradores individualmente.</p>
          </div>

        </div>

        {/* MODAL */}
        <CadastroColaboradorModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          beneficios={beneficios}
          onSave={(data) => {
            console.log("Colaborador cadastrado:", data)
            
          }}
        />

      </div>
    </div>
  )
}
