BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[ProjetoTarefaRecursos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [TarefaId] UNIQUEIDENTIFIER NOT NULL,
    [RecursoId] UNIQUEIDENTIFIER NOT NULL,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoTarefaRecursos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjetoTarefaRecursos_pkey] PRIMARY KEY CLUSTERED ([Id])
);

;WITH [RecursosDistintos] AS (
    SELECT
        [Vinculo].[EmpresaId],
        [Vinculo].[TarefaId],
        [ProjetoRecurso].[RecursoId],
        MIN([Vinculo].[CriadoEm]) AS [CriadoEm]
    FROM [dbo].[ProjetoTarefaVinculos] AS [Vinculo]
    INNER JOIN [dbo].[ProjetoRecursos] AS [ProjetoRecurso]
        ON [ProjetoRecurso].[Id] = [Vinculo].[ProjetoRecursoId]
    GROUP BY [Vinculo].[EmpresaId], [Vinculo].[TarefaId], [ProjetoRecurso].[RecursoId]
)
INSERT INTO [dbo].[ProjetoTarefaRecursos] ([Id], [EmpresaId], [TarefaId], [RecursoId], [CriadoEm])
SELECT NEWID(), [EmpresaId], [TarefaId], [RecursoId], [CriadoEm]
FROM [RecursosDistintos];

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoTarefaRecursos_Tarefa_Recurso]
    ON [dbo].[ProjetoTarefaRecursos]([TarefaId], [RecursoId]);

CREATE NONCLUSTERED INDEX [IX_ProjetoTarefaRecursos_Empresa_Recurso]
    ON [dbo].[ProjetoTarefaRecursos]([EmpresaId], [RecursoId]);

ALTER TABLE [dbo].[ProjetoTarefaRecursos]
ADD CONSTRAINT [ProjetoTarefaRecursos_EmpresaId_fkey]
FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoTarefaRecursos]
ADD CONSTRAINT [ProjetoTarefaRecursos_TarefaId_fkey]
FOREIGN KEY ([TarefaId]) REFERENCES [dbo].[ProjetoTarefas]([Id])
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoTarefaRecursos]
ADD CONSTRAINT [ProjetoTarefaRecursos_RecursoId_fkey]
FOREIGN KEY ([RecursoId]) REFERENCES [dbo].[Recursos]([Id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

DROP TABLE [dbo].[ProjetoTarefaVinculos];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW;

END CATCH