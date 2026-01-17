import { FilterRule, FilterOperator } from '@/types/funnel'

/**
 * Aplica uma regra de filtro a um valor
 */
function applyRule(value: string, rule: FilterRule): boolean {
  const compareValue = rule.caseSensitive ? value : value.toLowerCase()
  const ruleValue = rule.caseSensitive ? rule.value : rule.value.toLowerCase()

  switch (rule.operator) {
    case 'contains':
      return compareValue.includes(ruleValue)

    case 'not_contains':
      return !compareValue.includes(ruleValue)

    case 'starts_with':
      return compareValue.startsWith(ruleValue)

    case 'ends_with':
      return compareValue.endsWith(ruleValue)

    case 'equals':
      return compareValue === ruleValue

    case 'not_equals':
      return compareValue !== ruleValue

    case 'regex':
      try {
        const regex = new RegExp(rule.value, rule.caseSensitive ? '' : 'i')
        return regex.test(value)
      } catch {
        return false
      }

    default:
      return false
  }
}

/**
 * Interface para os dados que serão filtrados
 */
interface FilterableData {
  campaignName?: string
  campaignId?: string
  adSetName?: string
  adSetId?: string
  adName?: string
  adId?: string
}

/**
 * Extrai o valor do campo para filtro
 */
function getFieldValue(data: FilterableData, field: FilterRule['field']): string {
  switch (field) {
    case 'campaign_name':
      return data.campaignName || ''
    case 'campaign_id':
      return data.campaignId || ''
    case 'adset_name':
      return data.adSetName || ''
    case 'adset_id':
      return data.adSetId || ''
    case 'ad_name':
      return data.adName || ''
    case 'ad_id':
      return data.adId || ''
    default:
      return ''
  }
}

/**
 * Verifica se um item passa por todas as regras de filtro (lógica AND)
 */
export function matchesAllRules(data: FilterableData, rules: FilterRule[]): boolean {
  if (!rules || rules.length === 0) {
    return true
  }

  return rules.every((rule) => {
    const value = getFieldValue(data, rule.field)
    return applyRule(value, rule)
  })
}

/**
 * Verifica se um item passa por pelo menos uma regra de filtro (lógica OR)
 */
export function matchesAnyRule(data: FilterableData, rules: FilterRule[]): boolean {
  if (!rules || rules.length === 0) {
    return true
  }

  return rules.some((rule) => {
    const value = getFieldValue(data, rule.field)
    return applyRule(value, rule)
  })
}

/**
 * Gera condições SQL/Prisma a partir das regras de filtro
 */
export function rulesToPrismaConditions(rules: FilterRule[]): object[] {
  if (!rules || rules.length === 0) {
    return []
  }

  return rules.map((rule) => {
    const fieldMap: Record<string, string> = {
      campaign_name: 'campaign.name',
      campaign_id: 'campaign.metaCampaignId',
      adset_name: 'adSet.name',
      adset_id: 'adSet.metaAdSetId',
      ad_name: 'ad.name',
      ad_id: 'ad.metaAdId',
    }

    const prismaField = fieldMap[rule.field]
    if (!prismaField) return {}

    // Determinar o modo de comparação
    const mode = rule.caseSensitive ? undefined : 'insensitive'

    // Separar o path (ex: campaign.name -> { campaign: { name: ... } })
    const [relation, field] = prismaField.split('.')

    const buildCondition = (operator: FilterOperator, value: string) => {
      switch (operator) {
        case 'contains':
          return { [field]: { contains: value, mode } }
        case 'not_contains':
          return { NOT: { [field]: { contains: value, mode } } }
        case 'starts_with':
          return { [field]: { startsWith: value, mode } }
        case 'ends_with':
          return { [field]: { endsWith: value, mode } }
        case 'equals':
          return { [field]: { equals: value, mode } }
        case 'not_equals':
          return { NOT: { [field]: { equals: value, mode } } }
        case 'regex':
          // Prisma não suporta regex diretamente, usar contains como fallback
          return { [field]: { contains: value, mode } }
        default:
          return {}
      }
    }

    return { [relation]: buildCondition(rule.operator, rule.value) }
  })
}
