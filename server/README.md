# server

Nova API backend em TypeScript com Nest.js, Apollo GraphQL, Prisma e Jest.

## Stack

- Nest.js 11
- Apollo Server 5
- GraphQL (code-first)
- Prisma 6 (SQL Server)
- Jest (unit + e2e)

## Setup

1. Copie `.env.example` para `.env` na raiz do `server`.
2. Ajuste `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_TOKEN_ENCRYPTION_KEY` e `CORS_ORIGIN`.
3. Em uma base vazia, defina temporariamente `INITIAL_ADMIN_PASSWORD` com uma senha forte e exclusiva. O administrador inicial será obrigado a alterá-la no primeiro acesso.
4. Rode `npm run prisma:generate`.
5. Rode `npm run build`.
6. Rode `npm run start:dev`.

Não reutilize chaves entre ambientes nem use a mesma chave para JWT e criptografia dos tokens Google. Em homologação e produção, mantenha `NODE_ENV=production` e diferencie o ambiente por `APP_ENV`.

## Comandos

- `npm run build`
- `npm run start:dev`
- `npm run test`
- `npm run test:e2e`
- `npm run prisma:generate`
- `npm run prisma:migrate` — cria/aplica migrações somente no desenvolvimento.
- `npm run prisma:migrate:deploy` — aplica migrações já versionadas sem criar novas.

## Limites de segurança

- `AUTH_RATE_LIMIT_MAX_ATTEMPTS`, `AUTH_RATE_LIMIT_WINDOW_SECONDS`, `AUTH_RATE_LIMIT_BLOCK_SECONDS` e `AUTH_RATE_LIMIT_MAX_BUCKETS` controlam tentativas de autenticação; os padrões são 5 tentativas, janelas de 15 minutos e até 10.000 identificadores em memória.
- `AUTH_REGISTRATION_MAX_ATTEMPTS` e `AUTH_REGISTRATION_WINDOW_SECONDS` limitam o autocadastro; o padrão é 3 tentativas por IP a cada hora.
- `TRUST_PROXY` aceita somente `loopback`, IPs exatos ou sub-redes CIDR explícitas. Mantenha `loopback` no desenvolvimento e informe apenas o proxy reverso que efetivamente encaminha as requisições.
- `CHAMADOS_STORAGE_QUOTA_BYTES_PER_COMPANY` e `PROJETOS_STORAGE_QUOTA_BYTES_PER_COMPANY` controlam as cotas de anexos; o padrão de cada domínio é 1 GiB por empresa.
## Integracao de e-mail com Google

Para habilitar o envio de atualizacoes de chamados pela Gmail API, configure:

- `GOOGLE_OAUTH_CLIENT_ID`: client ID OAuth 2.0 do projeto Google Cloud.
- `GOOGLE_OAUTH_CLIENT_SECRET`: segredo do client OAuth.
- `GOOGLE_OAUTH_REDIRECT_URI`: callback autorizado, por padrao `http://localhost:3001/chamados/google-email/oauth/callback`.
- `GOOGLE_OAUTH_SUCCESS_URL`: pagina do frontend após a conexao, por padrao `http://localhost:5173/hub/controle-de-chamados/emails-solucoes?google=connected`.
- `GOOGLE_TOKEN_ENCRYPTION_KEY`: chave exclusiva e obrigatória usada para criptografar refresh tokens. Ela deve ser diferente de `JWT_SECRET`.

No Google Cloud, habilite a Gmail API e cadastre o redirect URI exatamente como configurado acima. O mesmo fluxo OAuth atende contas Gmail pessoais e Google Workspace. Cada remetente alternativo precisa estar cadastrado e verificado em "Enviar e-mail como" na conta Google conectada.
