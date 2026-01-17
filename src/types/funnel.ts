// Tipos para configuração de funis customizados

// Campos disponíveis para filtro
export type FilterField =
  | 'campaign_name'
  | 'campaign_id'
  | 'adset_name'
  | 'adset_id'
  | 'ad_name'
  | 'ad_id'

// Operadores de comparação
export type FilterOperator =
  | 'contains'      // contém
  | 'not_contains'  // não contém
  | 'starts_with'   // começa com
  | 'ends_with'     // termina com
  | 'equals'        // igual a
  | 'not_equals'    // diferente de
  | 'regex'         // expressão regular

// Regra individual de filtro
export interface FilterRule {
  field: FilterField
  operator: FilterOperator
  value: string
  caseSensitive?: boolean // default: false
}

// Condição lógica entre regras
export type LogicOperator = 'AND' | 'OR'

// Grupo de regras (para lógica complexa)
export interface FilterGroup {
  logic: LogicOperator
  rules: FilterRule[]
}

// Tipos de conversão disponíveis
export type ConversionMetric = 'purchases' | 'registrations' | 'leads'

// Configuração completa de um funil
export interface FunnelConfig {
  id: string
  name: string
  description?: string
  color?: string
  order: number
  isActive: boolean
  conversionMetric: ConversionMetric
  rules: FilterRule[] | FilterGroup
  createdAt: string
  updatedAt: string
}

// Payload para criar/atualizar funil
export interface FunnelConfigInput {
  name: string
  description?: string
  color?: string
  order?: number
  isActive?: boolean
  conversionMetric?: ConversionMetric
  rules: FilterRule[] | FilterGroup
}

// Labels para UI
export const FILTER_FIELD_LABELS: Record<FilterField, string> = {
  campaign_name: 'Nome da Campanha',
  campaign_id: 'ID da Campanha',
  adset_name: 'Nome do Conjunto',
  adset_id: 'ID do Conjunto',
  ad_name: 'Nome do Anúncio',
  ad_id: 'ID do Anúncio',
}

export const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  contains: 'Contém',
  not_contains: 'Não contém',
  starts_with: 'Começa com',
  ends_with: 'Termina com',
  equals: 'É igual a',
  not_equals: 'É diferente de',
  regex: 'Corresponde a (regex)',
}

// Cores predefinidas para funis
export const FUNNEL_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]
