// Dados brutos que vêm do Meta Ads (via Pabbly ou Google Sheets)
export interface MetaAdsData {
  day: string                    // Day

  // ============================================
  // MÉTRICAS BÁSICAS
  // ============================================
  amountSpent: number            // Amount Spent (spend)
  reach: number                  // Reach
  impressions: number            // Impressions
  clicksAll: number              // Clicks (All)
  uniqueLinkClicks: number       // Unique Link Clicks

  // ============================================
  // CONVERSÕES (expandido)
  // ============================================
  purchases: number              // Purchases
  purchaseValue?: number         // NEW: Purchase Value (para ROAS)
  leads?: number                 // NEW: Leads (para CPL)
  addToCart?: number             // NEW: Add to Cart
  initiateCheckout?: number      // NEW: Initiate Checkout

  // ============================================
  // LANDING PAGE
  // ============================================
  landingPageViews?: number      // NEW: Landing Page Views
  costPerLandingPageView: number // Cost per Landing Page View

  // ============================================
  // VIDEO METRICS (novos - para Creative Analysis)
  // ============================================
  videoViews3s?: number          // NEW: 3-second video views (Hook Rate)
  videoThruPlays?: number        // NEW: ThruPlay (15s or complete)
  videoP25?: number              // NEW: 25% watched
  videoP50?: number              // NEW: 50% watched
  videoP75?: number              // NEW: 75% watched
  videoP100?: number             // NEW: 100% watched
  videoAvgWatchTime?: number     // NEW: Average watch time (seconds)

  // ============================================
  // MÉTRICAS CALCULADAS
  // ============================================
  frequency?: number             // NEW: Impressions / Reach (saturação)
  cpm: number                    // CPM
  ctrLink: number                // CTR (LINK)
  connectRate: number            // Connect Rate
  cpa: number                    // CPA
  cpc: number                    // CPC
  txConv: number                 // TX CONV

  // ============================================
  // MÉTRICAS DERIVADAS (calculadas no frontend)
  // ============================================
  roas?: number                  // NEW: ROAS = purchaseValue / amountSpent
  hookRate?: number              // NEW: Hook Rate = videoViews3s / impressions
  holdRate?: number              // NEW: Hold Rate = videoThruPlays / videoViews3s
  cpl?: number                   // NEW: CPL = amountSpent / leads
}

// Funil com seus dados
export interface Funnel {
  id: string
  name: string
  data: MetaAdsData[]
}

// Resposta da API
export interface ApiResponse {
  funnels: Funnel[]
  lastUpdated: string
}

// Totais consolidados de um funil (expandido)
export interface FunnelTotals {
  // Absolutos
  totalSpent: number
  totalReach: number
  totalImpressions: number
  totalClicks: number
  totalLinkClicks: number
  totalPurchases: number

  // Novos absolutos
  totalRevenue: number           // NEW: Sum of purchaseValue
  totalLeads: number             // NEW: Sum of leads
  totalAddToCart: number         // NEW: Sum of addToCart
  totalInitiateCheckout: number  // NEW: Sum of initiateCheckout
  totalLandingPageViews: number  // NEW: Sum of landingPageViews
  totalVideoViews3s: number      // NEW: Sum of videoViews3s
  totalVideoThruPlays: number    // NEW: Sum of videoThruPlays

  // Agregados (calculados dos totais)
  avgCpm: number
  avgCtr: number
  avgCpa: number
  avgCpc: number
  avgTxConv: number

  // Novos agregados
  avgRoas: number                // NEW: totalRevenue / totalSpent
  avgCpl: number                 // NEW: totalSpent / totalLeads
  avgFrequency: number           // NEW: totalImpressions / totalReach
  avgHookRate: number            // NEW: totalVideoViews3s / totalImpressions * 100
  avgHoldRate: number            // NEW: totalVideoThruPlays / totalVideoViews3s * 100
  avgLpViewRate: number          // NEW: totalLandingPageViews / totalLinkClicks * 100

  [key: string]: number // Permite métricas customizadas
}

// Métrica/Indicador personalizado
export interface CustomMetric {
  id: string
  name: string
  formula: string // Ex: "totalSpent / totalPurchases"
  format: 'currency' | 'percentage' | 'number' | 'decimal'
  description?: string
  color?: string
}

// Meta para uma métrica
export interface Goal {
  id: string
  metricKey: string // Qual métrica (pode ser padrão ou custom)
  metricName: string
  targetValue: number
  targetType: 'min' | 'max' // min = quanto menor melhor (CPA), max = quanto maior melhor (purchases)
  funnelId?: string // Se for específico de um funil, senão aplica a todos
}

// Configurações salvas do usuário
export interface DashboardConfig {
  customMetrics: CustomMetric[]
  goals: Goal[]
}

// ============================================
// METRICS DICTIONARY (Centralized Definition)
// ============================================
// Note: "avg" prefix metrics are actually AGGREGATED calculations
// (e.g., CPM = totalSpent/totalImpressions * 1000, not mean of daily CPMs)
// Kept "avg" naming for backward compatibility with existing formulas

export const METRICS_DICTIONARY = {
  // ============================================
  // ABSOLUTE TOTALS
  // ============================================
  totalSpent: {
    key: 'totalSpent',
    label: 'Total Investido',
    shortLabel: 'Investido',
    unit: 'currency',
    description: 'Soma de todo o valor investido no período',
    formula: 'SUM(amountSpent)',
    higherIsBetter: false,
  },
  totalReach: {
    key: 'totalReach',
    label: 'Alcance Total',
    shortLabel: 'Alcance',
    unit: 'number',
    description: 'Total de pessoas únicas alcançadas',
    formula: 'SUM(reach)',
    higherIsBetter: true,
  },
  totalImpressions: {
    key: 'totalImpressions',
    label: 'Impressões Totais',
    shortLabel: 'Impressões',
    unit: 'number',
    description: 'Total de vezes que os anúncios foram exibidos',
    formula: 'SUM(impressions)',
    higherIsBetter: true,
  },
  totalClicks: {
    key: 'totalClicks',
    label: 'Cliques Totais',
    shortLabel: 'Cliques',
    unit: 'number',
    description: 'Total de cliques em todos os elementos',
    formula: 'SUM(clicksAll)',
    higherIsBetter: true,
  },
  totalLinkClicks: {
    key: 'totalLinkClicks',
    label: 'Cliques no Link',
    shortLabel: 'Link Clicks',
    unit: 'number',
    description: 'Total de cliques únicos no link',
    formula: 'SUM(uniqueLinkClicks)',
    higherIsBetter: true,
  },
  totalPurchases: {
    key: 'totalPurchases',
    label: 'Compras Totais',
    shortLabel: 'Compras',
    unit: 'number',
    description: 'Total de conversões/compras',
    formula: 'SUM(purchases)',
    higherIsBetter: true,
  },
  // NEW: Revenue & Conversions
  totalRevenue: {
    key: 'totalRevenue',
    label: 'Receita Total',
    shortLabel: 'Receita',
    unit: 'currency',
    description: 'Soma do valor de todas as compras',
    formula: 'SUM(purchaseValue)',
    higherIsBetter: true,
  },
  totalLeads: {
    key: 'totalLeads',
    label: 'Leads Totais',
    shortLabel: 'Leads',
    unit: 'number',
    description: 'Total de leads gerados',
    formula: 'SUM(leads)',
    higherIsBetter: true,
  },
  totalLandingPageViews: {
    key: 'totalLandingPageViews',
    label: 'Views de LP',
    shortLabel: 'LP Views',
    unit: 'number',
    description: 'Total de visualizações da landing page',
    formula: 'SUM(landingPageViews)',
    higherIsBetter: true,
  },
  // NEW: Video Metrics
  totalVideoViews3s: {
    key: 'totalVideoViews3s',
    label: 'Views 3s',
    shortLabel: '3s Views',
    unit: 'number',
    description: 'Total de visualizações de vídeo com 3+ segundos',
    formula: 'SUM(videoViews3s)',
    higherIsBetter: true,
  },
  totalVideoThruPlays: {
    key: 'totalVideoThruPlays',
    label: 'ThruPlays',
    shortLabel: 'ThruPlays',
    unit: 'number',
    description: 'Total de visualizações completas ou 15s+',
    formula: 'SUM(videoThruPlays)',
    higherIsBetter: true,
  },
  // ============================================
  // AGGREGATED METRICS (calculated from totals)
  // ============================================
  avgCpm: {
    key: 'avgCpm',
    label: 'CPM',
    shortLabel: 'CPM',
    unit: 'currency',
    description: 'Custo por mil impressões = (totalSpent / totalImpressions) * 1000',
    formula: '(totalSpent / totalImpressions) * 1000',
    higherIsBetter: false,
  },
  avgCtr: {
    key: 'avgCtr',
    label: 'CTR',
    shortLabel: 'CTR',
    unit: 'percentage',
    description: 'Taxa de cliques = (totalLinkClicks / totalImpressions) * 100',
    formula: '(totalLinkClicks / totalImpressions) * 100',
    higherIsBetter: true,
  },
  avgCpa: {
    key: 'avgCpa',
    label: 'CPA',
    shortLabel: 'CPA',
    unit: 'currency',
    description: 'Custo por aquisição = totalSpent / totalPurchases',
    formula: 'totalSpent / totalPurchases',
    higherIsBetter: false,
  },
  avgCpc: {
    key: 'avgCpc',
    label: 'CPC',
    shortLabel: 'CPC',
    unit: 'currency',
    description: 'Custo por clique = totalSpent / totalClicks',
    formula: 'totalSpent / totalClicks',
    higherIsBetter: false,
  },
  avgTxConv: {
    key: 'avgTxConv',
    label: 'Taxa de Conversão',
    shortLabel: 'Tx Conv',
    unit: 'percentage',
    description: 'Taxa de conversão = (totalPurchases / totalLinkClicks) * 100',
    formula: '(totalPurchases / totalLinkClicks) * 100',
    higherIsBetter: true,
  },
  // NEW: Financial Metrics
  avgRoas: {
    key: 'avgRoas',
    label: 'ROAS',
    shortLabel: 'ROAS',
    unit: 'decimal',
    description: 'Retorno sobre investimento = totalRevenue / totalSpent',
    formula: 'totalRevenue / totalSpent',
    higherIsBetter: true,
  },
  avgCpl: {
    key: 'avgCpl',
    label: 'CPL',
    shortLabel: 'CPL',
    unit: 'currency',
    description: 'Custo por lead = totalSpent / totalLeads',
    formula: 'totalSpent / totalLeads',
    higherIsBetter: false,
  },
  // NEW: Saturation & Engagement
  avgFrequency: {
    key: 'avgFrequency',
    label: 'Frequência',
    shortLabel: 'Freq',
    unit: 'decimal',
    description: 'Média de vezes que cada pessoa viu o anúncio = totalImpressions / totalReach',
    formula: 'totalImpressions / totalReach',
    higherIsBetter: false, // Alta frequência = saturação
  },
  // NEW: Video Performance
  avgHookRate: {
    key: 'avgHookRate',
    label: 'Hook Rate',
    shortLabel: 'Hook',
    unit: 'percentage',
    description: 'Taxa de engajamento inicial = (totalVideoViews3s / totalImpressions) * 100',
    formula: '(totalVideoViews3s / totalImpressions) * 100',
    higherIsBetter: true,
  },
  avgHoldRate: {
    key: 'avgHoldRate',
    label: 'Hold Rate',
    shortLabel: 'Hold',
    unit: 'percentage',
    description: 'Taxa de retenção = (totalVideoThruPlays / totalVideoViews3s) * 100',
    formula: '(totalVideoThruPlays / totalVideoViews3s) * 100',
    higherIsBetter: true,
  },
  // NEW: Landing Page
  avgLpViewRate: {
    key: 'avgLpViewRate',
    label: 'Taxa LP View',
    shortLabel: 'LP Rate',
    unit: 'percentage',
    description: 'Taxa de visualização da LP = (totalLandingPageViews / totalLinkClicks) * 100',
    formula: '(totalLandingPageViews / totalLinkClicks) * 100',
    higherIsBetter: true,
  },
} as const

export type MetricKey = keyof typeof METRICS_DICTIONARY

// Variáveis disponíveis para fórmulas (backward compatible)
export const AVAILABLE_VARIABLES: Record<string, string> = Object.fromEntries(
  Object.entries(METRICS_DICTIONARY).map(([key, metric]) => [key, metric.label])
)
