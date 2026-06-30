BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[ChamadoCategorias] (
  [Id] INT NOT NULL IDENTITY(1,1),
  [EmpresaId] INT NOT NULL,
  [Nome] NVARCHAR(1000) NOT NULL,
  [Descricao] NVARCHAR(1000),
  [Ativo] BIT NOT NULL CONSTRAINT [ChamadoCategorias_Ativo_df] DEFAULT 1,
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoCategorias_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
  [AtualizadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoCategorias_AtualizadoEm_df] DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT [ChamadoCategorias_pkey] PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UX_ChamadoCategorias_EmpresaId_Nome] UNIQUE NONCLUSTERED ([EmpresaId], [Nome])
);

CREATE TABLE [dbo].[ChamadoSequencias] (
  [Id] INT NOT NULL IDENTITY(1,1),
  [EmpresaId] INT NOT NULL,
  [ProximoNumero] INT NOT NULL CONSTRAINT [ChamadoSequencias_ProximoNumero_df] DEFAULT 1,
  [AtualizadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoSequencias_AtualizadoEm_df] DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT [ChamadoSequencias_pkey] PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UX_ChamadoSequencias_EmpresaId] UNIQUE NONCLUSTERED ([EmpresaId])
);

CREATE TABLE [dbo].[Chamados] (
  [Id] UNIQUEIDENTIFIER NOT NULL,
  [Numero] INT NOT NULL,
  [EmpresaId] INT NOT NULL,
  [SolicitanteId] UNIQUEIDENTIFIER NOT NULL,
  [ResponsavelId] UNIQUEIDENTIFIER,
  [CategoriaId] INT,
  [Titulo] NVARCHAR(1000) NOT NULL,
  [Descricao] NVARCHAR(1000) NOT NULL,
  [Tipo] NVARCHAR(1000) NOT NULL CONSTRAINT [Chamados_Tipo_df] DEFAULT 'SOLICITACAO',
  [Prioridade] NVARCHAR(1000) NOT NULL CONSTRAINT [Chamados_Prioridade_df] DEFAULT 'MEDIA',
  [Status] NVARCHAR(1000) NOT NULL CONSTRAINT [Chamados_Status_df] DEFAULT 'ABERTO',
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [Chamados_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
  [AtualizadoEm] DATETIME2 NOT NULL CONSTRAINT [Chamados_AtualizadoEm_df] DEFAULT CURRENT_TIMESTAMP,
  [PrimeiraRespostaEm] DATETIME2,
  [ResolvidoEm] DATETIME2,
  [EncerradoEm] DATETIME2,
  [Versao] INT NOT NULL CONSTRAINT [Chamados_Versao_df] DEFAULT 1,
  CONSTRAINT [Chamados_pkey] PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UX_Chamados_EmpresaId_Numero] UNIQUE NONCLUSTERED ([EmpresaId], [Numero])
);

CREATE TABLE [dbo].[ChamadoMensagens] (
  [Id] UNIQUEIDENTIFIER NOT NULL,
  [ChamadoId] UNIQUEIDENTIFIER NOT NULL,
  [EmpresaId] INT NOT NULL,
  [AutorId] UNIQUEIDENTIFIER NOT NULL,
  [Tipo] NVARCHAR(1000) NOT NULL CONSTRAINT [ChamadoMensagens_Tipo_df] DEFAULT 'PUBLICA',
  [Conteudo] NVARCHAR(1000) NOT NULL,
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoMensagens_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT [ChamadoMensagens_pkey] PRIMARY KEY CLUSTERED ([Id])
);

CREATE TABLE [dbo].[ChamadoHistorico] (
  [Id] UNIQUEIDENTIFIER NOT NULL,
  [ChamadoId] UNIQUEIDENTIFIER NOT NULL,
  [EmpresaId] INT NOT NULL,
  [UsuarioId] UNIQUEIDENTIFIER,
  [Evento] NVARCHAR(1000) NOT NULL,
  [Campo] NVARCHAR(1000),
  [ValorAnterior] NVARCHAR(1000),
  [ValorNovo] NVARCHAR(1000),
  [Observacao] NVARCHAR(1000),
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoHistorico_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT [ChamadoHistorico_pkey] PRIMARY KEY CLUSTERED ([Id])
);

CREATE INDEX [IX_Chamados_EmpresaId_Status] ON [dbo].[Chamados]([EmpresaId], [Status]);
CREATE INDEX [IX_Chamados_EmpresaId_ResponsavelId] ON [dbo].[Chamados]([EmpresaId], [ResponsavelId]);
CREATE INDEX [IX_Chamados_EmpresaId_SolicitanteId] ON [dbo].[Chamados]([EmpresaId], [SolicitanteId]);
CREATE INDEX [IX_Chamados_EmpresaId_Prioridade] ON [dbo].[Chamados]([EmpresaId], [Prioridade]);
CREATE INDEX [IX_Chamados_EmpresaId_AtualizadoEm] ON [dbo].[Chamados]([EmpresaId], [AtualizadoEm]);
CREATE INDEX [IX_ChamadoMensagens_EmpresaId_ChamadoId_CriadoEm] ON [dbo].[ChamadoMensagens]([EmpresaId], [ChamadoId], [CriadoEm]);
CREATE INDEX [IX_ChamadoHistorico_EmpresaId_ChamadoId_CriadoEm] ON [dbo].[ChamadoHistorico]([EmpresaId], [ChamadoId], [CriadoEm]);

ALTER TABLE [dbo].[ChamadoCategorias] ADD CONSTRAINT [ChamadoCategorias_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoSequencias] ADD CONSTRAINT [ChamadoSequencias_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Chamados] ADD CONSTRAINT [Chamados_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Chamados] ADD CONSTRAINT [Chamados_SolicitanteId_fkey] FOREIGN KEY ([SolicitanteId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Chamados] ADD CONSTRAINT [Chamados_ResponsavelId_fkey] FOREIGN KEY ([ResponsavelId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Chamados] ADD CONSTRAINT [Chamados_CategoriaId_fkey] FOREIGN KEY ([CategoriaId]) REFERENCES [dbo].[ChamadoCategorias]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoMensagens] ADD CONSTRAINT [ChamadoMensagens_ChamadoId_fkey] FOREIGN KEY ([ChamadoId]) REFERENCES [dbo].[Chamados]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoMensagens] ADD CONSTRAINT [ChamadoMensagens_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoMensagens] ADD CONSTRAINT [ChamadoMensagens_AutorId_fkey] FOREIGN KEY ([AutorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoHistorico] ADD CONSTRAINT [ChamadoHistorico_ChamadoId_fkey] FOREIGN KEY ([ChamadoId]) REFERENCES [dbo].[Chamados]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoHistorico] ADD CONSTRAINT [ChamadoHistorico_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoHistorico] ADD CONSTRAINT [ChamadoHistorico_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
