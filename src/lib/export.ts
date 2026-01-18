import { MetaAdsData, FunnelTotals } from '@/types/metrics'

export function exportToCSV(data: MetaAdsData[], filename: string = 'dados-dashboard') {
  const headers = [
    'Dia',
    'Investimento (R$)',
    'Alcance',
    'Impressoes',
    'Cliques Totais',
    'Cliques no Link',
    'Custo por Visualizacao',
    'Compras',
    'CPM',
    'CTR (%)',
    'Taxa de Conexao (%)',
    'CPA',
    'CPC',
    'Taxa de Conversao (%)',
  ]

  const rows = data.map(d => [
    d.day,
    d.amountSpent.toFixed(2),
    d.reach.toString(),
    d.impressions.toString(),
    d.clicksAll.toString(),
    d.uniqueLinkClicks.toString(),
    d.costPerLandingPageView.toFixed(2),
    d.purchases.toString(),
    d.cpm.toFixed(2),
    (d.ctrLink * 100).toFixed(2),
    d.connectRate.toFixed(2),
    d.cpa.toFixed(2),
    d.cpc.toFixed(2),
    (d.txConv * 100).toFixed(2),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

export function exportTotalsToCSV(totals: FunnelTotals, filename: string = 'totais-dashboard') {
  const headers = ['Metrica', 'Valor']
  const rows = [
    ['Investimento Total (R$)', totals.amountSpent.toFixed(2)],
    ['Alcance Total', totals.reach.toString()],
    ['Impressoes Totais', totals.impressions.toString()],
    ['Cliques Totais', totals.clicksAll.toString()],
    ['Cliques no Link', totals.uniqueLinkClicks.toString()],
    ['Compras Totais', totals.purchases.toString()],
    ['CPM Medio', totals.cpm.toFixed(2)],
    ['CTR Medio (%)', (totals.ctrLink * 100).toFixed(2)],
    ['CPA Medio', totals.cpa.toFixed(2)],
    ['CPC Medio', totals.cpc.toFixed(2)],
    ['Taxa de Conversao Media (%)', (totals.txConv * 100).toFixed(2)],
    ['ROAS', totals.roas.toFixed(2)],
  ]

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
