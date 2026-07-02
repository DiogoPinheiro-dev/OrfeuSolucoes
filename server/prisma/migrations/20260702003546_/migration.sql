BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [IX_ChamadoResponsaveis_EmpresaId_Tipo] ON [dbo].[ChamadoResponsaveis];

-- AlterTable
ALTER TABLE [dbo].[ChamadoAnexos] DROP CONSTRAINT [ChamadoAnexos_Id_df];
ALTER TABLE [dbo].[ChamadoAnexos] ALTER COLUMN [NomeOriginal] NVARCHAR(1000) NOT NULL;
ALTER TABLE [dbo].[ChamadoAnexos] ALTER COLUMN [NomeArquivo] NVARCHAR(1000) NOT NULL;
ALTER TABLE [dbo].[ChamadoAnexos] ALTER COLUMN [MimeType] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[ChamadoResponsaveis] DROP CONSTRAINT [ChamadoResponsaveis_Tipo_df];
ALTER TABLE [dbo].[ChamadoResponsaveis] ALTER COLUMN [Tipo] NVARCHAR(1000) NOT NULL;
ALTER TABLE [dbo].[ChamadoResponsaveis] ADD CONSTRAINT [ChamadoResponsaveis_Tipo_df] DEFAULT 'USUARIO' FOR [Tipo];

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveis_EmpresaId_Tipo] ON [dbo].[ChamadoResponsaveis]([EmpresaId], [Tipo]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
