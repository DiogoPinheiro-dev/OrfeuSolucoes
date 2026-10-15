BEGIN TRY
  BEGIN TRANSACTION;

  CREATE TABLE [dbo].[SistemaInstalacoes] (
    [Id] INT NOT NULL,
    [Origem] NVARCHAR(20) NOT NULL,
    [VersaoManifesto] INT NULL,
    [InstaladoEm] DATETIME2(3) NOT NULL CONSTRAINT [DF_SistemaInstalacoes_InstaladoEm] DEFAULT SYSUTCDATETIME(),
    [DuracaoMs] INT NULL,
    CONSTRAINT [SistemaInstalacoes_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [CK_SistemaInstalacoes_Id] CHECK ([Id] = 1),
    CONSTRAINT [CK_SistemaInstalacoes_Origem] CHECK ([Origem] IN (N'INSTALACAO', N'BANCO_EXISTENTE')),
    CONSTRAINT [CK_SistemaInstalacoes_VersaoManifesto] CHECK ([VersaoManifesto] IS NULL OR [VersaoManifesto] > 0),
    CONSTRAINT [CK_SistemaInstalacoes_DuracaoMs] CHECK ([DuracaoMs] IS NULL OR [DuracaoMs] >= 0)
  );

  CREATE TABLE [dbo].[ProdutoAtualizacoes] (
    [Id] NVARCHAR(100) NOT NULL,
    [Descricao] NVARCHAR(500) NOT NULL,
    [Modo] NVARCHAR(30) NOT NULL,
    [AplicadaEm] DATETIME2(3) NOT NULL CONSTRAINT [DF_ProdutoAtualizacoes_AplicadaEm] DEFAULT SYSUTCDATETIME(),
    [DuracaoMs] INT NULL,
    [Resumo] NVARCHAR(MAX) NULL,
    CONSTRAINT [ProdutoAtualizacoes_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [CK_ProdutoAtualizacoes_Modo] CHECK ([Modo] IN (N'APLICADA', N'INCORPORADA_NA_INSTALACAO')),
    CONSTRAINT [CK_ProdutoAtualizacoes_DuracaoMs] CHECK ([DuracaoMs] IS NULL OR [DuracaoMs] >= 0)
  );

  IF EXISTS (SELECT 1 FROM [dbo].[Empresas])
    OR EXISTS (SELECT 1 FROM [dbo].[Usuarios])
    OR EXISTS (SELECT 1 FROM [dbo].[GruposUsuarios])
  BEGIN
    INSERT INTO [dbo].[SistemaInstalacoes] ([Id], [Origem], [VersaoManifesto], [InstaladoEm], [DuracaoMs])
    VALUES (1, N'BANCO_EXISTENTE', NULL, SYSUTCDATETIME(), NULL);
  END;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
