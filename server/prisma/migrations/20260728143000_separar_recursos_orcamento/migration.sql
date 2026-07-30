BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[ProjetoCapacidadesLegadoSemProjeto] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [InicioEm] DATE NOT NULL,
    [FimEm] DATE NOT NULL,
    [CapacidadeMinutos] INT NOT NULL,
    [Versao] INT NOT NULL,
    [CriadoEm] DATETIME2 NOT NULL,
    [AtualizadoEm] DATETIME2 NOT NULL,
    [Motivo] NVARCHAR(240) NOT NULL,
    [ArquivadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoCapacidadesLegado_ArquivadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjetoCapacidadesLegado_pkey] PRIMARY KEY CLUSTERED ([Id])
);

UPDATE capacidade
SET [projetoId] = correspondencia.[ProjetoId]
FROM [dbo].[ProjetoCapacidades] capacidade
CROSS APPLY (
    SELECT CONVERT(UNIQUEIDENTIFIER, MIN(CONVERT(VARCHAR(36), alocacao.[ProjetoId]))) AS [ProjetoId]
    FROM [dbo].[ProjetoAlocacoes] alocacao
    WHERE alocacao.[EmpresaId] = capacidade.[EmpresaId]
      AND alocacao.[UsuarioId] = capacidade.[UsuarioId]
      AND alocacao.[InicioEm] <= capacidade.[FimEm]
      AND alocacao.[FimEm] >= capacidade.[InicioEm]
    HAVING COUNT(DISTINCT alocacao.[ProjetoId]) = 1
) correspondencia
WHERE capacidade.[projetoId] IS NULL;

INSERT INTO [dbo].[ProjetoCapacidadesLegadoSemProjeto] ([Id], [EmpresaId], [UsuarioId], [InicioEm], [FimEm], [CapacidadeMinutos], [Versao], [CriadoEm], [AtualizadoEm], [Motivo])
SELECT [Id], [EmpresaId], [UsuarioId], [InicioEm], [FimEm], [CapacidadeMinutos], [Versao], [CriadoEm], [AtualizadoEm], 'Capacidade global sem projeto ou alocacao univoca no modelo anterior.'
FROM [dbo].[ProjetoCapacidades]
WHERE [projetoId] IS NULL;

DELETE FROM [dbo].[ProjetoCapacidades]
WHERE [projetoId] IS NULL;

CREATE TABLE [dbo].[ProjetoRecursos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [Ativo] BIT NOT NULL CONSTRAINT [ProjetoRecursos_Ativo_df] DEFAULT 1,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoRecursos_Versao_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoRecursos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoRecursos_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ProjetoRecursos_Projeto_Usuario] UNIQUE NONCLUSTERED ([ProjetoId], [UsuarioId])
);

INSERT INTO [dbo].[ProjetoRecursos] ([Id], [EmpresaId], [ProjetoId], [UsuarioId], [Ativo], [Versao], [CriadoEm], [AtualizadoEm])
SELECT NEWID(), origem.[EmpresaId], origem.[ProjetoId], origem.[UsuarioId], 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT [EmpresaId], [projetoId] AS [ProjetoId], [UsuarioId]
    FROM [dbo].[ProjetoCapacidades]
    UNION
    SELECT [EmpresaId], [ProjetoId], [UsuarioId]
    FROM [dbo].[ProjetoAlocacoes]
    UNION
    SELECT [EmpresaId], [ProjetoId], [RecursoId]
    FROM [dbo].[ProjetoCustos]
    WHERE [RecursoId] IS NOT NULL
) origem;

ALTER TABLE [dbo].[ProjetoCapacidades] ADD [RecursoId] UNIQUEIDENTIFIER;
ALTER TABLE [dbo].[ProjetoAlocacoes] ADD [RecursoId] UNIQUEIDENTIFIER;

UPDATE capacidade
SET [RecursoId] = recurso.[Id]
FROM [dbo].[ProjetoCapacidades] capacidade
INNER JOIN [dbo].[ProjetoRecursos] recurso
    ON recurso.[EmpresaId] = capacidade.[EmpresaId]
    AND recurso.[ProjetoId] = capacidade.[projetoId]
    AND recurso.[UsuarioId] = capacidade.[UsuarioId];

UPDATE alocacao
SET [RecursoId] = recurso.[Id]
FROM [dbo].[ProjetoAlocacoes] alocacao
INNER JOIN [dbo].[ProjetoRecursos] recurso
    ON recurso.[EmpresaId] = alocacao.[EmpresaId]
    AND recurso.[ProjetoId] = alocacao.[ProjetoId]
    AND recurso.[UsuarioId] = alocacao.[UsuarioId];

ALTER TABLE [dbo].[ProjetoCustos] DROP CONSTRAINT [ProjetoCustos_RecursoId_fkey];

UPDATE custo
SET [RecursoId] = recurso.[Id]
FROM [dbo].[ProjetoCustos] custo
INNER JOIN [dbo].[ProjetoRecursos] recurso
    ON recurso.[EmpresaId] = custo.[EmpresaId]
    AND recurso.[ProjetoId] = custo.[ProjetoId]
    AND recurso.[UsuarioId] = custo.[RecursoId]
WHERE custo.[RecursoId] IS NOT NULL;

ALTER TABLE [dbo].[ProjetoCapacidades] DROP CONSTRAINT [ProjetoCapacidades_UsuarioId_fkey];
ALTER TABLE [dbo].[ProjetoCapacidades] DROP CONSTRAINT [ProjetoCapacidades_projetoId_fkey];
ALTER TABLE [dbo].[ProjetoAlocacoes] DROP CONSTRAINT [ProjetoAlocacoes_UsuarioId_fkey];
DROP INDEX [IX_ProjetoCapacidades_Empresa_Usuario_Periodo] ON [dbo].[ProjetoCapacidades];
DROP INDEX [IX_ProjetoAlocacoes_Empresa_Usuario_Periodo] ON [dbo].[ProjetoAlocacoes];

ALTER TABLE [dbo].[ProjetoCapacidades] ALTER COLUMN [RecursoId] UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE [dbo].[ProjetoAlocacoes] ALTER COLUMN [RecursoId] UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE [dbo].[ProjetoCapacidades] DROP COLUMN [UsuarioId];
ALTER TABLE [dbo].[ProjetoAlocacoes] DROP COLUMN [UsuarioId];
EXEC sp_rename 'dbo.ProjetoCapacidades.projetoId', 'ProjetoId', 'COLUMN';
ALTER TABLE [dbo].[ProjetoCapacidades] ALTER COLUMN [ProjetoId] UNIQUEIDENTIFIER NOT NULL;

CREATE NONCLUSTERED INDEX [IX_ProjetoRecursos_Empresa_Usuario_Ativo] ON [dbo].[ProjetoRecursos]([EmpresaId], [UsuarioId], [Ativo]);
CREATE NONCLUSTERED INDEX [IX_ProjetoRecursos_Projeto_Ativo] ON [dbo].[ProjetoRecursos]([ProjetoId], [Ativo]);
CREATE NONCLUSTERED INDEX [IX_ProjetoCapacidadesLegado_Empresa_Usuario] ON [dbo].[ProjetoCapacidadesLegadoSemProjeto]([EmpresaId], [UsuarioId]);
CREATE NONCLUSTERED INDEX [IX_ProjetoCapacidades_Empresa_Recurso_Periodo] ON [dbo].[ProjetoCapacidades]([EmpresaId], [RecursoId], [InicioEm], [FimEm]);
CREATE NONCLUSTERED INDEX [IX_ProjetoCapacidades_Projeto_Periodo] ON [dbo].[ProjetoCapacidades]([ProjetoId], [InicioEm], [FimEm]);
CREATE NONCLUSTERED INDEX [IX_ProjetoAlocacoes_Empresa_Recurso_Periodo] ON [dbo].[ProjetoAlocacoes]([EmpresaId], [RecursoId], [InicioEm], [FimEm]);

ALTER TABLE [dbo].[ProjetoRecursos] ADD CONSTRAINT [ProjetoRecursos_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoRecursos] ADD CONSTRAINT [ProjetoRecursos_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoRecursos] ADD CONSTRAINT [ProjetoRecursos_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoCapacidadesLegadoSemProjeto] ADD CONSTRAINT [ProjetoCapacidadesLegado_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoCapacidadesLegadoSemProjeto] ADD CONSTRAINT [ProjetoCapacidadesLegado_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoCapacidades] ADD CONSTRAINT [ProjetoCapacidades_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoCapacidades] ADD CONSTRAINT [ProjetoCapacidades_RecursoId_fkey] FOREIGN KEY ([RecursoId]) REFERENCES [dbo].[ProjetoRecursos]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoAlocacoes] ADD CONSTRAINT [ProjetoAlocacoes_RecursoId_fkey] FOREIGN KEY ([RecursoId]) REFERENCES [dbo].[ProjetoRecursos]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoCustos] ADD CONSTRAINT [ProjetoCustos_RecursoId_fkey] FOREIGN KEY ([RecursoId]) REFERENCES [dbo].[ProjetoRecursos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

UPDATE funcionalidade
SET [Slug] = 'orcamento-do-projeto',
    [Titulo] = 'Orcamento do projeto',
    [Label] = 'Orcamento',
    [Descricao] = 'Planeje o orcamento, categorias e custos do projeto.',
    [RegistryKey] = 'projetos.orcamento-do-projeto'
FROM [dbo].[Funcionalidades] funcionalidade
INNER JOIN [dbo].[Solucoes] solucao ON solucao.[Id] = funcionalidade.[SolucaoId]
WHERE solucao.[Slug] = 'projetos'
  AND funcionalidade.[Slug] = 'orcamento-e-recursos';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
