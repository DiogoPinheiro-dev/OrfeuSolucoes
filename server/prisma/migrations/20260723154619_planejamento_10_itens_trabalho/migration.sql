BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ProjetoItens] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [Numero] INT NOT NULL,
    [Chave] NVARCHAR(30) NOT NULL,
    [Tipo] NVARCHAR(20) NOT NULL,
    [Titulo] NVARCHAR(200) NOT NULL,
    [Descricao] NVARCHAR(max),
    [Status] NVARCHAR(20) NOT NULL,
    [Prioridade] NVARCHAR(20) NOT NULL,
    [ResponsavelId] UNIQUEIDENTIFIER,
    [AutorId] UNIQUEIDENTIFIER NOT NULL,
    [PaiId] UNIQUEIDENTIFIER,
    [InicioPrevistoEm] DATE,
    [FimPrevistoEm] DATE,
    [EstimativaMinutos] INT,
    [ConcluidoEm] DATETIME2,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoItens_Versao_df] DEFAULT 1,
    [ArquivadoEm] DATETIME2,
    [ArquivadoPorId] UNIQUEIDENTIFIER,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoItens_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoItens_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ProjetoItens_ProjetoId_Numero] UNIQUE NONCLUSTERED ([ProjetoId],[Numero]),
    CONSTRAINT [UX_ProjetoItens_ProjetoId_Chave] UNIQUE NONCLUSTERED ([ProjetoId],[Chave])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoItens_EmpresaId_ProjetoId_ArquivadoEm] ON [dbo].[ProjetoItens]([EmpresaId], [ProjetoId], [ArquivadoEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoItens_ProjetoId_Status_Prioridade] ON [dbo].[ProjetoItens]([ProjetoId], [Status], [Prioridade]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoItens_ProjetoId_ResponsavelId] ON [dbo].[ProjetoItens]([ProjetoId], [ResponsavelId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoItens_PaiId] ON [dbo].[ProjetoItens]([PaiId]);

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoItens] ADD CONSTRAINT [ProjetoItens_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoItens] ADD CONSTRAINT [ProjetoItens_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoItens] ADD CONSTRAINT [ProjetoItens_ResponsavelId_fkey] FOREIGN KEY ([ResponsavelId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoItens] ADD CONSTRAINT [ProjetoItens_AutorId_fkey] FOREIGN KEY ([AutorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoItens] ADD CONSTRAINT [ProjetoItens_ArquivadoPorId_fkey] FOREIGN KEY ([ArquivadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoItens] ADD CONSTRAINT [ProjetoItens_PaiId_fkey] FOREIGN KEY ([PaiId]) REFERENCES [dbo].[ProjetoItens]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
