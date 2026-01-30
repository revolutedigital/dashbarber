'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plug, Users, Webhook, ArrowLeft } from 'lucide-react'

export default function SettingsPage() {
  const params = useParams()
  const slug = params.workspaceSlug as string

  const sections = [
    {
      title: 'Conexões',
      description: 'Conecte suas contas de Google Ads e Meta Ads',
      href: `/${slug}/settings/connections`,
      icon: Plug,
    },
    {
      title: 'Equipe',
      description: 'Gerencie membros e permissões do workspace',
      href: `/${slug}/settings/team`,
      icon: Users,
    },
    {
      title: 'Webhooks',
      description: 'Configure webhooks para receber dados de vendas',
      href: `/${slug}/settings/webhooks`,
      icon: Webhook,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/${slug}`}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerencie seu workspace</p>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
            >
              <div className="p-2.5 rounded-lg bg-primary/10">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-medium text-foreground">{section.title}</h2>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
