BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[Capacitacoes] (
  [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Capacitacoes_Id] DEFAULT NEWID(),
  [EmpresaId] INT NOT NULL,
  [Nome] NVARCHAR(120) NOT NULL,
  [Descricao] NVARCHAR(500) NULL,
  [NivelHierarquico] INT NOT NULL,
  [Ativo] BIT NOT NULL CONSTRAINT [DF_Capacitacoes_Ativo] DEFAULT 1,
  [Versao] INT NOT NULL CONSTRAINT [DF_Capacitacoes_Versao] DEFAULT 1,
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_Capacitacoes_CriadoEm] DEFAULT GETDATE(),
  [AtualizadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_Capacitacoes_AtualizadoEm] DEFAULT GETDATE(),
  CONSTRAINT [PK_Capacitacoes] PRIMARY KEY ([Id]),
  CONSTRAINT [FK_Capacitacoes_Empresas_EmpresaId] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]),
  CONSTRAINT [CK_Capacitacoes_NivelHierarquico] CHECK ([NivelHierarquico] >= 1)
);

CREATE UNIQUE INDEX [UX_Capacitacoes_Empresa_Nome] ON [dbo].[Capacitacoes]([EmpresaId], [Nome]);
CREATE INDEX [IX_Capacitacoes_Empresa_Ativo_Nivel] ON [dbo].[Capacitacoes]([EmpresaId], [Ativo], [NivelHierarquico]);

CREATE TABLE [dbo].[Equipes] (
  [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Equipes_Id] DEFAULT NEWID(),
  [EmpresaId] INT NOT NULL,
  [Nome] NVARCHAR(120) NOT NULL,
  [Descricao] NVARCHAR(500) NULL,
  [Ativo] BIT NOT NULL CONSTRAINT [DF_Equipes_Ativo] DEFAULT 1,
  [Versao] INT NOT NULL CONSTRAINT [DF_Equipes_Versao] DEFAULT 1,
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_Equipes_CriadoEm] DEFAULT GETDATE(),
  [AtualizadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_Equipes_AtualizadoEm] DEFAULT GETDATE(),
  CONSTRAINT [PK_Equipes] PRIMARY KEY ([Id]),
  CONSTRAINT [FK_Equipes_Empresas_EmpresaId] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id])
);

CREATE UNIQUE INDEX [UX_Equipes_Empresa_Nome] ON [dbo].[Equipes]([EmpresaId], [Nome]);
CREATE INDEX [IX_Equipes_Empresa_Ativo] ON [dbo].[Equipes]([EmpresaId], [Ativo]);

EXEC(N'ALTER TABLE [dbo].[Recursos] ADD [CapacitacaoId] UNIQUEIDENTIFIER NULL;');
ALTER TABLE [dbo].[Recursos] ADD CONSTRAINT [FK_Recursos_Capacitacoes_CapacitacaoId]
  FOREIGN KEY ([CapacitacaoId]) REFERENCES [dbo].[Capacitacoes]([Id]);
CREATE INDEX [IX_Recursos_Empresa_Capacitacao] ON [dbo].[Recursos]([EmpresaId], [CapacitacaoId]);

CREATE TABLE [dbo].[EquipeRecursos] (
  [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_EquipeRecursos_Id] DEFAULT NEWID(),
  [EmpresaId] INT NOT NULL,
  [EquipeId] UNIQUEIDENTIFIER NOT NULL,
  [RecursoId] UNIQUEIDENTIFIER NOT NULL,
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_EquipeRecursos_CriadoEm] DEFAULT GETDATE(),
  CONSTRAINT [PK_EquipeRecursos] PRIMARY KEY ([Id]),
  CONSTRAINT [FK_EquipeRecursos_Empresas_EmpresaId] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]),
  CONSTRAINT [FK_EquipeRecursos_Equipes_EquipeId] FOREIGN KEY ([EquipeId]) REFERENCES [dbo].[Equipes]([Id]) ON DELETE CASCADE,
  CONSTRAINT [FK_EquipeRecursos_Recursos_RecursoId] FOREIGN KEY ([RecursoId]) REFERENCES [dbo].[Recursos]([Id])
);

CREATE UNIQUE INDEX [UX_EquipeRecursos_Equipe_Recurso] ON [dbo].[EquipeRecursos]([EquipeId], [RecursoId]);
CREATE INDEX [IX_EquipeRecursos_Empresa_Recurso] ON [dbo].[EquipeRecursos]([EmpresaId], [RecursoId]);

CREATE TABLE [dbo].[ProjetoEquipes] (
  [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_ProjetoEquipes_Id] DEFAULT NEWID(),
  [EmpresaId] INT NOT NULL,
  [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
  [EquipeId] UNIQUEIDENTIFIER NOT NULL,
  [Ativo] BIT NOT NULL CONSTRAINT [DF_ProjetoEquipes_Ativo] DEFAULT 1,
  [Versao] INT NOT NULL CONSTRAINT [DF_ProjetoEquipes_Versao] DEFAULT 1,
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_ProjetoEquipes_CriadoEm] DEFAULT GETDATE(),
  [AtualizadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_ProjetoEquipes_AtualizadoEm] DEFAULT GETDATE(),
  CONSTRAINT [PK_ProjetoEquipes] PRIMARY KEY ([Id]),
  CONSTRAINT [FK_ProjetoEquipes_Empresas_EmpresaId] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]),
  CONSTRAINT [FK_ProjetoEquipes_Projetos_ProjetoId] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]),
  CONSTRAINT [FK_ProjetoEquipes_Equipes_EquipeId] FOREIGN KEY ([EquipeId]) REFERENCES [dbo].[Equipes]([Id])
);

CREATE UNIQUE INDEX [UX_ProjetoEquipes_Projeto_Equipe] ON [dbo].[ProjetoEquipes]([ProjetoId], [EquipeId]);
CREATE INDEX [IX_ProjetoEquipes_Empresa_Equipe_Ativo] ON [dbo].[ProjetoEquipes]([EmpresaId], [EquipeId], [Ativo]);

COMMIT TRAN;

END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH
