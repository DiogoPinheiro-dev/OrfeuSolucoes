BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ChamadoResponsaveis] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [EmpresaId] INT NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [Ativo] BIT NOT NULL CONSTRAINT [ChamadoResponsaveis_Ativo_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoResponsaveis_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ChamadoResponsaveis_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ChamadoResponsaveis_EmpresaId_UsuarioId] UNIQUE NONCLUSTERED ([EmpresaId], [UsuarioId])
);

-- CreateTable
CREATE TABLE [dbo].[ChamadoResponsavelSolucoes] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [ResponsavelId] INT NOT NULL,
    [SolucaoId] INT NOT NULL,
    [ResponsavelGeral] BIT NOT NULL CONSTRAINT [ChamadoResponsavelSolucoes_ResponsavelGeral_df] DEFAULT 0,
    [Ativo] BIT NOT NULL CONSTRAINT [ChamadoResponsavelSolucoes_Ativo_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoResponsavelSolucoes_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ChamadoResponsavelSolucoes_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ChamadoResponsavelSolucoes_ResponsavelId_SolucaoId] UNIQUE NONCLUSTERED ([ResponsavelId], [SolucaoId])
);

-- CreateTable
CREATE TABLE [dbo].[ChamadoResponsavelFuncionalidades] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [ResponsavelSolucaoId] INT NOT NULL,
    [FuncionalidadeId] INT NOT NULL,
    [Ativo] BIT NOT NULL CONSTRAINT [ChamadoResponsavelFuncionalidades_Ativo_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoResponsavelFuncionalidades_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ChamadoResponsavelFuncionalidades_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ChamadoResponsavelFuncionalidades_ResponsavelSolucaoId_FuncionalidadeId] UNIQUE NONCLUSTERED ([ResponsavelSolucaoId], [FuncionalidadeId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveis_EmpresaId_Ativo] ON [dbo].[ChamadoResponsaveis]([EmpresaId], [Ativo]);
CREATE NONCLUSTERED INDEX [IX_ChamadoResponsavelSolucoes_SolucaoId] ON [dbo].[ChamadoResponsavelSolucoes]([SolucaoId]);
CREATE NONCLUSTERED INDEX [IX_ChamadoResponsavelFuncionalidades_FuncionalidadeId] ON [dbo].[ChamadoResponsavelFuncionalidades]([FuncionalidadeId]);

-- AddForeignKey
ALTER TABLE [dbo].[ChamadoResponsaveis] ADD CONSTRAINT [ChamadoResponsaveis_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoResponsaveis] ADD CONSTRAINT [ChamadoResponsaveis_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoResponsavelSolucoes] ADD CONSTRAINT [ChamadoResponsavelSolucoes_ResponsavelId_fkey] FOREIGN KEY ([ResponsavelId]) REFERENCES [dbo].[ChamadoResponsaveis]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoResponsavelSolucoes] ADD CONSTRAINT [ChamadoResponsavelSolucoes_SolucaoId_fkey] FOREIGN KEY ([SolucaoId]) REFERENCES [dbo].[Solucoes]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoResponsavelFuncionalidades] ADD CONSTRAINT [ChamadoResponsavelFuncionalidades_ResponsavelSolucaoId_fkey] FOREIGN KEY ([ResponsavelSolucaoId]) REFERENCES [dbo].[ChamadoResponsavelSolucoes]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoResponsavelFuncionalidades] ADD CONSTRAINT [ChamadoResponsavelFuncionalidades_FuncionalidadeId_fkey] FOREIGN KEY ([FuncionalidadeId]) REFERENCES [dbo].[Funcionalidades]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- DataMigration
IF OBJECT_ID(N'[dbo].[ChamadoResponsaveisConfiguracao]', N'U') IS NOT NULL
BEGIN
    INSERT INTO [dbo].[ChamadoResponsaveis] ([EmpresaId], [UsuarioId], [Ativo], [CriadoEm], [AtualizadoEm])
    SELECT
        [EmpresaId],
        [UsuarioId],
        CAST(MAX(CAST([Ativo] AS INT)) AS BIT) AS [Ativo],
        MIN([CriadoEm]) AS [CriadoEm],
        MAX([AtualizadoEm]) AS [AtualizadoEm]
    FROM [dbo].[ChamadoResponsaveisConfiguracao]
    GROUP BY [EmpresaId], [UsuarioId];

    INSERT INTO [dbo].[ChamadoResponsavelSolucoes] ([ResponsavelId], [SolucaoId], [ResponsavelGeral], [Ativo], [CriadoEm], [AtualizadoEm])
    SELECT
        responsavel.[Id] AS [ResponsavelId],
        configuracao.[SolucaoId],
        CAST(MAX(CASE WHEN configuracao.[FuncionalidadeId] IS NULL AND configuracao.[Ativo] = 1 THEN 1 ELSE 0 END) AS BIT) AS [ResponsavelGeral],
        CAST(MAX(CAST(configuracao.[Ativo] AS INT)) AS BIT) AS [Ativo],
        MIN(configuracao.[CriadoEm]) AS [CriadoEm],
        MAX(configuracao.[AtualizadoEm]) AS [AtualizadoEm]
    FROM [dbo].[ChamadoResponsaveisConfiguracao] configuracao
    INNER JOIN [dbo].[ChamadoResponsaveis] responsavel
        ON responsavel.[EmpresaId] = configuracao.[EmpresaId]
       AND responsavel.[UsuarioId] = configuracao.[UsuarioId]
    GROUP BY responsavel.[Id], configuracao.[SolucaoId];

    INSERT INTO [dbo].[ChamadoResponsavelFuncionalidades] ([ResponsavelSolucaoId], [FuncionalidadeId], [Ativo], [CriadoEm], [AtualizadoEm])
    SELECT
        responsavelSolucao.[Id] AS [ResponsavelSolucaoId],
        configuracao.[FuncionalidadeId],
        CAST(MAX(CAST(configuracao.[Ativo] AS INT)) AS BIT) AS [Ativo],
        MIN(configuracao.[CriadoEm]) AS [CriadoEm],
        MAX(configuracao.[AtualizadoEm]) AS [AtualizadoEm]
    FROM [dbo].[ChamadoResponsaveisConfiguracao] configuracao
    INNER JOIN [dbo].[ChamadoResponsaveis] responsavel
        ON responsavel.[EmpresaId] = configuracao.[EmpresaId]
       AND responsavel.[UsuarioId] = configuracao.[UsuarioId]
    INNER JOIN [dbo].[ChamadoResponsavelSolucoes] responsavelSolucao
        ON responsavelSolucao.[ResponsavelId] = responsavel.[Id]
       AND responsavelSolucao.[SolucaoId] = configuracao.[SolucaoId]
    WHERE configuracao.[FuncionalidadeId] IS NOT NULL
    GROUP BY responsavelSolucao.[Id], configuracao.[FuncionalidadeId];

    DROP TABLE [dbo].[ChamadoResponsaveisConfiguracao];
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