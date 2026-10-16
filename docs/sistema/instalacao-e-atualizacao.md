# Instalação e atualização

O Orfeu separa a criação da estrutura, a instalação dos dados padrão e as atualizações posteriores do produto. Essa separação impede que uma subida comum do backend regrave o catálogo ou desfaça personalizações administrativas.

## Visão geral

| Situação do banco | Procedimento |
|---|---|
| Banco novo e vazio | Aplicar as migrations e iniciar o backend. A primeira subida instala o produto uma única vez. |
| Banco com as 80 migrations anteriores à base consolidada | Atualizar primeiro até o commit de referência `189e494`, executar `npm run banco:transicao` e depois `npm run banco:atualizar`. |
| Banco já instalado ou transicionado | Criar e verificar um backup, executar `npm run banco:atualizar` e então iniciar a nova versão. |

As 80 migrations de desenvolvimento permanecem disponíveis no histórico do Git no commit `189e494`. A versão atual começa pela migration `20261015160000_base_do_produto`, que reproduz a estrutura final dessas migrations sem carregar dados padrão.

## Regra das migrations

Migrations criam ou transformam estrutura e podem converter dados existentes quando uma evolução exigir. Elas não são usadas para cadastrar soluções, funcionalidades, ações, agrupamentos, permissões ou outros dados padrão do produto.

Os dados padrão têm duas fontes versionadas:

- o manifesto do produto, aplicado uma única vez durante a instalação inicial;
- as atualizações do produto, aplicadas explicitamente pelo comando `npm run banco:atualizar`.

O arquivo `server/scripts/base-consolidada/legacy-migrations.json` registra os nomes das 80 migrations anteriores. A impressão digital de `server/prisma/base-schema-fingerprint.json` protege a equivalência estrutural exigida para a transição.

## Instalação em banco novo

Antes da primeira subida, configure pelo menos `DATABASE_URL`, `INITIAL_ADMIN_PASSWORD` e as demais variáveis obrigatórias do ambiente. `INSTALACAO_EMPRESA_NOME` é opcional e define o nome da empresa inicial.

Execute a partir de `server`:

```powershell
npm.cmd run prisma:migrate:deploy
npx.cmd prisma migrate status
npm.cmd run build
npm.cmd run start
```

As migrations deixam o banco sem dados de negócio. Na primeira subida, o backend confirma que o banco está vazio e grava tudo em uma única instalação transacional:

- a marca de instalação;
- o catálogo padrão de soluções, funcionalidades, ações e agrupamentos;
- as versões iniciais e a auditoria do catálogo;
- a empresa inicial e seus contratos;
- o grupo `Administradores`, com acesso às definições ativas;
- o usuário inicial `admin`, que deve trocar a senha no primeiro acesso;
- os tipos e as prioridades iniciais do Controle de Chamados.

A senha inicial vem somente de `INITIAL_ADMIN_PASSWORD`; ela não possui valor padrão e não deve ser registrada em documentação, log ou controle de versão. Se duas instâncias iniciarem juntas, a proteção de concorrência mantém uma única instalação.

Em desenvolvimento, `npx.cmd prisma migrate reset` chama o seed do Prisma depois de recriar a estrutura. O seed delega ao mesmo instalador; ele não é executado por `prisma migrate deploy` e não substitui a primeira subida em produção.

## O que acontece nas subidas seguintes

Depois da instalação, a subida não reconcilia nem regrava dados. Ela somente:

1. confirma a marca da instalação;
2. recusa a inicialização se houver atualização conhecida ainda não aplicada;
3. avisa se o banco registra uma atualização mais nova que o código em execução;
4. confere, por leitura, se as telas e ações publicadas possuem providers e consumidores compatíveis.

Quando tudo está compatível, o log registra `Conferencia do catalogo: telas e acoes publicadas compativeis com o codigo.`. Se houver incompatibilidades, o resumo é seguido de uma linha por problema para facilitar o diagnóstico pelo suporte.

Um banco com dados e sem marca de instalação é recusado. Não crie a marca manualmente: use a transição descrita abaixo.

## Transição de um banco anterior

`npm run banco:transicao` existe somente para bancos que possuem exatamente as 80 migrations legadas concluídas e a mesma estrutura da base consolidada. O comando:

1. confere o histórico completo das migrations legadas;
2. compara a impressão digital do esquema;
3. cria um backup com checksum no diretório padrão do SQL Server;
4. verifica o backup com `RESTORE VERIFYONLY`;
5. substitui o histórico do Prisma pela base consolidada;
6. aplica as migrations posteriores e registra a origem `BANCO_EXISTENTE`.

Execute a partir de `server`:

```powershell
npm.cmd run banco:transicao
npm.cmd run banco:atualizar
npx.cmd prisma migrate status
```

É possível apontar outro banco da mesma instância com `npm.cmd run banco:transicao -- --database NomeDoBanco`. Qualquer divergência de histórico ou estrutura interrompe o processo antes da troca. Guarde o caminho do backup informado pelo comando.

Se o banco estiver numa revisão anterior às 80 migrations, use o commit `189e494` para aplicar primeiro o histórico legado completo. Não execute a transição sobre uma versão intermediária.

## Atualização do produto

Toda promoção deve ter um backup recuperável imediatamente anterior. Depois do backup, execute:

```powershell
npm.cmd run banco:atualizar
```

O comando aplica, nesta ordem:

1. as migrations estruturais pendentes com `prisma migrate deploy`;
2. as atualizações pendentes do produto com `produto:atualizar`.

Cada atualização possui identidade estável, executa em transação serializável e é registrada em `ProdutoAtualizacoes`. Uma segunda execução não reaplica o que já foi concluído. Numa instalação nova, atualizações já incorporadas ao manifesto são registradas como `INCORPORADA_NA_INSTALACAO`; num banco transicionado, elas são registradas como `APLICADA`.

As operações de catálogo preservam valores publicados e personalizações. Quando uma definição padrão precisa mudar, a atualização pode criar um rascunho para análise no Configurador em vez de publicar silenciosamente. Novas permissões seguem a política explícita da atualização e não concedem acesso privilegiado por simples existência do item.

Se o backend informar `Atualizacoes de produto pendentes`, encerre a promoção, confirme o backup e execute `npm run banco:atualizar`. Não contorne a recusa alterando a tabela de controle.

## Publicação administrativa

Atualizar o banco não equivale a publicar um rascunho no Hub. Depois do comando:

1. entre como administrador do sistema;
2. abra o Configurador;
3. revise os itens indicados como **Atualização pendente**;
4. publique somente as alterações aprovadas;
5. revise contratos de empresa, permissões de grupo e ações dinâmicas.

Os rascunhos de ordem de **Backlog de demandas**, **Marcos e entregas** e **Comunicação** pertencem a essa revisão administrativa. A subida do backend não os publica nem aumenta sua revisão.

## Verificação e recuperação

Após instalar ou atualizar:

```powershell
npx.cmd prisma migrate status
node scripts/base-consolidada/verify-installation.cjs --expect-installed
```

Confirme também a saúde GraphQL, o log de compatibilidade, o login, a troca obrigatória da senha inicial, o Hub, o Configurador e as jornadas críticas do ambiente.

O rollback operacional é feito pela restauração do backup anterior; não há migration SQL reversa para uma atualização de produto já promovida. Depois de restaurar, use a versão de código correspondente ao backup. Em especial, um código anterior à base consolidada não deve ser iniciado sobre um banco já transicionado.

O workflow [Release candidate](release-candidate.md) ensaia instalação, recusa por atualização pendente, backup, restauração, reaplicação e idempotência em infraestrutura descartável.

