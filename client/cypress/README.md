# E2E no navegador

Esta suíte complementa o Vitest e valida jornadas críticas no navegador real. Nesta primeira etapa, as respostas GraphQL são interceptadas para que os cenários sejam determinísticos e não alterem o banco de desenvolvimento.

## Execução

1. Gere e sirva o build em `http://127.0.0.1:4173`:

   ```powershell
   npm.cmd run build
   npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
   ```

2. Em outro terminal, execute:

   ```powershell
   npm.cmd run test:e2e:browser
   ```

Para desenvolver e depurar os testes interativamente, use `npm.cmd run test:e2e:browser:open` com o preview ativo.

## Limite atual

Os testes cobrem o bundle, o navegador, o roteamento, a sessão no `localStorage`, os formulários e a renderização. A comunicação com NestJS e SQL Server permanece coberta pelas suítes backend; um E2E com banco real exigirá banco exclusivo e seed idempotente.
