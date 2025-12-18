import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Building2,
    Calendar,
    DollarSign,
} from 'lucide-react'
import '../../styles/Dashboard.css'

const condominios = [
    {
        id: 1,
        nome: 'Condomínio Solar das Acácias',
        cnpj: '12.345.678/0001-90',
        beneficios: [
            { id: 'B-101', tipo: 'Vale Alimentação', provedor: 'Alelo', colaboradores: 120, valor: 32000.5 },
            { id: 'B-102', tipo: 'Vale Refeição', provedor: 'Pluxee', colaboradores: 95, valor: 28000.0 },
            { id: 'B-103', tipo: 'Vale Transporte', provedor: 'SPTrans', colaboradores: 150, valor: 19000.0 }
        ]
    },
    {
        id: 2,
        nome: 'Residencial Jardim Europa',
        cnpj: '98.765.432/0001-10',
        beneficios: [
            { id: 'B-201', tipo: 'Plano de Saúde', provedor: 'Amil', colaboradores: 60, valor: 45000.0 },
            { id: 'B-202', tipo: 'Odontológico', provedor: 'Porto', colaboradores: 60, valor: 9000.0 }
        ]
    },
    {
        id: 3,
        nome: 'Condomínio Vila Verde',
        cnpj: '11.222.333/0001-44',
        beneficios: [
            { id: 'B-301', tipo: 'Vale Alimentação', provedor: 'VR', colaboradores: 80, valor: 21000.0 },
            { id: 'B-302', tipo: 'Seguro de Vida', provedor: 'SulAmérica', colaboradores: 80, valor: 7000.0 }
        ]
    }
]

// Faturamento
const historicoFaturamento = {
    1: [
        { competencia: '10/2025', valorTotal: 79000.5, status: 'Fechado', data: '10-10-2025' },
        { competencia: '09/2025', valorTotal: 77500.0, status: 'Fechado', data: '01-09-2025' },
        { competencia: '08/2025', valorTotal: 76800.0, status: 'Fechado', data: '05-08-2025' }
    ],
    2: [
        { competencia: '10/2025', valorTotal: 54000.0, status: 'Fechado', data: '05-10-2025' },
        { competencia: '09/2025', valorTotal: 53800.0, status: 'Fechado', data: '01-09-2025' }
    ],
    3: [
        { competencia: '10/2025', valorTotal: 28000.0, status: 'Fechado', data: '05-10-2025' },
        { competencia: '09/2025', valorTotal: 27500.0, status: 'Fechado', data: '01-09-2025' }
    ]
}

// Importações
const historicoImportacoes = {
    1: [
        { id: 'IMP-201', arquivo: 'folha_10_2025.txt', status: 'sucesso', data: '01-10-2025' },
        { id: 'IMP-198', arquivo: 'folha_09_2025.txt', status: 'sucesso', data: '01-09-2025' },
        { id: 'IMP-190', arquivo: 'folha_08_2025.txt', status: 'erro', data: '01-08-2025' }
    ],
    2: [
        { id: 'IMP-310', arquivo: 'folha_10_2025.txt', status: 'sucesso', data: '02-10-2025' }
    ],
    3: [
        { id: 'IMP-410', arquivo: 'folha_10_2025.txt', status: 'processando', data: '02-10-2025' }
    ]
}

const formatCurrency = (n) =>
    `R$ ${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

const StatusBadge = ({ status }) => {
    const map = {
        sucesso: 'bg-green',
        erro: 'bg-red',
        processando: 'bg-blue',
        Aberto: 'bg-amber',
        Fechado: 'bg-gray'
    }
    return <span className={`badge ${map[status] || 'bg-gray'}`}>{status}</span>
}

export default function HistoricoCondominio() {
    const { id } = useParams()
    const navigate = useNavigate()
    const condId = Number(id)

    const condominio = useMemo(
        () => condominios.find(c => c.id === condId),
        [condId]
    )

    const faturamento = historicoFaturamento[condId] || []
    const importacoes = historicoImportacoes[condId] || []

    const totalBeneficios = condominio ? condominio.beneficios.length : 0
    const totalColaboradores = condominio
        ? condominio.beneficios.reduce((sum, b) => sum + b.colaboradores, 0)
        : 0

    const totalAtual = faturamento.length ? faturamento[0].valorTotal : 0

    if (!condominio) {
        return (
            <div className="dashboard-container">
                <div className="detail-view">
                    <div className="detail-header">
                        <h2>Histórico do Condomínio</h2>
                    </div>
                    <p>Condomínio não encontrado.</p>
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                        Voltar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-container">
            <div className="detail-view">

                {/* HEADER */}
                <div className="detail-header detail-header--flex">

                    <div className="detail-title-block">
                        <button
                            className="btn-back"
                            type="button"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={16} />
                            Voltar
                        </button>

                        <h2>Histórico do Condomínio</h2>

                        <p className="detail-subtitle">
                            {condominio.nome} · CNPJ: {condominio.cnpj}
                        </p>
                    </div>

                    <div className="detail-header-actions">
                        <button
                            className="action-btn"
                            onClick={() =>
                                navigate(`/historico-condominio/${condominio.id}/colaboradores/adicionar`)
                            }
                        >
                            Adicionar colaboradores
                        </button>
                    </div>
                </div>

                {/* RESUMO */}
                <div className="detail-summary-grid">
                    <div className="summary-card">
                        <div className="summary-icon summary-icon--primary">
                            <Building2 size={18} />
                        </div>
                        <div className="summary-meta">
                            <span className="summary-label">Benefícios ativos</span>
                            <strong className="summary-value">{totalBeneficios}</strong>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="summary-icon summary-icon--green">
                            <DollarSign size={18} />
                        </div>
                        <div className="summary-meta">
                            <span className="summary-label">Faturamento atual</span>
                            <strong className="summary-value">{formatCurrency(totalAtual)}</strong>
                            <span className="summary-helper">
                                Competência {faturamento[0]?.competencia}
                            </span>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="summary-icon summary-icon--amber">
                            <Calendar size={18} />
                        </div>
                        <div className="summary-meta">
                            <span className="summary-label">Colaboradores</span>
                            <strong className="summary-value">{totalColaboradores}</strong>
                        </div>
                    </div>
                </div>

                {/* BENEFÍCIOS */}
                <section className="detail-section">
                    <div className="section-header">
                        <h3>Benefícios do condomínio</h3>
                    </div>

                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Benefício</th>
                                    <th>Provedor</th>
                                    <th>Colaboradores</th>
                                    <th>Valor mensal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {condominio.beneficios.map((b) => (
                                    <tr key={b.id}>
                                        <td>{b.tipo}</td>
                                        <td>{b.provedor}</td>
                                        <td>{b.colaboradores}</td>
                                        <td>{formatCurrency(b.valor)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* FATURAMENTO */}
                <section className="detail-section">
                    <div className="section-header">
                        <h3>Faturamento por competência</h3>
                    </div>

                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Competência</th>
                                    <th>Valor total</th>
                                    <th>Status</th>
                                    <th>Data de geração</th>
                                </tr>
                            </thead>
                            <tbody>
                                {faturamento.map((f, idx) => (
                                    <tr key={idx}>
                                        <td>{f.competencia}</td>
                                        <td>{formatCurrency(f.valorTotal)}</td>
                                        <td><StatusBadge status={f.status} /></td>
                                        <td>{f.data}</td>
                                    </tr>
                                ))}
                                {!faturamento.length && (
                                    <tr>
                                        <td colSpan={4} className="table-empty">
                                            Nenhum faturamento encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* IMPORTAÇÕES */}
                <section className="detail-section">
                    <div className="section-header">
                        <h3>Importações recentes</h3>
                    </div>

                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Arquivo</th>
                                    <th>Status</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importacoes.map((imp) => (
                                    <tr key={imp.id}>
                                        <td>{imp.id}</td>
                                        <td>{imp.arquivo}</td>
                                        <td><StatusBadge status={imp.status} /></td>
                                        <td>{imp.data}</td>
                                    </tr>
                                ))}
                                {!importacoes.length && (
                                    <tr>
                                        <td colSpan={4} className="table-empty">
                                            Nenhuma importação encontrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </div>
    )
}
