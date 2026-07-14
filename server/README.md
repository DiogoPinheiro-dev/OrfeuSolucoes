# server

Nova API backend em TypeScript com Nest.js, Apollo GraphQL, Prisma e Jest.

## Stack

- Nest.js 11
- Apollo Server 5
- GraphQL (code-first)
- Prisma 6 (SQL Server)
- Jest (unit + e2e)

## Setup

1. Configure o arquivo `.env` na raiz do `server`.
2. Ajuste `DATABASE_URL` e `JWT_SECRET`.
3. Rode `npm run prisma:generate`.
4. Rode `npm run build`.
5. Rode `npm run start:dev`.

## Comandos

- `npm run build`
- `npm run start:dev`
- `npm run test`
- `npm run test:e2e`
- `npm run prisma:generate`
- `npm run prisma:migrate`
## Integracao de e-mail com Google

Para habilitar o envio de atualizacoes de chamados pela Gmail API, configure:

- `GOOGLE_OAUTH_CLIENT_ID`: client ID OAuth 2.0 do projeto Google Cloud.
- `GOOGLE_OAUTH_CLIENT_SECRET`: segredo do client OAuth.
- `GOOGLE_OAUTH_REDIRECT_URI`: callback autorizado, por padrao `http://localhost:3001/chamados/google-email/oauth/callback`.
- `GOOGLE_OAUTH_SUCCESS_URL`: pagina do frontend após a conexao, por padrao `http://localhost:5173/hub/controle-de-chamados/emails-solucoes?google=connected`.
- `GOOGLE_TOKEN_ENCRYPTION_KEY`: chave exclusiva usada para criptografar refresh tokens; quando omitida, `JWT_SECRET` e usado como fallback.

No Google Cloud, habilite a Gmail API e cadastre o redirect URI exatamente como configurado acima. O mesmo fluxo OAuth atende contas Gmail pessoais e Google Workspace. Cada remetente alternativo precisa estar cadastrado e verificado em "Enviar e-mail como" na conta Google conectada.