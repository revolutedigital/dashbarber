import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl font-bold">Dashboard de Trafego</h1>
        <p className="text-xl text-muted-foreground">
          Visualize suas metricas de trafego pago de forma simples e eficiente.
          Conecte sua planilha do Google Sheets e acompanhe seus resultados em tempo real.
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
          >
            Acessar Dashboard
          </Link>
        </div>

        <div className="mt-12 p-6 bg-card rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Indicadores disponiveis:</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div>ROAS</div>
            <div>ROI</div>
            <div>CPL</div>
            <div>CPA</div>
            <div>CTR</div>
            <div>CPC</div>
            <div>CPM</div>
            <div>Taxa de Conversao</div>
          </div>
        </div>
      </div>
    </div>
  )
}
