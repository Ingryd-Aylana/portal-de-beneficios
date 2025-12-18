import React, { useState, useRef } from 'react'
import {
    FileSpreadsheet,
    FileText,
    Receipt,
    CreditCard,
    Users,
    Filter,
    Calendar,
    Building2,
    Download,
    CheckCircle,
    AlertCircle
} from 'lucide-react'
import '../../styles/Relatorios.css'

export default function RelatoriosBeneficios() {
    const [filtros, setFiltros] = useState({
        dataInicio: '',
        dataFim: '',
        beneficio: '',
        condominio: '',
        departamento: ''
    })

    const [toast, setToast] = useState({ open: false, message: '', type: 'success' })
    const toastTimer = useRef(null)

    const handleFiltroChange = (e) => {
        const { name, value } = e.target
        setFiltros(prev => ({ ...prev, [name]: value }))
    }

    const showToast = (message, type = 'success') => {
        setToast({ open: true, message, type })
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(
            () => setToast({ open: false, message: '', type: 'success' }),
            2500
        )
    }

    const handleExport = (tipoRelatorio, formato) => {
        console.log('Gerar relatório:', { tipoRelatorio, formato, filtros })

        showToast(
            `Relatório "${tipoRelatorio}" em ${formato.toUpperCase()} solicitado com sucesso.`,
            'success'
        )
    }

    return (
        <div className="rel-page">
            
            <div className="rel-filters card pad">
                <div className="rel-filters-head">
                    <div className="rel-filters-title">
                        <Filter className="ico" />
                        <span>Filtros</span>
                    </div>
                </div>

                <div className="rel-filters-grid">
                    <div className="field">
                        <label>Período - Início</label>
                        <div className="input-with-ico">
                            <Calendar className="ico" />
                            <input
                                type="date"
                                name="dataInicio"
                                value={filtros.dataInicio}
                                onChange={handleFiltroChange}
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label>Período - Fim</label>
                        <div className="input-with-ico">
                            <Calendar className="ico" />
                            <input
                                type="date"
                                name="dataFim"
                                value={filtros.dataFim}
                                onChange={handleFiltroChange}
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label>Condomínio</label>
                        <div className="input-with-ico">
                            <Building2 className="ico" />
                            <input
                                type="text"
                                name="condominio"
                                placeholder="Nome ou CNPJ"
                                value={filtros.condominio}
                                onChange={handleFiltroChange}
                            />
                        </div>
                    </div>

                </div>
            </div>

            <div className="rel-grid">

                <div className="card rel-card">
                    <div className="rel-card-head">
                        <div className="rel-card-ico rel-ico-green">
                            <FileSpreadsheet className="ico xl" />
                        </div>
                        <div>
                            <h2>Detalhamento do Pedido (Excel)</h2>
                            <p>Lista completa de todos os pedidos de benefícios com campos detalhados para análise em planilha.</p>
                        </div>
                    </div>
                    <ul className="rel-card-list">
                        <li>Todos os pedidos de benefícios</li>
                        <li>Dados de colaboradores, benefícios, valores e status</li>
                        <li>Ideal para análises e conciliações no Excel</li>
                    </ul>
                    <div className="rel-card-footer">
                        <button
                            className="btn btn-primary"
                            onClick={() => handleExport('Detalhamento do Pedido', 'excel')}
                        >
                            <Download className="ico" />
                            <span>Gerar Excel</span>
                        </button>
                    </div>
                </div>


                <div className="card rel-card">
                    <div className="rel-card-head">
                        <div className="rel-card-ico rel-ico-purple">
                            <Users className="ico xl" />
                        </div>
                        <div>
                            <h2>Departamento / Nome – Taxas Detalhadas</h2>
                            <p>Taxas e encargos detalhados por departamento ou colaborador.</p>
                        </div>
                    </div>
                    <ul className="rel-card-list">
                        <li>Visão por centro de custo / departamento</li>
                        <li>Taxas administrativas, serviços e encargos</li>
                        <li>Permite rastreio e alocação de custos</li>
                    </ul>
                    <div className="rel-card-footer">
                        <button
                            className="btn btn-primary"
                            onClick={() => handleExport('Taxas Detalhadas por Departamento/Nome', 'excel')}
                        >
                            <Download className="ico" />
                            <span>Excel</span>
                        </button>
                        <button
                            className="btn btn-light"
                            onClick={() => handleExport('Taxas Detalhadas por Departamento/Nome', 'pdf')}
                        >
                            <Download className="ico" />
                            <span>PDF</span>
                        </button>
                    </div>
                </div>

                <div className="card rel-card">
                    <div className="rel-card-head">
                        <div className="rel-card-ico rel-ico-orange">
                            <FileText className="ico xl" />
                        </div>
                        <div>
                            <h2>Notas de Débito</h2>
                            <p>Relatório das notas de débito geradas a partir dos pedidos de benefícios.</p>
                        </div>
                    </div>
                    <ul className="rel-card-list">
                        <li>Notas de débito por condomínio e período</li>
                        <li>Valores, número da nota e referência do pedido</li>
                        <li>Exportação em Excel ou PDF</li>
                    </ul>
                    <div className="rel-card-footer">
                        <button
                            className="btn btn-light"
                            onClick={() => handleExport('Notas de Débito', 'pdf')}
                        >
                            <Download className="ico" />
                            <span>PDF</span>
                        </button>
                    </div>
                </div>

                <div className="card rel-card">
                    <div className="rel-card-head">
                        <div className="rel-card-ico rel-ico-blue">
                            <Receipt className="ico xl" />
                        </div>
                        <div>
                            <h2>Notas Fiscais</h2>
                            <p>Consolidação das notas fiscais emitidas relacionadas aos benefícios.</p>
                        </div>
                    </div>
                    <ul className="rel-card-list">
                        <li>Lista de NF por período e condomínio</li>
                        <li>Códigos, série, valores e impostos</li>
                        <li>Auxilia na conferência com contabilidade</li>
                    </ul>
                    <div className="rel-card-footer">
                        <button
                            className="btn btn-light"
                            onClick={() => handleExport('Notas Fiscais', 'pdf')}
                        >
                            <Download className="ico" />
                            <span>PDF</span>
                        </button>
                    </div>
                </div>

                <div className="card rel-card">
                    <div className="rel-card-head">
                        <div className="rel-card-ico rel-ico-teal">
                            <CreditCard className="ico xl" />
                        </div>
                        <div>
                            <h2>Recarga Assinatura</h2>
                            <p>Relatório de recargas de benefícios recorrentes (assinaturas / mensalidades).</p>
                        </div>
                    </div>
                    <ul className="rel-card-list">
                        <li>Recargas mensais por colaborador e benefício</li>
                        <li>Valores, status e datas de processamento</li>
                        <li>Controle de recorrência e divergências</li>
                    </ul>
                    <div className="rel-card-footer">
                        <button
                            className="btn btn-light"
                            onClick={() => handleExport('Recarga Assinatura', 'pdf')}
                        >
                            <Download className="ico" />
                            <span>PDF</span>
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={`rel-toast-wrap ${toast.open ? 'show' : ''}`}
                role="status"
                aria-live="polite"
            >
                <div className={`rel-toast ${toast.type === 'danger' ? 'rel-toast-danger' : 'rel-toast-success'}`}>
                    {toast.type === 'danger' ? (
                        <AlertCircle className="rel-toast-ico" />
                    ) : (
                        <CheckCircle className="rel-toast-ico" />
                    )}
                    <span>{toast.message}</span>
                </div>
            </div>
        </div>
    )
}
