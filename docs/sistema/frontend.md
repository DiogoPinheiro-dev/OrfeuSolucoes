# Frontend

## Estrutura

O frontend é uma aplicação React servida pelo Vite. O roteamento fica em `client/src/main.jsx`, a sessão autenticada é mantida por `AuthProvider` e as chamadas GraphQL são executadas pelo Apollo Client.

As páginas de rota e as telas vinculadas às funcionalidades do Hub são carregadas sob demanda. O manifesto único em `client/src/auth/featureProviders.jsx` associa cada `providerKey` versionada ao seu loader lazy, às propriedades fixas da implementação e aos aliases históricos suportados. O `RegistryKey` permanece como identidade técnica para rota e documentação, sem depender do título apresentado ao usuário.

A navegação recebida do backend preserva `providerKey` e `providerVersion`. A página da funcionalidade resolve diretamente esse contrato no manifesto; provider ausente ou incompatível não executa outra tela por aproximação. Links antigos de Recursos e Grade de capacitação são aliases explícitos do provider atual de Planejamento de recursos.

Os componentes React coordenam estado e apresentação. Operações Apollo, montagem de documentos GraphQL e conversão de erros permanecem em `client/services`.

## Navegação e autorização

O Hub recebe do backend somente as soluções e funcionalidades disponíveis para a empresa e o usuário ativos. Documentação é a exceção sistêmica de acesso universal: aparece para qualquer usuário autenticado e não depende de vínculo com empresa ou grupo. A audiência de cada artigo continua sendo aplicada pelo catálogo da Central. Cada funcionalidade normalizada expõe as permissões:

- `podeVisualizar`;
- `podeIncluir`;
- `podeAlterar`;
- `podeExcluir`;
- ações dinâmicas retornadas em `acoes`.

O frontend usa essas permissões para ocultar ou desabilitar comandos. Essa verificação melhora a experiência, mas não substitui a autorização aplicada pelo backend.

O acesso efetivo é cumulativamente restritivo: a solução precisa estar publicada, ativa, disponível para a empresa e liberada ao grupo; depois, a funcionalidade também precisa estar publicada, ativa, contratada e visível ao grupo. A liberação da solução não concede automaticamente acesso às funcionalidades nem às ações. Administradores previstos pelas políticas do backend podem receber acesso integral, mas continuam sujeitos ao escopo e às restrições sistêmicas aplicáveis.

## Cadastros convencionais

Cadastros convencionais reutilizam os seguintes contratos:

- `CrudGrid`: cabeçalho, pesquisa, filtros, toolbar, tabela, estados de carregamento/erro/vazio e paginação;
- `CrudModal`: inclusão, alteração, visualização e exclusão;
- `ConfirmDialog`: confirmações simples, de atenção ou destrutivas;
- `useCrudSelection`: separação entre linha ativa e registros marcados para exclusão;
- hooks de erros de formulário: associação de mensagens gerais e mensagens por campo.

Na toolbar, a ordem padrão é incluir, alterar, visualizar e excluir. A linha ativa é usada para alteração ou visualização. Checkboxes são reservados para exclusão, inclusive múltipla quando suportada pela operação.

## Diálogos

`CrudModal` e `ConfirmDialog` compartilham o comportamento de diálogo:

- foco inicial dentro do diálogo;
- retenção do foco durante navegação por Tab;
- fechamento por Escape quando não há processamento;
- restauração do foco anterior;
- bloqueio da rolagem da página;
- bloqueio das ações durante processamento;
- confirmação de descarte quando um formulário alterado é fechado.

Os modos destrutivos e de atenção possuem variantes visuais próprias e mantêm mensagens acessíveis.

As abas compartilhadas do `CrudModal` preservam navegação pelas setas, Home e End. Conjuntos de até duas abas ocupam integralmente a largura disponível; conjuntos com três ou mais itens mantêm rolagem horizontal perceptível. Esse contrato é compartilhado pelos consumidores e não depende de CSS exclusivo de uma funcionalidade.

## Telas operacionais especializadas

Uma tela operacional mantém estrutura própria quando o `CrudGrid` não representa o fluxo sem perda de comportamento. Essas telas continuam reutilizando tokens, feedbacks, confirmações e diálogos compartilhados.

Exceções vigentes:

- Backlog: hierarquia, agrupamento, priorização posicional e paginação no servidor;
- Cronograma: Gantt, dependências e tabela equivalente para acesso textual;
- Relatórios de chamados: filtros analíticos, paginação e exportação;
- Planejamento de recursos: única funcionalidade com navegação principal por abas (`Recursos`, `Equipes` e `Planejamento`), persistida no parâmetro `tab` da URL;
- Orçamento: estrutura híbrida; categorias e custos usam `CrudGrid compact`, enquanto resumo, formulários e histórico de taxas permanecem especializados.

Capacidade não faz parte do sistema e não deve ser apresentada como módulo, indicador ou contrato.

## Estados e acessibilidade

As telas tratam explicitamente carregamento, erro, vazio, sucesso, processamento e somente leitura. Ações indisponíveis expõem o motivo no título e no nome acessível. Permissões por funcionalidade anunciam a ação e o contexto no nome acessível, evitando checkboxes homônimos. Tabelas compartilhadas oferecem navegação de linha por teclado, e componentes interativos preservam foco visível e rótulos acessíveis.
