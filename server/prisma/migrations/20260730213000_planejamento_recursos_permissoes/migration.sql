BEGIN TRY
BEGIN TRAN;

DECLARE @SolucaoId INT = (
    SELECT TOP (1) [Id] FROM [dbo].[Solucoes] WHERE [Slug] = N'projetos'
);
DECLARE @TarefasId INT = (
    SELECT TOP (1) [Id] FROM [dbo].[Funcionalidades]
    WHERE [SolucaoId] = @SolucaoId AND [Slug] = N'cadastro-de-tarefas'
);
DECLARE @PlanejamentoId INT = (
    SELECT TOP (1) [Id] FROM [dbo].[Funcionalidades]
    WHERE [SolucaoId] = @SolucaoId AND [Slug] = N'grade-de-capacitacao'
);

IF @PlanejamentoId IS NOT NULL
BEGIN
    UPDATE [dbo].[Funcionalidades]
       SET [Titulo] = N'Planejamento de recursos',
           [Label] = N'Planejamento de recursos',
           [Descricao] = N'Gerencie vinculos, capacidade, tarefas, custos e execucoes planejadas por recurso e projeto.',
           [Ordem] = 80,
           [RegistryKey] = N'projetos.grade-de-capacitacao',
           [Ativo] = 1
     WHERE [Id] = @PlanejamentoId;
END;

IF @TarefasId IS NOT NULL
BEGIN
    UPDATE [dbo].[Funcionalidades] SET [Ordem] = 90, [Ativo] = 0 WHERE [Id] = @TarefasId;
END;

IF @TarefasId IS NOT NULL AND @PlanejamentoId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[EmpresaFuncionalidades] ([EmpresaId], [FuncionalidadeId])
    SELECT [Origem].[EmpresaId], @PlanejamentoId
    FROM [dbo].[EmpresaFuncionalidades] [Origem]
    WHERE [Origem].[FuncionalidadeId] = @TarefasId
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[EmpresaFuncionalidades] [Destino]
          WHERE [Destino].[EmpresaId] = [Origem].[EmpresaId]
            AND [Destino].[FuncionalidadeId] = @PlanejamentoId
      );

    INSERT INTO [dbo].[GrupoFuncionalidades] (
        [GrupoId], [FuncionalidadeId], [PodeVisualizar], [PodeIncluir], [PodeAlterar], [PodeExcluir]
    )
    SELECT
        [Origem].[GrupoId], @PlanejamentoId, [Origem].[PodeVisualizar],
        [Origem].[PodeIncluir], [Origem].[PodeAlterar], [Origem].[PodeExcluir]
    FROM [dbo].[GrupoFuncionalidades] [Origem]
    WHERE [Origem].[FuncionalidadeId] = @TarefasId
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[GrupoFuncionalidades] [Destino]
          WHERE [Destino].[GrupoId] = [Origem].[GrupoId]
            AND [Destino].[FuncionalidadeId] = @PlanejamentoId
      );

    UPDATE [Destino]
       SET [PodeVisualizar] = CASE WHEN [Destino].[PodeVisualizar] = 1 OR [Origem].[PodeVisualizar] = 1 THEN 1 ELSE 0 END,
           [PodeIncluir] = CASE WHEN [Destino].[PodeIncluir] = 1 OR [Origem].[PodeIncluir] = 1 THEN 1 ELSE 0 END,
           [PodeAlterar] = CASE WHEN [Destino].[PodeAlterar] = 1 OR [Origem].[PodeAlterar] = 1 THEN 1 ELSE 0 END,
           [PodeExcluir] = CASE WHEN [Destino].[PodeExcluir] = 1 OR [Origem].[PodeExcluir] = 1 THEN 1 ELSE 0 END
    FROM [dbo].[GrupoFuncionalidades] [Destino]
    INNER JOIN [dbo].[GrupoFuncionalidades] [Origem]
        ON [Origem].[GrupoId] = [Destino].[GrupoId]
       AND [Origem].[FuncionalidadeId] = @TarefasId
    WHERE [Destino].[FuncionalidadeId] = @PlanejamentoId;

    INSERT INTO [dbo].[GrupoFuncionalidadeAcoes] ([GrupoId], [FuncionalidadeAcaoId], [Permitido])
    SELECT [PermissaoOrigem].[GrupoId], [AcaoDestino].[Id], [PermissaoOrigem].[Permitido]
    FROM [dbo].[GrupoFuncionalidadeAcoes] [PermissaoOrigem]
    INNER JOIN [dbo].[FuncionalidadeAcoes] [AcaoOrigem]
        ON [AcaoOrigem].[Id] = [PermissaoOrigem].[FuncionalidadeAcaoId]
       AND [AcaoOrigem].[FuncionalidadeId] = @TarefasId
    INNER JOIN [dbo].[FuncionalidadeAcoes] [AcaoDestino]
        ON [AcaoDestino].[FuncionalidadeId] = @PlanejamentoId
       AND [AcaoDestino].[Chave] = [AcaoOrigem].[Chave]
    WHERE NOT EXISTS (
        SELECT 1 FROM [dbo].[GrupoFuncionalidadeAcoes] [PermissaoDestino]
        WHERE [PermissaoDestino].[GrupoId] = [PermissaoOrigem].[GrupoId]
          AND [PermissaoDestino].[FuncionalidadeAcaoId] = [AcaoDestino].[Id]
    );

    UPDATE [PermissaoDestino]
       SET [Permitido] = CASE WHEN [PermissaoDestino].[Permitido] = 1 OR [PermissaoOrigem].[Permitido] = 1 THEN 1 ELSE 0 END
    FROM [dbo].[GrupoFuncionalidadeAcoes] [PermissaoDestino]
    INNER JOIN [dbo].[FuncionalidadeAcoes] [AcaoDestino]
        ON [AcaoDestino].[Id] = [PermissaoDestino].[FuncionalidadeAcaoId]
       AND [AcaoDestino].[FuncionalidadeId] = @PlanejamentoId
    INNER JOIN [dbo].[FuncionalidadeAcoes] [AcaoOrigem]
        ON [AcaoOrigem].[FuncionalidadeId] = @TarefasId
       AND [AcaoOrigem].[Chave] = [AcaoDestino].[Chave]
    INNER JOIN [dbo].[GrupoFuncionalidadeAcoes] [PermissaoOrigem]
        ON [PermissaoOrigem].[GrupoId] = [PermissaoDestino].[GrupoId]
       AND [PermissaoOrigem].[FuncionalidadeAcaoId] = [AcaoOrigem].[Id];
END;

COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
