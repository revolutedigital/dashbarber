# Roadmap de Melhorias - TrafficHub

## Fase 1: Fundamentos (Prioridade Alta)

### 1.1 Filtro por Periodo
- [ ] Seletor de datas no header (Hoje, 7 dias, 14 dias, 30 dias, Customizado)
- [ ] Filtrar dados por range de datas
- [ ] Persistir selecao no localStorage

### 1.2 Comparativo de Periodo
- [ ] Mostrar variacao % nos KPI cards (vs periodo anterior)
- [ ] Indicador visual (seta verde/vermelha)
- [ ] Tooltip com valores do periodo anterior

### 1.3 Redirect e Rotas
- [ ] Redirecionar `/` para `/dashboard`
- [ ] Pagina 404 customizada

### 1.4 Loading e Erros
- [ ] Skeleton loading nos cards
- [ ] Toast de notificacao para erros
- [ ] Retry automatico com feedback visual

---

## Fase 2: UX e Interface (Prioridade Media)

### 2.1 Dark/Light Mode
- [ ] Botao toggle no header
- [ ] Persistir preferencia no localStorage
- [ ] Respeitar preferencia do sistema

### 2.2 Responsividade Mobile
- [ ] Ajustar grid de KPIs para mobile
- [ ] Menu hamburger no header
- [ ] Graficos responsivos
- [ ] Touch-friendly nos selects

### 2.3 Melhorias Visuais
- [ ] Animacoes suaves nos numeros (count up)
- [ ] Hover states mais elaborados
- [ ] Micro-interacoes nos botoes

### 2.4 Export de Dados
- [ ] Botao download CSV
- [ ] Botao download Excel
- [ ] Exportar periodo selecionado

---

## Fase 3: Funcionalidades Avancadas (Prioridade Media)

### 3.1 Tabela de Dados Detalhada
- [ ] Tabela com todos os registros
- [ ] Ordenacao por coluna
- [ ] Busca/filtro na tabela
- [ ] Paginacao

### 3.2 Mais Graficos
- [ ] Grafico de pizza (distribuicao por funil)
- [ ] Grafico de area (evolucao acumulada)
- [ ] Heatmap de performance por dia da semana

### 3.3 Alertas e Metas
- [ ] Definir meta de CPA maximo
- [ ] Alerta quando CPA passar do limite
- [ ] Notificacao de anomalias

### 3.4 Relatorios
- [ ] Resumo semanal automatico
- [ ] Comparativo mensal
- [ ] PDF exportavel

---

## Fase 4: Performance e Tecnico (Prioridade Baixa)

### 4.1 Cache e Performance
- [ ] Cache local dos dados (SWR/React Query)
- [ ] Prefetch de dados
- [ ] Otimizar bundle size

### 4.2 PWA (Progressive Web App)
- [ ] Manifest.json
- [ ] Service Worker
- [ ] Icone na home do celular
- [ ] Funcionar offline (dados em cache)

### 4.3 Testes
- [ ] Testes unitarios (Jest)
- [ ] Testes de integracao
- [ ] Testes E2E (Playwright)

---

## Fase 5: Expansao (Futuro)

### 5.1 Multi-usuario
- [ ] Autenticacao (login)
- [ ] Cada usuario com suas planilhas
- [ ] Permissoes (admin/viewer)

### 5.2 Multiplas Fontes
- [ ] Conectar Google Ads
- [ ] Conectar TikTok Ads
- [ ] Dashboard unificado

### 5.3 Automacoes
- [ ] Relatorio por email (diario/semanal)
- [ ] Webhook para alertas
- [ ] Integracao com Slack/Discord

### 5.4 White-label
- [ ] Customizar logo/cores
- [ ] Dominio personalizado
- [ ] Remover branding

---

## Ordem de Implementacao Sugerida

1. **Fase 1.3** - Redirect (rapido, melhora UX)
2. **Fase 1.1** - Filtro por periodo (muito util)
3. **Fase 1.4** - Loading/Erros (profissionalismo)
4. **Fase 2.1** - Dark/Light mode (facil, impactante)
5. **Fase 1.2** - Comparativo (valor pro usuario)
6. **Fase 2.4** - Export CSV (muito pedido)
7. **Fase 2.2** - Mobile (ampliar acesso)
8. **Fase 3.1** - Tabela de dados (completude)

---

## Metricas de Sucesso

- [ ] Tempo de carregamento < 2s
- [ ] Lighthouse score > 90
- [ ] Mobile-friendly test: pass
- [ ] Zero erros no console
- [ ] Dados atualizados em tempo real
