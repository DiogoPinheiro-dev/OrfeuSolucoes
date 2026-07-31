# Testes e validação

## Camadas existentes

### Unitários

Comando no backend: `npm.cmd test`.

Testes unitários atuais cobrem o health resolver e serviços selecionados de
categorias, dashboard e relatórios de chamados.

### Integração

Comando: `npm.cmd run test:integration`.

O arquivo principal é
[`backend-flows.integration-spec.ts`](../server/test/backend-flows.integration-spec.ts).
Ele instancia manualmente a árvore de serviços e usa persistência Prisma em
memória simulada.

Cobertura relevante:

- usuários, grupos, empresas, soluções e Hub;
- fluxos de chamados, permissões, responsáveis, acompanhantes e anexos;
- tipos, prioridades, categorias, SLA, notificações e e-mail;
- cadastro de projetos e matriz de autorização;
- fundação operacional, itens e backlog;
- sprints, marcos, entregas, dependências e cronograma;
- comunicação, incluindo paginação do feed além do antigo limite de 200 registros;
- cadastro de recursos com múltiplos projetos selecionados no próprio formulário e exclusão segura de vínculos sem dados operacionais;
- cadastro de tarefas por recurso, funcionalidade textual editável, estimativa positiva, versão e histórico da taxa;
- Grade de capacitação, descrição de execução, capacidade e sobrealocação;
- orçamento, categorias, custos e aprovação.

Esse harness valida serviços, não SQL Server real, transporte GraphQL ou
interface. Mudanças de construtor devem atualizar a montagem manual.

### E2E

Comando: `npm.cmd run test:e2e`.

- `app.e2e-spec.ts` cobre a aplicação e jornadas de Chamados.
- `projetos.e2e-spec.ts` cobre a borda GraphQL do cadastro de Projetos e a paginação do feed de comunicação.

O Planejamento 16 e o Cadastro de tarefas possuem verificação de proteção dos resolvers separados e
integração de serviço. Os testes confirmam que a criação do projeto deixa equipe
e recursos vazios, que o criador se torna responsável e que cadastrar/alterar o
recurso sincroniza somente os vínculos escolhidos, sem criar capacidade ou
alocação. A exclusão remove vínculos simples e preserva registros com dependências
operacionais. A Grade cria ou desativa os vínculos e suas participações
operacionais, além de confirmar capacidade, atividade planejada e sobrealocação.
Ainda não há uma jornada financeira GraphQL completa.

### Frontend

Existem lint e build, mas não uma suíte automatizada. Validação de interface é
manual.

## Validações por mudança

### Documentação

- links relativos válidos;
- arquivos UTF-8;
- termos e nomes iguais aos contratos atuais;
- `git diff --check`.

### Backend ou banco

- `prisma validate`;
- `prisma migrate status`;
- build;
- unitários proporcionais à mudança;
- integração;
- E2E quando houver contrato de borda;
- ensaio de migration quando aplicável.

### Frontend

- lint;
- build;
- jornada manual da funcionalidade;
- estados de permissão, vazio, carregamento, erro e conflito.

## Último snapshot documentado

Em 31/07/2026, após a paginação no servidor do feed de Comunicação do projeto:

| Validação | Resultado |
|---|---|
| Prisma validate | aprovado |
| Prisma migrate status | 59 migrations; banco configurado atualizado |
| Backend build | aprovado |
| Unitários | 6 de 6 |
| Integração | 33 de 33 |
| E2E | 14 de 14 |
| Frontend lint | aprovado |
| Frontend build | aprovado |
| Validação visual | não executada nesta alteração; lint, build e contrato GraphQL aprovados |
| Links Markdown | nenhum destino relativo ausente |
| Diff check | aprovado, com avisos de normalização LF/CRLF |

O build frontend gerou aviso para bundle principal de aproximadamente 866 kB.

## Lacunas

- ausência de testes frontend;
- cobertura GraphQL de Projetos ainda parcial, concentrada no cadastro e na paginação da comunicação;
- ausência de jornada GraphQL completa de recursos, tarefas, grade e orçamento;
- integração em memória não substitui validação em SQL Server;
- testes de volume de backlog, Gantt e agregações ainda pendentes;
- validação integrada final depende dos Planejamentos 17 a 19.
