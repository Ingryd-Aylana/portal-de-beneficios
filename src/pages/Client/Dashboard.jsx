import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    TrendingUp,
    FileText,
    AlertCircle,
    DollarSign,
    Calendar,
    Filter,
    X,
    Search,
    Building2,
    BadgePercent,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import '../../styles/Dashboard.css'
import { entebenService } from '../../services/entebenService'
import PendenciasDoDiaModal from '../../components/PendenciasDoDiaModal'

/* Utils */
const formatCurrency = (n) =>
    `R$ ${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

const normalize = (str) =>
    (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9/.-]/g, ' ')

const StatusBadge = ({ status }) => {
    const statusStyles = {
        sucesso: 'bg-green',
        erro: 'bg-red',
        processando: 'bg-blue',
        Aberto: 'bg-amber',
        Fechado: 'bg-gray'
    }
    return <span className={`badge ${statusStyles[status] || 'bg-gray'}`}>{status}</span>
}

const DashboardCard = ({ title, value, subtitle, icon: Icon, colorClass, onClick, trend }) => {
    return (
        <div className={`dashboard-card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
            <div className="card-header">
                <div className={`card-icon-wrapper ${colorClass}`}>
                    <Icon className="card-icon" />
                </div>
                <h3 className="card-title">{title}</h3>
            </div>

            <div className="card-value">{value}</div>

            {subtitle && <div className="card-subtitle subtitle-line">{subtitle}</div>}

            {trend && (
                <div className="card-trend">
                    <TrendingUp size={14} />
                    <span>{trend}</span>
                </div>
            )}
        </div>
    )
}

const FilterPanel = ({ filters, onFilterChange, onClearFilters }) => {
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const onClickOutside = (e) => {
            if (isOpen && ref.current && !ref.current.contains(e.target)) setIsOpen(false)
        }
        const onEsc = (e) => e.key === 'Escape' && setIsOpen(false)
        document.addEventListener('mousedown', onClickOutside)
        document.addEventListener('keydown', onEsc)
        return () => {
            document.removeEventListener('mousedown', onClickOutside)
            document.removeEventListener('keydown', onEsc)
        }
    }, [isOpen])

    const hasAny = Object.values(filters).some(Boolean)

    return (
        <div className="filter-container" ref={ref}>
            <button
                className="filter-toggle"
                onClick={() => setIsOpen((v) => !v)}
                aria-expanded={isOpen}
            >
                <Filter size={18} />
                <span>Filtros</span>
                {hasAny && <span className="filter-badge" aria-label="Filtros ativos">●</span>}
            </button>

            {isOpen && (
                <div className="filter-panel" role="dialog" aria-label="Filtrar dashboard">
                    <div className="filter-header">
                        <h4>Filtrar Dashboard</h4>
                        <button onClick={() => setIsOpen(false)} className="filter-close" aria-label="Fechar filtros">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="filter-content">
                        <div className="filter-group">
                            <label>Período</label>
                            <select
                                value={filters.periodo}
                                onChange={(e) => onFilterChange('periodo', e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Todos</option>
                                <option value="hoje">Hoje</option>
                                <option value="semana">Última semana</option>
                                <option value="mes">Último mês</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => onFilterChange('status', e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Todos</option>
                                <option value="Aberto">Aberto</option>
                                <option value="Fechado">Fechado</option>
                                <option value="sucesso">Sucesso</option>
                                <option value="erro">Erro</option>
                            </select>
                        </div>

                        <button onClick={onClearFilters} className="filter-clear">
                            Limpar filtros
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

const AutocompleteSearch = ({ data, onSelect, inline = false }) => {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [highlight, setHighlight] = useState(0)
    const inputRef = useRef(null)
    const listRef = useRef(null)

    const results = useMemo(() => {
        if (!query || !data) return [] // Added check for data
        const q = normalize(query)
        return data
            .filter(c => normalize(c.nome).includes(q) || normalize(c.cnpj).includes(q))
            .slice(0, 8)
    }, [data, query])

    useEffect(() => {
        setHighlight(0)
    }, [query])

    const handleKeyDown = (e) => {
        if (!open) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlight(h => Math.min(h + 1, results.length - 1))
            listRef.current?.children?.[Math.min(highlight + 1, results.length - 1)]?.scrollIntoView({ block: 'nearest' })
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlight(h => Math.max(h - 1, 0))
            listRef.current?.children?.[Math.max(highlight - 1, 0)]?.scrollIntoView({ block: 'nearest' })
        }
        if (e.key === 'Enter' && results[highlight]) {
            e.preventDefault()
            selectItem(results[highlight])
        }
        if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    const selectItem = (item) => {
        onSelect(item)
        setQuery(`${item.nome} — ${item.cnpj}`)
        setOpen(false)
        inputRef.current?.blur()
    }

    return (
        <div className={`auto-wrap ${inline ? 'auto--inline' : ''}`}>
            {!inline && <label className="auto-label">Buscar condomínio ou CNPJ</label>}

            <div className={`auto-input ${open && results.length ? 'auto-input--open' : ''}`}>
                <Search size={18} className="auto-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
                    onFocus={() => query && setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite o nome do condomínio ou CNPJ"
                />
                {query && (
                    <button
                        className="auto-clear"
                        aria-label="Limpar"
                        onClick={() => { setQuery(''); setOpen(false); onSelect(null) }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {open && results.length > 0 && (
                <ul className="auto-list" ref={listRef} role="listbox">
                    {results.map((c, idx) => (
                        <li
                            key={c.id}
                            role="option"
                            aria-selected={highlight === idx}
                            className={`auto-item ${highlight === idx ? 'is-active' : ''}`}
                            onMouseEnter={() => setHighlight(idx)}
                            onMouseDown={(e) => { e.preventDefault(); selectItem(c) }}
                        >
                            <Building2 size={16} />
                            <div className="auto-meta">
                                <span className="auto-name">{c.nome}</span>
                                <span className="auto-cnpj">{c.cnpj}</span>
                            </div>
                        </li>
                        ))}
                </ul>
            )}

            {open && query && results.length === 0 && (
                <div className="auto-empty">Nenhum condomínio encontrado</div>
            )}
        </div>
    )
}

const BeneficiosDoCondominio = ({ condominio }) => {
    if (!condominio) return null

    const total = condominio.beneficios.reduce((s, b) => s + (b.valor || 0), 0)

    return (
        <div className="beneficios-wrap">
            <div className="beneficios-header">
                <div className="beneficios-title">
                    <Building2 size={20} />
                    <div>
                        <h3>{condominio.nome}</h3>
                        <span className="muted">CNPJ: {condominio.cnpj}</span>
                    </div>
                </div>
                <div className="beneficios-total">{formatCurrency(total)}</div>
            </div>

            <div className="beneficios-grid">
                {condominio.beneficios.map((b) => (
                    <div key={b.id} className="beneficio-card">
                        <div className="beneficio-head">
                            <div className="beneficio-icon"><BadgePercent size={18} /></div>
                            <div className="beneficio-titulo">
                                <strong>{b.tipo}</strong>
                                <span className="muted">Provedor: {b.provedor}</span>
                            </div>
                        </div>
                        <div className="beneficio-meta">
                            <div>
                                <span className="muted">Colaboradores</span>
                                <div className="beneficio-val">{b.colaboradores}</div>
                            </div>
                            <div>
                                <span className="muted">Valor</span>
                                <div className="beneficio-val">{formatCurrency(b.valor)}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* DASHBOARD */
export default function Dashboard() {
    const navigate = useNavigate()
    // 1. Estados para armazenar dados da API
    const [movimentacoes, setMovimentacoes] = useState([])
    const [acordos, setAcordos] = useState([])
    const [condominios, setCondominios] = useState([])
    const [isLoadingData, setIsLoadingData] = useState(true) // Novo estado para o carregamento

    const [filters, setFilters] = useState({ periodo: '', status: '' })
    const [selecionado, setSelecionado] = useState(null)

    // 2. useEffect para buscar dados na montagem do componente (e após a autenticação)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch de todas as promessas em paralelo
                const [movData, acordosData, condominiosData] = await Promise.all([
                    entebenService.getMovimentacoes(),
                    entebenService.getMovimentacoes(), // Você estava buscando 2x, mantive o padrão
                    entebenService.getcondominios()
                ]);
                
                // Atualiza os estados
                setMovimentacoes(movData);
                setAcordos(acordosData);
                setCondominios(condominiosData);
            } catch (error) {
                // Aqui você pode lidar com erros, como exibir uma mensagem de falha
                console.error("Erro ao carregar dados do Dashboard:", error);
                // O 401 deve ser tratado pelo seu Interceptor/AuthContext
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, []); // Array de dependências vazio: executa apenas na montagem

    // filtros nos MOCKS, agora usando os estados
    const ultMov = movimentacoes.length
    const importacoesRecentes = movimentacoes

    const filteredImportacoes = importacoesRecentes.filter(imp => {
        if (filters.status && imp.status !== filters.status) return false
        if (filters.periodo === 'hoje') {
            const hoje = new Date().toISOString().split('T')[0]
            return imp.data === hoje
        }
        if (filters.periodo === 'semana') {
            const semanaAtras = new Date()
            semanaAtras.setDate(semanaAtras.getDate() - 7)
            return new Date(imp.data) >= semanaAtras
        }
        return true
    })

    const filteredAcordos = acordos.filter(a => {
        if (filters.status && a.status !== filters.status) return false
        return true
    })

    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
    const handleClearFilters = () => setFilters({ periodo: '', status: '' })

    // Cálculos dependentes dos dados
    const totalAberto = filteredAcordos.filter(a => a.status !== 'Fechado').length
    const ultImp = filteredImportacoes[0]
    const erros = filteredImportacoes.filter(i => i.status === 'erro').length
    const faturamentoTotal = filteredAcordos.reduce((s, a) => s + a.valor, 0)

    const goImportacao = () => navigate('/importacao')
    const goPendentes = () => navigate('/pendentes')
    const goHistorico = () => navigate('/historico')
    const goFaturamento = () => navigate('/faturamento')

    // pendências do dia
    const todayStr = useMemo(() => {
        const d = new Date()
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
    }, [])

    const pendenciasDeHoje = useMemo(() => {
        return acordos.filter(a =>
            a.status !== 'Fechado' && a.vencimento <= todayStr
        )
    }, [acordos, todayStr]) // Adicionado 'acordos' como dependência

    // 3. Renderização de Carregamento
    if (isLoadingData) {
        return <div className="loading-dashboard">Carregando Dashboard...</div>;
    }

    return (
        <div className="dashboard-container">
                        <PendenciasDoDiaModal
                items={pendenciasDeHoje}
                onGoToPendentes={goPendentes}
            />

            <div className="dashboard-header header--with-tools">
                <h1 className="dashboard-title">Dashboard</h1>
                <div className="dashboard-tools">
                    <AutocompleteSearch data={condominios} onSelect={setSelecionado} inline />
                    <FilterPanel
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                    />
                </div>
            </div>

            {/* Cards */}
            <div className="card-grid">
                <DashboardCard
                    title="ÚLTIMA IMPORTAÇÃO"
                    value={`IMP-${ultImp?.id}` || '-'}
                    subtitle={
                        <div className="subtitle-line">
                            <StatusBadge status={ultImp?.status} />
                            <span>{ultImp?.arquivo}</span>
                        </div>
                    }
                    icon={FileText}
                    colorClass="icon--blue"
                    onClick={goImportacao}
                />

                <DashboardCard
                    title="PAGAMENTOS EM ABERTO"
                    value={totalAberto}
                    subtitle="Aguardando processamento"
                    icon={Calendar}
                    colorClass="icon--amber"
                    onClick={goPendentes}
                />

                <DashboardCard
                    title="ERROS DE IMPORTAÇÃO"
                    value={erros}
                    subtitle="Últimos 7 dias"
                    icon={AlertCircle}
                    colorClass="icon--red"
                    onClick={goHistorico}
                />

                <DashboardCard
                    title="FATURAMENTO ACUMULADO"
                    value={formatCurrency(faturamentoTotal)}
                    subtitle="Outubro 2025"
                    icon={DollarSign}
                    colorClass="icon--green"
                    onClick={goFaturamento}
                />
            </div>
               
            <BeneficiosDoCondominio condominio={selecionado} />
        </div>
    )
}