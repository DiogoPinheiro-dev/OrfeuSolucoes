# Testes automatizados

## Organização

Os testes do frontend ficam em `client/src/tests`. A pasta `client/test-suites` contém somente configurações do Vitest que selecionam os testes de cada suite.

As suítes disponíveis são:

- regressão: autenticação, contratos, hooks, serviços e componentes compartilhados;
- integração do Configurador;
- integração do Controle de Chamados;
- integração do Gerenciador de Projetos;
- E2E em memória para jornadas críticas do frontend;
- cobertura, reunindo os testes do frontend com execução serial.

## Comandos do frontend

Execute a partir de `client`:

```powershell
npm.cmd run test:regression
npm.cmd run test:integration:configurador
npm.cmd run test:integration:chamados
npm.cmd run test:integration:projetos
npm.cmd run test:e2e
npm.cmd run test:all
npm.cmd run test:coverage
npm.cmd run test:quality
npm.cmd run test:e2e:browser
```

`test:all` executa regressão, as três suítes de integração e E2E. `test:quality` acrescenta lint e build.

Os limites globais de cobertura do frontend são:

| Métrica | Limite |
|---|---:|
| Statements | 73% |
| Branches | 59% |
| Functions | 64% |
| Lines | 75% |

## Comandos do backend

Execute a partir de `server`:

```powershell
npm.cmd run test:unit
npm.cmd run test:integration
npm.cmd run test:e2e
npm.cmd run test:regression
npm.cmd run test:coverage
```

`test:regression` executa testes unitários, integração, E2E e build. Os limites globais de cobertura do backend são:

| Métrica | Limite |
|---|---:|
| Statements | 72% |
| Branches | 62% |
| Functions | 70% |
| Lines | 73% |

## Escopo dos níveis

Os testes de componentes validam renderização, estados, acessibilidade e interação com serviços simulados. As integrações do frontend exercitam fluxos completos das soluções com fronteiras externas substituídas por mocks.

Os testes E2E do frontend usam roteamento e contexto reais em ambiente JSDOM. O Cypress complementa essa camada com jornadas no Electron, incluindo autenticação, Hub, documentação, cache Apollo, aplicação do contrato da empresa às rotas de Chamados e Horas e responsividade do modal nos viewports 390×844, 768×1024 e 1440×900.

No backend, o harness de integração instancia o grafo de serviços em memória. Ele valida regras e colaboração entre serviços, mas não equivale a uma execução completa por HTTP, GraphQL e SQL Server. Testes E2E e validação visual complementam essa cobertura.

## Baseline validada

Em 25 de agosto de 2026, a suíte geral do frontend concluiu 502 testes, o Cypress concluiu 14 testes e o backend concluiu 159 testes no gate de cobertura. Lint e builds passaram. As coberturas globais observadas foram:

| Camada | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| Frontend | 75,31% | 62,23% | 66,65% | 77,60% |
| Backend | 75,73% | 65,70% | 72,89% | 76,93% |

O Prisma validou o schema e confirmou 70 migrations aplicadas no SQL Server. Essa contagem representa o estado daquela revisão; os comandos continuam sendo a fonte de verdade para validações posteriores.

## Integração contínua

O workflow `.github/workflows/quality.yml` executa os gates em jobs independentes:

- estática, contratos editoriais e detecção de testes focados ou desativados;
- regressão e cobertura do backend;
- qualidade e cobertura do frontend;
- validação do Prisma e aplicação das migrations em um SQL Server limpo;
- auditoria das dependências de produção;
- build de homologação e jornadas Cypress no Electron.

Cada job usa `npm ci`. Coberturas, relatórios de segurança, capturas e logs do navegador são publicados como artefatos quando disponíveis, inclusive para auxiliar o diagnóstico de falhas.
