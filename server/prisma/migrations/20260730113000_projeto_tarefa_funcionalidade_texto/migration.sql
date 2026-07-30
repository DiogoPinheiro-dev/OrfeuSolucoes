BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[ProjetoTarefas] ADD [Funcionalidade] NVARCHAR(500) NULL;

EXEC sp_executesql N'
UPDATE [tarefa]
SET [Funcionalidade] = COALESCE(
    NULLIF(LTRIM(RTRIM([funcionalidade].[Label])), N''''),
    NULLIF(LTRIM(RTRIM([funcionalidade].[Titulo])), N''''),
    NULLIF(LTRIM(RTRIM([funcionalidade].[Descricao])), N''''),
    N''Tarefa migrada''
)
FROM [dbo].[ProjetoTarefas] AS [tarefa]
INNER JOIN [dbo].[Funcionalidades] AS [funcionalidade]
    ON [funcionalidade].[Id] = [tarefa].[FuncionalidadeId];
';

EXEC sp_executesql N'ALTER TABLE [dbo].[ProjetoTarefas] ALTER COLUMN [Funcionalidade] NVARCHAR(500) NOT NULL;';
ALTER TABLE [dbo].[ProjetoTarefas] DROP CONSTRAINT [UX_ProjetoTarefas_Empresa_Recurso_Funcionalidade];
DROP INDEX [IX_ProjetoTarefas_Funcionalidade_Ativo] ON [dbo].[ProjetoTarefas];
ALTER TABLE [dbo].[ProjetoTarefas] DROP CONSTRAINT [ProjetoTarefas_FuncionalidadeId_fkey];
ALTER TABLE [dbo].[ProjetoTarefas] DROP COLUMN [FuncionalidadeId];

CREATE NONCLUSTERED INDEX [IX_ProjetoTarefas_Empresa_Recurso_Ativo]
    ON [dbo].[ProjetoTarefas]([EmpresaId], [RecursoId], [Ativo]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
