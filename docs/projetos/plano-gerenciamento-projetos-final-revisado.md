# Plano revisado — Conclusão do Gerenciamento de Projetos

Revisão: **31/07/2026**.

Este documento substitui a organização anterior dos Planejamentos 9–20 para
definir com clareza onde termina o Gerenciamento de Projetos.

## Decisões desta revisão

- O Gerenciamento de Projetos será concluído antes do início do planejamento
  de Controle de Horas.
- Controle de Horas será uma solução separada e possuirá o motor de lançamento,
  aprovação, rejeição e reabertura de apontamentos.
- Uma futura consulta de horas dentro de Projetos será apenas uma integração
  entre soluções e não faz parte do aceite atual.
- Dashboard, portfólio e saúde automática foram retirados deste plano e serão
  tratados em um planejamento separado posterior.
- Templates de projeto permanecem como extra opcional, sujeito a decisão
  futura.
- Orçamento do projeto, cadastro de recursos e planejamento de recursos são
  funcionalidades distintas dentro do Planejamento 16.

## Escopo obrigatório

| Planejamento | Tema | Situação |
|---|---|---|
| 9 | Fundação operacional | Entregue |
| 10 | Itens de trabalho e numeração | Entregue |
| 11 | Backlog e priorização | Entregue |
| 12 | Sprints | Entregue |
| 13 | Marcos e entregas | Entregue |
| 14 | Dependências e Gantt | Entregue; validar desempenho no fechamento |
| 15 | Comunicação, comentários e anexos | Entregue; aprimoramentos incrementais permitidos |
| 16 | Recursos, planejamento e orçamento | Em desenvolvimento e estabilização |
| 17 | Validação integrada e entrega | Pendente; encerra o Gerenciamento de Projetos |

## Fora do escopo obrigatório

| Tema | Decisão |
|---|---|
| Controle de Horas | Próximo planejamento separado, iniciado depois da conclusão de Projetos |
| Integração de horas com Projetos | Executada somente depois que Controle de Horas estiver disponível |
| Dashboard, portfólio e saúde automática | Planejamento separado posterior |
| Templates de projeto | Extra opcional, sem decisão de implementação |

## Princípios globais

- Todo registro respeita a empresa ativa e o contexto autorizado.
- A visibilidade depende da participação no projeto e das permissões da
  funcionalidade.
- O backend é a autoridade de autorização.
- `ProjetosService` permanece uma fachada fina sobre serviços especialistas.
- Projetos arquivados permanecem consultáveis e somente leitura.
- Registros históricos utilizam arquivamento lógico quando necessário.
- Mutações relevantes geram auditoria.
- Concorrência utiliza transação, idempotência ou versão.
- Datas, minutos, moedas, precisão e arredondamento possuem contratos únicos.
- O frontend reutiliza os componentes e tokens compartilhados da aplicação.
- Cada planejamento termina em um gate de validação e aguarda autorização.

# Planejamento 9 — Fundação operacional

Objetivo: manter a infraestrutura compartilhada pelos módulos operacionais.

### Escopo

- Contratos de estados, transições, arquivamento, paginação e concorrência.
- Autorização por empresa, projeto, papel, funcionalidade e ação.
- Serviços de auditoria, sequência, períodos e idempotência.
- Compatibilidade entre saúde manual atual e possíveis indicadores futuros.
- Documentação de arquitetura, contratos e permissões.

### Validação

- Prisma, builds, integração e E2E.
- Empresa ativa, autorização e projeto arquivado.
- Nenhuma regressão no cadastro de projetos.

# Planejamento 10 — Itens de trabalho e numeração

Objetivo: manter o núcleo operacional utilizado por backlog, sprints e
cronograma.

### Escopo

- Item com tipo, título, descrição, estado, prioridade, responsável, autor,
  datas e estimativa.
- Hierarquia sem autorreferência, projeto cruzado ou profundidade inválida.
- Versão para concorrência.
- Sequência transacional por projeto e chave pública imutável.
- Consultas paginadas, filtros, detalhe, histórico e permissões efetivas.
- Cadastro, edição, mudança de estado, arquivamento e reativação.

### Validação

- Concorrência, hierarquias inválidas e não reutilização de números.
- Isolamento entre empresas e projetos.
- Projeto arquivado somente leitura.

# Planejamento 11 — Backlog e priorização

Objetivo: manter o cadastro visual e a ordenação persistente dos itens.

### Escopo

- Ordenação persistente e atômica por projeto.
- Tratamento de priorizações concorrentes.
- Busca, filtros, paginação e agrupamentos.
- Cadastro e edição de hierarquia, responsáveis, datas e estimativas.
- Histórico, permissões e identificação de arquivados.
- Priorização acessível por controles de interface e teclado.

### Validação

- CRUD, arquivamento, filtros, paginação e concorrência.
- Papéis, responsividade e navegação por teclado.

# Planejamento 12 — Sprints

Objetivo: planejar e executar períodos sem confundi-los com marcos e entregas.

### Escopo

- Estados planejada, ativa, concluída e cancelada.
- Somente uma sprint ativa por projeto.
- Escopo inicial preservado e alterações posteriores auditadas.
- Ativação transacional.
- Encerramento com destino obrigatório para itens incompletos.
- Planejamento, quadro ativo, progresso e histórico.

### Validação

- Datas, transições, exclusividade e mudanças de escopo.
- Encerramento e preservação das métricas históricas.

# Planejamento 13 — Marcos e entregas

Objetivo: representar compromissos de negócio separadamente das tarefas.

### Escopo

- Marcos de data única com responsável, estado e datas.
- Entregas com resultado, critérios, período, responsável e conclusão.
- Relações entre itens, marcos e entregas do mesmo projeto.
- Progresso calculado, itens sem estimativa e atrasos.
- Navegação até os itens relacionados e modo somente leitura.

### Validação

- Relacionamentos, isolamento, progresso e atrasos.
- Datas realizadas e arquivamento histórico.

# Planejamento 14 — Dependências e Gantt

Objetivo: manter a rede de precedência e o cronograma consolidado.

### Escopo

- Dependências bloqueia/bloqueado por no mesmo projeto.
- Bloqueio de autorreferência, duplicidade e ciclos.
- Detecção de conflitos, bloqueios, risco e itens sem período.
- Nenhum reagendamento silencioso.
- Linha do tempo de itens, marcos, entregas e dependências.
- Filtros, agrupamentos, inconsistências, zoom e navegação.
- Tabela acessível equivalente e edição de datas confirmada.

### Validação

- Relações inválidas, conflitos e dependências arquivadas.
- Volume representativo com medição de tempo e consultas.
- Responsividade e acessibilidade.

# Planejamento 15 — Comunicação, comentários e anexos

Objetivo: centralizar contexto, decisões e colaboração.

### Escopo

- Atualizações com autor, conteúdo, data e saúde percebida.
- Histórico de edição.
- Comentários em projeto, itens e atualizações.
- Separação entre edição própria e moderação.
- Armazenamento seguro e independente de Chamados.
- Validação de tamanho, extensão, nome, caminho e autorização.
- Feed cronológico com autoria, contexto, alterações e anexos.

### Validação

- Autoria, moderação, isolamento e alvos arquivados.
- Arquivos inválidos e path traversal.
- Paginação, volume, integração e armazenamento.

# Planejamento 16 — Recursos, planejamento e orçamento

Objetivo: concluir identidade de recursos, planejamento operacional e dados
financeiros sem misturar suas responsabilidades.

## Decisão de domínio

- Cadastro de recursos é empresarial.
- Um recurso pode ser vinculado a vários projetos.
- Planejamento de recursos representa capacidade e execução planejada, não
  horas efetivamente trabalhadas.
- Orçamento do projeto é financeiro e possui autorização independente.
- Criar um projeto não cadastra recursos nem monta equipe automaticamente.

### Fase 16.1 — Cadastro empresarial de recursos

- Vincular recurso a usuário da empresa ativa.
- Manter estado e seleção de projetos.
- Impedir duplicidade e vínculo cruzado entre empresas.
- Preservar históricos ao desativar um recurso.
- Disponibilizar CRUD próprio no padrão da aplicação.

### Fase 16.2 — Tarefas do recurso

- Associar tarefa ao vínculo entre recurso e projeto.
- Manter descrição, estimativa em minutos, situação e observações.
- Manter valor/hora e histórico de taxas quando aplicável.
- Impedir exclusão de tarefa com planejamento; orientar desativação.
- Permitir várias tarefas para o mesmo vínculo.

### Fase 16.3 — Planejamento de recursos

- Definir capacidade por recurso e período.
- Associar tarefa a um ou mais períodos de execução planejada.
- Calcular capacidade, estimativa, planejado e saldos.
- Permitir sobrealocação, destacando-a como risco.
- Preservar registros legados ambíguos para reconciliação manual.
- Reutilizar CRUDs, tabelas compactas, modais e confirmações compartilhadas.

### Fase 16.4 — Orçamento do projeto

- Manter uma moeda por orçamento.
- Criar orçamento-base e categorias.
- Separar valores planejados, comprometidos e realizados.
- Permitir custos fixos e custos associados a recursos/tarefas.
- Guardar taxas históricas.
- Aprovar e reabrir a linha de base com auditoria.
- Centralizar precisão e arredondamento.

### Fase 16.5 — Segurança e compatibilidade

- Separar permissões operacionais e financeiras.
- Não retornar dados financeiros sem autorização.
- Manter telas independentes para recursos, planejamento e orçamento.
- Destacar sobrecarga, tarefa sobreplanejada e estouro orçamentário.
- Migrar registros existentes sem associações silenciosas.

### Validação do Planejamento 16

- Recurso vinculado a múltiplos projetos.
- Tarefa e execução no mesmo vínculo recurso/projeto.
- Períodos, sobrealocação, saldos e riscos.
- Cálculos financeiros, precisão, taxas e reabertura.
- Ausência de vazamento financeiro.
- Migração em banco existente e banco vazio.
- Prisma, builds, integração, E2E e validação manual.

# Planejamento 17 — Validação integrada e entrega

Objetivo: provar o funcionamento completo do Gerenciamento de Projetos e
encerrar sua entrega sem depender de outros produtos futuros.

### Fase 17.1 — Jornadas obrigatórias

- Criar e manter projeto, responsável e ciclo de vida.
- Gerar, cadastrar e priorizar itens.
- Planejar, iniciar e concluir sprint.
- Criar marcos, entregas e dependências.
- Consultar e editar o cronograma.
- Registrar comunicação, comentários e anexos.
- Cadastrar recursos, tarefas e planejamento.
- Definir e acompanhar orçamento com autorização financeira.
- Conferir consistência entre todos os módulos entregues.

### Fase 17.2 — Limites do aceite

- Não exigir lançamento ou aprovação de horas.
- Não exigir integração com Controle de Horas.
- Não exigir dashboard, portfólio ou saúde automática.
- Não exigir criação de projeto por template.
- Manter funcionalidades futuras inativas, sem telas incompletas no Hub.

### Fase 17.3 — Segurança e consistência

- Testar isolamento entre empresas.
- Testar responsável, membro, observador e administrador.
- Testar projeto e entidades arquivadas.
- Testar dados financeiros, arquivos, concorrência e idempotência.
- Testar dependências de exclusão e preservação histórica.

### Fase 17.4 — Migrações e desempenho

- Ensaiar migrations em banco vazio e com dados.
- Revisar índices, paginação e limites.
- Medir backlog, Gantt, feed e planejamento de recursos com volume
  representativo.
- Corrigir consultas N+1, bundles excessivos e gargalos.

### Fase 17.5 — Padrão visual e acessibilidade

- Substituir confirmações nativas pelos componentes compartilhados.
- Revisar modais, tabelas, toolbars, seleção e estados vazios.
- Validar responsividade, teclado, foco e leitores de tela.
- Conferir manualmente os fluxos críticos no navegador.

### Fase 17.6 — Documentação e aceite

- Atualizar GraphQL, schema, permissões, operação e handoff.
- Documentar sequência, planejamento, custos e transições.
- Produzir matriz final de evidências.
- Registrar Controle de Horas, Dashboard/Portfólio e Templates como planos
  separados ou extras.
- Confirmar que nenhum requisito obrigatório permaneceu pendente.

### Validação do Planejamento 17

- Prisma e migrations aprovados.
- Lint e builds aprovados.
- Integração e E2E aprovados.
- Fluxos manuais, responsividade e acessibilidade conferidos.
- Documentação atualizada.
- Aceite funcional do Gerenciamento de Projetos completo.

## Gate obrigatório de cada planejamento

1. Revisar mudanças restritas ao escopo.
2. Validar Prisma e migrations quando aplicável.
3. Executar lint e builds.
4. Executar integração e E2E proporcionais ao risco.
5. Atualizar o harness sem enfraquecer regras.
6. Testar empresa ativa, permissões e projeto arquivado.
7. Validar visualmente as telas alteradas.
8. Registrar o que foi entregue, validado e adiado.
9. Interromper até autorização para continuar.

## Ordem obrigatória final

**itens → backlog → sprints → marcos e entregas → dependências e Gantt →
comunicação → recursos/planejamento/orçamento → validação integrada e entrega
do Gerenciamento de Projetos**.

Depois desse aceite, poderão começar, em planos independentes:

1. **Controle de Horas**;
2. **integração de horas com Projetos**, depois que Controle de Horas estiver
   disponível;
3. **dashboard, portfólio e saúde automática**;
4. **templates**, somente se houver decisão explícita de implementação.
