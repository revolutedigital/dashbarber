'use client'

import { useState, useCallback, useEffect } from 'react'
import { MessageSquare, X, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Annotation {
  id: string
  chartId: string
  dataPoint: string // Date or x-value reference
  text: string
  color: string
  createdAt: Date
  updatedAt?: Date
}

interface ChartAnnotationProps {
  chartId: string
  dataPoint: string
  onSave: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void
  onDelete?: (id: string) => void
  existingAnnotation?: Annotation | null
  position?: { x: number; y: number }
  className?: string
}

const ANNOTATION_COLORS = [
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#eab308', label: 'Amarelo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
]

/**
 * Inline annotation editor for chart data points
 */
export function ChartAnnotation({
  chartId,
  dataPoint,
  onSave,
  onDelete,
  existingAnnotation,
  position,
  className,
}: ChartAnnotationProps) {
  const [isEditing, setIsEditing] = useState(!existingAnnotation)
  const [text, setText] = useState(existingAnnotation?.text || '')
  const [color, setColor] = useState(existingAnnotation?.color || ANNOTATION_COLORS[4].value)

  const handleSave = useCallback(() => {
    if (!text.trim()) return

    onSave({
      chartId,
      dataPoint,
      text: text.trim(),
      color,
      updatedAt: existingAnnotation ? new Date() : undefined,
    })
    setIsEditing(false)
  }, [chartId, dataPoint, text, color, existingAnnotation, onSave])

  const handleDelete = useCallback(() => {
    if (existingAnnotation && onDelete) {
      onDelete(existingAnnotation.id)
    }
  }, [existingAnnotation, onDelete])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setText(existingAnnotation?.text || '')
    }
  }, [handleSave, existingAnnotation])

  if (!isEditing && existingAnnotation) {
    return (
      <div
        className={cn(
          'absolute z-10 max-w-xs',
          className
        )}
        style={{
          left: position?.x,
          top: position?.y,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div
          className="relative p-2 rounded-lg shadow-lg text-sm"
          style={{
            backgroundColor: color,
            color: '#fff',
          }}
        >
          <p className="pr-12">{existingAnnotation.text}</p>
          <div className="absolute top-1 right-1 flex gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Editar anotação"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Remover anotação"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {/* Arrow pointer */}
          <div
            className="absolute left-1/2 -bottom-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent"
            style={{ borderTopColor: color, transform: 'translateX(-50%)' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'absolute z-20 bg-card border border-border rounded-lg shadow-xl p-3 min-w-[240px]',
        className
      )}
      style={{
        left: position?.x,
        top: position?.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          Anotação para {dataPoint}
        </span>
        <button
          onClick={() => setIsEditing(false)}
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="Fechar"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Adicione uma nota..."
        className="w-full p-2 text-sm bg-muted/50 border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        rows={2}
        autoFocus
      />

      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1">
          {ANNOTATION_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={cn(
                'w-5 h-5 rounded-full transition-transform',
                color === c.value && 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
              )}
              style={{ backgroundColor: c.value }}
              aria-label={c.label}
              title={c.label}
            />
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!text.trim()}
          className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Salvar
        </button>
      </div>
    </div>
  )
}

/**
 * Hook for managing chart annotations in localStorage
 */
export function useChartAnnotations(chartId: string) {
  const STORAGE_KEY = `dashbarber_annotations_${chartId}`

  const [annotations, setAnnotations] = useState<Annotation[]>([])

  // Load annotations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setAnnotations(parsed.map((a: Annotation) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: a.updatedAt ? new Date(a.updatedAt) : undefined,
        })))
      }
    } catch (error) {
      console.warn('Failed to load annotations:', error)
    }
  }, [STORAGE_KEY])

  // Save annotations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations))
    } catch (error) {
      console.warn('Failed to save annotations:', error)
    }
  }, [annotations, STORAGE_KEY])

  const addAnnotation = useCallback((data: Omit<Annotation, 'id' | 'createdAt'>) => {
    const newAnnotation: Annotation = {
      ...data,
      id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }
    setAnnotations(prev => [...prev, newAnnotation])
    return newAnnotation
  }, [])

  const updateAnnotation = useCallback((id: string, data: Partial<Omit<Annotation, 'id' | 'createdAt'>>) => {
    setAnnotations(prev => prev.map(a =>
      a.id === id ? { ...a, ...data, updatedAt: new Date() } : a
    ))
  }, [])

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id))
  }, [])

  const getAnnotationForDataPoint = useCallback((dataPoint: string) => {
    return annotations.find(a => a.dataPoint === dataPoint) || null
  }, [annotations])

  return {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getAnnotationForDataPoint,
  }
}

/**
 * Marker component for annotation indicators on chart
 */
export function AnnotationMarker({
  annotation,
  onClick,
  className,
}: {
  annotation: Annotation
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md hover:scale-110 transition-transform',
        className
      )}
      style={{ backgroundColor: annotation.color }}
      aria-label={`Ver anotação: ${annotation.text.substring(0, 20)}...`}
      title={annotation.text}
    >
      <MessageSquare className="w-2.5 h-2.5" />
    </button>
  )
}

export default ChartAnnotation
