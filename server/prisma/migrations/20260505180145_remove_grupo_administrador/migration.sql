/*
  Warnings:

  - You are about to drop the column `Administrador` on the `GruposUsuarios` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[GruposUsuarios] DROP CONSTRAINT [GruposUsuarios_Administrador_df];
ALTER TABLE [dbo].[GruposUsuarios] DROP COLUMN [Administrador];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
