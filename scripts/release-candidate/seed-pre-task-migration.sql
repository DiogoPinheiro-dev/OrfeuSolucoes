SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;

DECLARE @UsuarioId UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000001';
DECLARE @ProjetoId UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000001';
DECLARE @RecursoId UNIQUEIDENTIFIER = '30000000-0000-0000-0000-000000000001';
DECLARE @ProjetoRecursoId UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000001';
DECLARE @TarefaId UNIQUEIDENTIFIER = '50000000-0000-0000-0000-000000000001';
DECLARE @OrcamentoId UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000001';
DECLARE @CustoId UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000001';
DECLARE @EquipeId UNIQUEIDENTIFIER = '80000000-0000-0000-0000-000000000001';
DECLARE @ProjetoEquipeId UNIQUEIDENTIFIER = '90000000-0000-0000-0000-000000000001';
DECLARE @EmpresaId INT;
DECLARE @GrupoComumId INT;
DECLARE @ProjetosSolucaoId INT;
DECLARE @HorasProjetoId INT;
DECLARE @TemplatesId INT;
DECLARE @PortfolioId INT;
DECLARE @ApontarId INT;
DECLARE @HorasLegadoSolucaoId INT;
DECLARE @HorasLegadoRegistroId INT;

INSERT INTO [dbo].[Empresas] ([Nome], [AcessoProjetos]) VALUES (N'Empresa RC', 1);
SET @EmpresaId = SCOPE_IDENTITY();

INSERT INTO [dbo].[Usuarios] ([Id], [Nome], [Login], [Email], [Senha])
VALUES (@UsuarioId, N'Usuário RC', N'usuario.rc', N'usuario.rc@orfeu.test', N'hash-nao-utilizado');

INSERT INTO [dbo].[EmpresaUsuarios] ([EmpresaId], [UsuarioId]) VALUES (@EmpresaId, @UsuarioId);

INSERT INTO [dbo].[Projetos] (
  [Id], [EmpresaId], [Chave], [Nome], [Metodologia], [Situacao], [Saude],
  [ResponsavelId], [CriadoPorId], [AtualizadoEm]
) VALUES (
  @ProjetoId, @EmpresaId, N'RC', N'Projeto de ensaio do RC', N'KANBAN', N'RASCUNHO', N'EM_DIA',
  @UsuarioId, @UsuarioId, SYSUTCDATETIME()
);

INSERT INTO [dbo].[Recursos] ([Id], [EmpresaId], [UsuarioId], [AtualizadoEm])
VALUES (@RecursoId, @EmpresaId, @UsuarioId, SYSUTCDATETIME());

INSERT INTO [dbo].[ProjetoRecursos] ([Id], [EmpresaId], [ProjetoId], [RecursoId], [AtualizadoEm])
VALUES (@ProjetoRecursoId, @EmpresaId, @ProjetoId, @RecursoId, SYSUTCDATETIME());

INSERT INTO [dbo].[Equipes] ([Id], [EmpresaId], [Nome])
VALUES (@EquipeId, @EmpresaId, N'Equipe RC');

INSERT INTO [dbo].[EquipeRecursos] ([EmpresaId], [EquipeId], [RecursoId])
VALUES (@EmpresaId, @EquipeId, @RecursoId);

INSERT INTO [dbo].[ProjetoEquipes] ([Id], [EmpresaId], [ProjetoId], [EquipeId])
VALUES (@ProjetoEquipeId, @EmpresaId, @ProjetoId, @EquipeId);

INSERT INTO [dbo].[ProjetoTarefas] (
  [Id], [EmpresaId], [Funcionalidade], [ValorHora], [Moeda],
  [EstimativaMinutos], [AtualizadoEm]
) VALUES (
  @TarefaId, @EmpresaId, N'Implementar fluxo legado', 150.0000, N'BRL',
  480, SYSUTCDATETIME()
);

INSERT INTO [dbo].[ProjetoTarefaRecursos] ([Id], [EmpresaId], [TarefaId], [RecursoId])
VALUES (NEWID(), @EmpresaId, @TarefaId, @RecursoId);

INSERT INTO [dbo].[ProjetoOrcamentos] ([Id], [EmpresaId], [ProjetoId], [AtualizadoEm])
VALUES (@OrcamentoId, @EmpresaId, @ProjetoId, SYSUTCDATETIME());

INSERT INTO [dbo].[ProjetoCustos] (
  [Id], [EmpresaId], [ProjetoId], [OrcamentoId], [Tipo], [Descricao], [RecursoId],
  [QuantidadeMinutos], [TaxaHora], [ValorPlanejado], [CriadoPorId], [TarefaId], [AtualizadoEm]
) VALUES (
  @CustoId, @EmpresaId, @ProjetoId, @OrcamentoId, N'MAO_DE_OBRA', N'Custo legado do RC',
  @ProjetoRecursoId, 480, 150.0000, 1200.00, @UsuarioId, @TarefaId, SYSUTCDATETIME()
);

INSERT INTO [dbo].[Solucoes] ([Slug], [Nome], [Descricao], [Eyebrow], [Ordem], [Ativo], [ExibirNoHub])
VALUES (N'custom-rc', N'Customização RC', N'Deve sobreviver ao bootstrap.', N'RC', 777, 1, 1);

-- Catálogo anterior à 17.5: telas ainda indisponíveis, itens retirados presentes e solução Horas legada.
INSERT INTO [dbo].[GruposUsuarios] (
  [Nome], [Descricao], [AcessoEcommerce], [AcessoProjetos], [AcessoHoras], [AcessoConfigurador],
  [PodeVisualizar], [PodeIncluir], [PodeAlterar], [PodeExcluir]
) VALUES (
  N'Operação RC', N'Grupo comum que não pode herdar as telas de horas.', 0, 1, 1, 0, 1, 1, 1, 0
);
SET @GrupoComumId = SCOPE_IDENTITY();

-- O corte de agosto já contém as soluções padrão e o catálogo legado de Horas. As três
-- funcionalidades de Projetos abaixo representam o estado introduzido depois desse corte e
-- imediatamente anterior à consolidação feita pela 17.5.
SELECT @ProjetosSolucaoId = [Id] FROM [dbo].[Solucoes] WHERE [Slug] = N'projetos';
SELECT @HorasLegadoSolucaoId = [Id] FROM [dbo].[Solucoes] WHERE [Slug] = N'horas';

IF @ProjetosSolucaoId IS NULL OR @HorasLegadoSolucaoId IS NULL
  THROW 51000, 'As soluções padrão esperadas não existem no corte anterior à 17.5.', 1;

INSERT INTO [dbo].[Funcionalidades] (
  [SolucaoId], [Slug], [Titulo], [Label], [Descricao], [Ordem], [Ativo], [RegistryKey],
  [SomenteAdminSistema], [PadraoSistema], [ProviderKey], [ProviderVersion]
) VALUES (
  @ProjetosSolucaoId, N'horas-do-projeto', N'Horas do projeto', N'Horas',
  N'Consulte apontamentos pertencentes ao Controle de Horas.', 110, 0,
  N'projetos.horas-do-projeto', 0, 1, N'projetos.horas-do-projeto', 1
);
SET @HorasProjetoId = SCOPE_IDENTITY();

INSERT INTO [dbo].[Funcionalidades] (
  [SolucaoId], [Slug], [Titulo], [Label], [Descricao], [Ordem], [Ativo], [RegistryKey],
  [SomenteAdminSistema], [PadraoSistema], [ProviderKey], [ProviderVersion]
) VALUES (
  @ProjetosSolucaoId, N'templates-de-projeto', N'Templates de projeto', N'Templates',
  N'Gerencie estruturas versionadas para novos projetos.', 120, 0,
  N'projetos.templates-de-projeto', 0, 1, N'projetos.templates-de-projeto', 1
);
SET @TemplatesId = SCOPE_IDENTITY();

INSERT INTO [dbo].[Funcionalidades] (
  [SolucaoId], [Slug], [Titulo], [Label], [Descricao], [Ordem], [Ativo], [RegistryKey],
  [SomenteAdminSistema], [PadraoSistema], [ProviderKey], [ProviderVersion]
) VALUES (
  @ProjetosSolucaoId, N'portfolio-de-projetos', N'Portfólio de projetos', N'Portfólio',
  N'Acompanhe indicadores agregados dos projetos acessíveis.', 130, 0,
  N'projetos.portfolio-de-projetos', 0, 1, N'projetos.portfolio-de-projetos', 1
);
SET @PortfolioId = SCOPE_IDENTITY();

INSERT INTO [dbo].[FuncionalidadeAcoes] (
  [FuncionalidadeId], [Chave], [Nome], [Descricao], [Ordem], [Ativo], [AcaoPadrao],
  [Configuracao], [ConsumerKey], [ConsumerVersion]
) VALUES
  (@HorasProjetoId, N'apontar', N'Apontar horas', N'Permite registrar esforço.', 50, 1, 0, N'apontar', N'apontar', 1),
  (@HorasProjetoId, N'aprovar_horas', N'Aprovar horas', N'Permite aprovar apontamentos.', 60, 1, 0, N'aprovar_horas', N'aprovar_horas', 1),
  (@HorasProjetoId, N'reabrir_horas', N'Reabrir horas', N'Permite reabrir apontamentos.', 70, 1, 0, N'reabrir_horas', N'reabrir_horas', 1);

SELECT @ApontarId = [Id]
FROM [dbo].[FuncionalidadeAcoes]
WHERE [FuncionalidadeId] = @HorasProjetoId AND [Chave] = N'apontar';

INSERT INTO [dbo].[FuncionalidadeAcoes] (
  [FuncionalidadeId], [Chave], [Nome], [Ordem], [Ativo], [AcaoPadrao], [Configuracao], [ConsumerKey], [ConsumerVersion]
) VALUES
  (@TemplatesId, N'publicar', N'Publicar template', 50, 1, 0, N'publicar', N'publicar', 1),
  (@TemplatesId, N'instanciar', N'Instanciar template', 60, 1, 0, N'instanciar', N'instanciar', 1),
  (@PortfolioId, N'visualizar_financeiro', N'Visualizar financeiro', 50, 1, 0, N'visualizar_financeiro', N'visualizar_financeiro', 1);

SELECT @HorasLegadoRegistroId = [Id]
FROM [dbo].[Funcionalidades]
WHERE [SolucaoId] = @HorasLegadoSolucaoId AND [Slug] = N'registro-de-horas';

IF @HorasProjetoId IS NULL OR @TemplatesId IS NULL OR @PortfolioId IS NULL
  OR @ApontarId IS NULL OR @HorasLegadoRegistroId IS NULL
  THROW 51000, 'O catálogo legado esperado não existe no corte anterior à 17.5.', 1;

INSERT INTO [dbo].[GrupoSolucoes] ([GrupoId], [SolucaoId])
VALUES (@GrupoComumId, @ProjetosSolucaoId), (@GrupoComumId, @HorasLegadoSolucaoId);
INSERT INTO [dbo].[EmpresaSolucoes] ([EmpresaId], [SolucaoId])
VALUES (@EmpresaId, @ProjetosSolucaoId), (@EmpresaId, @HorasLegadoSolucaoId);

INSERT INTO [dbo].[GrupoFuncionalidades] (
  [GrupoId], [FuncionalidadeId], [PodeVisualizar], [PodeIncluir], [PodeAlterar], [PodeExcluir]
) VALUES
  (@GrupoComumId, @HorasProjetoId, 1, 1, 1, 0),
  (@GrupoComumId, @TemplatesId, 1, 1, 1, 0),
  (@GrupoComumId, @PortfolioId, 1, 0, 0, 0),
  (@GrupoComumId, @HorasLegadoRegistroId, 1, 1, 1, 0);

INSERT INTO [dbo].[EmpresaFuncionalidades] ([EmpresaId], [FuncionalidadeId])
VALUES
  (@EmpresaId, @HorasProjetoId),
  (@EmpresaId, @TemplatesId),
  (@EmpresaId, @PortfolioId),
  (@EmpresaId, @HorasLegadoRegistroId);

INSERT INTO [dbo].[GrupoFuncionalidadeAcoes] ([GrupoId], [FuncionalidadeAcaoId], [Permitido])
VALUES (@GrupoComumId, @ApontarId, 1);

DECLARE @HorasProjetoSnapshot NVARCHAR(MAX) = (
  SELECT
    F.[SolucaoId] AS [solucaoId], F.[Slug] AS [slug], F.[Titulo] AS [titulo],
    F.[Label] AS [label], F.[Descricao] AS [descricao], F.[Ordem] AS [ordem],
    F.[Ativo] AS [ativo], F.[RegistryKey] AS [registryKey], F.[ProviderKey] AS [providerKey],
    F.[ProviderVersion] AS [providerVersion], F.[SomenteAdminSistema] AS [somenteAdminSistema]
  FROM [dbo].[Funcionalidades] F
  WHERE F.[Id] = @HorasProjetoId
  FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
);

INSERT INTO [dbo].[CatalogoVersoes] (
  [FuncionalidadeId], [Numero], [Estado], [Origem], [Snapshot], [BaselineSnapshot], [PublicadoEm]
) VALUES (
  @HorasProjetoId, 1, N'PUBLICADA', N'PRODUTO', @HorasProjetoSnapshot, @HorasProjetoSnapshot, GETDATE()
);

PRINT N'Seed anterior à migration destrutiva criado com sucesso.';
