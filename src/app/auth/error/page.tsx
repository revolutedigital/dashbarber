'use client'

import { BarChart3, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    Configuration: 'Erro de configuração do servidor.',
    AccessDenied: 'Acesso negado. Você não tem permissão.',
    Verification: 'O link de verificação expirou ou já foi usado.',
    Default: 'Ocorreu um erro inesperado.',
  }

  const message = errorMessages[error || ''] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Erro de Autenticação</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Tentar novamente
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
