# Client (React + Vite)

Frontend do OrfeuSolucoes integrado ao backend GraphQL (Nest + Apollo).

## Setup

3. Instale dependencias: `npm install`.
4. Rode em dev: `npm run dev`.

## URLs locais e cookies

No desenvolvimento, mantenha `VITE_GRAPHQL_URL=/graphql` e `VITE_API_URL=`. O
Vite encaminha GraphQL e os endpoints REST para `localhost:3001`, mantendo o
cookie HTTP-only no mesmo host usado para abrir o frontend. Assim, tanto
`localhost:5173` quanto o acesso pela rede reutilizam a sessão sem misturar
`localhost`, `127.0.0.1` e o IP da rede. Builds remotos devem informar as URLs
do respectivo ambiente.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
