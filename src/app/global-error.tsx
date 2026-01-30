'use client'

import { AlertOctagon, RefreshCw } from 'lucide-react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 text-red-500">
            <AlertOctagon className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold">
              Erro crítico
            </h1>
            <p className="text-zinc-400">
              A aplicação encontrou um erro inesperado. Por favor, tente recarregar a página.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-left p-4 rounded-lg bg-zinc-800 text-sm">
              <summary className="cursor-pointer font-medium text-zinc-400">
                Detalhes do erro
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-red-400 overflow-auto max-h-48">
                {error.message}
                {error.digest && `\n\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-900 font-medium hover:bg-zinc-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
