BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[ChamadoAnexos] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [ChamadoAnexos_Id_df] DEFAULT NEWID(),
    [ChamadoId] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [AutorId] UNIQUEIDENTIFIER NOT NULL,
    [MensagemId] UNIQUEIDENTIFIER NULL,
    [NomeOriginal] NVARCHAR(255) NOT NULL,
    [NomeArquivo] NVARCHAR(255) NOT NULL,
    [Caminho] NVARCHAR(1000) NOT NULL,
    [MimeType] NVARCHAR(150) NOT NULL,
    [Tamanho] INT NOT NULL,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoAnexos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ChamadoAnexos_pkey] PRIMARY KEY CLUSTERED ([Id])
);

CREATE NONCLUSTERED INDEX [IX_ChamadoAnexos_EmpresaId_ChamadoId_CriadoEm] ON [dbo].[ChamadoAnexos]([EmpresaId], [ChamadoId], [CriadoEm]);
CREATE NONCLUSTERED INDEX [IX_ChamadoAnexos_EmpresaId_MensagemId] ON [dbo].[ChamadoAnexos]([EmpresaId], [MensagemId]);
CREATE NONCLUSTERED INDEX [IX_ChamadoAnexos_AutorId] ON [dbo].[ChamadoAnexos]([AutorId]);

ALTER TABLE [dbo].[ChamadoAnexos] ADD CONSTRAINT [ChamadoAnexos_ChamadoId_fkey] FOREIGN KEY ([ChamadoId]) REFERENCES [dbo].[Chamados]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoAnexos] ADD CONSTRAINT [ChamadoAnexos_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoAnexos] ADD CONSTRAINT [ChamadoAnexos_AutorId_fkey] FOREIGN KEY ([AutorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ChamadoAnexos] ADD CONSTRAINT [ChamadoAnexos_MensagemId_fkey] FOREIGN KEY ([MensagemId]) REFERENCES [dbo].[ChamadoMensagens]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH