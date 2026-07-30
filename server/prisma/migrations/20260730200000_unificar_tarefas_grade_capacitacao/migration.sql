BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[ProjetoTarefas]
ADD [ProjetoRecursoId] UNIQUEIDENTIFIER NULL;

ALTER TABLE [dbo].[ProjetoAlocacoes]
ADD [TarefaId] UNIQUEIDENTIFIER NULL;

EXEC sp_executesql N'
;WITH [VinculosUnicos] AS (
    SELECT [EmpresaId], [RecursoId], MIN([Id]) AS [ProjetoRecursoId]
    FROM [dbo].[ProjetoRecursos]
    GROUP BY [EmpresaId], [RecursoId]
    HAVING COUNT(*) = 1
)
UPDATE [Tarefa]
SET [ProjetoRecursoId] = [Vinculo].[ProjetoRecursoId]
FROM [dbo].[ProjetoTarefas] [Tarefa]
INNER JOIN [VinculosUnicos] [Vinculo]
    ON [Vinculo].[EmpresaId] = [Tarefa].[EmpresaId]
   AND [Vinculo].[RecursoId] = [Tarefa].[RecursoId]
WHERE [Tarefa].[ProjetoRecursoId] IS NULL;';

EXEC sp_executesql N'
;WITH [Candidatos] AS (
    SELECT [Alocacao].[Id] AS [AlocacaoId], MIN([Tarefa].[Id]) AS [TarefaId], COUNT(*) AS [Quantidade]
    FROM [dbo].[ProjetoAlocacoes] [Alocacao]
    INNER JOIN [dbo].[ProjetoTarefas] [Tarefa]
        ON [Tarefa].[EmpresaId] = [Alocacao].[EmpresaId]
       AND [Tarefa].[ProjetoRecursoId] = [Alocacao].[RecursoId]
       AND LOWER(LTRIM(RTRIM([Tarefa].[Funcionalidade]))) = LOWER(LTRIM(RTRIM([Alocacao].[Atividade])))
    WHERE [Alocacao].[TarefaId] IS NULL
      AND LEN(LTRIM(RTRIM([Alocacao].[Atividade]))) > 0
    GROUP BY [Alocacao].[Id]
    HAVING COUNT(*) = 1
)
UPDATE [Alocacao]
SET [TarefaId] = [Candidato].[TarefaId]
FROM [dbo].[ProjetoAlocacoes] [Alocacao]
INNER JOIN [Candidatos] [Candidato] ON [Candidato].[AlocacaoId] = [Alocacao].[Id]
WHERE [Candidato].[Quantidade] = 1;';

EXEC sp_executesql N'
CREATE NONCLUSTERED INDEX [IX_ProjetoTarefas_Empresa_ProjetoRecurso_Ativo]
ON [dbo].[ProjetoTarefas]([EmpresaId], [ProjetoRecursoId], [Ativo]);';

EXEC sp_executesql N'
CREATE NONCLUSTERED INDEX [IX_ProjetoAlocacoes_Tarefa_Periodo]
ON [dbo].[ProjetoAlocacoes]([TarefaId], [InicioEm], [FimEm]);';

EXEC sp_executesql N'
ALTER TABLE [dbo].[ProjetoTarefas]
ADD CONSTRAINT [ProjetoTarefas_ProjetoRecursoId_fkey]
FOREIGN KEY ([ProjetoRecursoId]) REFERENCES [dbo].[ProjetoRecursos]([Id])
ON DELETE NO ACTION ON UPDATE NO ACTION;';

EXEC sp_executesql N'
ALTER TABLE [dbo].[ProjetoAlocacoes]
ADD CONSTRAINT [ProjetoAlocacoes_TarefaId_fkey]
FOREIGN KEY ([TarefaId]) REFERENCES [dbo].[ProjetoTarefas]([Id])
ON DELETE NO ACTION ON UPDATE NO ACTION;';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
