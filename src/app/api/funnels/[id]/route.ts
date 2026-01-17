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

const FunnelUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  rules: z.union([z.array(FilterRuleSchema), FilterGroupSchema]).optional(),
})

// ============================================
// GET - Buscar funil específico
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const funnel = await prisma.funnelConfig.findUnique({
      where: { id },
    })

    if (!funnel) {
      return NextResponse.json(
        { error: 'Funnel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      funnel: {
        ...funnel,
        createdAt: funnel.createdAt.toISOString(),
        updatedAt: funnel.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching funnel:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funnel' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Atualizar funil
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validation = FunnelUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid funnel configuration', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, description, color, order, isActive, rules } = validation.data

    const funnel = await prisma.funnelConfig.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
        ...(rules !== undefined && { rules: rules as object }),
      },
    })

    return NextResponse.json({
      funnel: {
        ...funnel,
        createdAt: funnel.createdAt.toISOString(),
        updatedAt: funnel.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error updating funnel:', error)
    return NextResponse.json(
      { error: 'Failed to update funnel' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Remover funil
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.funnelConfig.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting funnel:', error)
    return NextResponse.json(
      { error: 'Failed to delete funnel' },
      { status: 500 }
    )
  }
}
