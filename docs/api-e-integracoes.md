# API e integrações

## GraphQL

Endpoint padrão: `http://localhost:3001/graphql`.

O schema completo e canônico está em
[`server/src/schema.gql`](../server/src/schema.gql). Ele é gerado a partir dos
resolvers e DTOs code-first.

### Autenticação

| Operação | Finalidade |
|---|---|
| `loginCompanies` | Descobrir empresas válidas para as credenciais. |
| `login` | Autenticar e selecionar empresa. |
| `me` | Restaurar o usuário autenticado. |
| `switchCompany` | Trocar o contexto empresarial. |
| `changePassword` | Alterar senha e renovar a sessão. |
| `logout` | Limpar o cookie. |

### Configurador

O schema oferece CRUD de `users`, `gruposUsuarios`, `empresas`, `solucoes`,
`funcionalidades` e `servicos`, além de `myHubNavigation`.

Entradas de grupo e empresa carregam as listas de soluções e funcionalidades.
Grupos também carregam permissões CRUD e ações dinâmicas.

### Chamados

Consultas principais:

- `meusChamados`, `filaChamados` e `chamadosArquivados`;
- `chamado`;
- `dashboardChamados` e `relatorioChamados`;
- opções de abertura, atendentes e responsáveis;
- categorias, tipos, prioridades e regras de SLA;
- notificações;
- contas de e-mail e URL de autorização Google.

Mutações principais:

- criar, responder, assumir, atribuir e transferir chamado;
- alterar status, prioridade, categoria e acompanhantes;
- resolver, reabrir, encerrar e arquivar;
- administrar responsáveis, SLA, categorias, tipos e prioridades;
- administrar contas Google e notificações.

### Projetos

Consultas principais:

- projetos e detalhe;
- itens, histórico e responsáveis do backlog;
- painel de sprints;
- marcos e entregas;
- cronograma;
- comunicação e feed;
- cadastro de recursos;
- cadastro de tarefas, descrições funcionais e taxas por recurso;
- Grade de capacitação, capacidade e execuções planejadas;
- orçamento, categorias e custos.

Mutações principais:

- projeto, situação, arquivamento e reativação;
- itens, status, arquivamento e priorização;
- ciclo de sprints;
- marcos e entregas;
- dependências e datas do cronograma;
- atualizações e comentários;
- cadastro, alteração e exclusão de recursos;
- cadastro, alteração e exclusão de tarefas de recurso;
- inclusão, alteração e exclusão de capacidade e execução na Grade de capacitação;
- orçamento, categorias, custos, aprovação e reabertura.

Recursos, Tarefas, Grade de capacitação e orçamento possuem consultas, tipos, resolvers e
autorizações independentes. `SalvarProjetoRecursoInput` recebe usuário, `projetoIds`,
estado e controle de versão, sincronizando os vínculos selecionados. `SalvarGradeVinculoInput`
cria ou altera a alocação do recurso em um projeto. `SalvarGradeAlocacaoInput`
recebe `projetoRecursoId`, período, minutos e `atividade`, que descreve o que será
executado. Um custo de pessoa recebe o ID
de `ProjetoRecurso`, nunca o ID solto de um usuário. O recurso só nasce pela
mutação explícita de cadastro; mutações de projeto e da grade não criam o
cadastro empresarial. A
mutação histórica de equipe permanece no schema por compatibilidade, mas não é
usada pela tela de cadastro de projetos.

`projetoTarefas` retorna tarefas, recursos e permissões efetivas.
`SalvarProjetoTarefaInput` recebe `recursoId`, `funcionalidade` como texto livre,
`estimativaMinutos`, `valorHora`, `moeda`, observação, situação e versão. O valor é transportado como
string decimal; o backend exige estimativa e valor positivos, exige a descrição funcional e
preserva o histórico de alterações da taxa.

As respostas de painéis de Projetos incluem permissões efetivas para orientar
a interface. O backend ainda repete a validação em cada mutação.

## Endpoints HTTP

Endpoints de negócio protegidos aceitam o mesmo JWT do GraphQL.

| Método e rota | Finalidade |
|---|---|
| `GET /chamados/relatorios/exportar` | Exportar CSV ou XLSX. |
| `POST /chamados/:id/anexos` | Enviar anexos do chamado. |
| `GET /chamados/:id/anexos/:anexoId/download` | Baixar anexo autorizado. |
| `POST /projetos/:id/anexos` | Enviar anexos de atualização ou comentário. |
| `GET /projetos/:id/anexos/:anexoId/download` | Baixar anexo do projeto. |
| `DELETE /projetos/:id/anexos/:anexoId` | Excluir logicamente um anexo. |
| `GET /chamados/google-email/oauth/callback` | Callback público do OAuth Google. |

Uploads usam `multipart/form-data`. O frontend resolve a base HTTP por
`VITE_API_URL` ou remove `/graphql` de `VITE_GRAPHQL_URL`.

## Contrato de erros

Falhas de validação de DTO retornam a mensagem geral e `fieldErrors` por
campo. Regras de negócio usam exceções de requisição inválida, acesso negado,
registro inexistente ou conflito.

Conflito de versão significa que outro processo alterou o registro. O cliente
deve recarregar os dados e reaplicar conscientemente a alteração.

## Gmail API

O Controle de Chamados usa OAuth 2.0 e Gmail API para envio. O fluxo é:

1. a interface solicita `googleEmailAuthUrl`;
2. o usuário autoriza a conta Google;
3. o callback valida `code` e `state`;
4. o refresh token é criptografado e persistido;
5. eventos de chamados geram mensagem MIME;
6. a conta principal envia para os destinatários sem duplicação.

O mesmo mecanismo atende Gmail pessoal e Google Workspace. Remetentes
alternativos dependem da configuração da própria conta Google.

## Template de e-mail

O arquivo padrão fica em `server/email-templates/chamado.html`. Ele é lido a
cada envio, permitindo mudança de conteúdo sem recompilar. Mudanças de código
ou ambiente ainda exigem reinicialização do processo.

O conteúdo dinâmico é escapado. O template oferece dados do chamado,
solicitante, responsáveis, classificação, empresa, solução, SLA, datas e
cores. A referência completa está no README da pasta de templates.

## Arquivos locais

O banco persiste metadados e caminho. O conteúdo binário fica nos diretórios
de upload. Backup do banco sem backup desses diretórios não restaura anexos.

## Evolução do contrato

- Atualize DTO, resolver, schema gerado e operação frontend juntos.
- Evite renomear campo GraphQL público em refatoração interna.
- Inclua autorização e teste negativo para toda nova mutação.
- Documente novos endpoints e variáveis de ambiente neste arquivo.
