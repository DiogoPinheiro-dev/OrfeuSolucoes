# Configurador

## Objetivo

O Configurador administra os cadastros que determinam identidade, empresas, acesso ao Hub e associação entre soluções e telas. A solução possui cinco funcionalidades ativas:

| Registry key | Tela |
|---|---|
| `configurador.cadastro-de-usuarios` | Cadastro de usuários |
| `configurador.cadastro-de-grupos` | Cadastro de grupos |
| `configurador.cadastro-de-empresas` | Cadastro de empresas |
| `configurador.cadastro-de-solucoes` | Cadastro de soluções |
| `configurador.cadastro-de-funcionalidades` | Cadastro de funcionalidades |

As telas são resolvidas pelo `RegistryKey` recebido do backend. Alterar somente o título ou o rótulo de uma funcionalidade não muda seu componente.

## Padrão das telas

Os cinco cadastros usam `CrudGrid`, `CrudModal`, `ConfirmDialog` e seleção compartilhada. A linha ativa alimenta alteração e visualização; checkboxes marcam registros para exclusão. Pesquisa, carregamento, erro, estado vazio, processamento e mensagens de sucesso são apresentados na própria tela.

Os botões incluir, alterar, visualizar e excluir respeitam as permissões da funcionalidade ativa. O backend repete a autorização e é a fonte de verdade para permitir a operação.

## Usuários

O cadastro mantém os dados de identificação e acesso do usuário, incluindo nome, login, e-mail, grupo, empresas vinculadas e controle de troca obrigatória de senha. Inclusão e alteração validam os campos antes do envio e apresentam erros gerais ou por campo devolvidos pelo serviço.

O usuário marcado como padrão do sistema não pode ser selecionado para exclusão. A proteção existe também no backend e não depende apenas do estado do botão na interface.

## Grupos

O grupo reúne:

- nome e descrição;
- acessos gerais disponíveis no cadastro;
- soluções liberadas;
- funcionalidades liberadas;
- permissões de visualizar, incluir, alterar e excluir por funcionalidade;
- permissões de ações dinâmicas vinculadas à funcionalidade.

Soluções exclusivas do administrador do sistema não são oferecidas para grupos comuns. Um grupo marcado como padrão do sistema não pode ser excluído. Vínculos e permissões são sincronizados pelo backend quando o grupo é salvo.

## Empresas

O cadastro associa cada empresa às soluções e funcionalidades disponíveis no Hub. A empresa também mantém os acessos gerais ainda presentes no contrato do sistema.

Criar, alterar ou remover empresas exige o administrador inicial do sistema. Ao criar uma empresa, o backend vincula os administradores do sistema, sincroniza os acessos selecionados e prepara as configurações padrão necessárias ao Controle de Chamados.

A empresa padrão do sistema não pode ser excluída. Ao remover outra empresa, o backend trata vínculos de usuários e impede que a operação deixe usuários comuns sem associação válida.

## Soluções

Uma solução define slug, nome, descrição, identificação visual, ordem, estado ativo, exibição no Hub e restrição ao administrador do sistema. O slug é único e identifica a solução nas rotas.

As operações cadastrais de solução são restritas ao administrador do sistema. A exclusão é confirmada antes do envio e falhas de dependência retornadas pelo backend permanecem visíveis ao usuário.

## Funcionalidades

Uma funcionalidade pertence a uma solução e define slug, título, rótulo, descrição, ordem, estado ativo, `RegistryKey` e eventual restrição ao administrador do sistema. Também pode possuir ações específicas além das quatro permissões CRUD.

Funcionalidades marcadas como padrão do sistema são protegidas contra alteração cadastral e exclusão. Elas continuam visíveis para consulta, mas não podem ser marcadas nos checkboxes de exclusão. Funcionalidades personalizadas seguem as permissões recebidas para inclusão, alteração e exclusão.

## Composição do acesso ao Hub

Para uma funcionalidade aparecer ao usuário, o backend considera em conjunto:

1. empresa ativa da sessão;
2. soluções e funcionalidades liberadas para a empresa;
3. grupo do usuário;
4. soluções, funcionalidades e ações liberadas ao grupo;
5. flags de atividade, exibição no Hub e restrição administrativa.

O frontend normaliza o resultado para `podeVisualizar`, `podeIncluir`, `podeAlterar`, `podeExcluir` e `acoes`. O administrador inicial possui acesso administrativo integral.

## Integrações

As telas usam serviços em:

- `client/services/Users`;
- `client/services/GruposUsuarios`;
- `client/services/Empresas`;
- `client/services/Solucoes`.

Os documentos GraphQL ficam em `client/services/graphql/operations.js`. No backend, os módulos de usuários, grupos, empresas e soluções aplicam persistência, sincronização de vínculos e autorização.

## Erros e proteções

As telas mantêm o último estado utilizável quando uma recarga falha e oferecem nova tentativa quando aplicável. Operações exibem erros de validação, autorização, conflito ou dependência enviados pelos serviços.

Registros padrão possuem motivo acessível no checkbox desabilitado. Ações sem permissão também ficam desabilitadas com a justificativa no título e no nome acessível.

## Testes

A integração do Configurador é executada com:

```powershell
cd client
npm.cmd run test:integration:configurador
```

A cobertura automatizada inclui:

- carregamento e recuperação após erro;
- bloqueio por ausência de permissão;
- proteção de usuários, grupos, empresas e funcionalidades padrão;
- inclusão, visualização, alteração e exclusão de soluções;
- inclusão, alteração e exclusão dos registros personalizados;
- persistência de erro de campo dentro do modal;
- contratos dos serviços Apollo;
- autenticação, rotas protegidas, Hub e troca de empresa nas suites de regressão e E2E.
