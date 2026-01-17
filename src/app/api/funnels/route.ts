import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// ============================================
// VALIDATION SCHEMAS
// ============================================

const FilterRuleSchema = z.object({
  field: z.enum([
    'campaign_name',
    'campaign_id',
    'adset_name',
    'adset_id',
    'ad_name',
    'ad_id',
  ]),
  operator: z.enum([
    'contains',
    'not_contains',
    'starts_with',
    'ends_with',
    'equals',
    'not_equals',
    'regex',
  ]),
  value: z.string().min(1),
  caseSensitive: z.boolean().optional(),
})

const FilterGroupSchema = z.object({
  logic: z.enum(['AND', 'OR']),
  rules: z.array(FilterRuleSchema),
})

const FunnelConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  conversionMetric: z.enum(['purchases', 'registrations', 'leads']).optional(),
  rules: z.union([z.array(FilterRuleSchema), FilterGroupSchema]),
})

// ============================================
// GET - Listar todos os funis
// ============================================

export async function GET() {
  try {
    const funnels = await prisma.funnelConfig.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json({
      funnels: funnels.map(f => ({
        ...f,
        rules: f.rules,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching funnels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funnels' },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Criar novo funil
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = FunnelConfigSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid funnel configuration', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, description, color, order, isActive, conversionMetric, rules } = validation.data

    // Get max order if not provided
    let finalOrder = order
    if (finalOrder === undefined) {
      const maxOrder = await prisma.funnelConfig.aggregate({
        _max: { order: true },
      })
      finalOrder = (maxOrder._max.order ?? -1) + 1
    }

    const funnel = await prisma.funnelConfig.create({
      data: {
        name,
        description,
        color,
        order: finalOrder,
        isActive: isActive ?? true,
        conversionMetric: conversionMetric ?? 'purchases',
        rules: rules as object,
      },
    })

    return NextResponse.json({
      funnel: {
        ...funnel,
        createdAt: funnel.createdAt.toISOString(),
        updatedAt: funnel.updatedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating funnel:', error)
    return NextResponse.json(
      { error: 'Failed to create funnel' },
      { status: 500 }
    )
  }
}
