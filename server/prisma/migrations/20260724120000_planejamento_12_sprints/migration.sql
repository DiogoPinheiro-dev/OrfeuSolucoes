BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[ProjetoSprints] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [Nome] NVARCHAR(120) NOT NULL,
    [Objetivo] NVARCHAR(500),
    [Status] NVARCHAR(20) NOT NULL,
    [InicioPrevistoEm] DATE NOT NULL,
    [FimPrevistoEm] DATE NOT NULL,
    [InicioRealEm] DATETIME2,
    [FimRealEm] DATETIME2,
    [Resultado] NVARCHAR(2000),
    [Versao] INT NOT NULL CONSTRAINT [ProjetoSprints_Versao_df] DEFAULT 1,
    [EscopoInicialItens] INT,
    [EscopoInicialEstimativa] INT,
    [ItensConcluidos] INT,
    [EstimativaConcluida] INT,
    [ItensAdicionadosAposInicio] INT,
    [ItensRetiradosAposInicio] INT,
    [CriadoPorId] UNIQUEIDENTIFIER NOT NULL,
    [CanceladoPorId] UNIQUEIDENTIFIER,
    [CanceladoEm] DATETIME2,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoSprints_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoSprints_pkey] PRIMARY KEY CLUSTERED ([Id])
);

CREATE TABLE [dbo].[ProjetoSprintItens] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [SprintId] UNIQUEIDENTIFIER NOT NULL,
    [ItemId] UNIQUEIDENTIFIER NOT NULL,
    [IncluidoPorId] UNIQUEIDENTIFIER NOT NULL,
    [RetiradoPorId] UNIQUEIDENTIFIER,
    [IncluidoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoSprintItens_IncluidoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [RetiradoEm] DATETIME2,
    [EscopoInicial] BIT NOT NULL CONSTRAINT [ProjetoSprintItens_EscopoInicial_df] DEFAULT 0,
    [StatusAoIniciar] NVARCHAR(20),
    [EstimativaAoIniciar] INT,
    [StatusAoEncerrar] NVARCHAR(20),
    [EstimativaAoEncerrar] INT,
    [ConcluidoNoSprint] BIT,
    CONSTRAINT [ProjetoSprintItens_pkey] PRIMARY KEY CLUSTERED ([Id])
);

CREATE NONCLUSTERED INDEX [IX_ProjetoSprints_EmpresaId_ProjetoId_Status]
ON [dbo].[ProjetoSprints]([EmpresaId], [ProjetoId], [Status]);

CREATE NONCLUSTERED INDEX [IX_ProjetoSprints_ProjetoId_Periodo]
ON [dbo].[ProjetoSprints]([ProjetoId], [InicioPrevistoEm], [FimPrevistoEm]);

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoSprints_ProjetoId_Ativa]
ON [dbo].[ProjetoSprints]([ProjetoId])
WHERE [Status] = N'ATIVA';

CREATE NONCLUSTERED INDEX [IX_ProjetoSprintItens_Projeto_Sprint_Ativo]
ON [dbo].[ProjetoSprintItens]([EmpresaId], [ProjetoId], [SprintId], [RetiradoEm]);

CREATE NONCLUSTERED INDEX [IX_ProjetoSprintItens_Item_Ativo]
ON [dbo].[ProjetoSprintItens]([ItemId], [RetiradoEm]);

CREATE NONCLUSTERED INDEX [IX_ProjetoSprintItens_Sprint_Escopo]
ON [dbo].[ProjetoSprintItens]([SprintId], [EscopoInicial], [RetiradoEm]);

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoSprintItens_ItemId_Ativo]
ON [dbo].[ProjetoSprintItens]([ItemId])
WHERE [RetiradoEm] IS NULL;

ALTER TABLE [dbo].[ProjetoSprints] ADD CONSTRAINT [ProjetoSprints_EmpresaId_fkey]
FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoSprints] ADD CONSTRAINT [ProjetoSprints_ProjetoId_fkey]
FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoSprints] ADD CONSTRAINT [ProjetoSprints_CriadoPorId_fkey]
FOREIGN KEY ([CriadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoSprints] ADD CONSTRAINT [ProjetoSprints_CanceladoPorId_fkey]
FOREIGN KEY ([CanceladoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoSprintItens] ADD CONSTRAINT [ProjetoSprintItens_EmpresaId_fkey]
FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoSprintItens] ADD CONSTRAINT [ProjetoSprintItens_ProjetoId_fkey]
FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoSprintItens] ADD CONSTRAINT [ProjetoSprintItens_SprintId_fkey]
FOREIGN KEY ([SprintId]) REFERENCES [dbo].[ProjetoSprints]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoSprintItens] ADD CONSTRAINT [ProjetoSprintItens_ItemId_fkey]
FOREIGN KEY ([ItemId]) REFERENCES [dbo].[ProjetoItens]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoSprintItens] ADD CONSTRAINT [ProjetoSprintItens_IncluidoPorId_fkey]
FOREIGN KEY ([IncluidoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE [dbo].[ProjetoSprintItens] ADD CONSTRAINT [ProjetoSprintItens_RetiradoPorId_fkey]
FOREIGN KEY ([RetiradoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
