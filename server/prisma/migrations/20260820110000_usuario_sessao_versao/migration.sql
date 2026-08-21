IF COL_LENGTH('Usuarios', 'SessaoVersao') IS NULL
BEGIN
  ALTER TABLE [Usuarios]
    ADD [SessaoVersao] INT NOT NULL
      CONSTRAINT [DF_Usuarios_SessaoVersao] DEFAULT 0;
END;

IF EXISTS (
  SELECT 1
  FROM [Usuarios]
  WHERE [Login] LIKE N'%@%' OR LEN([Login]) > 100
)
  THROW 51000, 'Existem logins invalidos, com @ ou mais de 100 caracteres. Corrija-os antes da migration.', 1;

IF EXISTS (
  SELECT [Login]
  FROM [Usuarios]
  WHERE [Login] IS NOT NULL
  GROUP BY [Login]
  HAVING COUNT(*) > 1
)
  THROW 51000, 'Existem logins duplicados. Corrija-os antes de aplicar o indice unico.', 1;

ALTER TABLE [Usuarios]
  ALTER COLUMN [Login] NVARCHAR(100) NULL;

IF NOT EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE [name] = N'CK_Usuarios_Login_SemArroba'
    AND [parent_object_id] = OBJECT_ID(N'[dbo].[Usuarios]')
)
BEGIN
  ALTER TABLE [Usuarios] WITH CHECK
    ADD CONSTRAINT [CK_Usuarios_Login_SemArroba]
      CHECK ([Login] IS NULL OR [Login] NOT LIKE N'%@%');
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE [name] = N'UX_Usuarios_Login'
    AND [object_id] = OBJECT_ID(N'[dbo].[Usuarios]')
)
BEGIN
  CREATE UNIQUE NONCLUSTERED INDEX [UX_Usuarios_Login]
    ON [Usuarios] ([Login])
    WHERE [Login] IS NOT NULL;
END;
