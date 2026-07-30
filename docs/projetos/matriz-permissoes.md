# Matriz de permissões de Projetos

Esta matriz descreve o comportamento implementado. A permissão final é a
interseção entre acesso funcional, visibilidade, papel e estado do projeto.

## Pré-condições globais

| Condição | Usuário comum | Administrador do sistema |
|---|---|---|
| JWT válido | Obrigatória | Obrigatória |
| Empresa ativa | Obrigatória | Obrigatória conforme o caso de uso |
| Solução e funcionalidade | Obrigatórias | Bypass |
| Ação funcional | Obrigatória | Bypass |
| Participar do projeto | Obrigatória | Bypass |
| Projeto não arquivado para mutação | Obrigatória | Obrigatória nos módulos operacionais |

Grupo com acesso integral recebe bypass funcional do Hub, mas ainda precisa
participar do projeto e possuir papel compatível.

Legenda:

- `V`: permitido com ação funcional correspondente;
- `R`: somente responsável, com ação funcional;
- `E`: responsável ou membro executor, com ação funcional;
- `N`: não permitido;
- `A`: administrador do sistema.

## Cadastro de projetos

| Operação | Responsável | Membro | Observador | Admin | Ação funcional |
|---|---:|---:|---:|---:|---|
| Visualizar | V | V | V | A | `visualizar` |
| Criar projeto | fora do papel | fora do papel | fora do papel | A | `incluir` |
| Alterar cadastro | E | E | N | A | `alterar` |
| Gerenciar equipe pela API de compatibilidade | R | N | N | A | `gerenciar_membros` |
| Alterar situação | E | E | N | A | `alterar_status` |
| Arquivar | R | N | N | A | `excluir` |
| Reativar | R | N | N | A | `reativar_projeto` |

O responsável do projeto é sempre considerado `RESPONSAVEL`, mesmo que também
exista relação de equipe. Reabertura de projeto concluído/cancelado para
planejado exige responsável ou administrador.

## Itens e backlog

| Operação | Responsável | Membro | Observador | Admin | Ação funcional |
|---|---:|---:|---:|---:|---|
| Visualizar | V | V | V | A | `visualizar` |
| Criar item | E | E | N | A | `incluir` |
| Alterar item | E | E | N | A | `alterar` |
| Alterar status | E | E | N | A | `alterar_status` |
| Arquivar item | E | E | N | A | `excluir` |
| Reativar item | E | E | N | A | `alterar` |
| Priorizar backlog | E | E | N | A | `priorizar` |

O responsável atribuído a um item precisa pertencer à empresa e ser
responsável ou membro executor do projeto. Observador não pode ser executor.

## Sprints

| Operação | Responsável | Membro | Observador | Admin | Ação |
|---|---:|---:|---:|---:|---|
| Visualizar | V | V | V | A | `visualizar` |
| Criar | E | E | N | A | `incluir` |
| Editar | E | E | N | A | `alterar` |
| Planejar escopo | E | E | N | A | `planejar` |
| Iniciar | E | E | N | A | `iniciar` |
| Concluir | E | E | N | A | `concluir` |
| Cancelar | E | E | N | A | `cancelar` |

## Marcos e entregas

| Operação | Responsável | Membro | Observador | Admin | Ação |
|---|---:|---:|---:|---:|---|
| Visualizar | V | V | V | A | `visualizar` |
| Criar | E | E | N | A | `incluir` |
| Alterar | E | E | N | A | `alterar` |
| Arquivar | E | E | N | A | `excluir` |
| Reativar | E | E | N | A | `alterar` |

A ação `aprovar` está reservada no catálogo de funcionalidades. O fluxo atual
de entrega usa status e alteração; aprovação separada deve ser implementada
explicitamente antes de ser documentada como operação existente.

## Cronograma e dependências

| Operação | Responsável | Membro | Observador | Admin | Ação |
|---|---:|---:|---:|---:|---|
| Visualizar Gantt | V | V | V | A | `visualizar` |
| Criar/arquivar/reativar dependência | E | E | N | A | `alterar` |
| Editar datas | E | E | N | A | `editar_datas` |

## Comunicação

| Operação | Responsável | Membro | Observador | Admin | Ação |
|---|---:|---:|---:|---:|---|
| Visualizar feed | V | V | V | A | `visualizar` |
| Publicar atualização | E | E | N | A | `incluir` |
| Editar atualização própria | E | E | N | A | `alterar` |
| Editar atualização alheia | E | E | N | A | `moderar` |
| Comentar | E | E | N | A | `comentar` |
| Editar/excluir comentário próprio | E | E | N | A | `comentar` |
| Editar/excluir comentário alheio | E | E | N | A | `moderar` |
| Enviar anexo | E | E | N | A | `gerenciar_anexos` |
| Excluir anexo alheio | E | E | N | A | `moderar` |

Autoria é verificada além da ação funcional.

## Recursos

Recursos são um cadastro empresarial e não dependem do papel do operador em um
projeto específico.

| Operação | Ação funcional | Escopo |
|---|---|---|
| Visualizar recursos | `visualizar` | Empresa do JWT |
| Cadastrar recurso e vinculá-lo a projetos | `incluir` | Empresa do JWT; projetos não arquivados |
| Alterar situação ou sincronizar vínculos | `alterar` | Empresa do JWT; novos vínculos exigem projetos não arquivados |
| Excluir recurso sem dependências operacionais | `excluir` | Empresa do JWT |

O usuário é escolhido entre todos os usuários vinculados à empresa e não precisa
ter acesso ao módulo Projetos; depois do cadastro, ele não pode ser trocado. Um ou
mais projetos são escolhidos por checkboxes dentro do modal; capacidade, períodos,
horas e atividade não fazem parte desse formulário. Na exclusão, vínculos simples
com projetos são removidos de forma transacional. A operação é recusada quando
existem tarefas, capacidades, alocações ou custos vinculados ao recurso.

## Cadastro de tarefas

O cadastro possui autorização própria no escopo da empresa ativa e não depende de
papel em um projeto específico.

| Operação | Ação funcional | Regra adicional |
|---|---|---|
| Consultar tarefas e recursos | `visualizar` | Empresa do JWT |
| Cadastrar descrição funcional e taxa | `incluir` | Recurso ativo e texto funcional obrigatório |
| Alterar funcionalidade, taxa, moeda, observação ou situação | `alterar` | Recurso permanece imutável |
| Excluir tarefa | `excluir` | ID, empresa e versão devem coincidir |

## Grade de capacitação

A grade possui autorização própria, separada do Cadastro de recursos.

| Operação | Ação funcional | Escopo |
|---|---|---|
| Visualizar grade e histórico | `visualizar` | Empresa do JWT |
| Alocar recurso a projeto | `incluir` | Recurso ativo e projeto não arquivado |
| Ativar/desativar alocação | `alterar` | Empresa do JWT; ativação exige recurso/projeto ativos |
| Incluir capacidade ou execução | `incluir` | Recurso/vínculo ativos e projeto não arquivado |
| Alterar capacidade ou execução | `alterar` | Recurso/vínculo ativos e projeto não arquivado |
| Excluir capacidade ou execução | `excluir` | Projeto não arquivado |

Ter acesso ao cadastro de recursos não concede automaticamente acesso de edição
à grade, e o inverso também não ocorre.

## Orçamento

| Operação | Responsável | Membro | Observador | Admin | Ação |
|---|---:|---:|---:|---:|---|
| Abrir a funcionalidade | V | V | V | A | `visualizar` |
| Visualizar financeiro | V | V | V | A | `visualizar_financeiro` |
| Gerenciar orçamento/custos | R | N | N | A | `gerenciar_financeiro` |
| Aprovar/reabrir orçamento | R | N | N | A | `aprovar_orcamento` |

Sem `visualizar_financeiro`, os dados financeiros ficam nulos. A ação pode ser
concedida a observador para consulta; mutações continuam exclusivas do
responsável. O seletor de custo consulta os recursos cadastrados sem conceder
permissões para administrá-los.

## Projeto arquivado

| Operação | Resultado |
|---|---|
| Consultar cadastro e painéis | Permitido conforme visibilidade |
| Alterar dados operacionais | Negado |
| Criar entidade operacional | Negado |
| Editar, arquivar ou reativar entidade filha | Negado |
| Reativar o próprio projeto | Permitido ao responsável com ação, ou admin |

## Funcionalidades futuras

As ações abaixo existem no catálogo, mas não possuem casos de uso ativos:

- horas: `apontar`, `aprovar_horas`, `reabrir_horas`;
- templates: `publicar`, `instanciar`;
- portfólio: `visualizar_financeiro`.

Não considere uma ação reservada como funcionalidade entregue.

## Como manter esta matriz

Qualquer mudança em:

- `projeto-authorization.service.ts`;
- serviço de autorização especialista;
- `projeto-feature-definitions.ts`;
- DTO de permissões efetivas;
- regras de autoria ou arquivamento;

deve atualizar esta matriz e os testes positivos/negativos correspondentes.
