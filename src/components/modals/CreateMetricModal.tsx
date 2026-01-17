'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AVAILABLE_VARIABLES, CustomMetric } from '@/types/metrics'
import { Zap, Calculator, Hash } from 'lucide-react'

interface CreateMetricModalProps {
  open: boolean
  onClose: () => void
  onSave: (metric: Omit<CustomMetric, 'id'>) => void
}

export function CreateMetricModal({ open, onClose, onSave }: CreateMetricModalProps) {
  const [name, setName] = useState('')
  const [formula, setFormula] = useState('')
  const [format, setFormat] = useState<CustomMetric['format']>('number')
  const [description, setDescription] = useState('')

  const handleSave = () => {
    if (!name || !formula) return

    onSave({
      name,
      formula,
      format,
      description,
    })

    // Reset form
    setName('')
    setFormula('')
    setFormat('number')
    setDescription('')
    onClose()
  }

  const insertVariable = (variable: string) => {
    setFormula(prev => prev + variable)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-primary">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg">Criar Metrica Personalizada</DialogTitle>
              <p className="text-white/70 text-sm mt-0.5">Defina formulas customizadas para suas analises</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nome da Metrica</Label>
            <Input
              id="name"
              placeholder="Ex: Custo por Lead Qualificado"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="formula" className="text-sm font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              Formula
            </Label>
            <Input
              id="formula"
              placeholder="Ex: totalSpent / totalPurchases"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="h-11 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use as variaveis abaixo e operadores: + - * / ( )
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Variaveis Disponiveis
            </Label>
            <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border/50" role="group" aria-label="Variaveis disponiveis para a formula">
              {Object.entries(AVAILABLE_VARIABLES).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => insertVariable(key)}
                  className="min-h-[44px] px-3 py-2 text-xs font-mono bg-background border border-border/50 rounded-md hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Inserir variavel ${key}: ${label}`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format" className="text-sm font-medium">Formato de Exibicao</Label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as CustomMetric['format'])}
              className="w-full h-11 min-h-[44px] bg-background border border-border/50 rounded-lg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
            >
              <option value="number">Numero</option>
              <option value="currency">Moeda (R$)</option>
              <option value="percentage">Porcentagem (%)</option>
              <option value="decimal">Decimal</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Descricao (opcional)</Label>
            <Input
              id="description"
              placeholder="Ex: Calcula o custo medio por aquisicao"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name || !formula}
            className="px-6"
          >
            Criar Metrica
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
