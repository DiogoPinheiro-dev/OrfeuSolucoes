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

## Operações GraphQL principais

- Query: `health`
- Mutation: `createUser(input)`
- Mutation: `login(input)`
- Mutation: `logout`
- Query protegida: `users`
- Query protegida: `servicos`
- Mutation protegida: `createServico(input)`
- Mutation protegida: `updateServico(input)`
- Mutation protegida: `deleteServico(id)`

## Auth

- JWT em `Authorization: Bearer <token>`
- Cookie HTTP-only `access_token` também suportado
