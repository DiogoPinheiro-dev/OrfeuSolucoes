# OrfeuSolucoes

Projeto com frontend React (`client`) e backend NestJS/GraphQL (`server`).

## Stack ativa

- Frontend: `client` (Vite + React + Apollo Client)
- Backend: `server` (NestJS + Apollo + Prisma + SQL Server)

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

## Cutover

O frontend está integrado ao backend `server`.