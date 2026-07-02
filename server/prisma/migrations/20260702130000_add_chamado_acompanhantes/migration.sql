BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[ChamadoAcompanhantes] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ChamadoAcompanhantes_Id_df] DEFAULT NEWID(),
    [ChamadoId] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [AdicionadoPorId] UNIQUEIDENTIFIER NULL,
    [Ativo] BIT NOT NULL CONSTRAINT [ChamadoAcompanhantes_Ativo_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoAcompanhantes_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoAcompanhantes_AtualizadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ChamadoAcompanhantes_pkey] PRIMARY KEY CLUSTERED ([Id])
);

CREATE UNIQUE NONCLUSTERED INDEX [UX_ChamadoAcompanhantes_ChamadoId_UsuarioId] ON [dbo].[ChamadoAcompanhantes]([ChamadoId], [UsuarioId]);
CREATE NONCLUSTERED INDEX [IX_ChamadoAcompanhantes_EmpresaId_ChamadoId_Ativo] ON [dbo].[ChamadoAcompanhantes]([EmpresaId], [ChamadoId], [Ativo]);
CREATE NONCLUSTERED INDEX [IX_ChamadoAcompanhantes_EmpresaId_UsuarioId_Ativo] ON [dbo].[ChamadoAcompanhantes]([EmpresaId], [UsuarioId], [Ativo]);

ALTER TABLE [dbo].[ChamadoAcompanhantes] ADD CONSTRAINT [ChamadoAcompanhantes_ChamadoId_fkey] FOREIGN KEY ([ChamadoId]) REFERENCES [dbo].[Chamados]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoAcompanhantes] ADD CONSTRAINT [ChamadoAcompanhantes_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoAcompanhantes] ADD CONSTRAINT [ChamadoAcompanhantes_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoAcompanhantes] ADD CONSTRAINT [ChamadoAcompanhantes_AdicionadoPorId_fkey] FOREIGN KEY ([AdicionadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH