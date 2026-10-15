BEGIN TRY

BEGIN TRAN;

DECLARE @MotivoHorasProjeto NVARCHAR(500) = N'Controle de horas incorporado ao Gerenciador de Projetos.';
DECLARE @HorasProjetoId INT = (
  SELECT F.[Id]
  FROM [dbo].[Funcionalidades] F
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND F.[Slug] = N'horas-do-projeto'
);

IF @HorasProjetoId IS NOT NULL
BEGIN
  -- O acesso inicial às telas de horas fica restrito a administradores do sistema e grupos EPHC completos.
  DELETE GPA
  FROM [dbo].[GrupoFuncionalidadeAcoes] GPA
  INNER JOIN [dbo].[FuncionalidadeAcoes] A ON A.[Id] = GPA.[FuncionalidadeAcaoId]
  INNER JOIN [dbo].[GruposUsuarios] G ON G.[Id] = GPA.[GrupoId]
  WHERE A.[FuncionalidadeId] = @HorasProjetoId
    AND NOT (
      G.[AcessoEcommerce] = 1 AND G.[AcessoProjetos] = 1
      AND G.[AcessoHoras] = 1 AND G.[AcessoConfigurador] = 1
    );

  DELETE GF
  FROM [dbo].[GrupoFuncionalidades] GF
  INNER JOIN [dbo].[GruposUsuarios] G ON G.[Id] = GF.[GrupoId]
  WHERE GF.[FuncionalidadeId] = @HorasProjetoId
    AND NOT (
      G.[AcessoEcommerce] = 1 AND G.[AcessoProjetos] = 1
      AND G.[AcessoHoras] = 1 AND G.[AcessoConfigurador] = 1
    );

  DECLARE @AntesApontar TABLE ([Id] INT PRIMARY KEY, [Snapshot] NVARCHAR(MAX));
  INSERT INTO @AntesApontar ([Id], [Snapshot])
  SELECT A.[Id], (
    SELECT
      A.[FuncionalidadeId] AS [funcionalidadeId], A.[Chave] AS [chave], A.[Nome] AS [nome],
      A.[Descricao] AS [descricao], A.[Ordem] AS [ordem], A.[Ativo] AS [ativo],
      A.[Configuracao] AS [configuracao], A.[ConsumerKey] AS [consumerKey],
      A.[ConsumerVersion] AS [consumerVersion]
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
  )
  FROM [dbo].[FuncionalidadeAcoes] A
  WHERE A.[FuncionalidadeId] = @HorasProjetoId
    AND A.[Chave] = N'apontar'
    AND A.[StatusPublicacao] <> N'DESPUBLICADA';

  DELETE GPA
  FROM [dbo].[GrupoFuncionalidadeAcoes] GPA
  INNER JOIN @AntesApontar B ON B.[Id] = GPA.[FuncionalidadeAcaoId];

  UPDATE A
  SET A.[StatusPublicacao] = N'DESPUBLICADA',
      A.[RevisaoCatalogo] = A.[RevisaoCatalogo] + 1
  FROM [dbo].[FuncionalidadeAcoes] A
  INNER JOIN @AntesApontar B ON B.[Id] = A.[Id];

  INSERT INTO [dbo].[CatalogoAuditorias] ([Entidade], [EntidadeId], [Evento], [Antes], [Depois], [Motivo])
  SELECT N'ACAO', A.[Id], N'DESPUBLICADA', B.[Snapshot], (
    SELECT
      A.[FuncionalidadeId] AS [funcionalidadeId], A.[Chave] AS [chave], A.[Nome] AS [nome],
      A.[Descricao] AS [descricao], A.[Ordem] AS [ordem], A.[Ativo] AS [ativo],
      A.[Configuracao] AS [configuracao], A.[ConsumerKey] AS [consumerKey],
      A.[ConsumerVersion] AS [consumerVersion]
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
  ), @MotivoHorasProjeto
  FROM @AntesApontar B
  INNER JOIN [dbo].[FuncionalidadeAcoes] A ON A.[Id] = B.[Id];
END;

DECLARE @HorasSolucaoId INT = (SELECT [Id] FROM [dbo].[Solucoes] WHERE [Slug] = N'horas');

IF @HorasSolucaoId IS NOT NULL
BEGIN
  DECLARE @AntesAcoesLegadas TABLE ([Id] INT PRIMARY KEY, [Snapshot] NVARCHAR(MAX));
  INSERT INTO @AntesAcoesLegadas ([Id], [Snapshot])
  SELECT A.[Id], (
    SELECT
      A.[FuncionalidadeId] AS [funcionalidadeId], A.[Chave] AS [chave], A.[Nome] AS [nome],
      A.[Descricao] AS [descricao], A.[Ordem] AS [ordem], A.[Ativo] AS [ativo],
      A.[Configuracao] AS [configuracao], A.[ConsumerKey] AS [consumerKey],
      A.[ConsumerVersion] AS [consumerVersion]
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
  )
  FROM [dbo].[FuncionalidadeAcoes] A
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = A.[FuncionalidadeId]
  WHERE F.[SolucaoId] = @HorasSolucaoId
    AND (A.[Ativo] <> 0 OR A.[StatusPublicacao] <> N'DESPUBLICADA');

  DELETE GPA
  FROM [dbo].[GrupoFuncionalidadeAcoes] GPA
  INNER JOIN [dbo].[FuncionalidadeAcoes] A ON A.[Id] = GPA.[FuncionalidadeAcaoId]
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = A.[FuncionalidadeId]
  WHERE F.[SolucaoId] = @HorasSolucaoId;

  UPDATE A
  SET A.[Ativo] = 0,
      A.[StatusPublicacao] = N'DESPUBLICADA',
      A.[RevisaoCatalogo] = A.[RevisaoCatalogo] + 1
  FROM [dbo].[FuncionalidadeAcoes] A
  INNER JOIN @AntesAcoesLegadas B ON B.[Id] = A.[Id];

  INSERT INTO [dbo].[CatalogoAuditorias] ([Entidade], [EntidadeId], [Evento], [Antes], [Depois], [Motivo])
  SELECT N'ACAO', A.[Id], N'DESPUBLICADA', B.[Snapshot], (
    SELECT
      A.[FuncionalidadeId] AS [funcionalidadeId], A.[Chave] AS [chave], A.[Nome] AS [nome],
      A.[Descricao] AS [descricao], A.[Ordem] AS [ordem], A.[Ativo] AS [ativo],
      A.[Configuracao] AS [configuracao], A.[ConsumerKey] AS [consumerKey],
      A.[ConsumerVersion] AS [consumerVersion]
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
  ), @MotivoHorasProjeto
  FROM @AntesAcoesLegadas B
  INNER JOIN [dbo].[FuncionalidadeAcoes] A ON A.[Id] = B.[Id];

  DECLARE @AntesFuncionalidadesLegadas TABLE ([Id] INT PRIMARY KEY, [Snapshot] NVARCHAR(MAX));
  INSERT INTO @AntesFuncionalidadesLegadas ([Id], [Snapshot])
  SELECT F.[Id], (
    SELECT
      F.[SolucaoId] AS [solucaoId], F.[Slug] AS [slug], F.[Titulo] AS [titulo],
      F.[Label] AS [label], F.[Descricao] AS [descricao], F.[Ordem] AS [ordem],
      F.[Ativo] AS [ativo], F.[RegistryKey] AS [registryKey], F.[ProviderKey] AS [providerKey],
      F.[ProviderVersion] AS [providerVersion], F.[SomenteAdminSistema] AS [somenteAdminSistema]
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
  )
  FROM [dbo].[Funcionalidades] F
  WHERE F.[SolucaoId] = @HorasSolucaoId
    AND (F.[Ativo] <> 0 OR F.[StatusPublicacao] <> N'DESPUBLICADA');

  DELETE GF
  FROM [dbo].[GrupoFuncionalidades] GF
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = GF.[FuncionalidadeId]
  WHERE F.[SolucaoId] = @HorasSolucaoId;

  DELETE EF
  FROM [dbo].[EmpresaFuncionalidades] EF
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = EF.[FuncionalidadeId]
  WHERE F.[SolucaoId] = @HorasSolucaoId;

  UPDATE F
  SET F.[Ativo] = 0,
      F.[StatusPublicacao] = N'DESPUBLICADA',
      F.[RevisaoCatalogo] = F.[RevisaoCatalogo] + 1
  FROM [dbo].[Funcionalidades] F
  INNER JOIN @AntesFuncionalidadesLegadas B ON B.[Id] = F.[Id];

  INSERT INTO [dbo].[CatalogoAuditorias] ([Entidade], [EntidadeId], [Evento], [Antes], [Depois], [Motivo])
  SELECT N'FUNCIONALIDADE', F.[Id], N'DESPUBLICADA', B.[Snapshot], (
    SELECT
      F.[SolucaoId] AS [solucaoId], F.[Slug] AS [slug], F.[Titulo] AS [titulo],
      F.[Label] AS [label], F.[Descricao] AS [descricao], F.[Ordem] AS [ordem],
      F.[Ativo] AS [ativo], F.[RegistryKey] AS [registryKey], F.[ProviderKey] AS [providerKey],
      F.[ProviderVersion] AS [providerVersion], F.[SomenteAdminSistema] AS [somenteAdminSistema]
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
  ), @MotivoHorasProjeto
  FROM @AntesFuncionalidadesLegadas B
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = B.[Id];

  DECLARE @AntesSolucaoHoras NVARCHAR(MAX) = (
    SELECT
      S.[Slug] AS [slug], S.[Nome] AS [nome], S.[Descricao] AS [descricao],
      S.[Eyebrow] AS [eyebrow], S.[Ordem] AS [ordem], S.[Ativo] AS [ativo],
      S.[ExibirNoHub] AS [exibirNoHub], S.[SomenteAdminSistema] AS [somenteAdminSistema]
    FROM [dbo].[Solucoes] S
    WHERE S.[Id] = @HorasSolucaoId
      AND (S.[Ativo] <> 0 OR S.[ExibirNoHub] <> 0 OR S.[StatusPublicacao] <> N'DESPUBLICADA')
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
  );

  IF @AntesSolucaoHoras IS NOT NULL
  BEGIN
    UPDATE [dbo].[Solucoes]
    SET [Ativo] = 0,
        [ExibirNoHub] = 0,
        [StatusPublicacao] = N'DESPUBLICADA',
        [RevisaoCatalogo] = [RevisaoCatalogo] + 1
    WHERE [Id] = @HorasSolucaoId;

    INSERT INTO [dbo].[CatalogoAuditorias] ([Entidade], [EntidadeId], [Evento], [Antes], [Depois], [Motivo])
    SELECT N'SOLUCAO', S.[Id], N'DESPUBLICADA', @AntesSolucaoHoras, (
      SELECT
        S.[Slug] AS [slug], S.[Nome] AS [nome], S.[Descricao] AS [descricao],
        S.[Eyebrow] AS [eyebrow], S.[Ordem] AS [ordem], S.[Ativo] AS [ativo],
        S.[ExibirNoHub] AS [exibirNoHub], S.[SomenteAdminSistema] AS [somenteAdminSistema]
      FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
    ), @MotivoHorasProjeto
    FROM [dbo].[Solucoes] S
    WHERE S.[Id] = @HorasSolucaoId;
  END;

  DELETE FROM [dbo].[GrupoSolucoes] WHERE [SolucaoId] = @HorasSolucaoId;
  DELETE FROM [dbo].[EmpresaSolucoes] WHERE [SolucaoId] = @HorasSolucaoId;
END;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
  ROLLBACK TRAN;
END;
THROW

END CATCH
