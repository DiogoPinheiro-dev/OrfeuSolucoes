BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[ProjetoTarefas] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [RecursoId] UNIQUEIDENTIFIER NOT NULL,
    [FuncionalidadeId] INT NOT NULL,
    [ValorHora] DECIMAL(18, 4) NOT NULL,
    [Moeda] NVARCHAR(3) NOT NULL CONSTRAINT [ProjetoTarefas_Moeda_df] DEFAULT N'BRL',
    [Observacao] NVARCHAR(500) NULL,
    [Ativo] BIT NOT NULL CONSTRAINT [ProjetoTarefas_Ativo_df] DEFAULT 1,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoTarefas_Versao_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoTarefas_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoTarefas_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ProjetoTarefas_Empresa_Recurso_Funcionalidade] UNIQUE NONCLUSTERED ([EmpresaId], [RecursoId], [FuncionalidadeId])
);

CREATE TABLE [dbo].[ProjetoTarefaTaxasHistorico] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [TarefaId] UNIQUEIDENTIFIER NOT NULL,
    [ValorHora] DECIMAL(18, 4) NOT NULL,
    [Moeda] NVARCHAR(3) NOT NULL,
    [CriadoPorId] UNIQUEIDENTIFIER NOT NULL,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoTarefaTaxasHistorico_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjetoTarefaTaxasHistorico_pkey] PRIMARY KEY CLUSTERED ([Id])
);

CREATE NONCLUSTERED INDEX [IX_ProjetoTarefas_Empresa_Ativo] ON [dbo].[ProjetoTarefas]([EmpresaId], [Ativo]);
CREATE NONCLUSTERED INDEX [IX_ProjetoTarefas_Funcionalidade_Ativo] ON [dbo].[ProjetoTarefas]([FuncionalidadeId], [Ativo]);
CREATE NONCLUSTERED INDEX [IX_ProjetoTarefaTaxas_Tarefa_Criado] ON [dbo].[ProjetoTarefaTaxasHistorico]([TarefaId], [CriadoEm]);

ALTER TABLE [dbo].[ProjetoTarefas] ADD CONSTRAINT [ProjetoTarefas_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoTarefas] ADD CONSTRAINT [ProjetoTarefas_RecursoId_fkey] FOREIGN KEY ([RecursoId]) REFERENCES [dbo].[Recursos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoTarefas] ADD CONSTRAINT [ProjetoTarefas_FuncionalidadeId_fkey] FOREIGN KEY ([FuncionalidadeId]) REFERENCES [dbo].[Funcionalidades]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoTarefaTaxasHistorico] ADD CONSTRAINT [ProjetoTarefaTaxasHistorico_TarefaId_fkey] FOREIGN KEY ([TarefaId]) REFERENCES [dbo].[ProjetoTarefas]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE [dbo].[ProjetoTarefaTaxasHistorico] ADD CONSTRAINT [ProjetoTarefaTaxasHistorico_CriadoPorId_fkey] FOREIGN KEY ([CriadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
