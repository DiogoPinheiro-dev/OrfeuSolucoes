# Contratos operacionais de Projetos

Estes contratos são obrigatórios para módulos implementados e futuros da
solução Projetos.

## Contexto e identidade

### Empresa

- `empresaId` confiável vem do JWT.
- A entrada não pode escolher outra empresa para ampliar acesso.
- Toda consulta operacional filtra empresa e projeto.

### Projeto

- IDs de projeto e entidades operacionais são UUID.
- A chave do projeto é maiúscula, tem até dez caracteres e é única por
  empresa.
- A chave não muda após criação.
- Participação é resolvida como `RESPONSAVEL`, `MEMBRO` ou `OBSERVADOR`.

### Entidade

- Identificadores inteiros são reservados principalmente a cadastros e tabelas
  de junção.
- Identificadores externos nunca dispensam a validação de empresa/projeto.

### Recurso e projeto

- Criar ou alterar projeto nunca aloca recurso.
- O criador é o responsável padrão; o formulário de projeto não administra equipe.
- Um recurso nasce somente por cadastro explícito na funcionalidade Recursos.
- O usuário identifica o recurso empresarial e é imutável após o cadastro.
- Cadastro e alteração do recurso recebem um ou mais projetos existentes e sincronizam os vínculos `ProjetoRecurso`, mas não recebem capacidade, período, horas ou atividade.
- O Planejamento de recursos também cria, reativa ou desativa o vínculo do recurso com o projeto.
- A alocação cria participação operacional de origem `RECURSO` para reutilizar as regras de autorização existentes.
- Desativar o vínculo preserva custos, tarefas, capacidade, execuções e histórico.
- Tarefas, capacidade e execuções planejadas são mantidas exclusivamente pelo Planejamento de recursos.
- Orçamento apenas referencia vínculos de recursos cadastrados; não os cria nem os altera.
- Excluir o cadastro remove transacionalmente apenas vínculos sem dados operacionais; tarefas, capacidades, alocações e custos bloqueiam a operação.

### Tarefa de recurso

- O Planejamento de recursos não substitui `ProjetoItem` ou o backlog.
- Cada nova tarefa pertence a um `ProjetoRecurso` e contém a descrição textual livre da funcionalidade executada.
- A estimativa de conclusão é obrigatória, informada em horas na interface e persistida em minutos.
- Recurso e projeto são definidos pelo vínculo e não podem ser trocados após a criação; a descrição funcional pode ser revisada.
- Valor/hora é positivo, usa quatro casas decimais e sempre possui moeda de três letras.
- Alterar valor ou moeda registra histórico atômico com autor e instante.
- Recurso, vínculo ou projeto inativo não recebe nova tarefa ativa; registros anteriores podem ser desativados e consultados.
- Uma tarefa pode possuir vários períodos de execução planejada.
- Toda nova execução referencia uma tarefa ativa do mesmo `ProjetoRecurso`; `atividade` existe apenas como compatibilidade de dados legados.
- Tarefas e execuções legadas só são reconciliadas automaticamente quando existe uma correspondência única; ambiguidades permanecem pendentes para correção manual.
- A tela consolida capacidade, estimativa, execução, saldos, custo por moeda e riscos por vínculo.

O fluxo completo está em [Planejamento de recursos](planejamento-recursos.md).

## Datas e instantes

### Data civil

Datas de planejamento devem ser trocadas como `YYYY-MM-DD` e persistidas em
colunas SQL `date`. Exemplos: início/fim previsto, data de marco, período de
capacidade e alocação.

O backend interpreta a data civil a partir da meia-noite UTC para evitar que o
fuso altere o dia. A interface deve formatar como data, sem aplicar conversão
de instante local.

### Instante

Auditoria, criação, atualização, arquivamento, conclusão e edição são
instantes `DateTime`. O transporte GraphQL usa ISO 8601. A apresentação pode
converter para o fuso do usuário, sem modificar o valor persistido.

### Período

- Fim não pode ser anterior ao início.
- Sobreposição é inclusiva nas extremidades nas regras atuais de capacidade e
  alocação.
- Módulos devem reutilizar `ProjetoPeriodoService` para a validação comum.

## Duração e esforço

- Unidade persistida e transportada: minuto inteiro.
- Valores devem ser inteiros seguros e não negativos.
- Campos de DTO podem impor mínimo maior quando zero não tiver significado.
- Conversão para horas é apenas apresentação.
- Custo por hora deve converter minutos de forma explícita e testada.

Campos existentes: `estimativaMinutos`, `capacidadeMinutos`,
`alocacaoMinutos`, prazos de SLA e futuros apontamentos.

## Paginação

Contrato comum de Projetos:

- página inicial: 1;
- limite padrão: 20;
- limite mínimo: 1;
- limite máximo: 100.

Respostas paginadas devem expor itens, total, página e limite. Feed e painéis
podem adotar paginação própria quando o contrato público já estiver definido.

## Moeda, taxas e arredondamento

- Código da moeda: três letras maiúsculas, como `BRL`.
- Valores: decimal não negativo, escala de duas casas.
- Taxa horária: escala de quatro casas.
- Arredondamento: `ROUND_HALF_UP`.
- Transporte GraphQL: string decimal.
- Persistência: `Decimal(18,2)` ou `Decimal(18,4)`.
- Somatórios usam `Prisma.Decimal`, nunca ponto flutuante JavaScript.

Variação financeira atual é valor planejado menos valor realizado.

## Concorrência e versão

- Criação inicia em versão 1.
- Update ou delete recebe a versão lida pelo cliente.
- A operação filtra `id`, versão e escopo de segurança.
- Sucesso incrementa a versão.
- Nenhuma linha alterada gera conflito.
- Após conflito, o cliente recarrega e não repete automaticamente uma decisão.

O backlog usa `backlogVersao` para proteger a ordem da coleção. A versão de um
item não substitui a versão do backlog.

## Idempotência

Operações com risco de repetição recebem chave estável do cliente. O backend
combina projeto, usuário, operação e chave e compara o hash do payload.

- Repetição idêntica concluída devolve a resposta anterior.
- Chave reutilizada para outro payload gera conflito.
- Operação em andamento gera conflito.
- Estado da operação é `PROCESSANDO`, `CONCLUIDA` ou `FALHOU`.

Idempotência deve ser usada dentro de fluxo transacional consistente.

## Arquivamento e exclusão

- Projeto arquivado: leitura permitida, mutações bloqueadas.
- Item, marco, entrega e dependência: arquivamento lógico e reativação.
- Comentário: exclusão lógica com moderador e instante.
- Anexo de projeto: exclusão lógica de metadados e remoção controlada do
  arquivo.
- Histórico e auditoria nunca são apagados pela operação de domínio.

Uma tela deve comunicar modo somente leitura e não apenas esconder botões.

## Auditoria

Mutações relevantes registram entidade, ID, evento, usuário e dados úteis. O
evento deve usar nome estável, em maiúsculas, e não depender do texto exibido
na interface.

Não registrar senha, JWT, token Google, conteúdo binário ou dado financeiro
que não seja necessário para rastreabilidade.

## Autorização

Toda operação segue esta ordem:

1. JWT válido;
2. empresa ativa;
3. funcionalidade visível;
4. ação permitida;
5. projeto pertence à empresa;
6. projeto visível ao usuário;
7. papel permitido;
8. projeto não arquivado para mutação;
9. autoria ou regra específica, quando aplicável.

A matriz completa está em [Matriz de permissões](matriz-permissoes.md).

## GraphQL

- Resolvers permanecem finos.
- DTOs validam forma, tamanho, enum e identificador.
- Serviços executam autorização e regras de negócio.
- Tipos de painel expõem permissões efetivas.
- Decimais são strings e datas usam os contratos deste documento.
- Campos públicos não devem ser renomeados por refatoração interna.
- O schema gerado deve acompanhar o código do resolver.

## Erros

| Categoria | Uso |
|---|---|
| Bad request | Entrada ou transição inválida. |
| Forbidden | Usuário autenticado sem ação/papel. |
| Not found | Registro ausente ou invisível. |
| Conflict | Versão, backlog ou idempotência concorrente. |

Erros de campo usam `fieldErrors`. Mensagens devem indicar a ação corretiva
sem expor dados de outra empresa.

## Transações

Use transação quando uma decisão depende de múltiplas gravações ou quando
auditoria, histórico e vínculo precisam ser atômicos. Validações que possam
mudar até a escrita devem ser repetidas ou protegidas dentro da transação.

## Contrato de teste

Cada módulo novo deve cobrir:

- caso principal;
- empresa diferente;
- usuário sem a funcionalidade/ação;
- observador tentando mutação;
- projeto arquivado;
- conflito de versão ou coleção;
- auditoria;
- validações de datas/valores;
- contrato GraphQL da borda;
- jornada de interface quando houver infraestrutura disponível.

Alterações de construtores devem atualizar o grafo manual do teste de
integração.
