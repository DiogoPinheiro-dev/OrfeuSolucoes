BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ChamadoPrioridades] DROP CONSTRAINT [DF_ChamadoPrioridades_Ativo],
[DF_ChamadoPrioridades_Ordem];
EXEC SP_RENAME N'dbo.PK_ChamadoPrioridades', N'ChamadoPrioridades_pkey';
ALTER TABLE [dbo].[ChamadoPrioridades] ADD CONSTRAINT [ChamadoPrioridades_Ativo_df] DEFAULT 1 FOR [Ativo], CONSTRAINT [ChamadoPrioridades_Ordem_df] DEFAULT 0 FOR [Ordem];

-- AlterTable
ALTER TABLE [dbo].[Chamados] ADD [PrimeiraRespostaLimiteEm] DATETIME2,
[ResolucaoLimiteEm] DATETIME2,
[SlaPausadoEm] DATETIME2,
[SlaRegraId] INT,
[SlaStatus] NVARCHAR(1000) NOT NULL CONSTRAINT [Chamados_SlaStatus_df] DEFAULT 'SEM_SLA',
[SlaTempoPausadoMinutos] INT NOT NULL CONSTRAINT [Chamados_SlaTempoPausadoMinutos_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[ChamadoTipos] DROP CONSTRAINT [DF_ChamadoTipos_Ativo],
[DF_ChamadoTipos_Ordem];
EXEC SP_RENAME N'dbo.PK_ChamadoTipos', N'ChamadoTipos_pkey';
ALTER TABLE [dbo].[ChamadoTipos] ADD CONSTRAINT [ChamadoTipos_Ativo_df] DEFAULT 1 FOR [Ativo], CONSTRAINT [ChamadoTipos_Ordem_df] DEFAULT 0 FOR [Ordem];

-- AlterTable
ALTER TABLE [dbo].[Empresas] DROP CONSTRAINT [DF_Empresas_PadraoSistema];
ALTER TABLE [dbo].[Empresas] ADD CONSTRAINT [Empresas_PadraoSistema_df] DEFAULT 0 FOR [PadraoSistema];

-- AlterTable
ALTER TABLE [dbo].[GruposUsuarios] DROP CONSTRAINT [DF_GruposUsuarios_PadraoSistema];
ALTER TABLE [dbo].[GruposUsuarios] ADD CONSTRAINT [GruposUsuarios_PadraoSistema_df] DEFAULT 0 FOR [PadraoSistema];

-- AlterTable
ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT [DF_Usuarios_PadraoSistema];
ALTER TABLE [dbo].[Usuarios] ADD CONSTRAINT [Usuarios_PadraoSistema_df] DEFAULT 0 FOR [PadraoSistema];

-- CreateTable
CREATE TABLE [dbo].[ChamadoSlaRegras] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [EmpresaId] INT NOT NULL,
    [PrioridadeId] INT NOT NULL,
    [PrimeiraRespostaPrazoMinutos] INT NOT NULL,
    [ResolucaoPrazoMinutos] INT NOT NULL,
    [ModoContagem] NVARCHAR(1000) NOT NULL CONSTRAINT [ChamadoSlaRegras_ModoContagem_df] DEFAULT 'CORRIDO',
    [Ativo] BIT NOT NULL CONSTRAINT [ChamadoSlaRegras_Ativo_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoSlaRegras_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ChamadoSlaRegras_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ChamadoSlaRegras_EmpresaId_PrioridadeId] UNIQUE NONCLUSTERED ([EmpresaId],[PrioridadeId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ChamadoSlaRegras_EmpresaId_Ativo] ON [dbo].[ChamadoSlaRegras]([EmpresaId], [Ativo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_SlaStatus] ON [dbo].[Chamados]([EmpresaId], [SlaStatus]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_ResolucaoLimiteEm] ON [dbo].[Chamados]([EmpresaId], [ResolucaoLimiteEm]);

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_ChamadoPrioridades_Empresas_EmpresaId', 'ChamadoPrioridades_EmpresaId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_Chamados_ChamadoPrioridades_PrioridadeId', 'Chamados_PrioridadeId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_Chamados_ChamadoTipos_TipoId', 'Chamados_TipoId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_ChamadoTipos_Empresas_EmpresaId', 'ChamadoTipos_EmpresaId_fkey', 'OBJECT';

-- AddForeignKey
ALTER TABLE [dbo].[Chamados] ADD CONSTRAINT [Chamados_SlaRegraId_fkey] FOREIGN KEY ([SlaRegraId]) REFERENCES [dbo].[ChamadoSlaRegras]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChamadoSlaRegras] ADD CONSTRAINT [ChamadoSlaRegras_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChamadoSlaRegras] ADD CONSTRAINT [ChamadoSlaRegras_PrioridadeId_fkey] FOREIGN KEY ([PrioridadeId]) REFERENCES [dbo].[ChamadoPrioridades]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
