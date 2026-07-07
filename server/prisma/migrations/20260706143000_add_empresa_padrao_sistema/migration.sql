IF COL_LENGTH('Empresas', 'PadraoSistema') IS NULL
BEGIN
  ALTER TABLE [Empresas] ADD [PadraoSistema] BIT NOT NULL CONSTRAINT [DF_Empresas_PadraoSistema] DEFAULT 0;
END;

IF EXISTS (SELECT 1 FROM [Empresas] WHERE [Nome] = N'Empresa Teste')
BEGIN
  EXEC(N'
    UPDATE [Empresas]
    SET [PadraoSistema] = CASE WHEN [Id] = (
      SELECT TOP 1 [Id]
      FROM [Empresas]
      WHERE [Nome] = N''Empresa Teste''
      ORDER BY [Id]
    ) THEN 1 ELSE [PadraoSistema] END;
  ');
END;