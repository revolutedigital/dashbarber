'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import {
  FilterRule,
  FilterField,
  FilterOperator,
  FILTER_FIELD_LABELS,
  FILTER_OPERATOR_LABELS,
  FUNNEL_COLORS,
  FunnelConfig,
} from '@/types/funnel'

// Tipos de conversão disponíveis
const CONVERSION_METRICS = {
  purchases: 'Compras',
  registrations: 'Registro Concluído',
  leads: 'Leads',
} as const

type ConversionMetric = keyof typeof CONVERSION_METRICS

interface CreateFunnelModalProps {
  open: boolean
  onClose: () => void
  onSave: (funnel: {
    name: string
    description?: string
    color?: string
    conversionMetric: string
    rules: FilterRule[]
  }) => void
  editingFunnel?: FunnelConfig | null
}

const DEFAULT_RULE: FilterRule = {
  field: 'campaign_name',
  operator: 'contains',
  value: '',
}

export function CreateFunnelModal({
  open,
  onClose,
  onSave,
  editingFunnel,
}: CreateFunnelModalProps) {
  const [name, setName] = useState(editingFunnel?.name || '')
  const [description, setDescription] = useState(editingFunnel?.description || '')
  const [color, setColor] = useState(editingFunnel?.color || FUNNEL_COLORS[0])
  const [conversionMetric, setConversionMetric] = useState<ConversionMetric>(
    (editingFunnel?.conversionMetric as ConversionMetric) || 'purchases'
  )
  const [rules, setRules] = useState<FilterRule[]>(
    editingFunnel?.rules && Array.isArray(editingFunnel.rules)
      ? editingFunnel.rules
      : [{ ...DEFAULT_RULE }]
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!open) return null

  const handleAddRule = () => {
    setRules([...rules, { ...DEFAULT_RULE }])
  }

  const handleRemoveRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index))
    }
  }

  const handleRuleChange = (
    index: number,
    field: keyof FilterRule,
    value: string | boolean
  ) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], [field]: value }
    setRules(newRules)

    // Clear error for this rule
    if (errors[`rule_${index}`]) {
      const newErrors = { ...errors }
      delete newErrors[`rule_${index}`]
      setErrors(newErrors)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    rules.forEach((rule, index) => {
      if (!rule.value.trim()) {
        newErrors[`rule_${index}`] = 'Valor é obrigatório'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      conversionMetric,
      rules,
    })

    // Reset form
    setName('')
    setDescription('')
    setColor(FUNNEL_COLORS[0])
    setConversionMetric('purchases')
    setRules([{ ...DEFAULT_RULE }])
    setErrors({})
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-card border border-border rounded-xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {editingFunnel ? 'Editar Funil' : 'Novo Funil'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome do Funil *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: VSL Produto Principal"
              className={`w-full px-4 py-2.5 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.name ? 'border-red-500' : 'border-border'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Campanhas do VSL de lançamento"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Cor */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Cor de identificação
            </label>
            <div className="flex gap-2 flex-wrap">
              {FUNNEL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Métrica de Conversão */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Métrica de Conversão Principal *
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Qual ação conta como conversão neste funil?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(CONVERSION_METRICS) as [ConversionMetric, string][]).map(
                ([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setConversionMetric(key)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      conversionMetric === key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Regras de Filtro */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">
                Regras de Filtro
              </label>
              <span className="text-xs text-muted-foreground">
                Campanhas que correspondem a TODAS as regras
              </span>
            </div>

            <div className="space-y-3">
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg"
                >
                  {/* Campo */}
                  <select
                    value={rule.field}
                    onChange={(e) =>
                      handleRuleChange(index, 'field', e.target.value as FilterField)
                    }
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {Object.entries(FILTER_FIELD_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>

                  {/* Operador */}
                  <select
                    value={rule.operator}
                    onChange={(e) =>
                      handleRuleChange(index, 'operator', e.target.value as FilterOperator)
                    }
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {Object.entries(FILTER_OPERATOR_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>

                  {/* Valor */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) =>
                        handleRuleChange(index, 'value', e.target.value)
                      }
                      placeholder="Digite o valor..."
                      className={`w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        errors[`rule_${index}`] ? 'border-red-500' : 'border-border'
                      }`}
                    />
                    {errors[`rule_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`rule_${index}`]}
                      </p>
                    )}
                  </div>

                  {/* Remover */}
                  {rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(index)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Adicionar Regra */}
            <button
              type="button"
              onClick={handleAddRule}
              className="mt-3 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar regra
            </button>
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <p className="text-sm">
              <span
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: color }}
              />
              <strong>{name || 'Nome do funil'}</strong>
              <span className="text-muted-foreground"> • </span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                {CONVERSION_METRICS[conversionMetric]}
              </span>
            </p>
            <p className="text-sm mt-2">
              {rules.map((rule, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-muted-foreground"> E </span>}
                  <code className="bg-background px-1.5 py-0.5 rounded text-xs">
                    {FILTER_FIELD_LABELS[rule.field]} {FILTER_OPERATOR_LABELS[rule.operator]}{' '}
                    &quot;{rule.value || '...'}&quot;
                  </code>
                </span>
              ))}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              {editingFunnel ? 'Salvar Alterações' : 'Criar Funil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
