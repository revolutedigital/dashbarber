'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">
            Algo deu errado
          </h1>
          <p className="text-muted-foreground">
            Ocorreu um erro ao carregar esta página. Por favor, tente novamente.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left p-4 rounded-lg bg-muted/50 text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              Detalhes do erro
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-destructive overflow-auto max-h-48">
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
          >
            <Home className="w-4 h-4" />
            Ir para início
          </a>
        </div>
      </div>
    </div>
  )
}
