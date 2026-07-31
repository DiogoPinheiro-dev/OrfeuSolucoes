# Matriz de evidências do Planejamento 9

Esta matriz liga requisitos a implementação, persistência e validação. O
estado descreve o working tree de 28/07/2026.

## Fundação operacional

| Requisito | Implementação | Persistência | Evidência de teste | Estado |
|---|---|---|---|---|
| Empresa ativa | [`ProjetoAuthorizationService`](../../server/src/modules/projetos/projeto-authorization.service.ts) | `empresaId` nas entidades | integração: isolamento por empresa | Atendido |
| Visibilidade por participação | `visibilityWhere` e `assertVisibleProject` | `Projeto.responsavelId`, `ProjetoMembro` | integração: papel e outra empresa | Atendido |
| Feature/action genérica | `assertFeatureActionAccess` | permissões do Hub | integração: matriz funcional | Atendido |
| Papel operacional | `assertOperationalAction` e autorizações especialistas | `ProjetoMembro.papel` | integração dos módulos | Atendido |
| Arquivado somente leitura | `assertWritableProject` | `Projeto.arquivadoEm` | integração: projeto arquivado | Atendido |
| Auditoria | [`ProjetoAuditoriaService`](../../server/src/modules/projetos/projeto-auditoria.service.ts) | `ProjetoEvento` | integração: fundação e módulos | Atendido |
| Sequência | [`ProjetoSequenciaService`](../../server/src/modules/projetos/projeto-sequencia.service.ts) | `ProjetoSequencia` | integração: itens | Atendido |
| Idempotência | [`ProjetoIdempotenciaService`](../../server/src/modules/projetos/projeto-idempotencia.service.ts) | `ProjetoOperacaoIdempotente` | integração: fundação | Atendido |
| Períodos/minutos/paginação | [`ProjetoPeriodoService`](../../server/src/modules/projetos/projeto-periodo.service.ts) | campos `date` e inteiros | integração: fundação e módulos | Atendido |
| Concorrência otimista | serviços de item, backlog, sprint, cronograma, comunicação e finanças | `versao`, `backlogVersao` | testes de conflito por módulo | Atendido |

## Contratos e bordas

| Requisito | Fonte | Estado |
|---|---|---|
| Modelos e índices | [`schema.prisma`](../../server/prisma/schema.prisma) | Atendido |
| Migration da fundação | [`20260723143845_planejamento_9_fundacao_operacional`](../../server/prisma/migrations/20260723143845_planejamento_9_fundacao_operacional/migration.sql) | Atendido |
| GraphQL code-first | resolvers e [`schema.gql`](../../server/src/schema.gql) | Atendido |
| Guard de autenticação | `GqlAuthGuard` e `AuthGuard` | Atendido |
| Erros por campo | `form-field.exception.ts` | Atendido |
| Registro do Hub | `projeto-feature-definitions.ts` e `hubConfig.js` | Atendido |
| Tela por funcionalidade ativa | `SolutionFeaturePage.jsx` | Atendido até Planejamento 16 e Cadastro de tarefas |
| Contratos operacionais escritos | [`contratos-operacionais.md`](contratos-operacionais.md) | Atendido neste fechamento |
| Matriz de permissões escrita | [`matriz-permissoes.md`](matriz-permissoes.md) | Atendido neste fechamento |

## Documentação geral adicionada ao escopo

| Área | Documento | Estado |
|---|---|---|
| Produto | [`visao-geral.md`](../visao-geral.md) | Atendido |
| Arquitetura | [`arquitetura.md`](../arquitetura.md) | Atendido |
| Configuração/operação | [`configuracao-e-execucao.md`](../configuracao-e-execucao.md) | Atendido |
| Módulos | [`modulos.md`](../modulos.md) | Atendido |
| Dados | [`modelo-de-dados.md`](../modelo-de-dados.md) | Atendido |
| API/integrações | [`api-e-integracoes.md`](../api-e-integracoes.md) | Atendido |
| Frontend | [`frontend.md`](../frontend.md) | Atendido |
| Segurança | [`seguranca-e-permissoes.md`](../seguranca-e-permissoes.md) | Atendido |
| Testes | [`testes-e-validacao.md`](../testes-e-validacao.md) | Atendido |
| Roadmap | [`estado-atual.md`](../estado-atual.md) | Atendido |

## Testes relacionados

Arquivo principal:
[`backend-flows.integration-spec.ts`](../../server/test/backend-flows.integration-spec.ts).

Casos de Projetos cobrem:

- modelos, participantes e unicidade;
- consultas, privacidade e filtros;
- criação sem equipe, responsável padrão, edição e chave imutável;
- auditoria, sequência, idempotência, períodos e arquivamento;
- itens, hierarquia, versão e histórico;
- backlog e concorrência;
- isolamento por empresa e papel;
- matriz de autorização;
- sprints;
- marcos e entregas;
- dependências e cronograma;
- comunicação, incluindo paginação do feed além do antigo limite de 200 registros;
- projeto criado com zero recursos e zero participantes;
- cadastro empresarial de recursos com múltiplos projetos selecionados no formulário;
- cadastro de tarefas por recurso com funcionalidade textual e taxa versionada;
- vínculo/desvínculo de recursos em projetos pela Grade de capacitação;
- sincronização de participação operacional de origem `RECURSO`;
- Grade de capacitação com capacidade, execução descrita e períodos por vínculo;
- orçamento, categorias, custos e aprovação.

E2E do cadastro e da paginação da comunicação:
[`projetos.e2e-spec.ts`](../../server/test/projetos.e2e-spec.ts).

## Validações de fechamento

| Validação | Comando | Critério |
|---|---|---|
| Links Markdown | verificador local | nenhum destino relativo ausente |
| Formatação | `git diff --check` | sem erro |
| Prisma | `npx.cmd prisma validate` | schema válido |
| Migrations | `npx.cmd prisma migrate status` | banco configurado atualizado |
| Backend | `npm.cmd run build` | compilação aprovada |
| Integração | `npm.cmd run test:integration` | todos aprovados |
| E2E | `npm.cmd run test:e2e` | todos aprovados |
| Frontend | `npm.cmd run lint` | sem erro |
| Frontend | `npm.cmd run build` | build aprovado |

## Pendências fora do fechamento documental

- testes automatizados de interface;
- unificação e lazy loading do registro frontend;
- teste de volume do Gantt;
- jornada GraphQL completa das funcionalidades separadas de recursos, tarefas, grade e orçamento;
- Planejamentos 17, 18 e 19;
- validação integrada final do Planejamento 20.

Esses itens devem permanecer visíveis no roadmap, mas não representam ausência
dos serviços fundamentais entregues pelo Planejamento 9.
