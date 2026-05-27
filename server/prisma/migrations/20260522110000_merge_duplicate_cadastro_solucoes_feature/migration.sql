BEGIN TRY

BEGIN TRAN;

DECLARE @configuradorId INT = (SELECT [Id] FROM [dbo].[Solucoes] WHERE [Slug] = 'configurador');
DECLARE @targetId INT;
DECLARE @duplicateId INT;

IF @configuradorId IS NOT NULL
BEGIN
  SET @targetId = (
    SELECT [Id]
    FROM [dbo].[Funcionalidades]
    WHERE [SolucaoId] = @configuradorId
      AND [Slug] = 'cadastro-de-solucoes'
  );

  SET @duplicateId = (
    SELECT [Id]
    FROM [dbo].[Funcionalidades]
    WHERE [SolucaoId] = @configuradorId
      AND [Slug] = N'cadastro-de-soluções'
  );

  IF @duplicateId IS NOT NULL AND @targetId IS NULL
  BEGIN
    UPDATE [dbo].[Funcionalidades]
    SET
      [Slug] = 'cadastro-de-solucoes',
      [Titulo] = 'Cadastro de solucoes',
      [Label] = 'Solucoes',
      [RegistryKey] = 'configurador.cadastro-de-solucoes',
      [SomenteAdminSistema] = 1
    WHERE [Id] = @duplicateId;
  END

  IF @duplicateId IS NOT NULL AND @targetId IS NOT NULL
  BEGIN
    DELETE FROM [dbo].[Funcionalidades]
    WHERE [Id] = @duplicateId;
  END
END

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
