BEGIN TRY

BEGIN TRAN;

EXEC(N'ALTER TABLE [dbo].[Solucoes] ADD
  [ChaveTecnica] NVARCHAR(200) NULL,
  [VersaoDefinicao] INT NOT NULL CONSTRAINT [DF_Solucoes_VersaoDefinicao] DEFAULT 1,
  [StatusPublicacao] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Solucoes_StatusPublicacao] DEFAULT N''PUBLICADA'',
  [RevisaoCatalogo] INT NOT NULL CONSTRAINT [DF_Solucoes_RevisaoCatalogo] DEFAULT 1,
  [PublicadoEm] DATETIME2 NULL;');

EXEC(N'ALTER TABLE [dbo].[Funcionalidades] ADD
  [ChaveTecnica] NVARCHAR(200) NULL,
  [ProviderKey] NVARCHAR(200) NULL,
  [ProviderVersion] INT NULL,
  [VersaoDefinicao] INT NOT NULL CONSTRAINT [DF_Funcionalidades_VersaoDefinicao] DEFAULT 1,
  [StatusPublicacao] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Funcionalidades_StatusPublicacao] DEFAULT N''PUBLICADA'',
  [RevisaoCatalogo] INT NOT NULL CONSTRAINT [DF_Funcionalidades_RevisaoCatalogo] DEFAULT 1,
  [PublicadoEm] DATETIME2 NULL;');

EXEC(N'ALTER TABLE [dbo].[FuncionalidadeAcoes] ADD
  [ConsumerKey] NVARCHAR(200) NULL,
  [ConsumerVersion] INT NULL,
  [VersaoDefinicao] INT NOT NULL CONSTRAINT [DF_FuncionalidadeAcoes_VersaoDefinicao] DEFAULT 1,
  [StatusPublicacao] NVARCHAR(20) NOT NULL CONSTRAINT [DF_FuncionalidadeAcoes_StatusPublicacao] DEFAULT N''PUBLICADA'',
  [RevisaoCatalogo] INT NOT NULL CONSTRAINT [DF_FuncionalidadeAcoes_RevisaoCatalogo] DEFAULT 1,
  [PublicadoEm] DATETIME2 NULL;');

EXEC(N'UPDATE [dbo].[Solucoes]
SET
  [ChaveTecnica] = CONCAT(N''solution.'', [Id]),
  [PublicadoEm] = GETDATE();');

EXEC(N'UPDATE [dbo].[Funcionalidades]
SET
  [ChaveTecnica] = COALESCE(NULLIF(LTRIM(RTRIM([RegistryKey])), N''''), CONCAT(N''feature.'', [Id])),
  [ProviderKey] = NULLIF(LTRIM(RTRIM([RegistryKey])), N''''),
  [ProviderVersion] = CASE WHEN NULLIF(LTRIM(RTRIM([RegistryKey])), N'''') IS NULL THEN NULL ELSE 1 END,
  [PublicadoEm] = GETDATE();');

EXEC(N'UPDATE [dbo].[FuncionalidadeAcoes]
SET [PublicadoEm] = GETDATE();');

EXEC(N'ALTER TABLE [dbo].[Solucoes] ALTER COLUMN [ChaveTecnica] NVARCHAR(200) NOT NULL;');
EXEC(N'ALTER TABLE [dbo].[Funcionalidades] ALTER COLUMN [ChaveTecnica] NVARCHAR(200) NOT NULL;');

EXEC(N'ALTER TABLE [dbo].[Solucoes] ADD CONSTRAINT [DF_Solucoes_ChaveTecnica] DEFAULT CONVERT(NVARCHAR(36), NEWID()) FOR [ChaveTecnica];');
EXEC(N'ALTER TABLE [dbo].[Funcionalidades] ADD CONSTRAINT [DF_Funcionalidades_ChaveTecnica] DEFAULT CONVERT(NVARCHAR(36), NEWID()) FOR [ChaveTecnica];');

EXEC(N'CREATE UNIQUE INDEX [UX_Solucoes_ChaveTecnica] ON [dbo].[Solucoes]([ChaveTecnica]);');
EXEC(N'CREATE UNIQUE INDEX [UX_Funcionalidades_ChaveTecnica] ON [dbo].[Funcionalidades]([ChaveTecnica]);');

EXEC(N'ALTER TABLE [dbo].[Solucoes] ADD CONSTRAINT [CK_Solucoes_StatusPublicacao]
  CHECK ([StatusPublicacao] IN (N''RASCUNHO'', N''PUBLICADA'', N''DESPUBLICADA''));');
EXEC(N'ALTER TABLE [dbo].[Funcionalidades] ADD CONSTRAINT [CK_Funcionalidades_StatusPublicacao]
  CHECK ([StatusPublicacao] IN (N''RASCUNHO'', N''PUBLICADA'', N''DESPUBLICADA''));');
EXEC(N'ALTER TABLE [dbo].[FuncionalidadeAcoes] ADD CONSTRAINT [CK_FuncionalidadeAcoes_StatusPublicacao]
  CHECK ([StatusPublicacao] IN (N''RASCUNHO'', N''PUBLICADA'', N''DESPUBLICADA''));');

CREATE TABLE [dbo].[CatalogoVersoes] (
  [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_CatalogoVersoes_Id] DEFAULT NEWID(),
  [SolucaoId] INT NULL,
  [FuncionalidadeId] INT NULL,
  [FuncionalidadeAcaoId] INT NULL,
  [Numero] INT NOT NULL,
  [Estado] NVARCHAR(20) NOT NULL,
  [Origem] NVARCHAR(20) NOT NULL,
  [Revisao] INT NOT NULL CONSTRAINT [DF_CatalogoVersoes_Revisao] DEFAULT 1,
  [VersaoDefinicao] INT NOT NULL CONSTRAINT [DF_CatalogoVersoes_VersaoDefinicao] DEFAULT 1,
  [Snapshot] NVARCHAR(MAX) NOT NULL,
  [BaselineSnapshot] NVARCHAR(MAX) NULL,
  [Motivo] NVARCHAR(500) NULL,
  [CriadoPorId] UNIQUEIDENTIFIER NULL,
  [PublicadoPorId] UNIQUEIDENTIFIER NULL,
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_CatalogoVersoes_CriadoEm] DEFAULT GETDATE(),
  [AtualizadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_CatalogoVersoes_AtualizadoEm] DEFAULT GETDATE(),
  [PublicadoEm] DATETIME2 NULL,
  CONSTRAINT [PK_CatalogoVersoes] PRIMARY KEY ([Id]),
  CONSTRAINT [CK_CatalogoVersoes_Entidade] CHECK (
    (CASE WHEN [SolucaoId] IS NULL THEN 0 ELSE 1 END) +
    (CASE WHEN [FuncionalidadeId] IS NULL THEN 0 ELSE 1 END) +
    (CASE WHEN [FuncionalidadeAcaoId] IS NULL THEN 0 ELSE 1 END) = 1
  ),
  CONSTRAINT [CK_CatalogoVersoes_Estado] CHECK ([Estado] IN (N'RASCUNHO', N'PUBLICADA', N'SUBSTITUIDA', N'DESCARTADA')),
  CONSTRAINT [CK_CatalogoVersoes_Origem] CHECK ([Origem] IN (N'PRODUTO', N'CUSTOMIZACAO', N'RESTAURACAO')),
  CONSTRAINT [FK_CatalogoVersoes_Solucoes] FOREIGN KEY ([SolucaoId]) REFERENCES [dbo].[Solucoes]([Id]) ON DELETE NO ACTION,
  CONSTRAINT [FK_CatalogoVersoes_Funcionalidades] FOREIGN KEY ([FuncionalidadeId]) REFERENCES [dbo].[Funcionalidades]([Id]) ON DELETE NO ACTION,
  CONSTRAINT [FK_CatalogoVersoes_FuncionalidadeAcoes] FOREIGN KEY ([FuncionalidadeAcaoId]) REFERENCES [dbo].[FuncionalidadeAcoes]([Id]) ON DELETE NO ACTION,
  CONSTRAINT [FK_CatalogoVersoes_CriadoPor] FOREIGN KEY ([CriadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION,
  CONSTRAINT [FK_CatalogoVersoes_PublicadoPor] FOREIGN KEY ([PublicadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_CatalogoVersoes_Solucao_Estado] ON [dbo].[CatalogoVersoes]([SolucaoId], [Estado]);
CREATE INDEX [IX_CatalogoVersoes_Funcionalidade_Estado] ON [dbo].[CatalogoVersoes]([FuncionalidadeId], [Estado]);
CREATE INDEX [IX_CatalogoVersoes_Acao_Estado] ON [dbo].[CatalogoVersoes]([FuncionalidadeAcaoId], [Estado]);
CREATE UNIQUE INDEX [UX_CatalogoVersoes_Solucao_Publicada] ON [dbo].[CatalogoVersoes]([SolucaoId]) WHERE [SolucaoId] IS NOT NULL AND [Estado] = N'PUBLICADA';
CREATE UNIQUE INDEX [UX_CatalogoVersoes_Funcionalidade_Publicada] ON [dbo].[CatalogoVersoes]([FuncionalidadeId]) WHERE [FuncionalidadeId] IS NOT NULL AND [Estado] = N'PUBLICADA';
CREATE UNIQUE INDEX [UX_CatalogoVersoes_Acao_Publicada] ON [dbo].[CatalogoVersoes]([FuncionalidadeAcaoId]) WHERE [FuncionalidadeAcaoId] IS NOT NULL AND [Estado] = N'PUBLICADA';
CREATE UNIQUE INDEX [UX_CatalogoVersoes_Solucao_Rascunho] ON [dbo].[CatalogoVersoes]([SolucaoId]) WHERE [SolucaoId] IS NOT NULL AND [Estado] = N'RASCUNHO';
CREATE UNIQUE INDEX [UX_CatalogoVersoes_Funcionalidade_Rascunho] ON [dbo].[CatalogoVersoes]([FuncionalidadeId]) WHERE [FuncionalidadeId] IS NOT NULL AND [Estado] = N'RASCUNHO';
CREATE UNIQUE INDEX [UX_CatalogoVersoes_Acao_Rascunho] ON [dbo].[CatalogoVersoes]([FuncionalidadeAcaoId]) WHERE [FuncionalidadeAcaoId] IS NOT NULL AND [Estado] = N'RASCUNHO';

CREATE TABLE [dbo].[CatalogoConflitos] (
  [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_CatalogoConflitos_Id] DEFAULT NEWID(),
  [VersaoId] UNIQUEIDENTIFIER NOT NULL,
  [Campo] NVARCHAR(100) NOT NULL,
  [BaselineAnterior] NVARCHAR(MAX) NULL,
  [ValorCustomizado] NVARCHAR(MAX) NULL,
  [BaselineNovo] NVARCHAR(MAX) NULL,
  [Estado] NVARCHAR(20) NOT NULL CONSTRAINT [DF_CatalogoConflitos_Estado] DEFAULT N'PENDENTE',
  [ValorResolvido] NVARCHAR(MAX) NULL,
  [ResolvidoPorId] UNIQUEIDENTIFIER NULL,
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_CatalogoConflitos_CriadoEm] DEFAULT GETDATE(),
  [ResolvidoEm] DATETIME2 NULL,
  CONSTRAINT [PK_CatalogoConflitos] PRIMARY KEY ([Id]),
  CONSTRAINT [UX_CatalogoConflitos_Versao_Campo] UNIQUE ([VersaoId], [Campo]),
  CONSTRAINT [CK_CatalogoConflitos_Estado] CHECK ([Estado] IN (N'PENDENTE', N'RESOLVIDO')),
  CONSTRAINT [FK_CatalogoConflitos_Versao] FOREIGN KEY ([VersaoId]) REFERENCES [dbo].[CatalogoVersoes]([Id]) ON DELETE CASCADE,
  CONSTRAINT [FK_CatalogoConflitos_ResolvidoPor] FOREIGN KEY ([ResolvidoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_CatalogoConflitos_Estado] ON [dbo].[CatalogoConflitos]([Estado]);

CREATE TABLE [dbo].[CatalogoAuditorias] (
  [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_CatalogoAuditorias_Id] DEFAULT NEWID(),
  [VersaoId] UNIQUEIDENTIFIER NULL,
  [Entidade] NVARCHAR(30) NOT NULL,
  [EntidadeId] INT NOT NULL,
  [Evento] NVARCHAR(30) NOT NULL,
  [Antes] NVARCHAR(MAX) NULL,
  [Depois] NVARCHAR(MAX) NULL,
  [Motivo] NVARCHAR(500) NULL,
  [AutorId] UNIQUEIDENTIFIER NULL,
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_CatalogoAuditorias_CriadoEm] DEFAULT GETDATE(),
  CONSTRAINT [PK_CatalogoAuditorias] PRIMARY KEY ([Id]),
  CONSTRAINT [FK_CatalogoAuditorias_Versao] FOREIGN KEY ([VersaoId]) REFERENCES [dbo].[CatalogoVersoes]([Id]) ON DELETE NO ACTION,
  CONSTRAINT [FK_CatalogoAuditorias_Autor] FOREIGN KEY ([AutorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_CatalogoAuditorias_Entidade_Criado] ON [dbo].[CatalogoAuditorias]([Entidade], [EntidadeId], [CriadoEm]);

EXEC(N'INSERT INTO [dbo].[CatalogoVersoes] ([Id], [SolucaoId], [Numero], [Estado], [Origem], [Revisao], [VersaoDefinicao], [Snapshot], [BaselineSnapshot], [CriadoEm], [AtualizadoEm], [PublicadoEm])
SELECT NEWID(), solucao.[Id], 1, N''PUBLICADA'', CASE WHEN solucao.[PadraoSistema] = 1 THEN N''PRODUTO'' ELSE N''CUSTOMIZACAO'' END, 1, solucao.[VersaoDefinicao], snapshot.[Valor], CASE WHEN solucao.[PadraoSistema] = 1 THEN snapshot.[Valor] ELSE NULL END, GETDATE(), GETDATE(), GETDATE()
FROM [dbo].[Solucoes] solucao
CROSS APPLY (SELECT solucao.[Slug] AS [slug], solucao.[Nome] AS [nome], solucao.[Descricao] AS [descricao], solucao.[Eyebrow] AS [eyebrow], solucao.[Ordem] AS [ordem], solucao.[Ativo] AS [ativo], solucao.[ExibirNoHub] AS [exibirNoHub], solucao.[SomenteAdminSistema] AS [somenteAdminSistema] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) snapshot([Valor]);');

EXEC(N'INSERT INTO [dbo].[CatalogoVersoes] ([Id], [FuncionalidadeId], [Numero], [Estado], [Origem], [Revisao], [VersaoDefinicao], [Snapshot], [BaselineSnapshot], [CriadoEm], [AtualizadoEm], [PublicadoEm])
SELECT NEWID(), funcionalidade.[Id], 1, N''PUBLICADA'', CASE WHEN funcionalidade.[PadraoSistema] = 1 THEN N''PRODUTO'' ELSE N''CUSTOMIZACAO'' END, 1, funcionalidade.[VersaoDefinicao], snapshot.[Valor], CASE WHEN funcionalidade.[PadraoSistema] = 1 THEN snapshot.[Valor] ELSE NULL END, GETDATE(), GETDATE(), GETDATE()
FROM [dbo].[Funcionalidades] funcionalidade
CROSS APPLY (SELECT funcionalidade.[SolucaoId] AS [solucaoId], funcionalidade.[Slug] AS [slug], funcionalidade.[Titulo] AS [titulo], funcionalidade.[Label] AS [label], funcionalidade.[Descricao] AS [descricao], funcionalidade.[Ordem] AS [ordem], funcionalidade.[Ativo] AS [ativo], funcionalidade.[RegistryKey] AS [registryKey], funcionalidade.[ProviderKey] AS [providerKey], funcionalidade.[ProviderVersion] AS [providerVersion], funcionalidade.[SomenteAdminSistema] AS [somenteAdminSistema] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) snapshot([Valor]);');

EXEC(N'INSERT INTO [dbo].[CatalogoVersoes] ([Id], [FuncionalidadeAcaoId], [Numero], [Estado], [Origem], [Revisao], [VersaoDefinicao], [Snapshot], [BaselineSnapshot], [CriadoEm], [AtualizadoEm], [PublicadoEm])
SELECT NEWID(), acao.[Id], 1, N''PUBLICADA'', CASE WHEN acao.[AcaoPadrao] = 1 THEN N''PRODUTO'' ELSE N''CUSTOMIZACAO'' END, 1, acao.[VersaoDefinicao], snapshot.[Valor], CASE WHEN acao.[AcaoPadrao] = 1 THEN snapshot.[Valor] ELSE NULL END, GETDATE(), GETDATE(), GETDATE()
FROM [dbo].[FuncionalidadeAcoes] acao
CROSS APPLY (SELECT acao.[FuncionalidadeId] AS [funcionalidadeId], acao.[Chave] AS [chave], acao.[Nome] AS [nome], acao.[Descricao] AS [descricao], acao.[Ordem] AS [ordem], acao.[Ativo] AS [ativo], acao.[Configuracao] AS [configuracao], acao.[ConsumerKey] AS [consumerKey], acao.[ConsumerVersion] AS [consumerVersion] FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) snapshot([Valor]);');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
  ROLLBACK TRAN;
END;
THROW

END CATCH
