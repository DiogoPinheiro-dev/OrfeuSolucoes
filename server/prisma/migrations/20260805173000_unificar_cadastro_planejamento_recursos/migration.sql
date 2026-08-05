BEGIN TRY

BEGIN TRAN;

DECLARE @SolucaoId INT = (
    SELECT TOP (1) [Id]
    FROM [dbo].[Solucoes]
    WHERE [Slug] = N'projetos'
);
DECLARE @RecursoId INT = (
    SELECT TOP (1) [Id]
    FROM [dbo].[Funcionalidades]
    WHERE [SolucaoId] = @SolucaoId
      AND [Slug] = N'recursos-do-projeto'
);
DECLARE @PlanejamentoId INT = (
    SELECT TOP (1) [Id]
    FROM [dbo].[Funcionalidades]
    WHERE [SolucaoId] = @SolucaoId
      AND [Slug] = N'grade-de-capacitacao'
);

IF @PlanejamentoId IS NULL AND @RecursoId IS NOT NULL
BEGIN
    UPDATE [dbo].[Funcionalidades]
       SET [Slug] = N'grade-de-capacitacao'
     WHERE [Id] = @RecursoId;

    SET @PlanejamentoId = @RecursoId;
    SET @RecursoId = NULL;
END;

IF @PlanejamentoId IS NOT NULL
BEGIN
    UPDATE [dbo].[Funcionalidades]
       SET [Titulo] = N'Planejamento de recursos',
           [Label] = N'Planejamento de recursos',
           [Descricao] = N'Gerencie vinculos, capacidade, tarefas, custos e execucoes planejadas por recurso e projeto.',
           [Ordem] = 70,
           [RegistryKey] = N'projetos.grade-de-capacitacao',
           [Ativo] = 1
     WHERE [Id] = @PlanejamentoId;
END;

IF @RecursoId IS NOT NULL
   AND @PlanejamentoId IS NOT NULL
   AND @RecursoId <> @PlanejamentoId
BEGIN
    INSERT INTO [dbo].[EmpresaFuncionalidades] ([EmpresaId], [FuncionalidadeId])
    SELECT [Origem].[EmpresaId], @PlanejamentoId
    FROM [dbo].[EmpresaFuncionalidades] AS [Origem]
    WHERE [Origem].[FuncionalidadeId] = @RecursoId
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
       AND [Origem].[FuncionalidadeId] = @RecursoId
    WHERE [Destino].[FuncionalidadeId] = @PlanejamentoId;

    INSERT INTO [dbo].[GrupoFuncionalidades] (
        [GrupoId],
        [FuncionalidadeId],
        [PodeVisualizar],
        [PodeIncluir],
        [PodeAlterar],
        [PodeExcluir]
    )
    SELECT
        [Origem].[GrupoId],
        @PlanejamentoId,
        [Origem].[PodeVisualizar],
        [Origem].[PodeIncluir],
        [Origem].[PodeAlterar],
        [Origem].[PodeExcluir]
    FROM [dbo].[GrupoFuncionalidades] AS [Origem]
    WHERE [Origem].[FuncionalidadeId] = @RecursoId
      AND NOT EXISTS (
          SELECT 1
          FROM [dbo].[GrupoFuncionalidades] AS [Destino]
          WHERE [Destino].[GrupoId] = [Origem].[GrupoId]
            AND [Destino].[FuncionalidadeId] = @PlanejamentoId
      );

    UPDATE [PermissaoDestino]
       SET [Permitido] = CASE
           WHEN [PermissaoDestino].[Permitido] = 1 OR [PermissaoOrigem].[Permitido] = 1 THEN 1
           ELSE 0
       END
    FROM [dbo].[GrupoFuncionalidadeAcoes] AS [PermissaoDestino]
    INNER JOIN [dbo].[FuncionalidadeAcoes] AS [AcaoDestino]
        ON [AcaoDestino].[Id] = [PermissaoDestino].[FuncionalidadeAcaoId]
       AND [AcaoDestino].[FuncionalidadeId] = @PlanejamentoId
    INNER JOIN [dbo].[FuncionalidadeAcoes] AS [AcaoOrigem]
        ON [AcaoOrigem].[FuncionalidadeId] = @RecursoId
       AND [AcaoOrigem].[Chave] = [AcaoDestino].[Chave]
    INNER JOIN [dbo].[GrupoFuncionalidadeAcoes] AS [PermissaoOrigem]
        ON [PermissaoOrigem].[GrupoId] = [PermissaoDestino].[GrupoId]
       AND [PermissaoOrigem].[FuncionalidadeAcaoId] = [AcaoOrigem].[Id];

    INSERT INTO [dbo].[GrupoFuncionalidadeAcoes] ([GrupoId], [FuncionalidadeAcaoId], [Permitido])
    SELECT
        [PermissaoOrigem].[GrupoId],
        [AcaoDestino].[Id],
        [PermissaoOrigem].[Permitido]
    FROM [dbo].[GrupoFuncionalidadeAcoes] AS [PermissaoOrigem]
    INNER JOIN [dbo].[FuncionalidadeAcoes] AS [AcaoOrigem]
        ON [AcaoOrigem].[Id] = [PermissaoOrigem].[FuncionalidadeAcaoId]
       AND [AcaoOrigem].[FuncionalidadeId] = @RecursoId
    INNER JOIN [dbo].[FuncionalidadeAcoes] AS [AcaoDestino]
        ON [AcaoDestino].[FuncionalidadeId] = @PlanejamentoId
       AND [AcaoDestino].[Chave] = [AcaoOrigem].[Chave]
    WHERE NOT EXISTS (
        SELECT 1
        FROM [dbo].[GrupoFuncionalidadeAcoes] AS [Destino]
        WHERE [Destino].[GrupoId] = [PermissaoOrigem].[GrupoId]
          AND [Destino].[FuncionalidadeAcaoId] = [AcaoDestino].[Id]
    );

    UPDATE [dbo].[Chamados]
       SET [FuncionalidadeId] = @PlanejamentoId
     WHERE [FuncionalidadeId] = @RecursoId;

    UPDATE [Destino]
       SET [Ativo] = CASE WHEN [Destino].[Ativo] = 1 OR [Origem].[Ativo] = 1 THEN 1 ELSE 0 END,
           [AtualizadoEm] = CASE
               WHEN [Destino].[AtualizadoEm] >= [Origem].[AtualizadoEm] THEN [Destino].[AtualizadoEm]
               ELSE [Origem].[AtualizadoEm]
           END
    FROM [dbo].[ChamadoResponsavelFuncionalidades] AS [Destino]
    INNER JOIN [dbo].[ChamadoResponsavelFuncionalidades] AS [Origem]
        ON [Origem].[ResponsavelSolucaoId] = [Destino].[ResponsavelSolucaoId]
       AND [Origem].[FuncionalidadeId] = @RecursoId
    WHERE [Destino].[FuncionalidadeId] = @PlanejamentoId;

    DELETE [Origem]
    FROM [dbo].[ChamadoResponsavelFuncionalidades] AS [Origem]
    WHERE [Origem].[FuncionalidadeId] = @RecursoId
      AND EXISTS (
          SELECT 1
          FROM [dbo].[ChamadoResponsavelFuncionalidades] AS [Destino]
          WHERE [Destino].[ResponsavelSolucaoId] = [Origem].[ResponsavelSolucaoId]
            AND [Destino].[FuncionalidadeId] = @PlanejamentoId
      );

    UPDATE [dbo].[ChamadoResponsavelFuncionalidades]
       SET [FuncionalidadeId] = @PlanejamentoId
     WHERE [FuncionalidadeId] = @RecursoId;

    DELETE FROM [dbo].[Funcionalidades]
     WHERE [Id] = @RecursoId;
END;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH