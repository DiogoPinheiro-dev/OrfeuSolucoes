BEGIN TRY

BEGIN TRAN;

DECLARE @SolucaoId INT = (
    SELECT TOP (1) [Id]
    FROM [dbo].[Solucoes]
    WHERE [Slug] = N'projetos'
);
DECLARE @PlanejamentoId INT = (
    SELECT TOP (1) [Id]
    FROM [dbo].[Funcionalidades]
    WHERE [SolucaoId] = @SolucaoId
      AND [Slug] IN (N'planejamento-de-recursos', N'grade-de-capacitacao')
    ORDER BY CASE WHEN [Slug] = N'planejamento-de-recursos' THEN 0 ELSE 1 END
);
DECLARE @TarefasLegadoId INT = (
    SELECT TOP (1) [Id]
    FROM [dbo].[Funcionalidades]
    WHERE [SolucaoId] = @SolucaoId
      AND [Slug] = N'cadastro-de-tarefas'
);

IF @PlanejamentoId IS NULL AND @TarefasLegadoId IS NOT NULL
BEGIN
    SET @PlanejamentoId = @TarefasLegadoId;
    SET @TarefasLegadoId = NULL;
END;

IF @PlanejamentoId IS NOT NULL
BEGIN
    UPDATE [dbo].[Funcionalidades]
       SET [Slug] = N'planejamento-de-recursos',
           [Titulo] = N'Planejamento de recursos',
           [Label] = N'Planejamento de recursos',
           [Descricao] = N'Gerencie os vinculos dos recursos com os projetos e suas tarefas.',
           [Ordem] = 70,
           [RegistryKey] = N'projetos.planejamento-de-recursos',
           [Ativo] = 1
     WHERE [Id] = @PlanejamentoId;
END;

IF @TarefasLegadoId IS NOT NULL
   AND @PlanejamentoId IS NOT NULL
   AND @TarefasLegadoId <> @PlanejamentoId
BEGIN
    INSERT INTO [dbo].[EmpresaFuncionalidades] ([EmpresaId], [FuncionalidadeId])
    SELECT [Origem].[EmpresaId], @PlanejamentoId
    FROM [dbo].[EmpresaFuncionalidades] AS [Origem]
    WHERE [Origem].[FuncionalidadeId] = @TarefasLegadoId
      AND NOT EXISTS (
          SELECT 1
          FROM [dbo].[EmpresaFuncionalidades] AS [Destino]
          WHERE [Destino].[EmpresaId] = [Origem].[EmpresaId]
            AND [Destino].[FuncionalidadeId] = @PlanejamentoId
      );

    UPDATE [Destino]
       SET [PodeVisualizar] = CASE WHEN [Destino].[PodeVisualizar] = 1 OR [Origem].[PodeVisualizar] = 1 THEN 1 ELSE 0 END,
           [PodeIncluir] = CASE WHEN [Destino].[PodeIncluir] = 1 OR [Origem].[PodeIncluir] = 1 THEN 1 ELSE 0 END,
           [PodeAlterar] = CASE WHEN [Destino].[PodeAlterar] = 1 OR [Origem].[PodeAlterar] = 1 THEN 1 ELSE 0 END,
           [PodeExcluir] = CASE WHEN [Destino].[PodeExcluir] = 1 OR [Origem].[PodeExcluir] = 1 THEN 1 ELSE 0 END
    FROM [dbo].[GrupoFuncionalidades] AS [Destino]
    INNER JOIN [dbo].[GrupoFuncionalidades] AS [Origem]
        ON [Origem].[GrupoId] = [Destino].[GrupoId]
       AND [Origem].[FuncionalidadeId] = @TarefasLegadoId
    WHERE [Destino].[FuncionalidadeId] = @PlanejamentoId;

    INSERT INTO [dbo].[GrupoFuncionalidades] (
        [GrupoId], [FuncionalidadeId], [PodeVisualizar], [PodeIncluir], [PodeAlterar], [PodeExcluir]
    )
    SELECT
        [Origem].[GrupoId], @PlanejamentoId, [Origem].[PodeVisualizar], [Origem].[PodeIncluir], [Origem].[PodeAlterar], [Origem].[PodeExcluir]
    FROM [dbo].[GrupoFuncionalidades] AS [Origem]
    WHERE [Origem].[FuncionalidadeId] = @TarefasLegadoId
      AND NOT EXISTS (
          SELECT 1
          FROM [dbo].[GrupoFuncionalidades] AS [Destino]
          WHERE [Destino].[GrupoId] = [Origem].[GrupoId]
            AND [Destino].[FuncionalidadeId] = @PlanejamentoId
      );

    UPDATE [dbo].[Chamados]
       SET [FuncionalidadeId] = @PlanejamentoId
     WHERE [FuncionalidadeId] = @TarefasLegadoId;

    UPDATE [Destino]
       SET [Ativo] = CASE WHEN [Destino].[Ativo] = 1 OR [Origem].[Ativo] = 1 THEN 1 ELSE 0 END,
           [AtualizadoEm] = CASE WHEN [Destino].[AtualizadoEm] >= [Origem].[AtualizadoEm] THEN [Destino].[AtualizadoEm] ELSE [Origem].[AtualizadoEm] END
    FROM [dbo].[ChamadoResponsavelFuncionalidades] AS [Destino]
    INNER JOIN [dbo].[ChamadoResponsavelFuncionalidades] AS [Origem]
        ON [Origem].[ResponsavelSolucaoId] = [Destino].[ResponsavelSolucaoId]
       AND [Origem].[FuncionalidadeId] = @TarefasLegadoId
    WHERE [Destino].[FuncionalidadeId] = @PlanejamentoId;

    DELETE [Origem]
    FROM [dbo].[ChamadoResponsavelFuncionalidades] AS [Origem]
    WHERE [Origem].[FuncionalidadeId] = @TarefasLegadoId
      AND EXISTS (
          SELECT 1
          FROM [dbo].[ChamadoResponsavelFuncionalidades] AS [Destino]
          WHERE [Destino].[ResponsavelSolucaoId] = [Origem].[ResponsavelSolucaoId]
            AND [Destino].[FuncionalidadeId] = @PlanejamentoId
      );

    UPDATE [dbo].[ChamadoResponsavelFuncionalidades]
       SET [FuncionalidadeId] = @PlanejamentoId
     WHERE [FuncionalidadeId] = @TarefasLegadoId;

    DELETE FROM [dbo].[Funcionalidades]
     WHERE [Id] = @TarefasLegadoId;
END;

IF OBJECT_ID(N'[dbo].[ProjetoCapacidades]', N'U') IS NOT NULL
BEGIN
    DROP TABLE [dbo].[ProjetoCapacidades];
END;

IF OBJECT_ID(N'[dbo].[ProjetoCapacidadesLegadoSemProjeto]', N'U') IS NOT NULL
BEGIN
    DROP TABLE [dbo].[ProjetoCapacidadesLegadoSemProjeto];
END;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW;

END CATCH
