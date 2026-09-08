SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.ProjetoTarefas', N'U') IS NULL
  THROW 51010, 'O backup anterior não restaurou ProjetoTarefas.', 1;

IF NOT EXISTS (
  SELECT 1 FROM [dbo].[ProjetoTarefas]
  WHERE [Id] = '50000000-0000-0000-0000-000000000001'
    AND [Funcionalidade] = N'Implementar fluxo legado'
)
  THROW 51011, 'A tarefa legada não foi recuperada pelo rollback.', 1;

IF NOT EXISTS (
  SELECT 1 FROM [dbo].[ProjetoCustos]
  WHERE [Id] = '70000000-0000-0000-0000-000000000001'
    AND [TarefaId] = '50000000-0000-0000-0000-000000000001'
)
  THROW 51012, 'O vínculo entre custo e tarefa não foi recuperado.', 1;

PRINT N'Restauração do backup anterior validada.';
