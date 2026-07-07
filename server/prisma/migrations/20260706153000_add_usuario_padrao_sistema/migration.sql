IF COL_LENGTH('Usuarios', 'PadraoSistema') IS NULL
BEGIN
  ALTER TABLE [Usuarios] ADD [PadraoSistema] BIT NOT NULL CONSTRAINT [DF_Usuarios_PadraoSistema] DEFAULT 0;
END;

IF EXISTS (SELECT 1 FROM [Usuarios] WHERE [Login] = N'admin' AND [Email] = N'admin@admin.com')
BEGIN
  EXEC(N'
    UPDATE [Usuarios]
    SET [PadraoSistema] = CASE
      WHEN [Id] = (
        SELECT TOP 1 [Id]
        FROM [Usuarios]
        WHERE [Login] = N''admin'' AND [Email] = N''admin@admin.com''
        ORDER BY [Id]
      ) THEN 1
      ELSE [PadraoSistema]
    END;
  ');
END;