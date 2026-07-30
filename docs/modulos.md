# Módulos do sistema

## Autenticação

Local: [`server/src/modules/auth`](../server/src/modules/auth)

Responsabilidades:

- login e descoberta das empresas disponíveis;
- emissão e renovação de contexto JWT;
- cookie de autenticação;
- troca de empresa;
- consulta do usuário atual;
- alteração de senha e encerramento de sessão.

O JWT pode ser extraído do cookie ou do Bearer token. A empresa selecionada é
incorporada ao token e usada pelos demais módulos.

## Usuários

Local: [`server/src/modules/users`](../server/src/modules/users)

- cadastro e alteração de usuário;
- senha e normalização de login/e-mail;
- vínculos com empresas e grupo;
- consulta e exclusão protegida;
- levantamento de dependências antes da exclusão.

`UsersService` delega catálogo, senha, empresa, consulta e dependências a
serviços especialistas.

## Empresas

Local: [`server/src/modules/empresas`](../server/src/modules/empresas)

- CRUD de empresas;
- liberação de soluções e funcionalidades;
- vínculo com usuários;
- criação das configurações padrão de chamados;
- proteção de empresas padrão do sistema.

## Grupos de usuários

Local: [`server/src/modules/grupos-usuarios`](../server/src/modules/grupos-usuarios)

- CRUD de grupos;
- permissões gerais e CRUD;
- soluções e funcionalidades liberadas;
- ações dinâmicas por funcionalidade;
- bootstrap de grupos padrão.

## Soluções, funcionalidades e Hub

Local: [`server/src/modules/solucoes`](../server/src/modules/solucoes)

- catálogo de soluções e funcionalidades;
- ações configuráveis;
- autorização central por ação;
- liberação por empresa e grupo;
- cálculo da navegação do Hub;
- bootstrap do Configurador, Chamados e Projetos.

O Hub usa a interseção empresa/grupo. Funcionalidades inativas não são
retornadas ao usuário.

## Serviços

Local: [`server/src/modules/servicos`](../server/src/modules/servicos)

Catálogo simples usado pela área pública, com título, descrição, valor,
desconto e vendas.

## Controle de Chamados

Local: [`server/src/modules/chamados`](../server/src/modules/chamados)

`ChamadosService` funciona como fachada para:

- abertura e numeração por empresa;
- filtros e paginação;
- autorização e atendimento;
- responsáveis por usuário ou grupo;
- acompanhantes;
- mensagens públicas e notas internas;
- anexos;
- status e histórico;
- categorias, tipos e prioridades;
- SLA;
- notificações;
- dashboard e relatórios;
- e-mail pela Gmail API.

### Estados do chamado

Estados existentes: `ABERTO`, `EM_TRIAGEM`, `EM_ATENDIMENTO`, `PENDENTE`,
`RESOLVIDO` e `ARQUIVADO`.

Transições operacionais gerais:

| Origem | Destinos gerais |
|---|---|
| `ABERTO` | `EM_TRIAGEM`, `EM_ATENDIMENTO` |
| `EM_TRIAGEM` | `EM_ATENDIMENTO`, `PENDENTE` |
| `EM_ATENDIMENTO` | `EM_TRIAGEM`, `PENDENTE` |
| `PENDENTE` | `EM_TRIAGEM`, `EM_ATENDIMENTO` |

Resolução, reabertura e arquivamento possuem casos de uso próprios.

### SLA

O snapshot de SLA é escolhido na abertura conforme empresa e prioridade. Os
estados são `SEM_SLA`, `NO_PRAZO`, `PERTO_DO_VENCIMENTO`, `ATRASADO` e
`PAUSADO`. Prazos e tempo pausado ficam persistidos no chamado.

## Projetos

Local: [`server/src/modules/projetos`](../server/src/modules/projetos)

`ProjetosService` é a fachada pública. A implementação está separada em
catálogo, consulta, equipe, ciclo de vida, chave, autorização, itens, backlog,
sprints, marcos, entregas, cronograma, comunicação, recursos, planejamento de
recursos e orçamento.

### Cadastro e participação operacional

- chave imutável, em maiúsculas e única por empresa;
- o criador é o responsável padrão;
- o formulário de projeto não cadastra ou altera equipe;
- papéis `RESPONSAVEL`, `MEMBRO` e `OBSERVADOR`;
- alocar um recurso cria sua participação operacional como membro; desalocar remove apenas a participação criada por recurso;
- visibilidade restrita aos participantes, exceto administrador;
- arquivamento lógico e reativação;
- saúde manual `EM_DIA`, `EM_RISCO` ou `ATRASADO`.

Situações: `RASCUNHO`, `PLANEJADO`, `EM_ANDAMENTO`, `PAUSADO`, `CONCLUIDO` e
`CANCELADO`. As transições são validadas por policy.

### Itens e backlog

- tipos `TAREFA`, `HISTORIA`, `BUG` e `MELHORIA`;
- prioridades `BAIXA`, `MEDIA`, `ALTA` e `CRITICA`;
- hierarquia pai/subtarefas;
- sequência e chave imutável por projeto;
- responsável pertencente à equipe executora;
- esforço em minutos;
- versionamento e histórico;
- priorização persistente protegida por `backlogVersao`.

### Sprints

- estados `PLANEJADA`, `ATIVA`, `CONCLUIDA` e `CANCELADA`;
- somente uma sprint ativa por projeto;
- snapshot do escopo ao iniciar e ao concluir;
- histórico de itens adicionados ou retirados;
- destino explícito dos itens incompletos.

### Marcos, entregas e cronograma

- marcos vinculados a itens e entregas;
- entregas com resultado esperado e critérios de aceite;
- progresso derivado dos itens vinculados;
- atraso calculado por data e estado;
- dependências direcionais entre itens, com prevenção de ciclos;
- visão Gantt consolidando itens, marcos e entregas;
- alteração confirmada de datas com versão.

### Comunicação

- atualizações com saúde percebida;
- histórico imutável de edições;
- comentários em atualizações ou itens;
- moderação e exclusão lógica de comentários;
- anexos com autorização no upload e download;
- feed cronológico agregando eventos do projeto.

### Recursos

- cadastro empresarial único por usuário;
- formulário com identidade do usuário, múltiplos projetos existentes e situação ativa/inativa;
- nenhum recurso é criado ou alocado pelo cadastro do projeto;
- identidade do usuário imutável após o cadastro do recurso;
- ativação e desativação protegidas por versão;
- inclusão e alteração sincronizam os vínculos `ProjetoRecurso`, sem cadastrar capacidade ou tarefa;
- exclusão transacional dos vínculos simples, bloqueada por tarefas, capacidades, alocações ou custos;
- custos continuam ligados ao vínculo do recurso com o projeto.

### Planejamento de recursos

- área operacional única para vínculos, capacidade, tarefas e execuções planejadas;
- visões selecionáveis Recursos e projetos e Tarefas dentro da mesma funcionalidade;
- grade consolidada por `ProjetoRecurso`, com capacidade, estimativa, planejamento, saldos, custo e risco;
- CRUD de tarefas com pesquisa, filtros, inclusão, alteração, visualização e exclusão protegida;
- modal padronizado com abas Cadastro, Capacidade, Tarefas e Planejamento;
- tarefa associada ao vínculo entre recurso e projeto, com descrição textual, estimativa, valor/hora, moeda, observação e histórico de taxa;
- uma tarefa pode receber vários períodos de execução;
- cada nova execução referencia uma tarefa ativa do mesmo vínculo;
- saldo de capacidade, saldo da tarefa, percentual de uso e sobreplanejamento calculados pelo backend;
- registros históricos continuam consultáveis quando recurso, vínculo ou projeto estiver inativo;
- tarefas ou execuções legadas ambíguas aparecem pendentes para reconciliação manual;
- a funcionalidade canônica mantém o slug `grade-de-capacitacao`;
- `cadastro-de-tarefas` fica inativa, preserva a rota como redirecionamento e tem suas permissões consolidadas;
- serviço de composição reutiliza os especialistas de tarefas e grade, mantendo a fachada pública fina.

Detalhes de modelo, cálculos e compatibilidade estão em
[Planejamento de recursos](projetos/planejamento-recursos.md).

### Orçamento

- orçamento único por projeto;
- categorias financeiras;
- custos fixos ou associados a recurso previamente cadastrado;
- valores planejado, comprometido e realizado;
- taxa horária com histórico;
- aprovação e reabertura do orçamento;
- autorização e tela independentes da gestão de recursos.

### Funcionalidades pendentes

`horas-do-projeto`, `templates-de-projeto` e `portfolio-de-projetos` estão
reservadas, mas inativas. Não possuem modelo, resolver, serviço ou tela.

## Dependências entre módulos

| Módulo consumidor | Dependências principais |
|---|---|
| Autenticação | Usuários, empresas e soluções |
| Hub | Soluções, funcionalidades, grupos e empresas |
| Chamados | Usuários, grupos, empresas, soluções e funcionalidades |
| Projetos | Usuários, empresas, soluções e funcionalidades |
| Frontend | Contratos GraphQL, Hub e endpoints HTTP |
