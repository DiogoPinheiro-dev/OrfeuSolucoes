BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[ProjetoTarefaVinculos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [TarefaId] UNIQUEIDENTIFIER NOT NULL,
    [ProjetoRecursoId] UNIQUEIDENTIFIER NOT NULL,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoTarefaVinculos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjetoTarefaVinculos_pkey] PRIMARY KEY CLUSTERED ([Id])
);

INSERT INTO [dbo].[ProjetoTarefaVinculos] ([Id], [EmpresaId], [TarefaId], [ProjetoRecursoId], [CriadoEm])
SELECT NEWID(), [EmpresaId], [Id], [ProjetoRecursoId], COALESCE([AtualizadoEm], [CriadoEm], CURRENT_TIMESTAMP)
FROM [dbo].[ProjetoTarefas]
WHERE [ProjetoRecursoId] IS NOT NULL;

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoTarefaVinculos_Tarefa_ProjetoRecurso]
    ON [dbo].[ProjetoTarefaVinculos]([TarefaId], [ProjetoRecursoId]);

CREATE NONCLUSTERED INDEX [IX_ProjetoTarefaVinculos_Empresa_ProjetoRecurso]
    ON [dbo].[ProjetoTarefaVinculos]([EmpresaId], [ProjetoRecursoId]);

ALTER TABLE [dbo].[ProjetoTarefaVinculos]
ADD CONSTRAINT [ProjetoTarefaVinculos_EmpresaId_fkey]
FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoTarefaVinculos]
ADD CONSTRAINT [ProjetoTarefaVinculos_TarefaId_fkey]
FOREIGN KEY ([TarefaId]) REFERENCES [dbo].[ProjetoTarefas]([Id])
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoTarefaVinculos]
ADD CONSTRAINT [ProjetoTarefaVinculos_ProjetoRecursoId_fkey]
FOREIGN KEY ([ProjetoRecursoId]) REFERENCES [dbo].[ProjetoRecursos]([Id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

DROP INDEX [IX_ProjetoTarefas_Empresa_Recurso_Ativo] ON [dbo].[ProjetoTarefas];
DROP INDEX [IX_ProjetoTarefas_Empresa_ProjetoRecurso_Ativo] ON [dbo].[ProjetoTarefas];

ALTER TABLE [dbo].[ProjetoTarefas] DROP CONSTRAINT [ProjetoTarefas_RecursoId_fkey];
ALTER TABLE [dbo].[ProjetoTarefas] DROP CONSTRAINT [ProjetoTarefas_ProjetoRecursoId_fkey];

ALTER TABLE [dbo].[ProjetoTarefas] DROP COLUMN [RecursoId], [ProjetoRecursoId];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW;

END CATCH