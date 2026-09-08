SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.ProjetoTarefas', N'U') IS NOT NULL
  THROW 51000, 'ProjetoTarefas ainda existe após a migration.', 1;

IF OBJECT_ID(N'dbo.ProjetoAlocacoes', N'U') IS NOT NULL
  THROW 51001, 'ProjetoAlocacoes ainda existe após a migration.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[ProjetoCustos] C
  INNER JOIN [dbo].[ProjetoItens] I ON I.[Id] = C.[ItemId]
  WHERE C.[Id] = '70000000-0000-0000-0000-000000000001'
    AND I.[ProjetoId] = '20000000-0000-0000-0000-000000000001'
    AND I.[Titulo] = N'Implementar fluxo legado'
    AND I.[EstimativaMinutos] = 480
)
  THROW 51002, 'O custo legado não foi reconciliado com o item de backlog esperado.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[ProjetoRecursos] PR
  INNER JOIN [dbo].[Recursos] R ON R.[Id] = PR.[RecursoId]
  INNER JOIN [dbo].[ProjetoEquipes] PE ON PE.[ProjetoId] = PR.[ProjetoId]
  INNER JOIN [dbo].[Equipes] E ON E.[Id] = PE.[EquipeId]
  WHERE PR.[Id] = '40000000-0000-0000-0000-000000000001'
    AND E.[Nome] = N'Equipe RC'
)
  THROW 51003, 'Recursos e equipes não sobreviveram à atualização.', 1;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Solucoes] WHERE [Slug] = N'custom-rc' AND [Nome] = N'Customização RC')
  THROW 51004, 'A customização do catálogo foi perdida.', 1;

PRINT N'Migration e reconciliação de dados validadas.';
