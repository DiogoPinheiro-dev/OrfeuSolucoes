# Gerenciador de Projetos

## Objetivo

O Gerenciador de Projetos organiza o ciclo de vida, a execução, os compromissos, os recursos, a comunicação e o orçamento dos projetos da empresa ativa. A solução possui oito funcionalidades ativas e vinculadas a telas no Hub:

| Registry key | Tela |
|---|---|
| `projetos.cadastro-de-projetos` | Cadastro de projetos |
| `projetos.backlog-de-demandas` | Backlog de demandas |
| `projetos.sprints` | Sprints |
| `projetos.marcos-e-entregas` | Marcos e entregas |
| `projetos.cronograma-e-gantt` | Cronograma e Gantt |
| `projetos.comunicacao-do-projeto` | Comunicação do projeto |
| `projetos.planejamento-de-recursos` | Planejamento de recursos |
| `projetos.orcamento-do-projeto` | Orçamento do projeto |

Cada tela é resolvida pelo `RegistryKey` recebido do backend. Empresa, funcionalidade e participação no projeto compõem o contexto de autorização das operações.

## Cadastro e ciclo do projeto

O cadastro mantém chave, nome, objetivo, descrição, metodologia, situação, saúde, datas, responsável e equipe. As metodologias disponíveis são Scrum, Kanban, híbrida e outra. A situação pode ser rascunho, planejado, em andamento, pausado, concluído ou cancelado; a saúde registra projeto em dia, em risco ou atrasado.

A listagem possui pesquisa, filtros por metodologia, situação e saúde, paginação pelo servidor e opção de incluir projetos arquivados. A visualização apresenta os dados completos em modo somente leitura.

As ações dinâmicas `gerenciar_membros`, `alterar_status` e `reativar_projeto` complementam as permissões CRUD. Um membro pode exercer o papel de responsável, membro ou observador. Alterações de ciclo respeitam as transições aceitas pelo estado atual. O arquivamento preserva o projeto e seus registros; projetos arquivados permanecem consultáveis e podem ser reativados por usuário autorizado.

## Backlog de demandas

O backlog reúne as demandas do projeto, seus responsáveis, prioridade, situação, estimativas e vínculos de planejamento. A tela oferece pesquisa e filtros e permite incluir, alterar, visualizar e arquivar itens conforme as permissões efetivas devolvidas pelo backend.

A ação `priorizar` altera a ordem persistente dos itens. A priorização é enviada sobre uma versão conhecida do backlog e exige o conjunto completo da ordem aplicável; se a operação falhar, a interface restaura a ordem anterior. Projetos arquivados ficam em modo somente leitura.

## Sprints

A tela de sprints separa períodos planejados, a sprint ativa e o histórico de sprints concluídas ou canceladas. Uma sprint inicia como `PLANEJADA`, pode tornar-se `ATIVA` e termina como `CONCLUIDA` ou `CANCELADA`.

As ações dinâmicas são:

- `planejar`, para definir e alterar o escopo;
- `iniciar`, para ativar uma sprint planejada;
- `concluir`, para encerrar a sprint ativa;
- `cancelar`, para cancelar uma sprint.

O escopo é formado por itens elegíveis do backlog. Na conclusão, itens incompletos podem retornar ao backlog ou ser destinados a outra sprint. As mudanças de escopo e estado são versionadas e auditadas.

## Marcos e entregas

Marcos e entregas registram compromissos do projeto, responsáveis, datas e itens relacionados. Marcos podem estar planejados, atingidos ou cancelados. Entregas podem estar planejadas, em andamento, concluídas ou canceladas.

Um marco atingido exige data de realização, e uma entrega concluída exige data de conclusão. A tela identifica compromissos atrasados a partir das datas previstas e dos respectivos estados. A ação `aprovar` representa a autorização específica para aprovação de compromissos de negócio. Alteração, arquivamento e reativação respeitam as permissões efetivas e a versão do registro.

## Cronograma e Gantt

O cronograma consolida os itens planejados e suas datas, dependências e inconsistências. A visualização permite localizar o item correspondente no backlog e mostra problemas que impedem uma sequência coerente, como vínculos incompletos ou datas incompatíveis.

A ação `editar_datas` autoriza a confirmação de alterações de datas. Dependências só podem ser criadas entre itens válidos do mesmo contexto de projeto, e o backend rejeita relações inválidas. Atualizações usam o contrato versionado para evitar que uma edição silenciosamente sobrescreva outra mais recente.

## Comunicação do projeto

A comunicação centraliza atualizações, comentários e eventos de auditoria em um feed cronológico paginado. Uma atualização pode registrar a saúde percebida do projeto. Comentários podem ser vinculados a itens disponíveis do backlog.

As ações dinâmicas são:

- `comentar`, para publicar e alterar comentários próprios;
- `moderar`, para administrar comentários de outros autores;
- `gerenciar_anexos`, para administrar anexos autorizados.

Eventos exibem o nome legível do registro envolvido e sua hierarquia de contexto. Quando disponíveis, os detalhes apresentam os campos alterados com valores anterior e posterior. Identificadores técnicos são usados apenas como fallback quando o registro não pode mais ser resolvido.

## Planejamento de recursos

Esta funcionalidade possui três visões internas especializadas:

1. `Cadastro de recursos`, para vincular usuários aos projetos em que atuam;
2. `Cadastro de tarefas`, para registrar tarefas e seus recursos responsáveis;
3. `Cadastro de planejamento`, para distribuir a execução planejada das tarefas.

Uma tarefa possui descrição funcional, horas estimadas, valor por hora, moeda, observação, estado ativo e um ou mais recursos. O custo estimado corresponde às horas estimadas multiplicadas pelo valor por hora. Tarefas inativas permanecem no histórico e não recebem novas execuções.

A tela destaca tarefas que ainda aguardam recurso, permite filtrar por projeto, recurso e situação e apresenta totais de horas estimadas e planejadas. Uma tarefa que já possui execução planejada não pode ser selecionada para exclusão. Recursos e tarefas de projetos arquivados permanecem consultáveis, sem novas alterações operacionais.

## Orçamento do projeto

O orçamento usa uma moeda de três letras e reúne categorias e custos. Custos podem ser fixos ou associados a recurso e tarefa, com valores planejado, comprometido e realizado. A tela calcula variações, destaca estouros e preserva o histórico de taxas aplicado aos custos de recurso.

As ações `visualizar_financeiro`, `gerenciar_financeiro` e `aprovar_orcamento` separam consulta, manutenção e aprovação. Sem a primeira, os valores financeiros não são devolvidos ao usuário. Um projeto sem orçamento permite criar o orçamento-base; enquanto estiver em rascunho, categorias e custos podem ser mantidos. Depois da aprovação, o orçamento fica bloqueado para alterações até ser reaberto por usuário autorizado.

## Autorização, concorrência e auditoria

O acesso considera a empresa ativa, a funcionalidade solicitada, as ações dinâmicas, o projeto e o papel do usuário na equipe. O backend calcula permissões efetivas por tela e por registro e volta a validá-las em todas as mutações. Ocultar ou desabilitar um botão no frontend não substitui essa validação.

Entidades operacionais usam versão para detectar alterações concorrentes. Quando a versão enviada está desatualizada, a operação é rejeitada em vez de sobrescrever dados recentes. Operações compostas usam transações, e alterações relevantes alimentam a auditoria e o feed do projeto.

Todos os dados são delimitados pela empresa ativa. Usuários sem acesso ao projeto ou pertencentes a outra empresa não podem consultar nem alterar seus registros.

## Arquitetura e integrações

Os componentes das telas ficam em `client/src/components` e os contratos Apollo ficam em `client/services/Projetos`. As operações GraphQL compartilhadas estão em `client/services/graphql/operations.js`.

No backend, `server/src/modules/projetos` contém a fachada pública e serviços especializados para catálogo, ciclo de vida, equipe, backlog, sprints, marcos e entregas, cronograma, comunicação, anexos, recursos, tarefas, planejamento, orçamento, autorização, versionamento, hierarquia, sequências e auditoria. Resolvers específicos expõem os contratos GraphQL e delegam as regras aos serviços.

## Erros e estados protegidos

As telas diferenciam carregamento, estado vazio e falha. Quando aplicável, uma consulta com erro oferece nova tentativa e preserva os filtros ou o último estado utilizável. Modais mantêm a mensagem de validação ou conflito junto à operação que falhou.

Projetos arquivados são apresentados em modo somente leitura nas funcionalidades operacionais. Ações sem permissão permanecem ausentes ou desabilitadas, e o backend rejeita acessos diretos, relações pertencentes a outro projeto, transições inválidas e versões desatualizadas.

## Testes

A integração do Gerenciador de Projetos é executada com:

```powershell
cd client
npm.cmd run test:integration:projetos
```

A cobertura automatizada do frontend inclui:

- listagem, filtros, paginação, criação, visualização, ciclo e arquivamento de projetos;
- criação, consulta, priorização, restauração após falha e bloqueio do backlog arquivado;
- criação, planejamento e início de sprints, além dos bloqueios de permissão;
- manutenção, alternância e arquivamento de marcos e entregas;
- dependências, inconsistências, navegação e datas versionadas do cronograma;
- atualizações, comentários, feed, detalhes de eventos e permissões da comunicação;
- as três visões do planejamento de recursos, tarefas, vínculos e conversões de horas e valores;
- orçamento-base, categorias, custos, aprovação, seleção compartilhada e ocultação financeira.

O backend possui cobertura de integração dos fluxos de projeto e uma suite E2E da borda GraphQL, incluindo jornada principal, paginação do feed, autenticação, contexto do usuário, filtros e negações de autorização. Os fluxos gerais de autenticação, rota protegida, empresa ativa e Hub também permanecem nas suites de regressão e E2E do frontend.
