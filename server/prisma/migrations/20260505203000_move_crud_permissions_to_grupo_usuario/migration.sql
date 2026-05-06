BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[GruposUsuarios] ADD
  [PodeVisualizar] bit NOT NULL CONSTRAINT [GruposUsuarios_PodeVisualizar_df] DEFAULT 1,
  [PodeIncluir] bit NOT NULL CONSTRAINT [GruposUsuarios_PodeIncluir_df] DEFAULT 0,
  [PodeAlterar] bit NOT NULL CONSTRAINT [GruposUsuarios_PodeAlterar_df] DEFAULT 0,
  [PodeExcluir] bit NOT NULL CONSTRAINT [GruposUsuarios_PodeExcluir_df] DEFAULT 0;

EXEC(N'
UPDATE [dbo].[GruposUsuarios]
SET
  [PodeVisualizar] = CASE
    WHEN EXISTS (
      SELECT 1 FROM [dbo].[Usuarios]
      WHERE [Usuarios].[GrupoId] = [GruposUsuarios].[Id]
    )
    AND NOT EXISTS (
      SELECT 1 FROM [dbo].[Usuarios]
      WHERE [Usuarios].[GrupoId] = [GruposUsuarios].[Id]
      AND ISNULL([Usuarios].[PodeVisualizar], 0) = 0
    )
    THEN 1 ELSE 0 END,
  [PodeIncluir] = CASE
    WHEN EXISTS (
      SELECT 1 FROM [dbo].[Usuarios]
      WHERE [Usuarios].[GrupoId] = [GruposUsuarios].[Id]
    )
    AND NOT EXISTS (
      SELECT 1 FROM [dbo].[Usuarios]
      WHERE [Usuarios].[GrupoId] = [GruposUsuarios].[Id]
      AND ISNULL([Usuarios].[PodeIncluir], 0) = 0
    )
    THEN 1 ELSE 0 END,
  [PodeAlterar] = CASE
    WHEN EXISTS (
      SELECT 1 FROM [dbo].[Usuarios]
      WHERE [Usuarios].[GrupoId] = [GruposUsuarios].[Id]
    )
    AND NOT EXISTS (
      SELECT 1 FROM [dbo].[Usuarios]
      WHERE [Usuarios].[GrupoId] = [GruposUsuarios].[Id]
      AND ISNULL([Usuarios].[PodeAlterar], 0) = 0
    )
    THEN 1 ELSE 0 END,
  [PodeExcluir] = CASE
    WHEN EXISTS (
      SELECT 1 FROM [dbo].[Usuarios]
      WHERE [Usuarios].[GrupoId] = [GruposUsuarios].[Id]
    )
    AND NOT EXISTS (
      SELECT 1 FROM [dbo].[Usuarios]
      WHERE [Usuarios].[GrupoId] = [GruposUsuarios].[Id]
      AND ISNULL([Usuarios].[PodeExcluir], 0) = 0
    )
    THEN 1 ELSE 0 END;

UPDATE [dbo].[GruposUsuarios]
SET
  [PodeVisualizar] = 1,
  [PodeIncluir] = 1,
  [PodeAlterar] = 1,
  [PodeExcluir] = 1
WHERE
  [AcessoEcommerce] = 1
  AND [AcessoProjetos] = 1
  AND [AcessoHoras] = 1
  AND [AcessoConfigurador] = 1;
');

DECLARE @constraintName nvarchar(128);

SELECT @constraintName = [dc].[name]
FROM [sys].[default_constraints] [dc]
JOIN [sys].[columns] [c] ON [c].[default_object_id] = [dc].[object_id]
JOIN [sys].[tables] [t] ON [t].[object_id] = [c].[object_id]
JOIN [sys].[schemas] [s] ON [s].[schema_id] = [t].[schema_id]
WHERE [s].[name] = 'dbo' AND [t].[name] = 'Usuarios' AND [c].[name] = 'PodeVisualizar';
IF @constraintName IS NOT NULL EXEC('ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT [' + @constraintName + ']');

SET @constraintName = NULL;
SELECT @constraintName = [dc].[name]
FROM [sys].[default_constraints] [dc]
JOIN [sys].[columns] [c] ON [c].[default_object_id] = [dc].[object_id]
JOIN [sys].[tables] [t] ON [t].[object_id] = [c].[object_id]
JOIN [sys].[schemas] [s] ON [s].[schema_id] = [t].[schema_id]
WHERE [s].[name] = 'dbo' AND [t].[name] = 'Usuarios' AND [c].[name] = 'PodeIncluir';
IF @constraintName IS NOT NULL EXEC('ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT [' + @constraintName + ']');

SET @constraintName = NULL;
SELECT @constraintName = [dc].[name]
FROM [sys].[default_constraints] [dc]
JOIN [sys].[columns] [c] ON [c].[default_object_id] = [dc].[object_id]
JOIN [sys].[tables] [t] ON [t].[object_id] = [c].[object_id]
JOIN [sys].[schemas] [s] ON [s].[schema_id] = [t].[schema_id]
WHERE [s].[name] = 'dbo' AND [t].[name] = 'Usuarios' AND [c].[name] = 'PodeAlterar';
IF @constraintName IS NOT NULL EXEC('ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT [' + @constraintName + ']');

SET @constraintName = NULL;
SELECT @constraintName = [dc].[name]
FROM [sys].[default_constraints] [dc]
JOIN [sys].[columns] [c] ON [c].[default_object_id] = [dc].[object_id]
JOIN [sys].[tables] [t] ON [t].[object_id] = [c].[object_id]
JOIN [sys].[schemas] [s] ON [s].[schema_id] = [t].[schema_id]
WHERE [s].[name] = 'dbo' AND [t].[name] = 'Usuarios' AND [c].[name] = 'PodeExcluir';
IF @constraintName IS NOT NULL EXEC('ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT [' + @constraintName + ']');

ALTER TABLE [dbo].[Usuarios] DROP COLUMN [PodeVisualizar], [PodeIncluir], [PodeAlterar], [PodeExcluir];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
