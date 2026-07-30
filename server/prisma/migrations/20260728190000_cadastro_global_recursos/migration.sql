BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[ProjetoMembros]
ADD [Origem] NVARCHAR(20) NOT NULL
    CONSTRAINT [ProjetoMembros_Origem_df] DEFAULT 'EQUIPE';

CREATE TABLE [dbo].[Recursos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [Ativo] BIT NOT NULL CONSTRAINT [Recursos_Ativo_df] DEFAULT 1,
    [Versao] INT NOT NULL CONSTRAINT [Recursos_Versao_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [Recursos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [Recursos_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_Recursos_Empresa_Usuario] UNIQUE NONCLUSTERED ([EmpresaId], [UsuarioId])
);

INSERT INTO [dbo].[Recursos] ([Id], [EmpresaId], [UsuarioId], [Ativo], [Versao], [CriadoEm], [AtualizadoEm])
SELECT NEWID(), [EmpresaId], [UsuarioId], CONVERT(BIT, MAX(CONVERT(INT, [Ativo]))), 1, MIN([CriadoEm]), MAX([AtualizadoEm])
FROM [dbo].[ProjetoRecursos]
GROUP BY [EmpresaId], [UsuarioId];

ALTER TABLE [dbo].[ProjetoRecursos] ADD [RecursoId] UNIQUEIDENTIFIER;

UPDATE projetoRecurso
SET [RecursoId] = recurso.[Id]
FROM [dbo].[ProjetoRecursos] projetoRecurso
INNER JOIN [dbo].[Recursos] recurso
    ON recurso.[EmpresaId] = projetoRecurso.[EmpresaId]
    AND recurso.[UsuarioId] = projetoRecurso.[UsuarioId];

ALTER TABLE [dbo].[ProjetoRecursos] DROP CONSTRAINT [ProjetoRecursos_UsuarioId_fkey];
ALTER TABLE [dbo].[ProjetoRecursos] DROP CONSTRAINT [UX_ProjetoRecursos_Projeto_Usuario];
DROP INDEX [IX_ProjetoRecursos_Empresa_Usuario_Ativo] ON [dbo].[ProjetoRecursos];

ALTER TABLE [dbo].[ProjetoRecursos] ALTER COLUMN [RecursoId] UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE [dbo].[ProjetoRecursos] DROP COLUMN [UsuarioId];

CREATE NONCLUSTERED INDEX [IX_Recursos_Empresa_Ativo] ON [dbo].[Recursos]([EmpresaId], [Ativo]);
CREATE NONCLUSTERED INDEX [IX_ProjetoRecursos_Empresa_Recurso_Ativo] ON [dbo].[ProjetoRecursos]([EmpresaId], [RecursoId], [Ativo]);
ALTER TABLE [dbo].[ProjetoRecursos] ADD CONSTRAINT [UX_ProjetoRecursos_Projeto_Recurso] UNIQUE NONCLUSTERED ([ProjetoId], [RecursoId]);

ALTER TABLE [dbo].[Recursos] ADD CONSTRAINT [Recursos_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Recursos] ADD CONSTRAINT [Recursos_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoRecursos] ADD CONSTRAINT [ProjetoRecursos_RecursoId_fkey] FOREIGN KEY ([RecursoId]) REFERENCES [dbo].[Recursos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

INSERT INTO [dbo].[ProjetoMembros] ([ProjetoId], [UsuarioId], [Papel], [Origem], [IncluidoEm])
SELECT projetoRecurso.[ProjetoId], recurso.[UsuarioId], 'MEMBRO', 'RECURSO', CURRENT_TIMESTAMP
FROM [dbo].[ProjetoRecursos] projetoRecurso
INNER JOIN [dbo].[Recursos] recurso ON recurso.[Id] = projetoRecurso.[RecursoId]
INNER JOIN [dbo].[Projetos] projeto ON projeto.[Id] = projetoRecurso.[ProjetoId]
WHERE projetoRecurso.[Ativo] = 1
  AND projeto.[ResponsavelId] <> recurso.[UsuarioId]
  AND NOT EXISTS (
      SELECT 1
      FROM [dbo].[ProjetoMembros] membro
      WHERE membro.[ProjetoId] = projetoRecurso.[ProjetoId]
        AND membro.[UsuarioId] = recurso.[UsuarioId]
  );

UPDATE funcionalidade
SET [Descricao] = 'Cadastre recursos da empresa e gerencie suas alocacoes em projetos existentes.'
FROM [dbo].[Funcionalidades] funcionalidade
INNER JOIN [dbo].[Solucoes] solucao ON solucao.[Id] = funcionalidade.[SolucaoId]
WHERE solucao.[Slug] = 'projetos'
  AND funcionalidade.[Slug] = 'recursos-do-projeto';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
