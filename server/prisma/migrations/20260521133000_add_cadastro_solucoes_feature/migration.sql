BEGIN TRY

BEGIN TRAN;

DECLARE @configuradorId INT = (SELECT [Id] FROM [dbo].[Solucoes] WHERE [Slug] = 'configurador');
DECLARE @funcionalidadeId INT;

IF @configuradorId IS NOT NULL
AND NOT EXISTS (
  SELECT 1
  FROM [dbo].[Funcionalidades]
  WHERE [SolucaoId] = @configuradorId AND [Slug] = 'cadastro-de-solucoes'
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
    'cadastro-de-solucoes',
    'Cadastro de solucoes',
    'Solucoes',
    'Crie e mantenha as solucoes exibidas no hub do sistema.',
    35,
    1,
    'configurador.cadastro-de-solucoes',
    1
  );
END

SET @funcionalidadeId = (
  SELECT [Id]
  FROM [dbo].[Funcionalidades]
  WHERE [SolucaoId] = @configuradorId AND [Slug] = 'cadastro-de-solucoes'
);

IF @funcionalidadeId IS NOT NULL
BEGIN
  INSERT INTO [dbo].[FuncionalidadeAcoes] ([FuncionalidadeId], [Chave], [Nome], [Ordem], [Ativo], [AcaoPadrao])
  SELECT @funcionalidadeId, [Chave], [Nome], [Ordem], 1, 1
  FROM (
    VALUES
      ('visualizar', 'Visualizar', 10),
      ('incluir', 'Incluir', 20),
      ('alterar', 'Alterar', 30),
      ('excluir', 'Excluir', 40)
  ) AS [Acoes]([Chave], [Nome], [Ordem])
  WHERE NOT EXISTS (
    SELECT 1
    FROM [dbo].[FuncionalidadeAcoes] [fa]
    WHERE [fa].[FuncionalidadeId] = @funcionalidadeId
      AND [fa].[Chave] = [Acoes].[Chave]
  );

  INSERT INTO [dbo].[GrupoFuncionalidades] (
    [GrupoId],
    [FuncionalidadeId],
    [PodeVisualizar],
    [PodeIncluir],
    [PodeAlterar],
    [PodeExcluir]
  )
  SELECT
    [gs].[GrupoId],
    @funcionalidadeId,
    ISNULL([g].[PodeVisualizar], 1),
    ISNULL([g].[PodeIncluir], 0),
    ISNULL([g].[PodeAlterar], 0),
    ISNULL([g].[PodeExcluir], 0)
  FROM [dbo].[GrupoSolucoes] [gs]
  JOIN [dbo].[GruposUsuarios] [g] ON [g].[Id] = [gs].[GrupoId]
  WHERE [gs].[SolucaoId] = @configuradorId
    AND NOT EXISTS (
      SELECT 1
      FROM [dbo].[GrupoFuncionalidades] [gf]
      WHERE [gf].[GrupoId] = [gs].[GrupoId]
        AND [gf].[FuncionalidadeId] = @funcionalidadeId
    );

  INSERT INTO [dbo].[EmpresaFuncionalidades] ([EmpresaId], [FuncionalidadeId])
  SELECT
    [es].[EmpresaId],
    @funcionalidadeId
  FROM [dbo].[EmpresaSolucoes] [es]
  WHERE [es].[SolucaoId] = @configuradorId
    AND NOT EXISTS (
      SELECT 1
      FROM [dbo].[EmpresaFuncionalidades] [ef]
      WHERE [ef].[EmpresaId] = [es].[EmpresaId]
        AND [ef].[FuncionalidadeId] = @funcionalidadeId
    );

  INSERT INTO [dbo].[GrupoFuncionalidadeAcoes] ([GrupoId], [FuncionalidadeAcaoId], [Permitido])
  SELECT
    [gf].[GrupoId],
    [fa].[Id],
    CASE [fa].[Chave]
      WHEN 'visualizar' THEN [gf].[PodeVisualizar]
      WHEN 'incluir' THEN [gf].[PodeIncluir]
      WHEN 'alterar' THEN [gf].[PodeAlterar]
      WHEN 'excluir' THEN [gf].[PodeExcluir]
      ELSE 0
    END
  FROM [dbo].[GrupoFuncionalidades] [gf]
  JOIN [dbo].[FuncionalidadeAcoes] [fa] ON [fa].[FuncionalidadeId] = [gf].[FuncionalidadeId]
  WHERE [gf].[FuncionalidadeId] = @funcionalidadeId
    AND NOT EXISTS (
      SELECT 1
      FROM [dbo].[GrupoFuncionalidadeAcoes] [gfa]
      WHERE [gfa].[GrupoId] = [gf].[GrupoId]
        AND [gfa].[FuncionalidadeAcaoId] = [fa].[Id]
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
