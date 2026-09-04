BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[ProjetoRecursos]
  ADD [VinculoDireto] BIT NOT NULL
    CONSTRAINT [DF_ProjetoRecursos_VinculoDireto] DEFAULT 1;

CREATE TABLE [dbo].[ProjetoRecursoEquipes] (
  [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_ProjetoRecursoEquipes_Id] DEFAULT NEWID(),
  [EmpresaId] INT NOT NULL,
  [ProjetoRecursoId] UNIQUEIDENTIFIER NOT NULL,
  [ProjetoEquipeId] UNIQUEIDENTIFIER NOT NULL,
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_ProjetoRecursoEquipes_CriadoEm] DEFAULT GETDATE(),
  CONSTRAINT [PK_ProjetoRecursoEquipes] PRIMARY KEY ([Id]),
  CONSTRAINT [FK_ProjetoRecursoEquipes_Empresas_EmpresaId] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]),
  CONSTRAINT [FK_ProjetoRecursoEquipes_ProjetoRecursos_ProjetoRecursoId] FOREIGN KEY ([ProjetoRecursoId]) REFERENCES [dbo].[ProjetoRecursos]([Id]) ON DELETE CASCADE,
  CONSTRAINT [FK_ProjetoRecursoEquipes_ProjetoEquipes_ProjetoEquipeId] FOREIGN KEY ([ProjetoEquipeId]) REFERENCES [dbo].[ProjetoEquipes]([Id]) ON DELETE CASCADE
);

CREATE UNIQUE INDEX [UX_ProjetoRecursoEquipes_Recurso_Equipe]
  ON [dbo].[ProjetoRecursoEquipes]([ProjetoRecursoId], [ProjetoEquipeId]);
CREATE INDEX [IX_ProjetoRecursoEquipes_Empresa_Equipe]
  ON [dbo].[ProjetoRecursoEquipes]([EmpresaId], [ProjetoEquipeId]);

COMMIT TRAN;

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH
