BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[GrupoFuncionalidades] ADD
  [PodeVisualizar] bit NOT NULL CONSTRAINT [GrupoFuncionalidades_PodeVisualizar_df] DEFAULT 1,
  [PodeIncluir] bit NOT NULL CONSTRAINT [GrupoFuncionalidades_PodeIncluir_df] DEFAULT 0,
  [PodeAlterar] bit NOT NULL CONSTRAINT [GrupoFuncionalidades_PodeAlterar_df] DEFAULT 0,
  [PodeExcluir] bit NOT NULL CONSTRAINT [GrupoFuncionalidades_PodeExcluir_df] DEFAULT 0;

EXEC(N'
UPDATE [gf]
SET
  [PodeVisualizar] = ISNULL([g].[PodeVisualizar], 1),
  [PodeIncluir] = ISNULL([g].[PodeIncluir], 0),
  [PodeAlterar] = ISNULL([g].[PodeAlterar], 0),
  [PodeExcluir] = ISNULL([g].[PodeExcluir], 0)
FROM [dbo].[GrupoFuncionalidades] [gf]
JOIN [dbo].[GruposUsuarios] [g] ON [g].[Id] = [gf].[GrupoId];
');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
