IF COL_LENGTH('GruposUsuarios', 'PadraoSistema') IS NULL
BEGIN
  ALTER TABLE [GruposUsuarios] ADD [PadraoSistema] BIT NOT NULL CONSTRAINT [DF_GruposUsuarios_PadraoSistema] DEFAULT 0;
END;

IF EXISTS (SELECT 1 FROM [GruposUsuarios] WHERE [Nome] = N'Administradores')
BEGIN
  EXEC(N'
    UPDATE [GruposUsuarios]
    SET [PadraoSistema] = CASE WHEN [Id] = (
      SELECT TOP 1 [Id]
      FROM [GruposUsuarios]
      WHERE [Nome] = N''Administradores''
      ORDER BY [Id]
    ) THEN 1 ELSE [PadraoSistema] END;
  ');
END;