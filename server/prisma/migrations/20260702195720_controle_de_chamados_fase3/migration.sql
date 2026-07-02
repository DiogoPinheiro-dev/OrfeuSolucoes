BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ChamadoAcompanhantes] DROP CONSTRAINT [ChamadoAcompanhantes_AtualizadoEm_df],
[ChamadoAcompanhantes_Id_df];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
