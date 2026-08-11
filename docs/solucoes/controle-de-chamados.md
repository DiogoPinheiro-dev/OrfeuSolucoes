# Controle de Chamados

## Objetivo

O Controle de Chamados reúne a abertura, o acompanhamento, o atendimento e a administração dos chamados da empresa ativa. A solução possui as seguintes funcionalidades registradas no Hub:

| Registry key | Tela |
|---|---|
| `controle-de-chamados.abrir-chamado` | Abrir chamado |
| `controle-de-chamados.meus-chamados` | Meus chamados |
| `controle-de-chamados.painel-atendimento` | Painel de atendimento |
| `controle-de-chamados.chamados-arquivados` | Chamados arquivados |
| `controle-de-chamados.dashboard` | Dashboard |
| `controle-de-chamados.relatorios` | Relatórios |
| `controle-de-chamados.categorias` | Categorias |
| `controle-de-chamados.tipos` | Tipos |
| `controle-de-chamados.prioridades` | Prioridades |
| `controle-de-chamados.responsaveis` | Responsáveis |
| `controle-de-chamados.sla` | SLA |
| `controle-de-chamados.emails-solucoes` | E-mails das soluções |

Cada tela é carregada pelo `RegistryKey` recebido do backend e usa a empresa ativa da sessão para delimitar os dados.

## Ciclo de vida

Os chamados utilizam os estados `ABERTO`, `EM_TRIAGEM`, `EM_ATENDIMENTO`, `PENDENTE`, `RESOLVIDO` e `ARQUIVADO`. Durante o atendimento, as transições gerais permitidas são:

| Estado atual | Próximos estados |
|---|---|
| Aberto | Em triagem ou em atendimento |
| Em triagem | Em atendimento ou pendente |
| Em atendimento | Em triagem ou pendente |
| Pendente | Em triagem ou em atendimento |

Resolver, arquivar e reabrir são ações próprias, submetidas às permissões e regras de responsabilidade do usuário. O backend valida o estado atual e a transição solicitada antes de persistir a mudança e registrar o histórico.

## Abertura

A abertura solicita assunto, descrição, categoria, tipo e prioridade de acordo com as opções ativas da empresa. A solução e a funcionalidade selecionadas determinam os responsáveis elegíveis. O solicitante pode selecionar um usuário ou grupo responsável, quando houver opções, ou abrir sem responsável quando a configuração permitir.

Também é possível incluir acompanhantes e anexos. Antes do envio, o frontend valida os campos obrigatórios; o backend repete as validações, confirma a elegibilidade dos vínculos e cria o histórico inicial do chamado.

## Listas e painel de atendimento

`Meus chamados` apresenta os registros relacionados ao usuário. O `Painel de atendimento` reúne a fila operacional disponível ao atendente, enquanto `Chamados arquivados` separa os registros encerrados do trabalho corrente.

As telas oferecem filtros por estado, categoria, prioridade, usuário responsável, grupo responsável, solicitante e situação de SLA. A ordenação inclui o vencimento do SLA. A visualização em Kanban permite mover um chamado entre estados compatíveis quando o usuário possui a ação dinâmica `alterar_status`; a mesma autorização é verificada no backend.

Falhas de carregamento, ausência de registros e nova tentativa são exibidas na área de conteúdo sem transformar um erro de consulta em lista vazia.

## Detalhe, mensagens e permissões

O detalhe concentra dados cadastrais, histórico, mensagens, anexos, acompanhantes e comandos operacionais. As ações são apresentadas conforme a relação do usuário com o chamado e as permissões dinâmicas da funcionalidade:

- `responder_chamado` e `responder_proprio_chamado`;
- `reabrir_chamado` e `reabrir_proprio_chamado`;
- `assumir_chamado`;
- `atribuir_chamado`;
- `transferir_chamado`;
- `alterar_status`;
- `alterar_prioridade`;
- `alterar_categoria`;
- `resolver_chamado`;
- `encerrar_chamado`.

Um acompanhante pode consultar o chamado, responder e anexar arquivos. Essa condição, isoladamente, não concede poderes de atribuição, transferência ou gestão do atendimento. Arquivamento e reabertura também consideram administração, responsabilidade direta e administração do grupo responsável.

## Anexos

Cada envio aceita até cinco arquivos, com tamanho máximo de 10 MB por arquivo. Os formatos permitidos são JPEG, PNG, PDF, DOCX e TXT. Tipo, tamanho e acesso ao chamado são verificados no backend; a interface apresenta a rejeição sem descartar os demais dados preenchidos.

## SLA

As regras de SLA definem prazos de primeira resposta e resolução para a combinação configurada de categoria, tipo e prioridade. A contagem pode usar tempo corrido (`CORRIDO`) ou dias úteis (`UTEIS`).

O chamado expõe as situações `SEM_SLA`, `NO_PRAZO`, `PERTO_DO_VENCIMENTO`, `ATRASADO` e `PAUSADO`. O serviço de SLA cria o snapshot aplicável ao chamado, calcula vencimentos e atualiza a situação usada no detalhe, nas filas, no dashboard e nos relatórios.

## Dashboard e relatórios

O dashboard apresenta totais de chamados abertos, em atendimento, pendentes, resolvidos, arquivados e atrasados no SLA, além dos tempos médios de primeira resposta e resolução. Rankings agrupam os resultados por prioridade, categoria e atendente.

Os relatórios permitem filtrar por período, atendente, categoria, prioridade, estado e situação de SLA. A consulta é paginada pelo servidor e os resultados podem ser exportados em CSV ou Excel. Se a consulta falhar, os filtros selecionados permanecem disponíveis para correção ou nova tentativa.

## Cadastros administrativos

Categorias, tipos, prioridades e regras de SLA seguem o padrão compartilhado de grade, modal e confirmação. As operações respeitam as permissões de visualizar, incluir, alterar e excluir da funcionalidade ativa. Quando o domínio exige preservação de histórico, a exclusão é representada por desativação.

O cadastro de responsáveis associa um usuário ou grupo às soluções e funcionalidades que ele atende. Essas associações alimentam as opções da abertura, da atribuição e da transferência. Registros vinculados ao histórico operacional são desativados em vez de removidos fisicamente.

## E-mails e notificações

O cadastro de e-mails das soluções utiliza autorização OAuth do Google com escopo de envio do Gmail. O estado da autorização é assinado e validado pelo backend. Uma conta principal deve estar ativa, e somente uma conta ativa pode ser a remetente principal.

Quando uma notificação configurada é enviada por e-mail, o serviço utiliza a conta principal ativa. O conteúdo HTML pode ser carregado do caminho configurado no ambiente ou do template padrão `server/email-templates/chamado.html`.

As notificações internas aparecem no cabeçalho com a quantidade não lida. O usuário pode marcar uma notificação ou todas como lidas; ao selecionar uma notificação de chamado, a aplicação navega para o respectivo detalhe.

## Arquitetura e integrações

No frontend, as telas são compostas em `client/src/components` e as operações Apollo ficam em `client/services/Chamados`. O módulo backend `server/src/modules/chamados` separa abertura, autorização, atendimento, mensagens, anexos, acompanhantes, responsáveis, configurações, SLA, dashboard, relatórios, notificações, e-mail e histórico em serviços especializados.

O resolver GraphQL recebe as operações da interface e a fachada de chamados coordena os serviços de domínio. A autorização é aplicada no backend e não depende da visibilidade dos botões no navegador.

## Erros e proteções

Consultas e mutações apresentam erros de validação, autorização e operação na própria tela. Ações destrutivas exigem confirmação. Estados de carregamento e processamento bloqueiam reenvios concorrentes, e falhas recuperáveis oferecem nova tentativa.

Os dados são sempre delimitados pela empresa ativa. Permissões de interface servem para orientar a experiência; o backend confirma acesso ao chamado, papel no atendimento, ação dinâmica, vínculos de responsável e transições de estado.

## Testes

A integração do Controle de Chamados é executada com:

```powershell
cd client
npm.cmd run test:integration:chamados
```

A cobertura automatizada inclui:

- abertura com responsável, grupo, acompanhantes, anexos e abertura sem responsável;
- validações e recuperação de falhas de carregamento;
- filas, filtros, Kanban e alteração autorizada de estado;
- resposta, assunção, atribuição, alterações cadastrais, resolução e reabertura;
- arquivamento e desarquivamento conforme responsabilidade e permissão;
- métricas, rankings, filtros de relatório e exportações;
- leitura, navegação e tratamento de erro das notificações;
- criação, alteração, validação, visualização e desativação dos cadastros administrativos;
- contas Google, confirmação de ações destrutivas e regras de responsável;
- bloqueio de ações quando a permissão necessária não está disponível.

Os fluxos de autenticação, rota protegida, seleção da empresa e composição do Hub permanecem cobertos pelas suites gerais de regressão e E2E.
