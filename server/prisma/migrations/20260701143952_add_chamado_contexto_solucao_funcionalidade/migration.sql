BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Chamados] ADD [FuncionalidadeId] INT,
[SolucaoId] INT;

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_SolucaoId] ON [dbo].[Chamados]([EmpresaId], [SolucaoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_FuncionalidadeId] ON [dbo].[Chamados]([EmpresaId], [FuncionalidadeId]);

-- AddForeignKey
ALTER TABLE [dbo].[Chamados] ADD CONSTRAINT [Chamados_SolucaoId_fkey] FOREIGN KEY ([SolucaoId]) REFERENCES [dbo].[Solucoes]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Chamados] ADD CONSTRAINT [Chamados_FuncionalidadeId_fkey] FOREIGN KEY ([FuncionalidadeId]) REFERENCES [dbo].[Funcionalidades]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
