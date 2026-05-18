BEGIN TRY

BEGIN TRAN;

DECLARE @configuradorId INT = (SELECT [Id] FROM [dbo].[Solucoes] WHERE [Slug] = 'configurador');

IF @configuradorId IS NOT NULL
AND NOT EXISTS (
  SELECT 1
  FROM [dbo].[Funcionalidades]
  WHERE [SolucaoId] = @configuradorId AND [Slug] = 'cadastro-de-funcionalidades'
)
BEGIN
  INSERT INTO [dbo].[Funcionalidades] (
    [SolucaoId],
    [Slug],
    [Titulo],
    [Label],
    [Descricao],
    [Ordem],
    [Ativo],
    [RegistryKey],
    [SomenteAdminSistema]
  )
  VALUES (
    @configuradorId,
    'cadastro-de-funcionalidades',
    'Cadastro de funcionalidades',
    'Funcionalidades',
    'Crie e mantenha rotas de funcionalidades vinculadas as solucoes do sistema.',
    40,
    1,
    'configurador.cadastro-de-funcionalidades',
    1
  );
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
