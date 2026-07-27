BEGIN TRY
BEGIN TRAN;

CREATE TABLE [dbo].[ProjetoMarcos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [Nome] NVARCHAR(160) NOT NULL,
    [Descricao] NVARCHAR(1000),
    [ResponsavelId] UNIQUEIDENTIFIER NOT NULL,
    [Status] NVARCHAR(20) NOT NULL,
    [DataPrevistaEm] DATE NOT NULL,
    [DataRealizadaEm] DATE,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoMarcos_Versao_df] DEFAULT 1,
    [CriadoPorId] UNIQUEIDENTIFIER NOT NULL,
    [ArquivadoEm] DATETIME2,
    [ArquivadoPorId] UNIQUEIDENTIFIER,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoMarcos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoMarcos_pkey] PRIMARY KEY CLUSTERED ([Id])
);

CREATE TABLE [dbo].[ProjetoMarcoItens] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [MarcoId] UNIQUEIDENTIFIER NOT NULL,
    [ItemId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [ProjetoMarcoItens_pkey] PRIMARY KEY CLUSTERED ([Id])
);

CREATE TABLE [dbo].[ProjetoEntregas] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [MarcoId] UNIQUEIDENTIFIER,
    [Nome] NVARCHAR(160) NOT NULL,
    [ResultadoEsperado] NVARCHAR(1500) NOT NULL,
    [CriteriosAceite] NVARCHAR(3000) NOT NULL,
    [ResponsavelId] UNIQUEIDENTIFIER NOT NULL,
    [Status] NVARCHAR(20) NOT NULL,
    [InicioPrevistoEm] DATE NOT NULL,
    [FimPrevistoEm] DATE NOT NULL,
    [ConcluidaEm] DATETIME2,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoEntregas_Versao_df] DEFAULT 1,
    [CriadoPorId] UNIQUEIDENTIFIER NOT NULL,
    [ArquivadoEm] DATETIME2,
    [ArquivadoPorId] UNIQUEIDENTIFIER,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoEntregas_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoEntregas_pkey] PRIMARY KEY CLUSTERED ([Id])
);

CREATE TABLE [dbo].[ProjetoEntregaItens] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [EntregaId] UNIQUEIDENTIFIER NOT NULL,
    [ItemId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [ProjetoEntregaItens_pkey] PRIMARY KEY CLUSTERED ([Id])
);

CREATE NONCLUSTERED INDEX [IX_ProjetoMarcos_Empresa_Projeto_Arquivado] ON [dbo].[ProjetoMarcos]([EmpresaId], [ProjetoId], [ArquivadoEm]);
CREATE NONCLUSTERED INDEX [IX_ProjetoMarcos_Projeto_Data_Status] ON [dbo].[ProjetoMarcos]([ProjetoId], [DataPrevistaEm], [Status]);
CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoMarcoItens_Marco_Item] ON [dbo].[ProjetoMarcoItens]([MarcoId], [ItemId]);
CREATE NONCLUSTERED INDEX [IX_ProjetoMarcoItens_Projeto_Item] ON [dbo].[ProjetoMarcoItens]([ProjetoId], [ItemId]);
CREATE NONCLUSTERED INDEX [IX_ProjetoEntregas_Empresa_Projeto_Arquivado] ON [dbo].[ProjetoEntregas]([EmpresaId], [ProjetoId], [ArquivadoEm]);
CREATE NONCLUSTERED INDEX [IX_ProjetoEntregas_Projeto_Fim_Status] ON [dbo].[ProjetoEntregas]([ProjetoId], [FimPrevistoEm], [Status]);
CREATE NONCLUSTERED INDEX [IX_ProjetoEntregas_MarcoId] ON [dbo].[ProjetoEntregas]([MarcoId]);
CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoEntregaItens_Entrega_Item] ON [dbo].[ProjetoEntregaItens]([EntregaId], [ItemId]);
CREATE NONCLUSTERED INDEX [IX_ProjetoEntregaItens_Projeto_Item] ON [dbo].[ProjetoEntregaItens]([ProjetoId], [ItemId]);

ALTER TABLE [dbo].[ProjetoMarcos] ADD CONSTRAINT [ProjetoMarcos_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoMarcos] ADD CONSTRAINT [ProjetoMarcos_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoMarcos] ADD CONSTRAINT [ProjetoMarcos_ResponsavelId_fkey] FOREIGN KEY ([ResponsavelId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoMarcoItens] ADD CONSTRAINT [ProjetoMarcoItens_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoMarcoItens] ADD CONSTRAINT [ProjetoMarcoItens_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoMarcoItens] ADD CONSTRAINT [ProjetoMarcoItens_MarcoId_fkey] FOREIGN KEY ([MarcoId]) REFERENCES [dbo].[ProjetoMarcos]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoMarcoItens] ADD CONSTRAINT [ProjetoMarcoItens_ItemId_fkey] FOREIGN KEY ([ItemId]) REFERENCES [dbo].[ProjetoItens]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoEntregas] ADD CONSTRAINT [ProjetoEntregas_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoEntregas] ADD CONSTRAINT [ProjetoEntregas_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoEntregas] ADD CONSTRAINT [ProjetoEntregas_MarcoId_fkey] FOREIGN KEY ([MarcoId]) REFERENCES [dbo].[ProjetoMarcos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoEntregas] ADD CONSTRAINT [ProjetoEntregas_ResponsavelId_fkey] FOREIGN KEY ([ResponsavelId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoEntregaItens] ADD CONSTRAINT [ProjetoEntregaItens_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoEntregaItens] ADD CONSTRAINT [ProjetoEntregaItens_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoEntregaItens] ADD CONSTRAINT [ProjetoEntregaItens_EntregaId_fkey] FOREIGN KEY ([EntregaId]) REFERENCES [dbo].[ProjetoEntregas]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoEntregaItens] ADD CONSTRAINT [ProjetoEntregaItens_ItemId_fkey] FOREIGN KEY ([ItemId]) REFERENCES [dbo].[ProjetoItens]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW
END CATCH
