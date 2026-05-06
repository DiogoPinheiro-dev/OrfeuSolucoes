/*
  Warnings:

  - You are about to drop the column `Tipo` on the `Usuarios` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT [Usuarios_Tipo_df];
ALTER TABLE [dbo].[Usuarios] DROP COLUMN [Tipo];
ALTER TABLE [dbo].[Usuarios] ADD [GrupoId] INT,
[PodeAlterar] BIT NOT NULL CONSTRAINT [Usuarios_PodeAlterar_df] DEFAULT 0,
[PodeExcluir] BIT NOT NULL CONSTRAINT [Usuarios_PodeExcluir_df] DEFAULT 0,
[PodeIncluir] BIT NOT NULL CONSTRAINT [Usuarios_PodeIncluir_df] DEFAULT 0,
[PodeVisualizar] BIT NOT NULL CONSTRAINT [Usuarios_PodeVisualizar_df] DEFAULT 1;

-- CreateTable
CREATE TABLE [dbo].[GruposUsuarios] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [Nome] NVARCHAR(1000) NOT NULL,
    [Descricao] NVARCHAR(1000),
    [AcessoEcommerce] BIT NOT NULL CONSTRAINT [GruposUsuarios_AcessoEcommerce_df] DEFAULT 0,
    [AcessoProjetos] BIT NOT NULL CONSTRAINT [GruposUsuarios_AcessoProjetos_df] DEFAULT 0,
    [AcessoHoras] BIT NOT NULL CONSTRAINT [GruposUsuarios_AcessoHoras_df] DEFAULT 0,
    [AcessoConfigurador] BIT NOT NULL CONSTRAINT [GruposUsuarios_AcessoConfigurador_df] DEFAULT 0,
    [Administrador] BIT NOT NULL CONSTRAINT [GruposUsuarios_Administrador_df] DEFAULT 0,
    CONSTRAINT [GruposUsuarios_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_GruposUsuarios_Nome] UNIQUE NONCLUSTERED ([Nome])
);

-- AddForeignKey
ALTER TABLE [dbo].[Usuarios] ADD CONSTRAINT [Usuarios_GrupoId_fkey] FOREIGN KEY ([GrupoId]) REFERENCES [dbo].[GruposUsuarios]([Id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
