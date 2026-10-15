-- Ações criadas pelas migrations anteriores à fundação do catálogo (agosto de 2026) ficaram sem consumidor.
-- A autorização usa a chave da ação; o consumidor passa a ser a configuração ou a própria chave, como a
-- aplicação faz ao criar uma ação. Num banco instalado pela base consolidada, nenhuma linha é afetada.
BEGIN TRY
  BEGIN TRANSACTION;

  DECLARE @Antes TABLE ([Id] INT PRIMARY KEY, [Snapshot] NVARCHAR(MAX));

  INSERT INTO @Antes ([Id], [Snapshot])
  SELECT A.[Id], (
    SELECT
      A.[FuncionalidadeId] AS [funcionalidadeId], A.[Chave] AS [chave], A.[Nome] AS [nome],
      A.[Descricao] AS [descricao], A.[Ordem] AS [ordem], A.[Ativo] AS [ativo],
      A.[Configuracao] AS [configuracao], A.[ConsumerKey] AS [consumerKey],
      A.[ConsumerVersion] AS [consumerVersion]
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
  )
  FROM [dbo].[FuncionalidadeAcoes] A
  WHERE A.[ConsumerKey] IS NULL;

  UPDATE A
  SET A.[ConsumerKey] = COALESCE(NULLIF(LTRIM(RTRIM(A.[Configuracao])), N''), A.[Chave]),
      A.[ConsumerVersion] = COALESCE(A.[ConsumerVersion], 1),
      A.[RevisaoCatalogo] = A.[RevisaoCatalogo] + 1
  FROM [dbo].[FuncionalidadeAcoes] A
  INNER JOIN @Antes B ON B.[Id] = A.[Id];

  INSERT INTO [dbo].[CatalogoAuditorias] ([Entidade], [EntidadeId], [Evento], [Antes], [Depois], [Motivo], [CriadoEm])
  SELECT N'ACAO', A.[Id], N'CORRECAO_LEGADO', B.[Snapshot], (
    SELECT
      A.[FuncionalidadeId] AS [funcionalidadeId], A.[Chave] AS [chave], A.[Nome] AS [nome],
      A.[Descricao] AS [descricao], A.[Ordem] AS [ordem], A.[Ativo] AS [ativo],
      A.[Configuracao] AS [configuracao], A.[ConsumerKey] AS [consumerKey],
      A.[ConsumerVersion] AS [consumerVersion]
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
  ), N'Consumidor da acao preenchido com a chave: acao criada antes da fundacao do catalogo.', SYSUTCDATETIME()
  FROM @Antes B
  INNER JOIN [dbo].[FuncionalidadeAcoes] A ON A.[Id] = B.[Id];

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
