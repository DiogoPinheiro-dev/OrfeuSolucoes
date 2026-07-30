BEGIN TRY
BEGIN TRAN;

DECLARE @SolucaoId INT = (
    SELECT TOP (1) [Id]
    FROM [dbo].[Solucoes]
    WHERE [Slug] = N'projetos'
);

UPDATE [dbo].[Funcionalidades]
   SET [Ordem] = 80
 WHERE [SolucaoId] = @SolucaoId
   AND [Slug] = N'cadastro-de-tarefas';

UPDATE [dbo].[Funcionalidades]
   SET [Ordem] = 90
 WHERE [SolucaoId] = @SolucaoId
   AND [Slug] = N'grade-de-capacitacao';

COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
