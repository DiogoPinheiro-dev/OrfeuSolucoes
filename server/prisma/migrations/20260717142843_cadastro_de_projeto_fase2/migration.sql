BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [UX_ChamadoNotificacoes_EventoChave] ON [dbo].[ChamadoNotificacoes];

-- AlterTable
ALTER TABLE [dbo].[ChamadoNotificacoes] DROP CONSTRAINT [DF_ChamadoNotificacoes_Id];
EXEC SP_RENAME N'dbo.PK_ChamadoNotificacoes', N'ChamadoNotificacoes_pkey';
ALTER TABLE [dbo].[ChamadoNotificacoes] ALTER COLUMN [EventoChave] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[ChamadoSolucaoEmails] DROP CONSTRAINT [DF_ChamadoSolucaoEmails_Ativo],
[DF_ChamadoSolucaoEmails_AtualizadoEm];
EXEC SP_RENAME N'dbo.PK_ChamadoSolucaoEmails', N'ChamadoSolucaoEmails_pkey';
ALTER TABLE [dbo].[ChamadoSolucaoEmails] ADD CONSTRAINT [ChamadoSolucaoEmails_Ativo_df] DEFAULT 1 FOR [Ativo];

-- AlterTable
ALTER TABLE [dbo].[GoogleEmailContas] DROP CONSTRAINT [DF_GoogleEmailContas_Ativo],
[DF_GoogleEmailContas_AtualizadoEm];
EXEC SP_RENAME N'dbo.PK_GoogleEmailContas', N'GoogleEmailContas_pkey';
ALTER TABLE [dbo].[GoogleEmailContas] ADD CONSTRAINT [GoogleEmailContas_Ativo_df] DEFAULT 1 FOR [Ativo];

-- AlterTable
EXEC SP_RENAME N'dbo.PK_ProjetoMembros', N'ProjetoMembros_pkey';

-- AlterTable
ALTER TABLE [dbo].[Projetos] DROP CONSTRAINT [DF_Projetos_Id];
EXEC SP_RENAME N'dbo.PK_Projetos', N'Projetos_pkey';

-- CreateIndex
ALTER TABLE [dbo].[ChamadoNotificacoes] ADD CONSTRAINT [UX_ChamadoNotificacoes_EventoChave] UNIQUE NONCLUSTERED ([EventoChave]);

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_ChamadoNotificacoes_Chamados', 'ChamadoNotificacoes_ChamadoId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_ChamadoNotificacoes_Empresas', 'ChamadoNotificacoes_EmpresaId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_ChamadoNotificacoes_Usuarios', 'ChamadoNotificacoes_UsuarioId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_ChamadoSolucaoEmails_Empresas', 'ChamadoSolucaoEmails_EmpresaId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_ChamadoSolucaoEmails_GoogleEmailContas', 'ChamadoSolucaoEmails_GoogleContaId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_ChamadoSolucaoEmails_Solucoes', 'ChamadoSolucaoEmails_SolucaoId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_GoogleEmailContas_Empresas', 'GoogleEmailContas_EmpresaId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_GoogleEmailContas_Usuarios', 'GoogleEmailContas_CriadoPorId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_ProjetoMembros_Projetos_ProjetoId', 'ProjetoMembros_ProjetoId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_ProjetoMembros_Usuarios_UsuarioId', 'ProjetoMembros_UsuarioId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_Projetos_Empresas_EmpresaId', 'Projetos_EmpresaId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_Projetos_Usuarios_ArquivadoPorId', 'Projetos_ArquivadoPorId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_Projetos_Usuarios_CriadoPorId', 'Projetos_CriadoPorId_fkey', 'OBJECT';

-- RenameForeignKey
EXEC sp_rename 'dbo.FK_Projetos_Usuarios_ResponsavelId', 'Projetos_ResponsavelId_fkey', 'OBJECT';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
