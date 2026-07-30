# Configuração e execução

## Pré-requisitos

- Node.js compatível com as dependências do projeto;
- npm;
- SQL Server acessível pelo backend;
- credenciais Google OAuth somente se o envio de e-mails for utilizado.

Instale as dependências separadamente em `server` e `client`.

## Backend

O arquivo `server/.env` deve conter valores próprios do ambiente. Não
versione segredos.

### Variáveis obrigatórias

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Conexão Prisma com SQL Server. |
| `JWT_SECRET` | Assinatura dos tokens e fallback da criptografia OAuth. |
| `CORS_ORIGIN` | Lista de origens permitidas, separadas por vírgula. |

### Variáveis gerais opcionais

| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | `3001` | Porta HTTP do backend. |
| `JWT_EXPIRES_IN` | `28800` | Vida do JWT em segundos. |
| `NODE_ENV` | `development` | Ativa flags de produção e cookie seguro. |
| `SKIP_DB_CONNECT` | `false` | Evita conexão automática em testes controlados. |
| `CHAMADOS_UPLOAD_DIR` | `uploads` | Diretório dos anexos de chamados. |
| `PROJETOS_UPLOAD_DIR` | `uploads` | Diretório dos anexos de projetos. |

### E-mail de chamados

| Variável | Obrigatoriedade | Uso |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Para Gmail | Client ID OAuth. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Para Gmail | Segredo OAuth. |
| `GOOGLE_OAUTH_REDIRECT_URI` | Opcional | Callback do backend. |
| `GOOGLE_OAUTH_SUCCESS_URL` | Opcional | Retorno para o frontend. |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Recomendada | Criptografa refresh tokens. |
| `CHAMADO_EMAIL_TEMPLATE_PATH` | Opcional | Substitui o template HTML padrão. |
| `CHAMADO_APP_URL` | Opcional | Base dos links enviados por e-mail. |
| `CHAMADO_EMAIL_TIMEZONE` | `America/Sao_Paulo` | Fuso usado no template. |

O template padrão e suas variáveis estão descritos em
[`server/email-templates/README.md`](../server/email-templates/README.md).

## Frontend

O arquivo `client/.env` aceita:

| Variável | Padrão | Uso |
|---|---|---|
| `VITE_GRAPHQL_URL` | `http://localhost:3001/graphql` | Endpoint Apollo. |
| `VITE_API_URL` | URL GraphQL sem `/graphql` | Base para anexos e exportações HTTP. |

Não copie valores de ambientes internos para a documentação ou para arquivos
de exemplo públicos.

## Execução local

### Backend

```powershell
cd server
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma migrate dev
npm.cmd run start:dev
```

### Frontend

```powershell
cd client
npm.cmd install
npm.cmd run dev
```

O frontend usa a porta padrão do Vite e o backend usa `PORT`, normalmente
`3001`.

## Validação

### Backend

```powershell
npx.cmd prisma validate
npx.cmd prisma migrate status
npm.cmd run build
npm.cmd test
npm.cmd run test:integration
npm.cmd run test:e2e
```

### Frontend

```powershell
npm.cmd run lint
npm.cmd run build
```

O backend não possui script de lint configurado. O frontend ainda não possui
script de testes automatizados.

## Migrations

- `prisma migrate dev` cria e aplica migrations no desenvolvimento.
- `prisma migrate status` consulta a situação do banco configurado.
- Em implantação controlada, use `prisma migrate deploy`.
- `prisma validate` valida o schema, mas não ensaia uma migration.
- Antes de publicar uma migration estrutural, valide-a em banco vazio e em
  cópia representativa com dados.
- Não edite uma migration aplicada em ambiente compartilhado; crie uma
  migration corretiva.

## Produção

Antes de colocar o sistema em produção:

- use `NODE_ENV=production`;
- configure HTTPS para que o cookie seja enviado como `secure`;
- restrinja `CORS_ORIGIN`;
- use um `JWT_SECRET` forte e exclusivo;
- defina `GOOGLE_TOKEN_ENCRYPTION_KEY` própria;
- mantenha uploads em volume persistente, com backup e permissão restrita;
- desabilite acesso público direto aos diretórios de anexos;
- aplique migrations antes de iniciar a nova versão;
- execute build e testes;
- monitore arquivos, banco, prazo de SLA e falhas da Gmail API.
