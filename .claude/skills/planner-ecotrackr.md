---
name: saas-residuos-planner
description: >
  Guia de planejamento para novas funcionalidades do EcoTrack (SaaS B2B de
  coleta de resíduos). Acione este skill quando o usuário pedir para planejar,
  especificar, decompor, priorizar ou arquitetar qualquer feature do EcoTrack.
  Fornece contexto de domínio, fluxo de delegação entre agentes, matriz de
  responsabilidades e checklist por tipo de módulo.
---

# EcoTrack Planner

## Visão Geral

Este skill guia o planejamento de features da plataforma EcoTrack, garantindo que o contexto de domínio (legislação, perfis de usuário, roadmap de fases) seja considerado antes de delegar ao agente correto. Use-o como ponto de partida para qualquer nova funcionalidade ou decisão arquitetural.

---

## Quando Acionar Este Skill

- Usuário pede para "planejar", "especificar", "arquitetar" ou "decompor" uma feature
- Usuário menciona módulos não mapeados no roadmap atual
- Início de novo sprint ou épico
- Decisão sobre qual fase do roadmap uma feature pertence
- Dúvida sobre qual agente deve liderar uma tarefa
- Necessidade de priorização entre funcionalidades concorrentes

---

## Contexto de Domínio EcoTrack

### Perfis de Usuário

| Perfil | Papel | Objetivo Principal |
| :--- | :--- | :--- |
| **Gerador** | Origem do resíduo (restaurantes, clínicas, pequenas indústrias) | Conformidade legal com mínimo de esforço |
| **Transportador / Coletor** | Logística de coleta e entrega | Otimização de rotas e documentação digital |
| **Destinador** | Recebimento e processamento final (aterros, recicladoras) | Controle de entrada e emissão de CDF |

### Status de Coleta

```
PENDENTE → CONFIRMADA → EM_ROTA → COLETADO → FINALIZADO
                                            ↘ CANCELADO
```

### Conformidade Legal Obrigatória

- **CONAMA 275/2001:** MTR gerado como PDF em todas as coletas
- **SINIR:** Integração via API REST/SOAP para registro e baixa de MTRs
- **LGPD:** Log de acesso a dados pessoais; endpoint de exclusão de conta
- **ABNT NBR 10.004:** Base para classificação de tipos de resíduos

### Multi-tenancy

Todas as queries filtram por `empresaId` extraído do JWT. Nenhum dado cruza entre empresas distintas.

---

## Fluxo de Planejamento de Feature

Siga estes 6 passos antes de iniciar qualquer implementação:

1. **Identificar o ator principal** — Qual perfil (Gerador, Transportador ou Destinador) aciona ou consome a feature?
2. **Classificar o módulo** — A qual módulo pertence: Agendamento, MTR/Conformidade, Marketplace, Rastreamento, Relatórios ou Auth?
3. **Verificar a fase do roadmap** — A feature é MVP, Automação ou Inteligência? (ver tabela abaixo)
4. **Consultar a Matriz de Delegação** — Quem lidera e quem apoia? (ver tabela abaixo)
5. **Acionar `@tech-leader` primeiro** — Ele decompõe a feature e coordena os especialistas
6. **Gerar spec completa** — Use o comando `/spec <nome-da-feature>` para produzir a especificação detalhada

---

## Roadmap de Fases

| Fase | Nome | Foco | Features Principais |
| :--- | :--- | :--- | :--- |
| **1** | MVP | Core operacional | Cadastro de usuários e resíduos, agendamento de coletas, status flow completo, MTR básico (emissão manual), diretório de transportadores |
| **2** | Automação | Eficiência | Integração SINIR (emissão automática de MTR), matching Gerador-Transportador, app mobile para motoristas, filas BullMQ, push notifications, gestão de assinaturas |
| **3** | Inteligência | Valor agregado | Dashboard de sustentabilidade com métricas de impacto, otimização de rotas por IA, marketplace de recicláveis com avaliações, PGRS automatizado |

---

## Matriz de Delegação de Agentes

| Tipo de Tarefa | Agente Principal | Agentes de Suporte |
| :--- | :--- | :--- |
| Nova página / componente UI | `@frontend-specialist` | `@design-specialist` (tokens e UX), `@tech-leader` (aprovação) |
| Novo endpoint de API / schema Prisma | `@backend-engineer` | `@tech-leader` (contrato de API) |
| Identidade visual / UX flow / tokens | `@design-specialist` | `@frontend-specialist` (implementação) |
| Arquitetura / decisão técnica | `@tech-leader` | todos conforme necessário |
| Feature completa ponta a ponta | `@tech-leader` | delega para todos os 3 especialistas |
| Integração externa (SINIR, Mapbox, Stripe) | `@backend-engineer` | `@tech-leader` (validação) |
| Conformidade legal (LGPD, MTR, CDF) | `@backend-engineer` | `@tech-leader` (revisão) |
| Otimização de performance / queries | `@backend-engineer` | `@tech-leader` |
| Mapa interativo / rastreamento em tempo real | `@frontend-specialist` | `@backend-engineer` (WebSocket) |

---

## Checklists por Módulo

Responda todas as perguntas antes de delegar ao agente.

### Agendamento / Coleta

- [ ] Qual tipo de resíduo? (ORGANICO / RECICLAVEL / ELETRONICO / HOSPITALAR / PERIGOSO)
- [ ] Qual status final esperado no fluxo de coleta?
- [ ] Há geração de MTR envolvida nessa coleta?
- [ ] Precisa de notificação (push e/ou e-mail) em qual evento?
- [ ] Há regra de cancelamento ou reagendamento com prazo?

### MTR / Conformidade

- [ ] Integração com SINIR é necessária (Fase 2+)?
- [ ] Geração de PDF conforme CONAMA 275/2001?
- [ ] Qual ator assina digitalmente: Gerador, Transportador ou Destinador?
- [ ] O MTR deve ser arquivado no banco para auditoria?
- [ ] Há emissão de CDF pelo Destinador ao final?

### Marketplace / Transportadores

- [ ] Precisa de geolocalização (Mapbox / Google Maps)?
- [ ] Quais certificações do Transportador devem ser validadas?
- [ ] Matching automático por proximidade ou busca manual pelo Gerador?
- [ ] Há sistema de avaliação (rating) envolvido?
- [ ] Fila de re-notificação se o Transportador recusar (timeout)?

### Dashboard / Relatórios

- [ ] Qual métrica de sustentabilidade exibir (kg desviados, CO2 evitado, etc.)?
- [ ] Dados segmentados por empresa (multi-tenant) ou agregados?
- [ ] Exportação necessária em PDF, CSV ou ambos?
- [ ] Frequência de atualização: real-time (WebSocket) ou batch (cron job)?
- [ ] Relatório personalizável com logo do Gerador?

### Auth / Multi-tenancy

- [ ] O novo endpoint extrai `empresaId` do JWT e filtra todas as queries?
- [ ] Há novos escopos de permissão (roles) necessários?
- [ ] Precisa de log de auditoria LGPD para dados pessoais acessados?

---

## Recursos do Projeto

| Recurso | Localização | Para que serve |
| :--- | :--- | :--- |
| Convenções de código e API | `CLAUDE.md` | Padrões de resposta, design tokens, status de coleta |
| Spec detalhada de feature | `/spec <feature>` | Gera spec completa com RF, regras, modelo de dados e critérios de aceite |
| Definições dos agentes | `.claude/agents/` | Responsabilidades, stack e ferramentas de cada especialista |
| Especificação técnica completa | `docs/especificacao-tecnica.md` | Requisitos funcionais (RF1.x–RF3.x), DFDs, arquitetura e roadmap |
