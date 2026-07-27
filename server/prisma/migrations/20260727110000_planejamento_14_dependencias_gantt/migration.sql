BEGIN TRY
BEGIN TRAN;

CREATE TABLE [dbo].[ProjetoItemDependencias] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [BloqueadorId] UNIQUEIDENTIFIER NOT NULL,
    [BloqueadoId] UNIQUEIDENTIFIER NOT NULL,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoItemDependencias_Versao_df] DEFAULT 1,
    [CriadoPorId] UNIQUEIDENTIFIER NOT NULL,
    [ArquivadoEm] DATETIME2,
    [ArquivadoPorId] UNIQUEIDENTIFIER,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoItemDependencias_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoItemDependencias_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [CK_ProjetoItemDependencias_SemAutorreferencia] CHECK ([BloqueadorId] <> [BloqueadoId])
);

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoItemDependencias_Projeto_Relacao] ON [dbo].[ProjetoItemDependencias]([ProjetoId], [BloqueadorId], [BloqueadoId]);
CREATE NONCLUSTERED INDEX [IX_ProjetoItemDependencias_Empresa_Projeto_Arquivado] ON [dbo].[ProjetoItemDependencias]([EmpresaId], [ProjetoId], [ArquivadoEm]);
CREATE NONCLUSTERED INDEX [IX_ProjetoItemDependencias_Bloqueador_Arquivado] ON [dbo].[ProjetoItemDependencias]([BloqueadorId], [ArquivadoEm]);
CREATE NONCLUSTERED INDEX [IX_ProjetoItemDependencias_Bloqueado_Arquivado] ON [dbo].[ProjetoItemDependencias]([BloqueadoId], [ArquivadoEm]);

ALTER TABLE [dbo].[ProjetoItemDependencias] ADD CONSTRAINT [ProjetoItemDependencias_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoItemDependencias] ADD CONSTRAINT [ProjetoItemDependencias_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoItemDependencias] ADD CONSTRAINT [ProjetoItemDependencias_BloqueadorId_fkey] FOREIGN KEY ([BloqueadorId]) REFERENCES [dbo].[ProjetoItens]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoItemDependencias] ADD CONSTRAINT [ProjetoItemDependencias_BloqueadoId_fkey] FOREIGN KEY ([BloqueadoId]) REFERENCES [dbo].[ProjetoItens]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoItemDependencias] ADD CONSTRAINT [ProjetoItemDependencias_CriadoPorId_fkey] FOREIGN KEY ([CriadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoItemDependencias] ADD CONSTRAINT [ProjetoItemDependencias_ArquivadoPorId_fkey] FOREIGN KEY ([ArquivadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW
END CATCH