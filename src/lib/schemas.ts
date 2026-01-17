import { z } from 'zod'

// ============================================
// DATE VALIDATION
// ============================================
const datePattern = /^(\d{1,2}\/\d{1,2}(\/\d{2,4})?|\d{4}-\d{2}-\d{2})$/

// ============================================
// MAX REASONABLE VALUES (prevent overflow/garbage data)
// ============================================
const MAX_IMPRESSIONS = 999_999_999
const MAX_CLICKS = 999_999_999
const MAX_AMOUNT = 999_999_999
const MAX_PERCENTAGE = 100

// ============================================
// SCHEMA: Meta Ads Data with Enterprise Validations
// ============================================
export const MetaAdsDataSchema = z.object({
  // Date with format validation
  day: z.string()
    .regex(datePattern, 'Invalid date format. Expected DD/MM, DD/MM/YY, or YYYY-MM-DD'),

  // Monetary values with reasonable limits
  amountSpent: z.number()
    .nonnegative('amountSpent must be >= 0')
    .max(MAX_AMOUNT, `amountSpent exceeds maximum (${MAX_AMOUNT})`),

  // Reach/Impressions with logical validation
  reach: z.number()
    .nonnegative('reach must be >= 0')
    .max(MAX_IMPRESSIONS, `reach exceeds maximum`),

  impressions: z.number()
    .nonnegative('impressions must be >= 0')
    .max(MAX_IMPRESSIONS, `impressions exceeds maximum`),

  // Clicks with limits
  clicksAll: z.number()
    .nonnegative('clicksAll must be >= 0')
    .max(MAX_CLICKS, `clicksAll exceeds maximum`),

  uniqueLinkClicks: z.number()
    .nonnegative('uniqueLinkClicks must be >= 0')
    .max(MAX_CLICKS, `uniqueLinkClicks exceeds maximum`),

  costPerLandingPageView: z.number()
    .nonnegative('costPerLandingPageView must be >= 0')
    .max(MAX_AMOUNT, `costPerLandingPageView exceeds maximum`),

  // Conversions
  purchases: z.number()
    .nonnegative('purchases must be >= 0')
    .max(MAX_CLICKS, `purchases exceeds maximum`),

  // Calculated metrics with reasonable ranges
  cpm: z.number()
    .nonnegative('cpm must be >= 0')
    .max(MAX_AMOUNT, `cpm exceeds maximum`),

  ctrLink: z.number()
    .nonnegative('ctrLink must be >= 0')
    .max(MAX_PERCENTAGE, `ctrLink cannot exceed 100%`),

  connectRate: z.number()
    .nonnegative('connectRate must be >= 0')
    .max(MAX_PERCENTAGE, `connectRate cannot exceed 100%`),

  cpa: z.number()
    .nonnegative('cpa must be >= 0')
    .max(MAX_AMOUNT, `cpa exceeds maximum`),

  cpc: z.number()
    .nonnegative('cpc must be >= 0')
    .max(MAX_AMOUNT, `cpc exceeds maximum`),

  txConv: z.number()
    .nonnegative('txConv must be >= 0')
    .max(MAX_PERCENTAGE, `txConv cannot exceed 100%`),
})
  // Cross-field validations (logical constraints)
  .refine(
    (data) => data.reach <= data.impressions || data.impressions === 0,
    { message: 'reach cannot exceed impressions', path: ['reach'] }
  )
  .refine(
    (data) => data.clicksAll <= data.impressions || data.impressions === 0,
    { message: 'clicksAll cannot exceed impressions', path: ['clicksAll'] }
  )
  .refine(
    (data) => data.uniqueLinkClicks <= data.clicksAll || data.clicksAll === 0,
    { message: 'uniqueLinkClicks cannot exceed clicksAll', path: ['uniqueLinkClicks'] }
  )

// Schema para um funil
export const FunnelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  data: z.array(MetaAdsDataSchema),
})

// Schema para resposta da API do Google Sheets
export const ApiResponseSchema = z.object({
  funnels: z.array(FunnelSchema),
  lastUpdated: z.string(),
})

// Schema para métricas customizadas
export const CustomMetricSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  formula: z.string().min(1).max(500),
  format: z.enum(['currency', 'percentage', 'number', 'decimal']),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

// Schema para metas
export const GoalSchema = z.object({
  id: z.string().min(1),
  metricKey: z.string().min(1),
  metricName: z.string().min(1),
  targetValue: z.number().positive(),
  targetType: z.enum(['min', 'max']),
  funnelId: z.string().optional(),
})

// ============================================
// VERSIONED CONFIG SCHEMA (for localStorage migration)
// ============================================
export const CONFIG_VERSION = 2

export const DashboardConfigSchema = z.object({
  version: z.number().default(CONFIG_VERSION),
  customMetrics: z.array(CustomMetricSchema),
  goals: z.array(GoalSchema),
})

// Tipos inferidos dos schemas
export type ValidatedMetaAdsData = z.infer<typeof MetaAdsDataSchema>
export type ValidatedFunnel = z.infer<typeof FunnelSchema>
export type ValidatedApiResponse = z.infer<typeof ApiResponseSchema>
export type ValidatedCustomMetric = z.infer<typeof CustomMetricSchema>
export type ValidatedGoal = z.infer<typeof GoalSchema>
export type ValidatedDashboardConfig = z.infer<typeof DashboardConfigSchema>
