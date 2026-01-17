import { MetaAdsData, FunnelTotals } from '@/types/metrics'

// Função auxiliar para divisão segura (evita divisão por zero)
function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return numerator / denominator
}

/**
 * Calcula totais de um funil usando fórmulas agregadas corretas
 *
 * IMPORTANTE: Métricas como CPM, CTR e Taxa de Conversão devem ser
 * calculadas a partir dos totais agregados, NÃO como média simples.
 *
 * Fórmulas:
 * - CPM = (Total Investido / Total Impressões) * 1000
 * - CTR = (Total Cliques Link / Total Impressões) * 100
 * - CPA = Total Investido / Total Compras
 * - CPC = Total Investido / Total Cliques
 * - Taxa de Conversão = (Total Compras / Total Cliques Link) * 100
 * - ROAS = Total Receita / Total Investido
 * - CPL = Total Investido / Total Leads
 * - Frequency = Total Impressões / Total Alcance
 * - Hook Rate = (Total Video 3s / Total Impressões) * 100
 * - Hold Rate = (Total ThruPlays / Total Video 3s) * 100
 * - LP View Rate = (Total LP Views / Total Link Clicks) * 100
 */
export function calculateFunnelTotals(data: MetaAdsData[]): FunnelTotals {
  const validData = data.filter(d => d.amountSpent > 0)

  // Soma todos os valores absolutos (incluindo novos campos)
  const totals = validData.reduce(
    (acc, item) => ({
      // Existentes
      totalSpent: acc.totalSpent + item.amountSpent,
      totalReach: acc.totalReach + item.reach,
      totalImpressions: acc.totalImpressions + item.impressions,
      totalClicks: acc.totalClicks + item.clicksAll,
      totalLinkClicks: acc.totalLinkClicks + item.uniqueLinkClicks,
      totalPurchases: acc.totalPurchases + item.purchases,
      // Novos
      totalRevenue: acc.totalRevenue + (item.purchaseValue || 0),
      totalLeads: acc.totalLeads + (item.leads || 0),
      totalAddToCart: acc.totalAddToCart + (item.addToCart || 0),
      totalInitiateCheckout: acc.totalInitiateCheckout + (item.initiateCheckout || 0),
      totalLandingPageViews: acc.totalLandingPageViews + (item.landingPageViews || 0),
      totalVideoViews3s: acc.totalVideoViews3s + (item.videoViews3s || 0),
      totalVideoThruPlays: acc.totalVideoThruPlays + (item.videoThruPlays || 0),
    }),
    {
      totalSpent: 0,
      totalReach: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalLinkClicks: 0,
      totalPurchases: 0,
      totalRevenue: 0,
      totalLeads: 0,
      totalAddToCart: 0,
      totalInitiateCheckout: 0,
      totalLandingPageViews: 0,
      totalVideoViews3s: 0,
      totalVideoThruPlays: 0,
    }
  )

  // Calcula as métricas derivadas a partir dos totais agregados
  return {
    // Absolutos existentes
    totalSpent: totals.totalSpent,
    totalReach: totals.totalReach,
    totalImpressions: totals.totalImpressions,
    totalClicks: totals.totalClicks,
    totalLinkClicks: totals.totalLinkClicks,
    totalPurchases: totals.totalPurchases,

    // Novos absolutos
    totalRevenue: totals.totalRevenue,
    totalLeads: totals.totalLeads,
    totalAddToCart: totals.totalAddToCart,
    totalInitiateCheckout: totals.totalInitiateCheckout,
    totalLandingPageViews: totals.totalLandingPageViews,
    totalVideoViews3s: totals.totalVideoViews3s,
    totalVideoThruPlays: totals.totalVideoThruPlays,

    // Agregados existentes
    avgCpm: safeDivide(totals.totalSpent, totals.totalImpressions) * 1000,
    avgCtr: safeDivide(totals.totalLinkClicks, totals.totalImpressions) * 100,
    avgCpa: safeDivide(totals.totalSpent, totals.totalPurchases),
    avgCpc: safeDivide(totals.totalSpent, totals.totalClicks),
    avgTxConv: safeDivide(totals.totalPurchases, totals.totalLinkClicks) * 100,

    // Novos agregados
    avgRoas: safeDivide(totals.totalRevenue, totals.totalSpent),
    avgCpl: safeDivide(totals.totalSpent, totals.totalLeads),
    avgFrequency: safeDivide(totals.totalImpressions, totals.totalReach),
    avgHookRate: safeDivide(totals.totalVideoViews3s, totals.totalImpressions) * 100,
    avgHoldRate: safeDivide(totals.totalVideoThruPlays, totals.totalVideoViews3s) * 100,
    avgLpViewRate: safeDivide(totals.totalLandingPageViews, totals.totalLinkClicks) * 100,
  }
}

// Consolida dados de múltiplos funis
export function consolidateFunnels(funnelsData: MetaAdsData[][]): MetaAdsData[] {
  const allData: MetaAdsData[] = []
  funnelsData.forEach(funnel => {
    allData.push(...funnel)
  })
  return allData
}

// Formata valores para exibição
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatCompact(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return formatNumber(value)
}

export function formatDecimal(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

export function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`
}

export function formatFrequency(value: number): string {
  return value.toFixed(2)
}
