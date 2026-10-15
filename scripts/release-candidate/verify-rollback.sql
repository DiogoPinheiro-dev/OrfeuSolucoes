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

IF OBJECT_ID(N'dbo.ProjetoApontamentos', N'U') IS NOT NULL
  THROW 51013, 'O rollback manteve tabelas criadas depois do backup.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[GrupoFuncionalidades] GF
  INNER JOIN [dbo].[GruposUsuarios] G ON G.[Id] = GF.[GrupoId]
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = GF.[FuncionalidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE G.[Nome] = N'Operação RC' AND S.[Slug] = N'projetos' AND F.[Slug] = N'horas-do-projeto'
)
  THROW 51014, 'O rollback não recuperou o acesso antigo a Horas do projeto.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[FuncionalidadeAcoes] A
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = A.[FuncionalidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND F.[Slug] = N'horas-do-projeto'
    AND A.[Chave] = N'apontar' AND A.[StatusPublicacao] = N'PUBLICADA'
)
  THROW 51015, 'O rollback não recuperou a ação apontar publicada.', 1;

IF NOT EXISTS (
  SELECT 1 FROM [dbo].[Solucoes]
  WHERE [Slug] = N'horas' AND [StatusPublicacao] = N'PUBLICADA'
)
  THROW 51016, 'O rollback não recuperou o catálogo legado de Horas.', 1;

IF (
  SELECT COUNT(*)
  FROM [dbo].[Funcionalidades] F
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos'
    AND F.[Slug] IN (N'templates-de-projeto', N'portfolio-de-projetos')
    AND F.[StatusPublicacao] = N'PUBLICADA'
) <> 2
  THROW 51017, 'O rollback não recuperou Templates e Portfólio publicados.', 1;

PRINT N'Restauração do backup anterior validada.';
