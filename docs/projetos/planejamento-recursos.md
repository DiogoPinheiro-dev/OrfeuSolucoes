# Planejamento de recursos

## Objetivo

O Planejamento de recursos é o ponto operacional único para relacionar
recursos, projetos, tarefas, capacidade e execução planejada. O cadastro
empresarial do recurso permanece separado porque define a identidade do
profissional e os projetos aos quais ele pode ser vinculado.

A funcionalidade canônica mantém o slug `grade-de-capacitacao` para preservar
links e permissões existentes. A antiga funcionalidade
`cadastro-de-tarefas` fica inativa e sua rota redireciona para a tela
unificada.

## Jornada da interface

A funcionalidade possui duas visões selecionáveis:

1. **Recursos e projetos**: apresenta uma linha para cada
   `ProjetoRecurso` e consolida capacidade, estimativas, execução, saldos,
   custo por moeda, risco e situação do vínculo.
2. **Tarefas**: apresenta uma linha para cada tarefa e oferece pesquisa,
   filtros por projeto, recurso e situação, além das ações de inclusão,
   alteração, visualização e exclusão.

O cadastro feito pela visão Tarefas permite escolher um recurso e um dos
projetos aos quais ele está vinculado. A visualização da tarefa reúne dados
gerais, observação, histórico de valores e períodos de execução.

Uma tarefa com execução planejada não pode ser excluída. Nesse caso, a
interface orienta sua desativação para preservar o histórico.

O modal da visão Recursos e projetos mantém quatro abas:

1. **Cadastro**: recurso, projeto e situação do vínculo;
2. **Capacidade**: períodos e minutos disponíveis;
3. **Tarefas**: tarefas pertencentes ao vínculo selecionado;
4. **Planejamento**: períodos de execução associados a uma tarefa.

Uma tarefa pode possuir vários períodos de execução. A execução não recebe
uma descrição livre nova: ela referencia a tarefa selecionada.

As duas visões e as tabelas internas reutilizam `CrudGrid`. Dentro dos modais,
a variante `compact` mantém a mesma toolbar de inclusão, alteração,
visualização e exclusão, os mesmos checkboxes, estados desabilitados e estilo
de linhas dos demais cadastros. `useCrudSelection` mantém seleção e filtros
coerentes, e exclusões simples usam `ConfirmDialog`.

## Modelo de domínio

```text
Recurso
  └─ ProjetoRecurso
       ├─ ProjetoCapacidade
       ├─ ProjetoTarefa
       │    ├─ ProjetoTarefaTaxaHistorico
       │    └─ ProjetoAlocacao
       └─ ProjetoCusto
```

Novas tarefas exigem um `ProjetoRecurso` ativo. `projetoRecursoId` permanece
opcional no banco apenas para permitir a reconciliação segura dos registros
legados. Uma nova alocação exige uma tarefa ativa pertencente ao mesmo
vínculo.

`ProjetoAlocacao.atividade` foi preservado como campo legado. O contrato
canônico é `tarefaId`; o backend só associa texto antigo automaticamente
quando encontra uma correspondência única no mesmo vínculo.

## Cálculos

- **Capacidade**: soma de `capacidadeMinutos`.
- **Estimativa**: soma de `estimativaMinutos` das tarefas ativas.
- **Planejado**: soma de `alocacaoMinutos`.
- **Saldo de capacidade**: capacidade menos planejado.
- **Saldo da tarefa**: estimativa menos execução planejada.
- **Custo planejado**: minutos planejados divididos por 60, multiplicados
  pelo valor/hora da tarefa, agrupados por moeda.

Uma linha fica em risco quando ultrapassa a capacidade, quando uma tarefa é
sobreplanejada ou quando existem alocações legadas ainda sem `tarefaId`.

## Autorizações e compatibilidade

As operações continuam protegidas no backend por empresa, funcionalidade,
ação e visibilidade do projeto. Durante a transição, as permissões efetivas da
Grade de capacitação e do Cadastro de tarefas são combinadas. A migration
`20260730213000_planejamento_recursos_permissoes` consolida as liberações na
funcionalidade canônica e desativa o cadastro antigo.

O Hub registra tanto `grade-de-capacitacao` quanto `cadastro-de-tarefas` no
mesmo componente, mas exibe somente Planejamento de recursos na navegação
atual.

## Migração e reconciliação

A migration `20260730200000_unificar_tarefas_grade_capacitacao` adiciona os
vínculos opcionais entre tarefa, recurso do projeto e alocação.

- Tarefas antigas são associadas automaticamente somente quando o recurso
  possui um único vínculo de projeto possível.
- Alocações antigas são associadas somente quando o texto identifica uma
  única tarefa no mesmo vínculo.
- Registros ambíguos permanecem pendentes e são exibidos para correção manual.

Essa estratégia evita atribuir silenciosamente uma tarefa ao projeto errado.

## Contratos principais

- Query consolidada: `planejamentoRecursos`.
- Tarefa: `salvarProjetoTarefa` e `excluirProjetoTarefa`.
- Capacidade: `salvarGradeCapacidade` e `excluirGradeCapacidade`.
- Execução: `salvarGradeAlocacao` e `excluirGradeAlocacao`.
- Vínculo: operações da Grade de capacitação permanecem disponíveis para
  inclusão, ativação e desativação.

Os resolvers permanecem finos. A composição da tela fica em
`ProjetoPlanejamentoRecursoService`, que reutiliza os serviços especialistas
de tarefa e grade.

## Validação

O fluxo é coberto pelo teste de integração de Projetos para:

- tarefa associada ao vínculo entre recurso e projeto;
- execução associada à tarefa do mesmo vínculo;
- consolidação de horas, saldos, custos e risco;
- isolamento de empresa e autorização já exercitados pelo módulo.

