# Client (React + Vite)

Frontend do OrfeuSolucoes integrado ao backend GraphQL (Nest + Apollo).

## Setup

1. Copie `.env.example` para `.env` na raiz do `client`.
2. Mantenha o mesmo hostname no frontend e em `VITE_GRAPHQL_URL`. No desenvolvimento local, use `localhost` nos dois endereços; misturar `localhost`, `127.0.0.1` e IP da rede impede que o cookie de autenticação seja reenviado.
3. Instale dependencias: `npm install`.
4. Rode em dev: `npm run dev`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
