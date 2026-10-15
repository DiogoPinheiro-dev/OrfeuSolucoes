BEGIN TRY

BEGIN TRAN;

DECLARE @Motivo NVARCHAR(500) = N'Retirada do roteiro de Projetos em 08/10/2026.';
DECLARE @FuncionalidadesRetiradas TABLE ([Id] INT PRIMARY KEY);

INSERT INTO @FuncionalidadesRetiradas ([Id])
SELECT F.[Id]
FROM [dbo].[Funcionalidades] F
INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
WHERE S.[Slug] = N'projetos'
  AND F.[Slug] IN (N'templates-de-projeto', N'portfolio-de-projetos');

DECLARE @AntesAcoes TABLE ([Id] INT PRIMARY KEY, [Snapshot] NVARCHAR(MAX));
INSERT INTO @AntesAcoes ([Id], [Snapshot])
SELECT A.[Id], (
  SELECT
    A.[FuncionalidadeId] AS [funcionalidadeId], A.[Chave] AS [chave], A.[Nome] AS [nome],
    A.[Descricao] AS [descricao], A.[Ordem] AS [ordem], A.[Ativo] AS [ativo],
    A.[Configuracao] AS [configuracao], A.[ConsumerKey] AS [consumerKey],
    A.[ConsumerVersion] AS [consumerVersion]
  FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
)
FROM [dbo].[FuncionalidadeAcoes] A
INNER JOIN @FuncionalidadesRetiradas R ON R.[Id] = A.[FuncionalidadeId]
WHERE A.[Ativo] <> 0 OR A.[StatusPublicacao] <> N'DESPUBLICADA';

DELETE GPA
FROM [dbo].[GrupoFuncionalidadeAcoes] GPA
INNER JOIN [dbo].[FuncionalidadeAcoes] A ON A.[Id] = GPA.[FuncionalidadeAcaoId]
INNER JOIN @FuncionalidadesRetiradas R ON R.[Id] = A.[FuncionalidadeId];

UPDATE A
SET A.[Ativo] = 0,
    A.[StatusPublicacao] = N'DESPUBLICADA',
    A.[RevisaoCatalogo] = A.[RevisaoCatalogo] + 1
FROM [dbo].[FuncionalidadeAcoes] A
INNER JOIN @AntesAcoes B ON B.[Id] = A.[Id];

INSERT INTO [dbo].[CatalogoAuditorias] ([Entidade], [EntidadeId], [Evento], [Antes], [Depois], [Motivo])
SELECT N'ACAO', A.[Id], N'DESPUBLICADA', B.[Snapshot], (
  SELECT
    A.[FuncionalidadeId] AS [funcionalidadeId], A.[Chave] AS [chave], A.[Nome] AS [nome],
    A.[Descricao] AS [descricao], A.[Ordem] AS [ordem], A.[Ativo] AS [ativo],
    A.[Configuracao] AS [configuracao], A.[ConsumerKey] AS [consumerKey],
    A.[ConsumerVersion] AS [consumerVersion]
  FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
), @Motivo
FROM @AntesAcoes B
INNER JOIN [dbo].[FuncionalidadeAcoes] A ON A.[Id] = B.[Id];

DECLARE @AntesFuncionalidades TABLE ([Id] INT PRIMARY KEY, [Snapshot] NVARCHAR(MAX));
INSERT INTO @AntesFuncionalidades ([Id], [Snapshot])
SELECT F.[Id], (
  SELECT
    F.[SolucaoId] AS [solucaoId], F.[Slug] AS [slug], F.[Titulo] AS [titulo],
    F.[Label] AS [label], F.[Descricao] AS [descricao], F.[Ordem] AS [ordem],
    F.[Ativo] AS [ativo], F.[RegistryKey] AS [registryKey], F.[ProviderKey] AS [providerKey],
    F.[ProviderVersion] AS [providerVersion], F.[SomenteAdminSistema] AS [somenteAdminSistema]
  FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
)
FROM [dbo].[Funcionalidades] F
INNER JOIN @FuncionalidadesRetiradas R ON R.[Id] = F.[Id]
WHERE F.[Ativo] <> 0 OR F.[StatusPublicacao] <> N'DESPUBLICADA';

DELETE GF
FROM [dbo].[GrupoFuncionalidades] GF
INNER JOIN @FuncionalidadesRetiradas R ON R.[Id] = GF.[FuncionalidadeId];

DELETE EF
FROM [dbo].[EmpresaFuncionalidades] EF
INNER JOIN @FuncionalidadesRetiradas R ON R.[Id] = EF.[FuncionalidadeId];

UPDATE F
SET F.[Ativo] = 0,
    F.[StatusPublicacao] = N'DESPUBLICADA',
    F.[RevisaoCatalogo] = F.[RevisaoCatalogo] + 1
FROM [dbo].[Funcionalidades] F
INNER JOIN @AntesFuncionalidades B ON B.[Id] = F.[Id];

INSERT INTO [dbo].[CatalogoAuditorias] ([Entidade], [EntidadeId], [Evento], [Antes], [Depois], [Motivo])
SELECT N'FUNCIONALIDADE', F.[Id], N'DESPUBLICADA', B.[Snapshot], (
  SELECT
    F.[SolucaoId] AS [solucaoId], F.[Slug] AS [slug], F.[Titulo] AS [titulo],
    F.[Label] AS [label], F.[Descricao] AS [descricao], F.[Ordem] AS [ordem],
    F.[Ativo] AS [ativo], F.[RegistryKey] AS [registryKey], F.[ProviderKey] AS [providerKey],
    F.[ProviderVersion] AS [providerVersion], F.[SomenteAdminSistema] AS [somenteAdminSistema]
  FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
), @Motivo
FROM @AntesFuncionalidades B
INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = B.[Id];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
  ROLLBACK TRAN;
END;
THROW

END CATCH
