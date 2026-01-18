import { CustomMetric } from '@/types/metrics'

/**
 * Métricas pré-definidas para Gestores de Tráfego Sênior
 *
 * Estas métricas são as mais utilizadas na gestão de tráfego pago
 * para infoprodutos e e-commerce.
 */
export const PREDEFINED_METRICS: CustomMetric[] = [
  // ============================================
  // MÉTRICAS DE RENTABILIDADE
  // ============================================
  {
    id: 'predefined_roas',
    name: 'ROAS',
    formula: 'totalRevenue / totalSpent',
    format: 'decimal',
    description: 'Retorno sobre investimento em ads',
    color: '#10b981', // emerald
  },
  {
    id: 'predefined_roi',
    name: 'ROI %',
    formula: '((totalRevenue - totalSpent) / totalSpent) * 100',
    format: 'percentage',
    description: 'Retorno percentual sobre investimento',
    color: '#22c55e', // green
  },
  {
    id: 'predefined_lucro',
    name: 'Lucro Bruto',
    formula: 'totalRevenue - totalSpent',
    format: 'currency',
    description: 'Receita menos investimento',
    color: '#14b8a6', // teal
  },

  // ============================================
  // MÉTRICAS DE CUSTO
  // ============================================
  {
    id: 'predefined_cpl',
    name: 'CPL',
    formula: 'totalSpent / totalLeads',
    format: 'currency',
    description: 'Custo por Lead',
    color: '#f59e0b', // amber
  },
  {
    id: 'predefined_cpa',
    name: 'CPA',
    formula: 'totalSpent / totalPurchases',
    format: 'currency',
    description: 'Custo por Aquisição',
    color: '#ef4444', // red
  },
  {
    id: 'predefined_cpv',
    name: 'Custo por Venda',
    formula: 'totalSpent / totalPurchases',
    format: 'currency',
    description: 'Investimento dividido por vendas',
    color: '#f97316', // orange
  },

  // ============================================
  // MÉTRICAS DE EFICIÊNCIA
  // ============================================
  {
    id: 'predefined_ticket_medio',
    name: 'Ticket Médio',
    formula: 'totalRevenue / totalPurchases',
    format: 'currency',
    description: 'Valor médio por venda',
    color: '#8b5cf6', // violet
  },
  {
    id: 'predefined_tx_conversao_leads',
    name: 'Tx Conv. Leads',
    formula: '(totalPurchases / totalLeads) * 100',
    format: 'percentage',
    description: 'Leads que converteram em vendas',
    color: '#06b6d4', // cyan
  },
  {
    id: 'predefined_tx_conversao_cliques',
    name: 'Tx Conv. Cliques',
    formula: '(totalPurchases / totalLinkClicks) * 100',
    format: 'percentage',
    description: 'Cliques que converteram em vendas',
    color: '#0ea5e9', // sky
  },

  // ============================================
  // MÉTRICAS DE FUNIL
  // ============================================
  {
    id: 'predefined_ctr_link',
    name: 'CTR Link',
    formula: '(totalLinkClicks / totalImpressions) * 100',
    format: 'percentage',
    description: 'Taxa de clique no link',
    color: '#3b82f6', // blue
  },
  {
    id: 'predefined_taxa_lp',
    name: 'Taxa LP View',
    formula: '(totalLandingPageViews / totalLinkClicks) * 100',
    format: 'percentage',
    description: 'Cliques que viram a landing page',
    color: '#6366f1', // indigo
  },
  {
    id: 'predefined_frequencia',
    name: 'Frequência',
    formula: 'totalImpressions / totalReach',
    format: 'decimal',
    description: 'Média de vezes que cada pessoa viu o ad',
    color: '#ec4899', // pink
  },

  // ============================================
  // MÉTRICAS AVANÇADAS
  // ============================================
  {
    id: 'predefined_cac_payback',
    name: 'MER',
    formula: 'totalRevenue / totalSpent',
    format: 'decimal',
    description: 'Marketing Efficiency Ratio (igual ROAS)',
    color: '#a855f7', // purple
  },
  {
    id: 'predefined_custo_mil_cliques',
    name: 'Custo/1k Cliques',
    formula: '(totalSpent / totalClicks) * 1000',
    format: 'currency',
    description: 'Quanto custa mil cliques',
    color: '#64748b', // slate
  },
  {
    id: 'predefined_receita_por_clique',
    name: 'Receita/Clique',
    formula: 'totalRevenue / totalLinkClicks',
    format: 'currency',
    description: 'Quanto cada clique gera de receita',
    color: '#84cc16', // lime
  },
]

/**
 * Retorna métricas pré-definidas que fazem sentido baseado nos dados disponíveis
 * Algumas métricas dependem de totalRevenue ou totalLeads que podem ser 0
 */
export function getRelevantPredefinedMetrics(): CustomMetric[] {
  // Retorna as métricas mais essenciais primeiro
  return [
    PREDEFINED_METRICS.find(m => m.id === 'predefined_roas')!,
    PREDEFINED_METRICS.find(m => m.id === 'predefined_lucro')!,
    PREDEFINED_METRICS.find(m => m.id === 'predefined_cpa')!,
    PREDEFINED_METRICS.find(m => m.id === 'predefined_ticket_medio')!,
    PREDEFINED_METRICS.find(m => m.id === 'predefined_tx_conversao_cliques')!,
    PREDEFINED_METRICS.find(m => m.id === 'predefined_frequencia')!,
  ]
}

/**
 * Métricas essenciais que todo gestor de tráfego precisa
 */
export const ESSENTIAL_METRICS: CustomMetric[] = [
  PREDEFINED_METRICS.find(m => m.id === 'predefined_roas')!,
  PREDEFINED_METRICS.find(m => m.id === 'predefined_lucro')!,
  PREDEFINED_METRICS.find(m => m.id === 'predefined_cpa')!,
  PREDEFINED_METRICS.find(m => m.id === 'predefined_ticket_medio')!,
  PREDEFINED_METRICS.find(m => m.id === 'predefined_ctr_link')!,
  PREDEFINED_METRICS.find(m => m.id === 'predefined_frequencia')!,
]
