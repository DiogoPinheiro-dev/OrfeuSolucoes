BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ProjetoApontamentos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [ItemId] UNIQUEIDENTIFIER,
    [DataTrabalho] DATE NOT NULL,
    [Minutos] INT NOT NULL,
    [Descricao] NVARCHAR(1000) NOT NULL,
    [Faturavel] BIT NOT NULL CONSTRAINT [ProjetoApontamentos_Faturavel_df] DEFAULT 1,
    [Status] NVARCHAR(20) NOT NULL CONSTRAINT [ProjetoApontamentos_Status_df] DEFAULT 'RASCUNHO',
    [EnviadoEm] DATETIME2,
    [DecididoPorId] UNIQUEIDENTIFIER,
    [DecididoEm] DATETIME2,
    [Motivo] NVARCHAR(500),
    [CustoId] UNIQUEIDENTIFIER,
    [TaxaHistoricoId] UNIQUEIDENTIFIER,
    [TaxaHoraAplicada] DECIMAL(18,4),
    [ValorCusto] DECIMAL(18,2),
    [Moeda] NVARCHAR(3),
    [CustoSituacao] NVARCHAR(20) NOT NULL CONSTRAINT [ProjetoApontamentos_CustoSituacao_df] DEFAULT 'NAO_APLICAVEL',
    [ArquivadoEm] DATETIME2,
    [ArquivadoPorId] UNIQUEIDENTIFIER,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoApontamentos_Versao_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoApontamentos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoApontamentos_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [CK_ProjetoApontamentos_Minutos] CHECK ([Minutos] BETWEEN 1 AND 1440),
    CONSTRAINT [CK_ProjetoApontamentos_Status] CHECK ([Status] IN ('RASCUNHO', 'ENVIADO', 'APROVADO', 'REJEITADO')),
    CONSTRAINT [CK_ProjetoApontamentos_CustoSituacao] CHECK ([CustoSituacao] IN ('NAO_APLICAVEL', 'CALCULADO', 'SEM_TAXA', 'TAXA_AMBIGUA'))
);

-- CreateTable
CREATE TABLE [dbo].[ProjetoApontamentoPeriodos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [Competencia] NVARCHAR(7) NOT NULL,
    [Situacao] NVARCHAR(20) NOT NULL,
    [FechadoPorId] UNIQUEIDENTIFIER NOT NULL,
    [FechadoEm] DATETIME2 NOT NULL,
    [ReabertoPorId] UNIQUEIDENTIFIER,
    [ReabertoEm] DATETIME2,
    [MotivoReabertura] NVARCHAR(500),
    [Versao] INT NOT NULL CONSTRAINT [ProjetoApontamentoPeriodos_Versao_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoApontamentoPeriodos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoApontamentoPeriodos_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ProjetoApontamentoPeriodos_Projeto_Competencia] UNIQUE NONCLUSTERED ([ProjetoId],[Competencia]),
    CONSTRAINT [CK_ProjetoApontamentoPeriodos_Competencia] CHECK ([Competencia] LIKE '[0-9][0-9][0-9][0-9]-[0-1][0-9]' AND RIGHT([Competencia], 2) BETWEEN '01' AND '12'),
    CONSTRAINT [CK_ProjetoApontamentoPeriodos_Situacao] CHECK ([Situacao] IN ('FECHADO', 'REABERTO'))
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoApontamentos_Empresa_Usuario_Data] ON [dbo].[ProjetoApontamentos]([EmpresaId], [UsuarioId], [DataTrabalho]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoApontamentos_Empresa_Projeto_Data] ON [dbo].[ProjetoApontamentos]([EmpresaId], [ProjetoId], [DataTrabalho]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoApontamentos_Projeto_Status] ON [dbo].[ProjetoApontamentos]([ProjetoId], [Status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoApontamentos_ItemId] ON [dbo].[ProjetoApontamentos]([ItemId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoApontamentos_CustoId] ON [dbo].[ProjetoApontamentos]([CustoId]);

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentos] ADD CONSTRAINT [ProjetoApontamentos_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentos] ADD CONSTRAINT [ProjetoApontamentos_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentos] ADD CONSTRAINT [ProjetoApontamentos_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentos] ADD CONSTRAINT [ProjetoApontamentos_ItemId_fkey] FOREIGN KEY ([ItemId]) REFERENCES [dbo].[ProjetoItens]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentos] ADD CONSTRAINT [ProjetoApontamentos_DecididoPorId_fkey] FOREIGN KEY ([DecididoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentos] ADD CONSTRAINT [ProjetoApontamentos_CustoId_fkey] FOREIGN KEY ([CustoId]) REFERENCES [dbo].[ProjetoCustos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentos] ADD CONSTRAINT [ProjetoApontamentos_TaxaHistoricoId_fkey] FOREIGN KEY ([TaxaHistoricoId]) REFERENCES [dbo].[ProjetoCustoTaxasHistorico]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentos] ADD CONSTRAINT [ProjetoApontamentos_ArquivadoPorId_fkey] FOREIGN KEY ([ArquivadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] ADD CONSTRAINT [ProjetoApontamentoPeriodos_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] ADD CONSTRAINT [ProjetoApontamentoPeriodos_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] ADD CONSTRAINT [ProjetoApontamentoPeriodos_FechadoPorId_fkey] FOREIGN KEY ([FechadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] ADD CONSTRAINT [ProjetoApontamentoPeriodos_ReabertoPorId_fkey] FOREIGN KEY ([ReabertoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
