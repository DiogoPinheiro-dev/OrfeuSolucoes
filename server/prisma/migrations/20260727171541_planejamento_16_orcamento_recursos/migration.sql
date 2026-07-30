BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ProjetoCapacidades] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [InicioEm] DATE NOT NULL,
    [FimEm] DATE NOT NULL,
    [CapacidadeMinutos] INT NOT NULL,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoCapacidades_Versao_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoCapacidades_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    [projetoId] UNIQUEIDENTIFIER,
    CONSTRAINT [ProjetoCapacidades_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[ProjetoAlocacoes] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [InicioEm] DATE NOT NULL,
    [FimEm] DATE NOT NULL,
    [AlocacaoMinutos] INT NOT NULL,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoAlocacoes_Versao_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoAlocacoes_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoAlocacoes_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[ProjetoOrcamentos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [Moeda] NVARCHAR(3) NOT NULL CONSTRAINT [ProjetoOrcamentos_Moeda_df] DEFAULT 'BRL',
    [Status] NVARCHAR(20) NOT NULL CONSTRAINT [ProjetoOrcamentos_Status_df] DEFAULT 'RASCUNHO',
    [Versao] INT NOT NULL CONSTRAINT [ProjetoOrcamentos_Versao_df] DEFAULT 1,
    [AprovadoEm] DATETIME2,
    [AprovadoPorId] UNIQUEIDENTIFIER,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoOrcamentos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoOrcamentos_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ProjetoOrcamentos_ProjetoId] UNIQUE NONCLUSTERED ([ProjetoId])
);

-- CreateTable
CREATE TABLE [dbo].[ProjetoOrcamentoCategorias] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [OrcamentoId] UNIQUEIDENTIFIER NOT NULL,
    [Nome] NVARCHAR(120) NOT NULL,
    [ValorPlanejado] DECIMAL(18,2) NOT NULL CONSTRAINT [ProjetoOrcamentoCategorias_ValorPlanejado_df] DEFAULT 0,
    [ValorComprometido] DECIMAL(18,2) NOT NULL CONSTRAINT [ProjetoOrcamentoCategorias_ValorComprometido_df] DEFAULT 0,
    [ValorRealizado] DECIMAL(18,2) NOT NULL CONSTRAINT [ProjetoOrcamentoCategorias_ValorRealizado_df] DEFAULT 0,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoOrcamentoCategorias_Versao_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoOrcamentoCategorias_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoOrcamentoCategorias_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ProjetoOrcamentoCategorias_Orcamento_Nome] UNIQUE NONCLUSTERED ([OrcamentoId],[Nome])
);

-- CreateTable
CREATE TABLE [dbo].[ProjetoCustos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [OrcamentoId] UNIQUEIDENTIFIER NOT NULL,
    [CategoriaId] UNIQUEIDENTIFIER,
    [Tipo] NVARCHAR(20) NOT NULL,
    [Descricao] NVARCHAR(240) NOT NULL,
    [RecursoId] UNIQUEIDENTIFIER,
    [QuantidadeMinutos] INT,
    [TaxaHora] DECIMAL(18,4),
    [ValorPlanejado] DECIMAL(18,2) NOT NULL CONSTRAINT [ProjetoCustos_ValorPlanejado_df] DEFAULT 0,
    [ValorComprometido] DECIMAL(18,2) NOT NULL CONSTRAINT [ProjetoCustos_ValorComprometido_df] DEFAULT 0,
    [ValorRealizado] DECIMAL(18,2) NOT NULL CONSTRAINT [ProjetoCustos_ValorRealizado_df] DEFAULT 0,
    [CriadoPorId] UNIQUEIDENTIFIER NOT NULL,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoCustos_Versao_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoCustos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoCustos_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[ProjetoCustoTaxasHistorico] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [CustoId] UNIQUEIDENTIFIER NOT NULL,
    [TaxaHora] DECIMAL(18,4) NOT NULL,
    [CriadoPorId] UNIQUEIDENTIFIER NOT NULL,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoCustoTaxasHistorico_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjetoCustoTaxasHistorico_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoCapacidades_Empresa_Usuario_Periodo] ON [dbo].[ProjetoCapacidades]([EmpresaId], [UsuarioId], [InicioEm], [FimEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoAlocacoes_Empresa_Usuario_Periodo] ON [dbo].[ProjetoAlocacoes]([EmpresaId], [UsuarioId], [InicioEm], [FimEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoAlocacoes_Projeto_Periodo] ON [dbo].[ProjetoAlocacoes]([ProjetoId], [InicioEm], [FimEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoOrcamentos_Empresa_Status] ON [dbo].[ProjetoOrcamentos]([EmpresaId], [Status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoOrcamentoCategorias_Empresa_Projeto] ON [dbo].[ProjetoOrcamentoCategorias]([EmpresaId], [ProjetoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoCustos_Empresa_Projeto_Tipo] ON [dbo].[ProjetoCustos]([EmpresaId], [ProjetoId], [Tipo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoCustos_CategoriaId] ON [dbo].[ProjetoCustos]([CategoriaId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoCustoTaxas_Custo_Criado] ON [dbo].[ProjetoCustoTaxasHistorico]([CustoId], [CriadoEm]);

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoCapacidades] ADD CONSTRAINT [ProjetoCapacidades_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoCapacidades] ADD CONSTRAINT [ProjetoCapacidades_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoCapacidades] ADD CONSTRAINT [ProjetoCapacidades_projetoId_fkey] FOREIGN KEY ([projetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAlocacoes] ADD CONSTRAINT [ProjetoAlocacoes_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAlocacoes] ADD CONSTRAINT [ProjetoAlocacoes_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAlocacoes] ADD CONSTRAINT [ProjetoAlocacoes_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoOrcamentos] ADD CONSTRAINT [ProjetoOrcamentos_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoOrcamentos] ADD CONSTRAINT [ProjetoOrcamentos_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoOrcamentos] ADD CONSTRAINT [ProjetoOrcamentos_AprovadoPorId_fkey] FOREIGN KEY ([AprovadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoOrcamentoCategorias] ADD CONSTRAINT [ProjetoOrcamentoCategorias_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoOrcamentoCategorias] ADD CONSTRAINT [ProjetoOrcamentoCategorias_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoOrcamentoCategorias] ADD CONSTRAINT [ProjetoOrcamentoCategorias_OrcamentoId_fkey] FOREIGN KEY ([OrcamentoId]) REFERENCES [dbo].[ProjetoOrcamentos]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoCustos] ADD CONSTRAINT [ProjetoCustos_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoCustos] ADD CONSTRAINT [ProjetoCustos_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoCustos] ADD CONSTRAINT [ProjetoCustos_OrcamentoId_fkey] FOREIGN KEY ([OrcamentoId]) REFERENCES [dbo].[ProjetoOrcamentos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoCustos] ADD CONSTRAINT [ProjetoCustos_CategoriaId_fkey] FOREIGN KEY ([CategoriaId]) REFERENCES [dbo].[ProjetoOrcamentoCategorias]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoCustos] ADD CONSTRAINT [ProjetoCustos_RecursoId_fkey] FOREIGN KEY ([RecursoId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoCustos] ADD CONSTRAINT [ProjetoCustos_CriadoPorId_fkey] FOREIGN KEY ([CriadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoCustoTaxasHistorico] ADD CONSTRAINT [ProjetoCustoTaxasHistorico_CustoId_fkey] FOREIGN KEY ([CustoId]) REFERENCES [dbo].[ProjetoCustos]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoCustoTaxasHistorico] ADD CONSTRAINT [ProjetoCustoTaxasHistorico_CriadoPorId_fkey] FOREIGN KEY ([CriadoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
