# Visão geral do OrfeuSolucoes

## Objetivo

O OrfeuSolucoes é uma aplicação web multiempresa que reúne módulos
administrativos e operacionais em um Hub único. O usuário autentica-se,
seleciona uma empresa permitida e recebe somente as soluções, funcionalidades
e ações liberadas para a combinação entre empresa e grupo de acesso.

## Stack atual

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite 7, React Router 7 e Apollo Client 4 |
| Backend | NestJS 11, Apollo Server 5 e GraphQL code-first |
| Persistência | Prisma 6 e SQL Server |
| Autenticação | JWT por cookie HTTP-only ou Bearer token |
| Testes | Jest unitário, integração em memória e E2E |
| Arquivos | Armazenamento local configurável para anexos |
| E-mail | Gmail API com OAuth 2.0 |

## Áreas do produto

### Autenticação e contexto empresarial

- login por usuário/e-mail e senha;
- escolha de empresa quando o usuário possui mais de um vínculo;
- troca de empresa sem novo login;
- alteração obrigatória ou voluntária de senha;
- restauração e encerramento da sessão;
- navegação recalculada para a empresa ativa.

### Configurador

- cadastro de usuários;
- associação de usuários a empresas;
- cadastro de grupos;
- liberação de soluções e funcionalidades por grupo;
- permissões CRUD e ações específicas por funcionalidade;
- cadastro de empresas e respectivas liberações;
- cadastro de soluções e funcionalidades;
- proteção de registros padrão do sistema.

### Catálogo de serviços

Mantém título, descrição, valor, desconto e volume de vendas dos serviços
exibidos pela aplicação.

### Controle de Chamados

Abrange:

- abertura e consulta de chamados;
- fila de atendimento e chamados do usuário;
- responsável por usuário ou grupo;
- liderança temporária de atendimento;
- acompanhantes;
- mensagens públicas e notas internas;
- anexos;
- categorias, tipos e prioridades configuráveis;
- regras e indicadores de SLA;
- notificações internas;
- envio de e-mails pela Gmail API;
- dashboard, relatórios e exportação CSV/XLSX;
- resolução, reabertura e arquivamento com histórico.

### Projetos

Funcionalidades implementadas:

- cadastro, ciclo de vida e arquivamento de projetos, sem edição de equipe no formulário;
- itens de trabalho e backlog priorizado;
- sprints;
- marcos e entregas;
- dependências e cronograma/Gantt;
- atualizações, comentários, anexos e feed;
- cadastro empresarial da identidade e situação dos recursos;
- cadastro de tarefas com recurso, descrição textual livre da funcionalidade, horas estimadas e valor cobrado por hora, com histórico de taxas;
- Grade de capacitação independente, com alocação em projetos, capacidade e descrição do que cada recurso executará;
- orçamento, categorias e custos em uma funcionalidade financeira separada.

Funcionalidades reservadas, porém inativas:

- apontamento de horas;
- templates de projeto;
- dashboard e portfólio.

Consulte [Estado atual e roadmap](estado-atual.md) para a distinção entre
código versionado, alterações locais e módulos pendentes.

## Atores e limites de acesso

| Ator | Escopo |
|---|---|
| Administrador do sistema | Ignora a matriz funcional e acessa cadastros administrativos; ainda opera dentro do contexto empresarial informado pelas regras de cada módulo. |
| Grupo com acesso integral | Ignora a interseção normal do Hub, mas não se torna automaticamente membro de todos os projetos. |
| Usuário comum | Depende do vínculo com a empresa, das liberações da empresa, das permissões do grupo e das regras do registro acessado. |
| Responsável de projeto | Lidera o projeto e possui operações exclusivas, condicionadas às permissões funcionais. |
| Membro de projeto | Executa operações operacionais permitidas. |
| Observador de projeto | Consulta o projeto; não executa mutações operacionais. |
| Solicitante de chamado | Abre, acompanha e interage conforme o estado e as permissões do chamado. |
| Atendente | Atua na fila conforme elegibilidade e ações liberadas. |

## Jornadas principais

### Entrada no sistema

1. O usuário informa suas credenciais.
2. O backend valida as empresas vinculadas.
3. Quando necessário, o usuário escolhe a empresa.
4. O backend emite um JWT com a empresa ativa.
5. O Hub é calculado pela interseção entre empresa e grupo.

### Chamado

1. O solicitante seleciona solução/funcionalidade, tipo, prioridade e categoria.
2. O backend reserva um número por empresa e calcula o snapshot de SLA.
3. Atendentes elegíveis assumem ou recebem o chamado.
4. Mensagens, anexos, histórico, notificações e e-mails acompanham os eventos.
5. O chamado pode ser resolvido, reaberto e arquivado.

### Projeto

1. Um projeto é criado com chave única por empresa; o criador torna-se responsável e nenhuma equipe ou recurso é incluído pelo formulário.
2. Itens de trabalho formam o backlog.
3. Sprints, marcos e entregas organizam a execução.
4. Dependências e datas alimentam o cronograma.
5. Atualizações e comentários formam o feed.
6. Recursos são cadastrados uma vez na empresa e vinculados a um ou mais projetos existentes no próprio formulário, sem capacidade ou horas.
7. O Cadastro de tarefas registra, em texto livre, o que cada recurso executa, as horas estimadas para conclusão e sua taxa comercial por hora.
8. A Grade de capacitação administra os vínculos e registra disponibilidade, horas e a atividade que será executada.
9. O orçamento referencia recursos já cadastrados quando um custo for associado a uma pessoa.

## Limites atuais

- apontamento de horas, templates e portfólio ainda não existem;
- a saúde do projeto é atualmente um valor manual, não um cálculo de portfólio;
- o frontend não possui suíte automatizada;
- o bundle principal do frontend ainda não usa divisão ampla por funcionalidade;
- a cobertura operacional é mais forte em serviços do que em jornadas completas de interface.
