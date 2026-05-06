BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[EmpresaUsuarios] DROP CONSTRAINT [FK_EmpresaUsuarios_Empresas];

-- DropForeignKey
ALTER TABLE [dbo].[EmpresaUsuarios] DROP CONSTRAINT [FK_EmpresaUsuarios_Usuarios];

-- AlterTable
ALTER TABLE [dbo].[Empresas] DROP CONSTRAINT [DF_Empresas_AcessoEcommerce],
[DF_Empresas_AcessoHoras],
[DF_Empresas_AcessoProjetos];
ALTER TABLE [dbo].[Empresas] ADD CONSTRAINT [Empresas_AcessoEcommerce_df] DEFAULT 0 FOR [AcessoEcommerce], CONSTRAINT [Empresas_AcessoHoras_df] DEFAULT 0 FOR [AcessoHoras], CONSTRAINT [Empresas_AcessoProjetos_df] DEFAULT 0 FOR [AcessoProjetos];

-- AddForeignKey
ALTER TABLE [dbo].[EmpresaUsuarios] ADD CONSTRAINT [EmpresaUsuarios_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[EmpresaUsuarios] ADD CONSTRAINT [EmpresaUsuarios_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
