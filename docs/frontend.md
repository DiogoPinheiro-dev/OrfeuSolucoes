# Frontend

## Inicialização e rotas

Entrada: [`client/src/main.jsx`](../client/src/main.jsx).

Providers:

- `ApolloProvider` para GraphQL;
- `AuthProvider` para sessão e empresa;
- `RouterProvider` para navegação.

Rotas públicas:

- `/`: apresentação e entrada;
- `/login`: escolha/autenticação de empresa;
- `/ecommerce`: catálogo público.

Rotas protegidas:

- `/hub`;
- `/hub/:slug`;
- `/hub/:slug/:areaSlug`;
- `/hub/:slug/:areaSlug/:itemId`.

`ProtectedRoute` aguarda a restauração da sessão e redireciona usuário não
autenticado.

## Sessão e Apollo

`AuthContext` mantém usuário, autenticação, troca de empresa e alteração de
senha. O cliente guarda token e usuário no `localStorage`, consulta `me` para
restaurar a sessão e limpa o cache ao trocar empresa ou sair.

O Apollo Client usa `VITE_GRAPHQL_URL`, envia credenciais e adiciona Bearer
quando existe token local. A política de cache do histórico de chamados evita
substituir uma lista já carregada por uma resposta vazia transitória.

## Hub e registro de telas

O fluxo é:

1. `myHubNavigation` retorna soluções e funcionalidades permitidas;
2. `normalizeSolutions` normaliza o contrato;
3. `SolutionWorkspace` apresenta a solução;
4. `hubConfig.js` converte `registryKey` em chave local;
5. `SolutionFeaturePage` seleciona o componente.

Funcionalidades ativas com tela:

| Solução | Telas |
|---|---|
| Configurador | usuários, grupos, empresas, soluções e funcionalidades |
| Chamados | abertura, meus chamados, fila, arquivados, dashboard, relatórios, categorias, tipos, prioridades, responsáveis, SLA e e-mail |
| Projetos | cadastro, backlog, sprints, marcos/entregas, cronograma, comunicação, recursos, planejamento de recursos unificado e orçamento |

Quando a funcionalidade existe no Hub sem componente registrado, a página
exibe uma mensagem de ausência de tela. Funcionalidades futuras de Projetos
permanecem inativas no backend.

## Camada de serviços

`client/services` concentra:

- operações GraphQL compartilhadas;
- adaptação de respostas;
- normalização de erros;
- chamadas HTTP de anexos e exportações.

Componentes não devem duplicar contratos GraphQL. Uma alteração deve atualizar
a operação central e o serviço do domínio.

`ProjectResourceManagement` lista recursos da empresa e mantém usuário, estado e
os projetos escolhidos por checkboxes dentro do modal, sem seletor de projeto no cabeçalho. `ProjectResourcePlanningManagement` unifica vínculos, capacidade, tarefas e execuções planejadas. Suas visões Recursos e projetos e Tarefas usam `CrudGrid`; tabelas internas e históricas usam a variante `compact`, com seleção compartilhada, toolbar padronizada e `ConfirmDialog` para exclusões.
`ProjectBudgetManagement` mantém apenas orçamento, categorias e custos; seu
seletor utiliza vínculos ativos de recursos. O cadastro de projeto não possui aba
Equipe nem dispara alocação automática.

## Componentes e estilos

Padrões compartilhados:

- `CrudGrid` e `crudGrid.css` para listagens, incluindo a variante `compact` em modais e seções;
- `useCrudSelection` para sincronizar linha ativa e checkboxes destinados à exclusão;
- `CrudModal` e `crudModal.css` para formulários;
- `ConfirmDialog` para ações destrutivas;
- `FormFieldError` para erros de campo;
- `CustomDropdown` e `FieldHelp` para formulários.

Telas específicas devem reutilizar esses contratos e manter CSS sob uma
classe raiz da funcionalidade. Alterações locais de uma tela não devem mudar
componentes compartilhados sem necessidade comprovada.

## Permissões na interface

O frontend recebe permissões CRUD e ações dinâmicas. `canUseFeatureAction`
normaliza o identificador e resolve:

- ações específicas retornadas pelo Hub;
- fallback CRUD legado;
- bypass visual do administrador.

Nos módulos de Projetos, painéis também retornam permissões efetivas que já
consideram papel e arquivamento. Mesmo assim, toda mutação continua sujeita ao
backend.

## Estado e atualização de dados

- Operações críticas usam `fetchPolicy: network-only` ou refetch explícito.
- Alterações versionadas devem enviar a versão apresentada pela consulta.
- Após conflito, a interface deve recarregar antes de nova tentativa.
- Troca de empresa limpa o cache Apollo para impedir mistura de tenants.
- Uploads e downloads usam `VITE_API_URL` porque não trafegam pelo GraphQL.

## Dívidas conhecidas

- O mapa de `registryKey` e o mapa de componentes ficam em arquivos distintos.
- As telas são importadas estaticamente, aumentando o bundle inicial.
- O build atual alerta para bundle principal acima de 500 kB.
- Não existe script de teste frontend.

Esses itens não impedem o funcionamento atual, mas devem ser tratados na
validação integrada e nas próximas evoluções arquiteturais.

## Checklist de uma nova tela

1. Criar ou ativar a funcionalidade no backend.
2. Definir `registryKey` estável.
3. Adicionar operação GraphQL e serviço.
4. Criar componente e CSS escopado.
5. Registrar a chave no Hub e o componente na página.
6. Respeitar permissões retornadas.
7. Tratar loading, vazio, erro, conflito e somente leitura.
8. Validar lint, build e jornada manual.
9. Atualizar a documentação.
