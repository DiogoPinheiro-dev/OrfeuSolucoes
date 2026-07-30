# Estado atual e roadmap

Snapshot: **30/07/2026**.

## Produto

| Área | Estado |
|---|---|
| Autenticação e multiempresa | Implementada |
| Configurador | Implementado |
| Catálogo de serviços | Implementado |
| Controle de Chamados | Implementado até a fase atual; base de conhecimento ainda fora do escopo entregue |
| Cadastro e gestão operacional de Projetos | Implementados até recursos, tarefas, grade de capacitação e orçamento, em funcionalidades separadas |

## Planejamentos de Projetos

| Planejamento | Estado | Observação |
|---|---|---|
| 9 — Fundação operacional | Concluído documentalmente neste trabalho | Infraestrutura, contratos, permissões e evidências formalizados. |
| 10 — Itens de trabalho | Implementado | Modelo, hierarquia, versão, histórico e API. |
| 11 — Backlog | Implementado | Filtros, paginação e priorização persistente. |
| 12 — Sprints | Implementado | Planejamento, execução e encerramento. |
| 13 — Marcos e entregas | Implementado | Compromissos, progresso e atraso. |
| 14 — Dependências e Gantt | Implementado | Falta validação com volume representativo. |
| 15 — Comunicação | Implementado | Atualizações, comentários, anexos, histórico e feed. |
| 16 — Recursos e orçamento | Implementado localmente | Recurso é cadastro empresarial vinculado a um ou mais projetos pelo próprio modal; tarefas relacionam recurso, descrição funcional livre, estimativa de conclusão e taxa; capacidade e execução ficam na Grade de capacitação; alterações ainda não fazem parte de commit. |
| 17 — Apontamento de horas | Não iniciado | Funcionalidade reservada e inativa no Hub. |
| 18 — Templates | Não iniciado | Funcionalidade reservada e inativa no Hub. |
| 19 — Dashboard e portfólio | Não iniciado | Funcionalidade reservada e inativa no Hub. |
| 20 — Validação integrada | Parcial | Depende dos Planejamentos 17 a 19. |

## Situação do Planejamento 16

O working tree contém Prisma, migration, autorizações, serviços, resolvers,
GraphQL, serviços frontend, telas, estilos e testes independentes para recursos,
tarefas, Grade de capacitação e orçamento. O cadastro de recurso mantém usuário, estado e
os vínculos com projetos existentes; a grade mantém capacidade, períodos, alocação
e a atividade que será executada. O Cadastro de tarefas mantém a descrição livre do que será executado, as horas estimadas e
o valor/hora do recurso, com histórico de taxas. O cadastro de projeto não possui equipe nem aloca recursos; seu
criador é o responsável padrão. O banco configurado reconhece 56 migrations.
Os vínculos existentes foram consolidados em cadastro empresarial sem alterar
os IDs usados por custos, capacidades e alocações. Capacidades antigas sem
associação inequívoca continuam preservadas na tabela legada.

Antes de incorporar o Planejamento 16 ao controle de versão:

1. revisar o diff local;
2. ensaiar a migration em banco vazio;
3. conferir as telas manualmente;
4. criar o commit autorizado.

O ensaio com dados existentes foi concluído no banco configurado: um cadastro
empresarial preservou dois vínculos com projetos, dois custos, uma capacidade e
uma alocação. Uma capacidade antiga sem projeto inequívoco permanece como legado.

## Próximo ponto de retomada

Após o fechamento técnico e versionamento do Planejamento 16, o próximo
desenvolvimento previsto é o Planejamento 17 — Apontamento de horas.

Este documento não autoriza o início automático de um planejamento. Cada
etapa depende de autorização explícita.
