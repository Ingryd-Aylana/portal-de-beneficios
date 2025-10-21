export const importacoesRecentes = [
  { id: 'IMP-1001', arquivo: 'beneficiarios_2025-09.csv', registros: 1200, status: 'sucesso', data: '2025-10-02' },
  { id: 'IMP-1002', arquivo: 'dependentes_2025-10.txt', registros: 340, status: 'erro', data: '2025-10-05' },
  { id: 'IMP-1003', arquivo: 'beneficios_extra.csv', registros: 980, status: 'processando', data: '2025-10-09' }
]

export const acordosFaturamento = [
  { id: 'folha_setembro', acordo: 'Vale Alimentação', valor: 15230.55, competencia: '09-2025', status: 'Faturado' },
  { id: 'folha_setembro', acordo: 'Vale Transporte', valor: 6230.90, competencia: '09-2025', status: 'Faturado' },
  { id: 'folha_outubro', acordo: 'Alelo', valor: 12210.00, competencia: '10-2025', status: 'Em Faturamento' }
]

export const pendencias = [
  { tipo: 'Faturamento', descricao: 'Falta de Pagamento', qtd: 7, origem: 'Condomínio Flor de Brasilia - CNPJ 01.234.567/0001-89' }
]

export const historico = [
  { id: 'folha_outubro', tipo: 'Importação', referencia: 'IMP-0999', data: '09/10/2025', status: 'sucesso' },
  { id: 'folha_outubro', tipo: 'Faturamento', referencia: 'FAT-374122', data: '15/10/2025', status: 'sucesso' },
  { id: 'folha_novembro', tipo: 'Importação', referencia: 'IMP-1002', data: '16/10/2025', status: 'erro' },
  { id: 'folha_novembro', tipo: 'Importação', referencia: 'IMP-1003', data: '16/10/2025', status: 'processando' }
]