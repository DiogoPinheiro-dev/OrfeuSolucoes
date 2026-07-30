# Documentação do OrfeuSolucoes

Esta pasta descreve o sistema existente no repositório na data de
**30/07/2026**. A documentação foi construída a partir do código, do schema
Prisma, do schema GraphQL, das migrations e dos testes atuais.

## Por onde começar

- [Visão geral do produto](visao-geral.md)
- [Arquitetura](arquitetura.md)
- [Configuração e execução](configuracao-e-execucao.md)
- [Módulos do sistema](modulos.md)
- [Modelo de dados](modelo-de-dados.md)
- [API e integrações](api-e-integracoes.md)
- [Frontend](frontend.md)
- [Segurança e permissões](seguranca-e-permissoes.md)
- [Testes e validação](testes-e-validacao.md)
- [Estado atual e roadmap](estado-atual.md)

## Fundação operacional de Projetos — Planejamento 9

- [Fechamento do Planejamento 9](projetos/planejamento-09-fechamento.md)
- [Fundação operacional](projetos/fundacao-operacional.md)
- [Contratos operacionais](projetos/contratos-operacionais.md)
- [Matriz de permissões](projetos/matriz-permissoes.md)
- [Matriz de evidências](projetos/matriz-evidencias.md)
- [Planejamento de recursos](projetos/planejamento-recursos.md)

## Fontes de verdade

Quando houver divergência, prevalecem nesta ordem:

1. migrations aplicadas e [schema Prisma](../server/prisma/schema.prisma);
2. regras dos serviços e políticas do backend;
3. [schema GraphQL gerado](../server/src/schema.gql);
4. registro de funcionalidades e permissões do Hub;
5. esta documentação.

A documentação deve ser atualizada no mesmo trabalho que alterar uma regra
pública, um modelo persistido, uma permissão, uma variável de ambiente, uma
rota ou uma jornada de usuário.

## Escopo documentado

O material cobre:

- autenticação JWT, sessão, troca de empresa e autorização;
- Configurador: usuários, grupos, empresas, soluções e funcionalidades;
- catálogo de serviços;
- Controle de Chamados;
- gestão operacional de Projetos com Cadastro de recursos, Planejamento de recursos unificado e Orçamento;
- frontend React, Hub dinâmico e camada de serviços;
- GraphQL, endpoints HTTP, anexos e integração Gmail;
- Prisma/SQL Server, migrations, testes e operação local.

Funcionalidades reservadas no Hub, mas ainda não implementadas, são
identificadas explicitamente como pendentes.
