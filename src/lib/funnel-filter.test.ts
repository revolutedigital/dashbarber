import { describe, it, expect } from 'vitest'
import { matchesAllRules, matchesAnyRule, rulesToPrismaConditions } from './funnel-filter'
import { FilterRule } from '@/types/funnel'

describe('funnel-filter', () => {
  describe('matchesAllRules', () => {
    it('should return true for empty rules', () => {
      expect(matchesAllRules({}, [])).toBe(true)
      expect(matchesAllRules({}, undefined as unknown as FilterRule[])).toBe(true)
    })

    describe('contains operator', () => {
      it('should match when value contains text', () => {
        const data = { campaignName: 'Black Friday Sale 2026' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'contains', value: 'Friday' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should not match when value does not contain text', () => {
        const data = { campaignName: 'Summer Sale' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'contains', value: 'Winter' }
        ]

        expect(matchesAllRules(data, rules)).toBe(false)
      })

      it('should be case insensitive by default', () => {
        const data = { campaignName: 'Black Friday' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'contains', value: 'BLACK' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should respect caseSensitive flag', () => {
        const data = { campaignName: 'Black Friday' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'contains', value: 'BLACK', caseSensitive: true }
        ]

        expect(matchesAllRules(data, rules)).toBe(false)
      })
    })

    describe('not_contains operator', () => {
      it('should match when value does not contain text', () => {
        const data = { campaignName: 'Summer Sale' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'not_contains', value: 'Winter' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should not match when value contains text', () => {
        const data = { campaignName: 'Summer Sale' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'not_contains', value: 'Summer' }
        ]

        expect(matchesAllRules(data, rules)).toBe(false)
      })
    })

    describe('starts_with operator', () => {
      it('should match when value starts with text', () => {
        const data = { campaignName: 'BF2026 - Black Friday' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'starts_with', value: 'BF' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should not match when value does not start with text', () => {
        const data = { campaignName: 'Black Friday BF2026' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'starts_with', value: 'BF' }
        ]

        expect(matchesAllRules(data, rules)).toBe(false)
      })
    })

    describe('ends_with operator', () => {
      it('should match when value ends with text', () => {
        const data = { campaignName: 'Campaign - ACTIVE' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'ends_with', value: 'active' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should not match when value does not end with text', () => {
        const data = { campaignName: 'ACTIVE - Campaign' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'ends_with', value: 'active' }
        ]

        expect(matchesAllRules(data, rules)).toBe(false)
      })
    })

    describe('equals operator', () => {
      it('should match when value exactly equals text', () => {
        const data = { campaignId: '12345' }
        const rules: FilterRule[] = [
          { field: 'campaign_id', operator: 'equals', value: '12345' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should not match when value does not exactly equal text', () => {
        const data = { campaignId: '12345' }
        const rules: FilterRule[] = [
          { field: 'campaign_id', operator: 'equals', value: '1234' }
        ]

        expect(matchesAllRules(data, rules)).toBe(false)
      })
    })

    describe('not_equals operator', () => {
      it('should match when value does not equal text', () => {
        const data = { campaignId: '12345' }
        const rules: FilterRule[] = [
          { field: 'campaign_id', operator: 'not_equals', value: '99999' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should not match when value equals text', () => {
        const data = { campaignId: '12345' }
        const rules: FilterRule[] = [
          { field: 'campaign_id', operator: 'not_equals', value: '12345' }
        ]

        expect(matchesAllRules(data, rules)).toBe(false)
      })
    })

    describe('regex operator', () => {
      it('should match valid regex pattern', () => {
        const data = { campaignName: 'BF2026-001' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'regex', value: 'BF\\d{4}-\\d{3}' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should not match invalid regex pattern', () => {
        const data = { campaignName: 'Test Campaign' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'regex', value: 'BF\\d{4}' }
        ]

        expect(matchesAllRules(data, rules)).toBe(false)
      })

      it('should handle invalid regex gracefully', () => {
        const data = { campaignName: 'Test' }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'regex', value: '[invalid' }
        ]

        expect(matchesAllRules(data, rules)).toBe(false)
      })
    })

    describe('multiple rules (AND logic)', () => {
      it('should match when all rules pass', () => {
        const data = {
          campaignName: 'BF2026 Black Friday',
          adSetName: 'Retargeting'
        }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'contains', value: 'BF' },
          { field: 'adset_name', operator: 'contains', value: 'Retargeting' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should not match when any rule fails', () => {
        const data = {
          campaignName: 'BF2026 Black Friday',
          adSetName: 'Prospecting'
        }
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'contains', value: 'BF' },
          { field: 'adset_name', operator: 'contains', value: 'Retargeting' }
        ]

        expect(matchesAllRules(data, rules)).toBe(false)
      })
    })

    describe('different fields', () => {
      it('should filter by adSetName', () => {
        const data = { adSetName: 'Retargeting 180d' }
        const rules: FilterRule[] = [
          { field: 'adset_name', operator: 'contains', value: 'Retargeting' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should filter by adSetId', () => {
        const data = { adSetId: '789456' }
        const rules: FilterRule[] = [
          { field: 'adset_id', operator: 'equals', value: '789456' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should filter by adName', () => {
        const data = { adName: 'Creative v2' }
        const rules: FilterRule[] = [
          { field: 'ad_name', operator: 'starts_with', value: 'Creative' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should filter by adId', () => {
        const data = { adId: '123abc' }
        const rules: FilterRule[] = [
          { field: 'ad_id', operator: 'equals', value: '123abc' }
        ]

        expect(matchesAllRules(data, rules)).toBe(true)
      })

      it('should handle missing field', () => {
        const data = {} // No campaignName
        const rules: FilterRule[] = [
          { field: 'campaign_name', operator: 'contains', value: 'Test' }
        ]

        expect(matchesAllRules(data, rules)).toBe(false)
      })
    })
  })

  describe('matchesAnyRule', () => {
    it('should return true for empty rules', () => {
      expect(matchesAnyRule({}, [])).toBe(true)
    })

    it('should match when at least one rule passes (OR logic)', () => {
      const data = {
        campaignName: 'Summer Sale',
        adSetName: 'Retargeting'
      }
      const rules: FilterRule[] = [
        { field: 'campaign_name', operator: 'contains', value: 'Winter' },
        { field: 'adset_name', operator: 'contains', value: 'Retargeting' }
      ]

      expect(matchesAnyRule(data, rules)).toBe(true)
    })

    it('should not match when all rules fail', () => {
      const data = {
        campaignName: 'Summer Sale',
        adSetName: 'Prospecting'
      }
      const rules: FilterRule[] = [
        { field: 'campaign_name', operator: 'contains', value: 'Winter' },
        { field: 'adset_name', operator: 'contains', value: 'Retargeting' }
      ]

      expect(matchesAnyRule(data, rules)).toBe(false)
    })

    it('should match when single rule passes', () => {
      const data = { campaignName: 'Black Friday' }
      const rules: FilterRule[] = [
        { field: 'campaign_name', operator: 'contains', value: 'Friday' }
      ]

      expect(matchesAnyRule(data, rules)).toBe(true)
    })
  })

  describe('rulesToPrismaConditions', () => {
    it('should return empty array for empty rules', () => {
      expect(rulesToPrismaConditions([])).toEqual([])
      expect(rulesToPrismaConditions(undefined as unknown as FilterRule[])).toEqual([])
    })

    it('should generate contains condition', () => {
      const rules: FilterRule[] = [
        { field: 'campaign_name', operator: 'contains', value: 'Test' }
      ]

      const conditions = rulesToPrismaConditions(rules)
      expect(conditions[0]).toEqual({
        campaign: { name: { contains: 'Test', mode: 'insensitive' } }
      })
    })

    it('should generate not_contains condition', () => {
      const rules: FilterRule[] = [
        { field: 'campaign_name', operator: 'not_contains', value: 'Draft' }
      ]

      const conditions = rulesToPrismaConditions(rules)
      expect(conditions[0]).toEqual({
        campaign: { NOT: { name: { contains: 'Draft', mode: 'insensitive' } } }
      })
    })

    it('should generate startsWith condition', () => {
      const rules: FilterRule[] = [
        { field: 'adset_name', operator: 'starts_with', value: 'RT' }
      ]

      const conditions = rulesToPrismaConditions(rules)
      expect(conditions[0]).toEqual({
        adSet: { name: { startsWith: 'RT', mode: 'insensitive' } }
      })
    })

    it('should generate endsWith condition', () => {
      const rules: FilterRule[] = [
        { field: 'ad_name', operator: 'ends_with', value: '_v2' }
      ]

      const conditions = rulesToPrismaConditions(rules)
      expect(conditions[0]).toEqual({
        ad: { name: { endsWith: '_v2', mode: 'insensitive' } }
      })
    })

    it('should generate equals condition', () => {
      const rules: FilterRule[] = [
        { field: 'campaign_id', operator: 'equals', value: '12345' }
      ]

      const conditions = rulesToPrismaConditions(rules)
      expect(conditions[0]).toEqual({
        campaign: { metaCampaignId: { equals: '12345', mode: 'insensitive' } }
      })
    })

    it('should respect caseSensitive flag', () => {
      const rules: FilterRule[] = [
        { field: 'campaign_name', operator: 'contains', value: 'Test', caseSensitive: true }
      ]

      const conditions = rulesToPrismaConditions(rules)
      expect(conditions[0]).toEqual({
        campaign: { name: { contains: 'Test', mode: undefined } }
      })
    })

    it('should handle unknown operator', () => {
      const rules: FilterRule[] = [
        { field: 'campaign_name', operator: 'unknown' as any, value: 'Test' }
      ]

      const conditions = rulesToPrismaConditions(rules)
      expect(conditions[0]).toEqual({ campaign: {} })
    })

    it('should handle unknown field', () => {
      const rules: FilterRule[] = [
        { field: 'unknown_field' as any, operator: 'contains', value: 'Test' }
      ]

      const conditions = rulesToPrismaConditions(rules)
      expect(conditions[0]).toEqual({})
    })
  })
})
