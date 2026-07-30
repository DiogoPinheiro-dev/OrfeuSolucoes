# Planejamento 9 — Fechamento da fundação operacional

## Objetivo

Consolidar as regras compartilhadas necessárias para que os módulos
operacionais de Projetos evoluam sem duplicar autorização, auditoria,
sequenciamento, concorrência, datas, durações e contratos públicos.

Neste fechamento, o escopo documental foi ampliado para cobrir todo o
OrfeuSolucoes. A ampliação não adiciona funcionalidades aos Planejamentos 17 a
19 e não muda regras de negócio.

## Escopo técnico original

- autorização por solução, funcionalidade e ação;
- contexto de empresa e visibilidade por projeto;
- projeto arquivado somente leitura;
- auditoria de mutações;
- sequenciamento por projeto;
- idempotência;
- períodos, durações e paginação;
- controle de concorrência;
- contratos estáveis entre Prisma, GraphQL e frontend;
- base de testes de integração.

## Escopo documental ampliado

O Planejamento 9 passa a incluir:

- visão geral do produto;
- arquitetura frontend/backend;
- configuração, execução e operação;
- segurança, autenticação e permissões;
- módulos e responsabilidades;
- modelo de dados;
- GraphQL, HTTP e integrações;
- frontend e registro do Hub;
- testes, validações e lacunas;
- estado atual e roadmap;
- fundação operacional específica de Projetos;
- contratos operacionais;
- matriz de permissões;
- matriz de evidências.

## Critérios de conclusão

| Critério | Estado |
|---|---|
| Auditoria persistente disponível | Atendido |
| Sequência concorrente por namespace | Atendido |
| Idempotência persistente | Atendido |
| Autorização generalizada por feature/action | Atendido |
| Empresa e projeto isolados | Atendido |
| Projeto arquivado somente leitura | Atendido |
| Períodos, minutos e paginação padronizados | Atendido |
| Concorrência otimista nos módulos operacionais | Atendido |
| Contratos operacionais documentados | Atendido neste fechamento |
| Matriz de permissões documentada | Atendido neste fechamento |
| Evidências ligadas ao código e testes | Atendido neste fechamento |
| Documentação geral do sistema | Atendido neste fechamento |

## Itens que não bloqueiam o fechamento funcional

- registro frontend ainda duplicado entre chave e componente;
- imports estáticos das telas;
- ausência de testes frontend;
- documentação GraphQL não gerada por ferramenta dedicada.

Esses itens permanecem como dívida arquitetural/qualidade para a validação
integrada. Eles não anulam os contratos já aplicados pelo backend.

## Resultado

O Planejamento 9 fica considerado **concluído** quando as validações listadas
na matriz de evidências passarem no working tree atual.

O fechamento não inicia o Planejamento 17 e não versiona automaticamente as
alterações locais do Planejamento 16.
