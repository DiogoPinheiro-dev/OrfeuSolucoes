BEGIN TRY

BEGIN TRAN;

-- AlterTable com backfill seguro para itens existentes
ALTER TABLE [dbo].[ProjetoItens] ADD [OrdemBacklog] INT NULL;

EXEC(N'
UPDATE [dbo].[ProjetoItens]
SET [OrdemBacklog] = [Numero]
WHERE [OrdemBacklog] IS NULL;
');

ALTER TABLE [dbo].[ProjetoItens] ALTER COLUMN [OrdemBacklog] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Projetos] ADD [BacklogVersao] INT NOT NULL CONSTRAINT [Projetos_BacklogVersao_df] DEFAULT 0;

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoItens_ProjetoId_OrdemBacklog_Numero] ON [dbo].[ProjetoItens]([ProjetoId], [OrdemBacklog], [Numero]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
