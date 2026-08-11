# Testes automatizados

## Organização

Os testes do frontend ficam em `client/src/tests`. A pasta `client/test-suites` contém somente configurações do Vitest que selecionam os testes de cada suite.

As suites disponíveis são:

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
```

`test:all` executa regressão, as três suites de integração e E2E. `test:quality` acrescenta lint e build.

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

Os testes E2E do frontend usam roteamento e contexto reais em ambiente JSDOM, mas não substituem uma homologação em navegador com frontend, backend e banco ativos.

No backend, o harness de integração instancia o grafo de serviços em memória. Ele valida regras e colaboração entre serviços, mas não equivale a uma execução completa por HTTP, GraphQL e SQL Server. Testes E2E e validação visual complementam essa cobertura.

## Baseline validada

Em 11 de agosto de 2026, a suite geral do frontend concluiu 454 testes, além de lint e build. A validação visual percorreu autenticação, Hub, troca de empresa e funcionalidades das soluções sem erros no console. Essa contagem representa o estado daquela revisão; os comandos são a fonte de verdade para validações posteriores.
