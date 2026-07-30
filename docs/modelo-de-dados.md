# Modelo de dados

O modelo canônico está em
[`server/prisma/schema.prisma`](../server/prisma/schema.prisma). O datasource é
SQL Server e os nomes físicos são preservados com `@map` e `@@map`.

## Administração e acesso

| Modelo | Responsabilidade |
|---|---|
| `Usuario` | Identidade, senha, grupo e relações operacionais. |
| `GrupoUsuario` | Perfil geral e permissões. |
| `Empresa` | Tenant e liberações do produto. |
| `EmpresaUsuario` | Vínculo permitido entre usuário e empresa. |
| `Solucao` | Produto exibido no Hub. |
| `Funcionalidade` | Área navegável de uma solução. |
| `FuncionalidadeAcao` | Ação específica de uma funcionalidade. |
| `GrupoSolucao` | Liberação de solução para grupo. |
| `GrupoFuncionalidade` | Permissões CRUD por grupo. |
| `GrupoFuncionalidadeAcao` | Permissão de ação dinâmica. |
| `EmpresaSolucao` | Liberação de solução para empresa. |
| `EmpresaFuncionalidade` | Liberação de funcionalidade para empresa. |
| `Servico` | Catálogo comercial público. |

## Controle de Chamados

| Modelo | Responsabilidade |
|---|---|
| `Chamado` | Registro principal, estado, SLA e responsáveis. |
| `ChamadoSequencia` | Próximo número por empresa. |
| `ChamadoCategoria` | Classificação empresarial. |
| `ChamadoTipo` | Tipo configurável. |
| `ChamadoPrioridade` | Prioridade configurável. |
| `ChamadoSlaRegra` | Prazos associados à prioridade. |
| `ChamadoResponsavel` | Usuário ou grupo elegível. |
| `ChamadoResponsavelSolucao` | Elegibilidade por solução. |
| `ChamadoResponsavelFuncionalidade` | Elegibilidade detalhada. |
| `ChamadoAcompanhante` | Usuários que acompanham o chamado. |
| `ChamadoMensagem` | Resposta pública ou nota interna. |
| `ChamadoAnexo` | Metadados de arquivo. |
| `ChamadoHistorico` | Linha do tempo auditável. |
| `ChamadoNotificacao` | Notificação interna idempotente. |
| `GoogleEmailConta` | Conta Gmail e refresh token criptografado. |

### Invariantes de Chamados

- `numero` é único por empresa.
- Tipo e prioridade são referências persistidas, não textos livres.
- O SLA é capturado no chamado para preservar o prazo aplicado.
- Mensagens, anexos e histórico carregam `empresaId`.
- Notificações usam `eventoChave` única para evitar duplicação.
- Responsáveis podem ser usuários ou grupos e podem ter escopo funcional.

## Projetos

| Grupo | Modelos |
|---|---|
| Cadastro | `Projeto`, `ProjetoMembro` |
| Fundação operacional | `ProjetoEvento`, `ProjetoSequencia`, `ProjetoOperacaoIdempotente` |
| Trabalho e backlog | `ProjetoItem` |
| Dependências | `ProjetoItemDependencia` |
| Sprints | `ProjetoSprint`, `ProjetoSprintItem` |
| Compromissos | `ProjetoMarco`, `ProjetoMarcoItem`, `ProjetoEntrega`, `ProjetoEntregaItem` |
| Comunicação | `ProjetoAtualizacao`, `ProjetoAtualizacaoHistorico`, `ProjetoComentario`, `ProjetoAnexo` |
| Recursos | `Recurso` (cadastro empresarial), `ProjetoRecurso` (vínculo com projeto) |
| Planejamento de recursos | `ProjetoTarefa`, `ProjetoTarefaTaxaHistorico`, `ProjetoCapacidade`, `ProjetoAlocacao`; a alocação referencia `tarefaId` e preserva `atividade` como legado |
| Compatibilidade de recursos | `ProjetoCapacidadeLegado` preserva capacidades antigas que não podiam ser associadas com segurança a um único projeto |
| Financeiro | `ProjetoOrcamento`, `ProjetoOrcamentoCategoria`, `ProjetoCusto`, `ProjetoCustoTaxaHistorico` |

### Invariantes de Projetos

- A chave do projeto é única por empresa e não muda após criação.
- Somente participantes visualizam o projeto, exceto administrador.
- Um usuário aparece uma vez na participação operacional de cada projeto.
- Participações criadas pela alocação possuem origem `RECURSO`; registros anteriores permanecem com origem `EQUIPE`.
- Criar ou alterar o cadastro do projeto não cria recursos.
- Um usuário possui no máximo um `Recurso` por empresa e um vínculo por projeto.
- A identidade do usuário de `Recurso` é imutável; seu estado e os projetos vinculados podem ser alterados no Cadastro de recursos.
- `ProjetoRecurso` pode nascer no Cadastro de recursos; o Planejamento de recursos também administra sua ativação e desativação.
- Toda nova `ProjetoTarefa` pertence a um `ProjetoRecurso`; o vínculo opcional existe apenas para reconciliação de registros legados.
- Recurso e projeto da tarefa são imutáveis; descrição, estimativa, valor/hora, moeda, observação e situação podem ser alterados com controle de versão.
- Toda alteração de valor/hora ou moeda cria `ProjetoTarefaTaxaHistorico` na mesma transação.
- Capacidade e alocação sempre pertencem a um `ProjetoRecurso` e ao mesmo projeto.
- Toda nova `ProjetoAlocacao` referencia por `tarefaId` uma tarefa ativa do mesmo vínculo; uma tarefa pode possuir vários períodos de execução.
- `ProjetoAlocacao.atividade` é compatibilidade legada e não é o identificador canônico da execução.
- Tarefas e alocações legadas só são vinculadas automaticamente quando há correspondência única; casos ambíguos permanecem pendentes para correção manual.
- Número e chave do item são únicos por projeto.
- `backlogVersao` protege a priorização concorrente.
- Itens, sprints, compromissos, dependências e finanças usam versão.
- Dependências não podem formar ciclos.
- Um projeto possui no máximo uma sprint ativa.
- Um projeto possui no máximo um orçamento.
- Orçamento aprovado é somente leitura até reabertura.
- Custo associado a pessoa referencia um `ProjetoRecurso`; novos custos exigem recurso ativo.
- Eventos de projeto preservam entidade, evento, autor e dados.

## Identificadores

- Entidades operacionais usam principalmente UUID do SQL Server.
- Cadastros administrativos e configurações usam inteiros incrementais.
- Relações multiempresa incluem `empresaId` mesmo quando o registro também
  aponta para um projeto ou chamado.

## Datas, duração e valores

- Datas de planejamento são persistidas como `date` quando não representam
  um instante.
- Auditoria usa `DateTime`.
- Duração, capacidade, alocação e esforço usam minutos inteiros.
- Valores financeiros usam `Decimal(18,2)`.
- Taxa horária usa `Decimal(18,4)`.
- A camada GraphQL financeira transmite decimais como string para evitar perda
  de precisão em JavaScript.

## Exclusão e histórico

- Projetos, itens, dependências, marcos e entregas usam arquivamento lógico.
- Comentários de projeto usam exclusão lógica.
- Chamados chegam ao estado `ARQUIVADO`; mensagens e histórico são mantidos.
- Algumas tabelas de junção usam cascata porque não possuem significado fora
  do registro pai.
- Relações operacionais principais usam `NoAction` para impedir exclusões
  acidentais em cascata.

## Migrations

Cada alteração persistente deve possuir migration em
[`server/prisma/migrations`](../server/prisma/migrations). O schema atual não
substitui o histórico das migrations. Antes de implantação, valide status,
banco vazio e banco com dados representativos.
