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

Os cinco cadastros usam `CrudGrid`, `CrudModal`, `ConfirmDialog` e seleção compartilhada. As grades exibem até cinco registros por página. A linha ativa alimenta alteração e visualização; checkboxes marcam registros para exclusão ou desativação, conforme a persistência real do domínio. Pesquisa, carregamento, erro, estado vazio, processamento e mensagens de sucesso são apresentados na própria tela.

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

Soluções inativas, exclusivas do administrador do sistema ou sistêmicas de acesso universal não são oferecidas para vínculo com grupos. Por isso, Documentação não aparece como checkbox: qualquer usuário autenticado recebe acesso à Central sem depender do grupo. Cada checkbox de ação possui um nome acessível contextual, composto pela ação e pela funcionalidade, mesmo quando o texto visual da opção permanece curto. Em cada rotina, a ação **Marcar todas** seleciona a funcionalidade, as permissões básicas e todas as ações dinâmicas exibidas; depois de concluir a seleção, o botão permanece desabilitado até que alguma permissão seja desmarcada. Um grupo marcado como padrão do sistema não pode ser excluído. Vínculos e permissões são sincronizados pelo backend quando o grupo é salvo.

## Empresas

O cadastro associa cada empresa às soluções e funcionalidades contratáveis disponíveis no Hub. Soluções inativas não podem ser contratadas por esse cadastro. Documentação é uma solução sistêmica de acesso universal e, portanto, não aparece como opção de contrato da empresa. A empresa também mantém os acessos gerais ainda presentes no contrato do sistema.

Criar, alterar ou remover empresas exige o administrador inicial do sistema. Ao criar uma empresa, o backend vincula os administradores do sistema, sincroniza os acessos selecionados e prepara as configurações padrão necessárias ao Controle de Chamados.

A empresa padrão do sistema não pode ser excluída. Ao remover outra empresa, o backend trata vínculos de usuários e impede que a operação deixe usuários comuns sem associação válida.

## Soluções

Uma solução define slug, nome, descrição, identificação visual, ordem, estado ativo, exibição no Hub e restrição ao administrador do sistema. O slug é único e identifica a solução nas rotas. A coluna de funcionalidades distingue quantas estão ativas e quantas estão cadastradas.

Soluções padrão preservam seus dados cadastrais e permitem alterar somente a ordem. O Controle de Horas permanece registrado como solução padrão inativa, fora do Hub e indisponível para empresas e grupos até existir implementação funcional própria.

As operações cadastrais de solução são restritas ao administrador do sistema. A exclusão é confirmada antes do envio e falhas de dependência retornadas pelo backend permanecem visíveis ao usuário.

## Funcionalidades

Uma funcionalidade pertence a uma solução e define slug, título, rótulo, descrição, ordem, estado ativo, `RegistryKey`, `providerKey`, versão compatível do provider e eventual restrição ao administrador do sistema. Também pode possuir ações específicas além das quatro permissões CRUD.

O `RegistryKey` preserva a identidade técnica usada por rotas e documentação. A implementação executável é selecionada exclusivamente pelo `providerKey` versionado no manifesto frontend. Uma funcionalidade sem provider conhecido ou com versão incompatível não pode ser publicada; se um contrato inconsistente chegar defensivamente ao navegador, nenhuma tela alternativa é executada. O catálogo atual usa providers desenvolvidos em código; não existe construtor no-code nem renderer declarativo.

Funcionalidades marcadas como padrão do sistema são protegidas contra alteração cadastral e exclusão; somente sua ordem pode ser alterada. Elas continuam visíveis para consulta, mas não podem ser marcadas nos checkboxes de exclusão. Funcionalidades personalizadas seguem as permissões recebidas para inclusão, alteração e exclusão.

As consultas e mutações de soluções reutilizam o mesmo fragmento GraphQL completo. Assim, uma atualização cadastral não substitui no cache as funcionalidades e ações já carregadas por objetos parciais.

## Composição do acesso ao Hub

Para uma funcionalidade aparecer ao usuário, o backend considera em conjunto:

1. empresa ativa da sessão;
2. soluções e funcionalidades liberadas para a empresa;
3. grupo do usuário;
4. soluções, funcionalidades e ações liberadas ao grupo;
5. flags de atividade, exibição no Hub e restrição administrativa.

O frontend normaliza o resultado preservando também `providerKey`, `providerVersion` e `RegistryKey`, além de `podeVisualizar`, `podeIncluir`, `podeAlterar`, `podeExcluir` e `acoes`. A permissão herdada da solução é apenas o primeiro limite: ela não concede automaticamente acesso às funcionalidades ou ações, que continuam dependendo dos vínculos e permissões próprios validados pelo backend. O administrador inicial pode ignorar as permissões do grupo, mas continua limitado às soluções contratadas pela empresa ativa. Configurador permanece reservado ao administrador inicial. Documentação fica disponível para qualquer usuário autenticado, independentemente de empresa, contrato ou grupo; a audiência declarada em cada artigo continua determinando quais conteúdos aparecem no catálogo.

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
- autenticação, rotas protegidas, Hub e troca de empresa nas suítes de regressão e E2E.
