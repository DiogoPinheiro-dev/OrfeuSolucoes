# OrfeuSolucoes

Projeto com frontend React (`client`) e backend NestJS/GraphQL (`server`).

## Stack ativa

- Frontend: `client` (Vite + React + Apollo Client)
- Backend: `server` (NestJS + Apollo + Prisma + SQL Server)

## Documentação

A documentação técnica e funcional está em [`docs/README.md`](docs/README.md).
Ela cobre arquitetura, configuração, segurança, módulos, modelo de dados,
GraphQL/HTTP, frontend, testes, estado atual e o fechamento do Planejamento 9
de Projetos.

## Como rodar

1. Configure `server/.env`.
2. Configure `client/.env`.
3. No backend:
   - `cd server`
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
   - `npm run start:dev`
4. No frontend:
   - `cd client`
   - `npm run dev`
