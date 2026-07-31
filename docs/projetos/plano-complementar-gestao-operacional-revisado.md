# Plano complementar revisado — Gestão operacional de projetos

Revisão: **31/07/2026**.

Este documento substitui, para decisões futuras, a versão original dos
Planejamentos 9–20. Ele preserva a arquitetura e o escopo já entregues e
incorpora as seguintes decisões de produto:

- orçamento do projeto, cadastro de recursos e planejamento de recursos são
  funcionalidades separadas, ainda que compartilhem contratos;
- o motor de apontamento e aprovação de horas pertence à solução **Controle de
  Horas**; Projetos possuirá somente uma integração de consulta e consolidação;
- templates de projeto passam a ser um **extra opcional**, sujeito a decisão
  futura e sem bloquear a entrega do gerenciamento de projetos;
- dashboard, portfólio e saúde automática podem indicar dados indisponíveis
  quando uma integração opcional ainda não estiver habilitada.

## Estado e ordem do conjunto

| Planejamento | Tema | Classificação atual |
|---|---|---|
| 9 | Fundação da gestão operacional | Entregue |
| 10 | Itens de trabalho e numeração | Entregue |
| 11 | Backlog e priorização | Entregue |
| 12 | Sprints | Entregue |
| 13 | Marcos e entregas | Entregue |
| 14 | Dependências e Gantt | Entregue; sujeito ao fechamento de desempenho |
| 15 | Comunicação, comentários e anexos | Entregue; aprimoramentos incrementais permitidos |
| 16 | Recursos, planejamento e orçamento | Em desenvolvimento e estabilização |
| 17 | Integração com Controle de Horas | Integração futura; não contém motor de apontamento |
| 18 | Templates de projeto | Extra opcional; decisão futura |
| 19 | Dashboard, portfólio e saúde automática | Próximo módulo obrigatório após o fechamento do 16 |
| 20 | Validação integrada e entrega | Obrigatório para o aceite final |

## Princípios globais

- Todo registro pertence à empresa ativa e, direta ou indiretamente, ao seu
  contexto autorizado.
- A visibilidade depende da participação no projeto e das permissões da
  funcionalidade.
- O backend é a autoridade sobre permissões; o frontend apenas reflete as
  permissões efetivas.
- `ProjetosService` permanece como fachada fina sobre serviços especialistas.
- Projetos arquivados permanecem consultáveis e somente leitura.
- Entidades históricas utilizam arquivamento lógico quando a exclusão puder
  comprometer rastreabilidade.
- Mutações relevantes geram auditoria.
- Operações concorrentes utilizam transação, idempotência ou versão.
- Datas de calendário, instantes, minutos, moeda, precisão e arredondamento
  utilizam contratos centralizados.
- GraphQL/Apollo permanece na camada de serviços do frontend.
- Telas reutilizam `CrudGrid`, `CrudModal`, `ConfirmDialog`, tokens e padrões
  compartilhados sempre que o comportamento permitir.
- O harness de integração acompanha novos modelos e construtores sem
  enfraquecer regras existentes.
- Cada planejamento termina em um gate de validação e aguarda autorização
  antes do próximo.

# Planejamento 9 — Fundação da gestão operacional

Objetivo: manter os contratos compartilhados usados pelos módulos
operacionais.

### Fase 9.1 — Base e contratos

- Manter vocabulário, estados, transições e regras de arquivamento.
- Padronizar paginação, busca, filtros, ordenação e concorrência.
- Preservar compatibilidade entre saúde manual e saúde automática futura.

### Fase 9.2 — Autorização e infraestrutura

- Manter ações específicas por funcionalidade e permissões financeiras
  independentes.
- Reutilizar sequenciamento, auditoria, períodos e idempotência.
- Preservar empresa ativa, visibilidade por projeto e modo somente leitura.

### Validação do Planejamento 9

- Contratos e matriz de permissões documentados.
- Prisma, builds, integração e E2E aprovados.
- Nenhuma regressão no cadastro-base de projetos.

# Planejamento 10 — Itens de trabalho e numeração

Objetivo: manter o núcleo de tarefas usado por backlog, sprints, cronograma e
indicadores.

### Fase 10.1 — Item e hierarquia

- Item vinculado a projeto com tipo, título, descrição, status, prioridade,
  responsável, autor, datas e estimativas.
- Hierarquia sem autorreferência, projeto cruzado ou profundidade inválida.
- Versão para prevenir sobrescritas concorrentes.

### Fase 10.2 — Identificador público

- Contador transacional por projeto.
- Chaves imutáveis como `ORF-1`, sem reutilização de números arquivados.
- Unicidade preservada em criações simultâneas.

### Fase 10.3 — Serviços e GraphQL

- Serviços separados de catálogo, consulta, sequência, hierarquia e
  autorização.
- Consultas paginadas, filtros, detalhe, histórico e permissões efetivas.
- Mutações de cadastro, edição, status, arquivamento e reativação.

### Validação do Planejamento 10

- Sequência concorrente, hierarquias inválidas e imutabilidade.
- Isolamento, projeto arquivado, builds e integração.

# Planejamento 11 — Backlog e priorização

Objetivo: manter o cadastro visual e a ordenação persistente dos itens.

### Fase 11.1 — Operações

- Ordenação persistente e reordenação atômica por projeto.
- Tratamento de priorizações concorrentes.
- Busca, filtros, paginação e agrupamentos.

### Fase 11.2 — Interface

- Tela `projetos.backlog-de-demandas` com estados de carregamento, vazio e
  erro.
- Cadastro, edição, hierarquia, responsável, datas, estimativas e histórico.
- Priorização acessível e reversão visual quando o servidor rejeitar a ação.

### Validação do Planejamento 11

- CRUD, arquivamento, filtros, paginação e concorrência.
- Papéis, projeto arquivado, responsividade e teclado.

# Planejamento 12 — Sprints

Objetivo: planejar e executar períodos sem misturá-los com marcos ou entregas.

### Fase 12.1 — Ciclo e escopo

- Sprints planejada, ativa, concluída e cancelada.
- Somente uma sprint ativa por projeto.
- Escopo inicial preservado e alterações posteriores auditadas.

### Fase 12.2 — Execução e interface

- Ativação transacional.
- Encerramento com destino obrigatório para itens incompletos.
- Planejamento, quadro ativo, progresso e histórico.
- Permissões distintas para planejar, iniciar, concluir e cancelar.

### Validação do Planejamento 12

- Transições, datas, exclusividade, mudança de escopo e métricas históricas.
- Builds e integração.

# Planejamento 13 — Marcos e entregas

Objetivo: representar compromissos de negócio separadamente das tarefas.

### Fase 13.1 — Marcos e entregas

- Marcos de data única com responsável, estado e datas prevista/realizada.
- Entregas com resultado, critérios, período, responsável e conclusão.
- Relacionamentos com itens e entre entrega e marco no mesmo projeto.

### Fase 13.2 — Progresso e interface

- Progresso calculado pelos itens associados.
- Tratamento explícito de itens sem estimativa e atrasos.
- Listas, relacionamentos, navegação para o backlog e modo somente leitura.

### Validação do Planejamento 13

- Isolamento, progresso, atrasos, datas realizadas e arquivamento histórico.
- Permissões, builds e integração.

# Planejamento 14 — Dependências e Gantt

Objetivo: formar a rede de precedência e apresentar o cronograma consolidado.

### Fase 14.1 — Dependências e cronograma

- Dependências bloqueia/bloqueado por no mesmo projeto.
- Bloqueio de autorreferência, duplicidade e ciclos.
- Detecção de conflitos, bloqueios, risco e itens sem período.
- Nenhum reagendamento silencioso.

### Fase 14.2 — Consulta e interface

- Linha do tempo consolidando itens, marcos, entregas e dependências.
- Filtros de período, agrupamentos e inconsistências.
- Gantt com barras, marcos, conectores, zoom e navegação.
- Tabela acessível equivalente e edição de datas confirmada pelo backend.

### Validação do Planejamento 14

- Relações inválidas, conflitos, dependências arquivadas e itens sem datas.
- Volume representativo com medição de tempo e consultas.
- Validação visual, responsiva e de acessibilidade.

# Planejamento 15 — Comunicação, comentários e anexos

Objetivo: centralizar contexto, decisões e colaboração no projeto.

### Fase 15.1 — Atualizações e comentários

- Atualizações estruturadas com autor, conteúdo, data e saúde percebida.
- Histórico de edição.
- Comentários em projetos, itens e atualizações autorizadas.
- Separação entre edição própria e moderação.

### Fase 15.2 — Anexos e feed

- Armazenamento seguro independente das regras de Chamados.
- Validação de tamanho, extensão, nome, caminho e autorização.
- Permissões separadas de upload, download e exclusão.
- Feed cronológico com autoria, data, evento, contexto, alterações e anexos.

### Validação do Planejamento 15

- Autoria, moderação, isolamento e alvos arquivados.
- Arquivos inválidos e path traversal.
- Paginação, volume, builds, integração e armazenamento.

# Planejamento 16 — Recursos, planejamento e orçamento

Objetivo: separar identidade do recurso, planejamento operacional e dados
financeiros, mantendo integração explícita entre eles.

## Decisão de domínio

- **Cadastro de recursos** é empresarial e define quem é o recurso e a quais
  projetos ele pode ser vinculado.
- **Planejamento de recursos** organiza capacidade, tarefas e períodos de
  execução planejada; não representa horas efetivamente trabalhadas.
- **Orçamento do projeto** é financeiro e possui autorização própria.
- Criar um projeto não cadastra recursos nem monta automaticamente uma equipe.
- Um mesmo recurso pode ser vinculado a vários projetos.

### Fase 16.1 — Cadastro empresarial de recursos

- Vincular recurso a um usuário da empresa ativa.
- Manter estado ativo/inativo e seleção de um ou mais projetos.
- Impedir vínculos cruzados entre empresas e duplicidades indevidas.
- Preservar históricos que dependam do recurso ao desativá-lo.
- Disponibilizar CRUD próprio seguindo o padrão da aplicação.

### Fase 16.2 — Tarefas do recurso

- Criar tarefas associadas ao vínculo entre recurso e projeto.
- Manter descrição funcional, estimativa em minutos, situação e observações.
- Manter valor/hora e histórico de taxas quando aplicável.
- Impedir exclusão quando existirem execuções planejadas; orientar
  desativação.
- Permitir várias tarefas para o mesmo recurso e projeto.

### Fase 16.3 — Planejamento de recursos

- Utilizar uma funcionalidade canônica para recursos/projetos e tarefas.
- Definir capacidade por recurso e período.
- Associar uma tarefa a um ou mais períodos de execução planejada.
- Representar capacidade e planejamento em minutos, exibindo horas na UI.
- Calcular capacidade, estimativa, planejado e respectivos saldos.
- Permitir sobrealocação, mas sinalizá-la como risco.
- Preservar registros legados ambíguos para reconciliação manual, sem criar
  associações silenciosas.

### Fase 16.4 — Orçamento do projeto

- Manter uma moeda por orçamento de projeto.
- Criar orçamento-base e categorias.
- Separar valores planejados, comprometidos e realizados.
- Permitir custos fixos e custos associados a recursos/tarefas.
- Guardar a taxa histórica usada nos cálculos.
- Permitir aprovação da linha de base e reabertura auditada.
- Centralizar precisão decimal e arredondamento.

### Fase 16.5 — Segurança e interface

- Separar permissões operacionais e financeiras.
- Não retornar dados financeiros a usuários sem acesso.
- Manter telas independentes para cadastro de recursos, planejamento de
  recursos e orçamento do projeto.
- Destacar sobrecarga, tarefa sobreplanejada e estouro orçamentário.
- Reutilizar CRUDs, tabelas compactas, modais e confirmações compartilhadas.

### Validação do Planejamento 16

- Recurso empresarial vinculado a múltiplos projetos.
- Tarefa e execução pertencentes ao mesmo vínculo recurso/projeto.
- Períodos sobrepostos, sobrealocação, saldos e riscos.
- Cálculos financeiros, precisão, histórico de taxas e reabertura.
- Ausência de vazamento financeiro.
- Migração segura de registros existentes e reconciliação de ambiguidades.
- Prisma, builds, integração, E2E e validação manual das telas.

# Planejamento 17 — Integração com Controle de Horas

Objetivo: consumir esforço real aprovado sem duplicar o domínio de
apontamento dentro do Gerenciamento de Projetos.

## Decisão de domínio

A solução **Controle de Horas** é a fonte de verdade para lançamento, edição,
envio, aprovação, rejeição, reabertura, período e faturabilidade. Projetos não
deve criar um segundo motor de apontamento.

### Fase 17.1 — Contrato de integração

- Definir os identificadores de empresa, usuário, projeto, item/tarefa, data e
  duração compartilhados entre as soluções.
- Consumir apenas registros visíveis e autorizados da empresa ativa.
- Distinguir horas pendentes, aprovadas e rejeitadas sem controlar suas
  transições em Projetos.
- Versionar o contrato para evitar acoplamento direto aos serviços de escrita.

### Fase 17.2 — Consulta no projeto

- Disponibilizar totais por projeto, recurso, item/tarefa e período.
- Exibir dados incompletos ou indisponíveis quando Controle de Horas não
  estiver habilitado.
- Criar visão de leitura “Horas do projeto”.
- Oferecer atalho para a funcionalidade correspondente em Controle de Horas.

### Fase 17.3 — Custos e indicadores

- Considerar somente horas aprovadas em esforço realizado e custos.
- Usar a taxa histórica correta para o período do apontamento.
- Evitar duplicidade de custo em reprocessamentos.
- Recalcular ou compensar resultados quando um lançamento aprovado for
  reaberto na solução de origem.

### Validação do Planejamento 17

- Nenhuma mutação de apontamento exposta pelo módulo de Projetos.
- Isolamento, autorização e vínculo correto com projeto/item.
- Horas aprovadas, reabertas e rejeitadas refletidas corretamente.
- Idempotência e taxa histórica.
- Indisponibilidade da solução tratada sem quebrar Projetos.

Esta integração pode ser executada quando Controle de Horas estiver pronto.
Ela não bloqueia a construção inicial do Planejamento 19, desde que os
indicadores de esforço informem claramente a ausência da fonte.

# Planejamento 18 — Templates de projeto — extra opcional

Status: **fora do escopo obrigatório e sujeito a decisão futura**.

Objetivo potencial: reutilizar estruturas estabilizadas sem copiar dados
históricos ou sensíveis.

Se autorizado futuramente, o extra deverá:

- criar templates versionados por empresa;
- manter versões publicadas imutáveis e arquiváveis;
- copiar somente configuração, backlog-base, hierarquia, marcos, entregas,
  dependências, papéis e categorias sem valores sensíveis;
- utilizar datas relativas ao início do novo projeto;
- nunca copiar comentários, anexos, horas, custos realizados ou histórico;
- apresentar prévia antes da criação;
- instanciar todas as entidades em uma transação idempotente;
- gerar novas chaves, sequências e identificadores;
- solicitar responsáveis para papéis obrigatórios.

### Gate do extra

- Não criar models, migrations, GraphQL, permissões ou telas antes de uma
  decisão explícita de produto.
- Manter a entrada do Hub inativa enquanto o extra não for autorizado.
- Sua ausência não reprova os Planejamentos 19 ou 20.

# Planejamento 19 — Dashboard, portfólio e saúde automática

Objetivo: transformar os dados disponíveis em informação gerencial
explicável.

### Fase 19.1 — Serviços de leitura

- Criar serviços especializados de agregação separados dos serviços de
  escrita.
- Calcular progresso, prazos, sprint, bloqueios, marcos e atividade.
- Integrar capacidade e orçamento quando o Planejamento 16 estiver estável.
- Integrar esforço realizado somente quando Controle de Horas estiver
  disponível.
- Definir cache, data da atualização e indicação de fonte indisponível.

### Fase 19.2 — Saúde automática

- Separar saúde calculada, manual e efetiva.
- Preservar o campo público atual como saúde efetiva.
- Considerar atrasos, bloqueios, marcos críticos, mudança de escopo,
  sobrecarga, orçamento e ausência de atualização.
- Considerar horas apenas quando a integração estiver habilitada.
- Registrar motivos e versão da regra.
- Permitir substituição manual com justificativa e validade.

### Fase 19.3 — Dashboard do projeto

- Exibir progresso, próximos marcos, riscos, atividade e dados operacionais.
- Exibir orçamento e capacidade somente com autorização.
- Exibir esforço como indisponível quando não houver integração de horas.
- Permitir navegação de cada indicador até sua origem.
- Indicar dados incompletos ou desatualizados.

### Fase 19.4 — Portfólio

- Agregar somente projetos acessíveis da empresa ativa.
- Exibir saúde, responsável, progresso, prazo e riscos.
- Incluir filtros, ordenação e capacidade entre projetos.
- Proteger agregações financeiras por permissão específica.

### Validação do Planejamento 19

- Cenários determinísticos para cada saúde e seus motivos.
- Substituição manual, expiração e retorno automático.
- Agregações comparadas aos registros de origem.
- Comportamento correto com integrações disponíveis e indisponíveis.
- Isolamento, autorização, desempenho, builds e integração.

# Planejamento 20 — Validação integrada e entrega

Objetivo: provar o funcionamento completo do escopo obrigatório e preparar
uma entrega sustentável.

### Fase 20.1 — Jornadas obrigatórias

- Criar e manter projeto, equipe e ciclo de vida.
- Gerar, cadastrar e priorizar itens.
- Planejar e concluir sprint.
- Criar marcos, entregas e dependências.
- Registrar comunicação e anexos.
- Cadastrar recursos, tarefas e planejamento quando o Planejamento 16 estiver
  finalizado.
- Definir e acompanhar o orçamento com autorização financeira.
- Conferir resultados no dashboard e portfólio.

### Fase 20.2 — Jornadas condicionais

- Consultar horas aprovadas se Controle de Horas e sua integração estiverem
  disponíveis.
- Criar projeto por template somente se o extra do Planejamento 18 tiver sido
  autorizado e implementado.
- A ausência dessas jornadas opcionais deve ser documentada, não tratada como
  falha do aceite obrigatório.

### Fase 20.3 — Segurança e consistência

- Testar isolamento entre empresas.
- Testar responsável, membro, observador e administrador.
- Testar projeto e entidades arquivadas.
- Testar dados financeiros, arquivos, concorrência e idempotência.
- Confirmar que módulos opcionais inativos não aparecem como telas quebradas.

### Fase 20.4 — Migrações e desempenho

- Ensaiar migrations em banco vazio e banco com dados.
- Revisar índices, paginação e limites.
- Medir backlog, Gantt, feed, planejamento de recursos e agregações com volume
  representativo.
- Corrigir consultas N+1, bundles excessivos e gargalos identificados.

### Fase 20.5 — Documentação e aceite

- Atualizar contratos GraphQL, schema, permissões, operação e handoff.
- Documentar sequência, saúde, planejamento, custos e transições.
- Produzir uma matriz final de evidências.
- Registrar explicitamente integrações e extras adiados.
- Confirmar que nenhum requisito obrigatório permaneceu pendente.

### Validação do Planejamento 20

- Prisma e migrations aprovados.
- Lint e builds aprovados.
- Integração e E2E aprovados.
- Fluxos manuais críticos, responsividade e acessibilidade conferidos.
- Documentação atualizada.
- Aceite funcional do escopo obrigatório completo.

## Gate obrigatório ao término de cada planejamento

Cada planejamento termina com:

1. revisão das mudanças restritas ao escopo;
2. validação de Prisma e migration, quando aplicável;
3. lint e build do backend e frontend;
4. integração e E2E proporcionais ao risco;
5. atualização do harness sem enfraquecer regras;
6. testes de empresa ativa, permissões e projeto arquivado;
7. validação visual das telas alteradas;
8. registro do entregue, validado e adiado;
9. interrupção até autorização para o próximo planejamento.

## Ordem revisada

Ordem obrigatória:

**itens → backlog → sprints → marcos e entregas → dependências e Gantt →
comunicação → recursos/planejamento/orçamento → dashboard e portfólio →
validação integrada**.

Ordem condicional:

- **integração com Controle de Horas**, quando a solução responsável estiver
  disponível;
- **templates**, somente após decisão explícita de produto.

Assim, o gerenciamento de projetos pode ser concluído sem duplicar o domínio
de horas e sem transformar Templates em requisito obrigatório.
