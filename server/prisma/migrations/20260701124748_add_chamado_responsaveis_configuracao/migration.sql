BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ChamadoCategorias] DROP CONSTRAINT [ChamadoCategorias_AtualizadoEm_df];

-- AlterTable
ALTER TABLE [dbo].[Chamados] DROP CONSTRAINT [Chamados_AtualizadoEm_df];

-- AlterTable
ALTER TABLE [dbo].[ChamadoSequencias] DROP CONSTRAINT [ChamadoSequencias_AtualizadoEm_df];

-- AlterTable
ALTER TABLE [dbo].[FuncionalidadeAcoes] DROP CONSTRAINT [DF_FuncionalidadeAcoes_AcaoPadrao],
[DF_FuncionalidadeAcoes_Ativo],
[DF_FuncionalidadeAcoes_Ordem];
EXEC SP_RENAME N'dbo.PK_FuncionalidadeAcoes', N'FuncionalidadeAcoes_pkey';
ALTER TABLE [dbo].[FuncionalidadeAcoes] ADD CONSTRAINT [FuncionalidadeAcoes_AcaoPadrao_df] DEFAULT 0 FOR [AcaoPadrao], CONSTRAINT [FuncionalidadeAcoes_Ativo_df] DEFAULT 1 FOR [Ativo], CONSTRAINT [FuncionalidadeAcoes_Ordem_df] DEFAULT 0 FOR [Ordem];

-- AlterTable
ALTER TABLE [dbo].[GrupoFuncionalidadeAcoes] DROP CONSTRAINT [DF_GrupoFuncionalidadeAcoes_Permitido];
EXEC SP_RENAME N'dbo.PK_GrupoFuncionalidadeAcoes', N'GrupoFuncionalidadeAcoes_pkey';
ALTER TABLE [dbo].[GrupoFuncionalidadeAcoes] ADD CONSTRAINT [GrupoFuncionalidadeAcoes_Permitido_df] DEFAULT 0 FOR [Permitido];

-- CreateTable
CREATE TABLE [dbo].[ChamadoResponsaveisConfiguracao] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [EmpresaId] INT NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [SolucaoId] INT NOT NULL,
    [FuncionalidadeId] INT,
    [Escopo] NVARCHAR(1000) NOT NULL CONSTRAINT [ChamadoResponsaveisConfiguracao_Escopo_df] DEFAULT 'SOLUCAO',
    [Observacao] NVARCHAR(1000),
    [Ativo] BIT NOT NULL CONSTRAINT [ChamadoResponsaveisConfiguracao_Ativo_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ChamadoResponsaveisConfiguracao_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ChamadoResponsaveisConfiguracao_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveisConfiguracao_EmpresaId_Ativo] ON [dbo].[ChamadoResponsaveisConfiguracao]([EmpresaId], [Ativo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveisConfiguracao_EmpresaId_UsuarioId] ON [dbo].[ChamadoResponsaveisConfiguracao]([EmpresaId], [UsuarioId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveisConfiguracao_EmpresaId_Escopo] ON [dbo].[ChamadoResponsaveisConfiguracao]([EmpresaId], [SolucaoId], [FuncionalidadeId]);

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_FuncionalidadeAcoes_Funcionalidades_FuncionalidadeId', 'FuncionalidadeAcoes_FuncionalidadeId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_GrupoFuncionalidadeAcoes_FuncionalidadeAcoes_FuncionalidadeAcaoId', 'GrupoFuncionalidadeAcoes_FuncionalidadeAcaoId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_GrupoFuncionalidadeAcoes_GruposUsuarios_GrupoId', 'GrupoFuncionalidadeAcoes_GrupoId_fkey', 'OBJECT';

-- AddForeignKey
ALTER TABLE [dbo].[ChamadoResponsaveisConfiguracao] ADD CONSTRAINT [ChamadoResponsaveisConfiguracao_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChamadoResponsaveisConfiguracao] ADD CONSTRAINT [ChamadoResponsaveisConfiguracao_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChamadoResponsaveisConfiguracao] ADD CONSTRAINT [ChamadoResponsaveisConfiguracao_SolucaoId_fkey] FOREIGN KEY ([SolucaoId]) REFERENCES [dbo].[Solucoes]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChamadoResponsaveisConfiguracao] ADD CONSTRAINT [ChamadoResponsaveisConfiguracao_FuncionalidadeId_fkey] FOREIGN KEY ([FuncionalidadeId]) REFERENCES [dbo].[Funcionalidades]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
