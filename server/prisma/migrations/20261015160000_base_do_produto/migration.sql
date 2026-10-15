-- Base consolidada gerada a partir do esquema SQL Server validado.

-- Nao editar manualmente: use server/scripts/base-consolidada/gerar-base.ps1.

SET XACT_ABORT ON;

BEGIN TRY

  BEGIN TRANSACTION;



  IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID(N'dbo') AND name <> N'_prisma_migrations')

    THROW 51000, 'Banco existente detectado. Execute npm run banco:transicao antes de aplicar a base consolidada.', 1;



SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[GruposUsuarios](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Nome] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[AcessoEcommerce] [bit] NOT NULL,
	[AcessoProjetos] [bit] NOT NULL,
	[AcessoHoras] [bit] NOT NULL,
	[AcessoConfigurador] [bit] NOT NULL,
	[PodeVisualizar] [bit] NOT NULL,
	[PodeIncluir] [bit] NOT NULL,
	[PodeAlterar] [bit] NOT NULL,
	[PodeExcluir] [bit] NOT NULL,
	[PadraoSistema] [bit] NOT NULL,
 CONSTRAINT [GruposUsuarios_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_GruposUsuarios_Nome] UNIQUE NONCLUSTERED 
(
	[Nome] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[Empresas](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Nome] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[AcessoEcommerce] [bit] NOT NULL,
	[AcessoProjetos] [bit] NOT NULL,
	[AcessoHoras] [bit] NOT NULL,
	[PadraoSistema] [bit] NOT NULL,
 CONSTRAINT [Empresas_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[Solucoes](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Slug] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Nome] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Eyebrow] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Ordem] [int] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[ExibirNoHub] [bit] NOT NULL,
	[SomenteAdminSistema] [bit] NOT NULL,
	[PadraoSistema] [bit] NOT NULL,
	[ChaveTecnica] [nvarchar](200) COLLATE Latin1_General_CI_AS NOT NULL,
	[VersaoDefinicao] [int] NOT NULL,
	[StatusPublicacao] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[RevisaoCatalogo] [int] NOT NULL,
	[PublicadoEm] [datetime2](7) NULL,
 CONSTRAINT [Solucoes_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_Solucoes_Slug] UNIQUE NONCLUSTERED 
(
	[Slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[Servicos](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Titulo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Valor] [decimal](18, 2) NULL,
	[Desconto] [decimal](18, 2) NULL,
	[Vendas] [int] NULL,
 CONSTRAINT [Servicos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[Usuarios](
	[Id] [uniqueidentifier] NOT NULL,
	[Nome] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Email] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Senha] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Login] [nvarchar](100) COLLATE Latin1_General_CI_AS NULL,
	[GrupoId] [int] NULL,
	[DeveAlterarSenha] [bit] NOT NULL,
	[PadraoSistema] [bit] NOT NULL,
	[SessaoVersao] [int] NOT NULL,
 CONSTRAINT [Usuarios_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_Usuarios_Email] UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[Capacitacoes](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[Nome] [nvarchar](120) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](500) COLLATE Latin1_General_CI_AS NULL,
	[NivelHierarquico] [int] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[Versao] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Capacitacoes] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoCategorias](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[Nome] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Ativo] [bit] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoCategorias_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ChamadoCategorias_EmpresaId_Nome] UNIQUE NONCLUSTERED 
(
	[EmpresaId] ASC,
	[Nome] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoSequencias](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProximoNumero] [int] NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoSequencias_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ChamadoSequencias_EmpresaId] UNIQUE NONCLUSTERED 
(
	[EmpresaId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[Equipes](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[Nome] [nvarchar](120) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](500) COLLATE Latin1_General_CI_AS NULL,
	[Ativo] [bit] NOT NULL,
	[Versao] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Equipes] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[EmpresaSolucoes](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[SolucaoId] [int] NOT NULL,
 CONSTRAINT [EmpresaSolucoes_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_EmpresaSolucoes_EmpresaId_SolucaoId] UNIQUE NONCLUSTERED 
(
	[EmpresaId] ASC,
	[SolucaoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoPrioridades](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[Nome] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Cor] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Ordem] [int] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoPrioridades_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoTipos](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[Nome] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Cor] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Ordem] [int] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoTipos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[FuncionalidadeAgrupamentos](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SolucaoId] [int] NOT NULL,
	[Slug] [nvarchar](200) COLLATE Latin1_General_CI_AS NOT NULL,
	[Titulo] [nvarchar](200) COLLATE Latin1_General_CI_AS NOT NULL,
	[Label] [nvarchar](200) COLLATE Latin1_General_CI_AS NULL,
	[Descricao] [nvarchar](500) COLLATE Latin1_General_CI_AS NULL,
	[Ordem] [int] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[PadraoSistema] [bit] NOT NULL,
	[ChaveTecnica] [nvarchar](200) COLLATE Latin1_General_CI_AS NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_FuncionalidadeAgrupamentos] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[GrupoSolucoes](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[GrupoId] [int] NOT NULL,
	[SolucaoId] [int] NOT NULL,
 CONSTRAINT [GrupoSolucoes_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_GrupoSolucoes_GrupoId_SolucaoId] UNIQUE NONCLUSTERED 
(
	[GrupoId] ASC,
	[SolucaoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[GoogleEmailContas](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[Nome] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Tipo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[EmailGoogle] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[RefreshTokenCriptografado] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[ConectadoEm] [datetime2](7) NULL,
	[CriadoPorId] [uniqueidentifier] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
	[Principal] [bit] NOT NULL,
 CONSTRAINT [GoogleEmailContas_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[Funcionalidades](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SolucaoId] [int] NOT NULL,
	[Slug] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Titulo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Label] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Ordem] [int] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[RegistryKey] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[SomenteAdminSistema] [bit] NOT NULL,
	[PadraoSistema] [bit] NOT NULL,
	[ChaveTecnica] [nvarchar](200) COLLATE Latin1_General_CI_AS NOT NULL,
	[ProviderKey] [nvarchar](200) COLLATE Latin1_General_CI_AS NULL,
	[ProviderVersion] [int] NULL,
	[VersaoDefinicao] [int] NOT NULL,
	[StatusPublicacao] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[RevisaoCatalogo] [int] NOT NULL,
	[PublicadoEm] [datetime2](7) NULL,
	[AgrupamentoId] [int] NULL,
	[OrdemNoAgrupamento] [int] NULL,
 CONSTRAINT [Funcionalidades_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_Funcionalidades_SolucaoId_Slug] UNIQUE NONCLUSTERED 
(
	[SolucaoId] ASC,
	[Slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[Projetos](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[Chave] [nvarchar](10) COLLATE Latin1_General_CI_AS NOT NULL,
	[Nome] [nvarchar](200) COLLATE Latin1_General_CI_AS NOT NULL,
	[Objetivo] [nvarchar](500) COLLATE Latin1_General_CI_AS NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Metodologia] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[Situacao] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[Saude] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[InicioPrevistoEm] [date] NULL,
	[FimPrevistoEm] [date] NULL,
	[InicioRealEm] [date] NULL,
	[FimRealEm] [date] NULL,
	[ResponsavelId] [uniqueidentifier] NOT NULL,
	[CriadoPorId] [uniqueidentifier] NOT NULL,
	[ArquivadoEm] [datetime2](7) NULL,
	[ArquivadoPorId] [uniqueidentifier] NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
	[BacklogVersao] [int] NOT NULL,
 CONSTRAINT [Projetos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoSlaRegras](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[PrioridadeId] [int] NOT NULL,
	[PrimeiraRespostaPrazoMinutos] [int] NOT NULL,
	[ResolucaoPrazoMinutos] [int] NOT NULL,
	[ModoContagem] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Ativo] [bit] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoSlaRegras_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ChamadoSlaRegras_EmpresaId_PrioridadeId] UNIQUE NONCLUSTERED 
(
	[EmpresaId] ASC,
	[PrioridadeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[EmpresaUsuarios](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[UsuarioId] [uniqueidentifier] NOT NULL,
 CONSTRAINT [EmpresaUsuarios_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoResponsaveis](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[UsuarioId] [uniqueidentifier] NULL,
	[Ativo] [bit] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
	[Tipo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[GrupoId] [int] NULL,
 CONSTRAINT [ChamadoResponsaveis_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[Recursos](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[UsuarioId] [uniqueidentifier] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[Versao] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
	[CapacitacaoId] [uniqueidentifier] NULL,
 CONSTRAINT [Recursos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_Recursos_Empresa_Usuario] UNIQUE NONCLUSTERED 
(
	[EmpresaId] ASC,
	[UsuarioId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoSequencias](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[Namespace] [nvarchar](40) COLLATE Latin1_General_CI_AS NOT NULL,
	[ProximoNumero] [int] NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoSequencias_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ProjetoSequencias_ProjetoId_Namespace] UNIQUE NONCLUSTERED 
(
	[ProjetoId] ASC,
	[Namespace] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoOrcamentos](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[Moeda] [nvarchar](3) COLLATE Latin1_General_CI_AS NOT NULL,
	[Status] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[Versao] [int] NOT NULL,
	[AprovadoEm] [datetime2](7) NULL,
	[AprovadoPorId] [uniqueidentifier] NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoOrcamentos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ProjetoOrcamentos_ProjetoId] UNIQUE NONCLUSTERED 
(
	[ProjetoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoSprints](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[Nome] [nvarchar](120) COLLATE Latin1_General_CI_AS NOT NULL,
	[Objetivo] [nvarchar](500) COLLATE Latin1_General_CI_AS NULL,
	[Status] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[InicioPrevistoEm] [date] NOT NULL,
	[FimPrevistoEm] [date] NOT NULL,
	[InicioRealEm] [datetime2](7) NULL,
	[FimRealEm] [datetime2](7) NULL,
	[Resultado] [nvarchar](2000) COLLATE Latin1_General_CI_AS NULL,
	[Versao] [int] NOT NULL,
	[EscopoInicialItens] [int] NULL,
	[EscopoInicialEstimativa] [int] NULL,
	[ItensConcluidos] [int] NULL,
	[EstimativaConcluida] [int] NULL,
	[ItensAdicionadosAposInicio] [int] NULL,
	[ItensRetiradosAposInicio] [int] NULL,
	[CriadoPorId] [uniqueidentifier] NOT NULL,
	[CanceladoPorId] [uniqueidentifier] NULL,
	[CanceladoEm] [datetime2](7) NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoSprints_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[EmpresaFuncionalidades](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[FuncionalidadeId] [int] NOT NULL,
 CONSTRAINT [EmpresaFuncionalidades_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_EmpresaFuncionalidades_EmpresaId_FuncionalidadeId] UNIQUE NONCLUSTERED 
(
	[EmpresaId] ASC,
	[FuncionalidadeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[Chamados](
	[Id] [uniqueidentifier] NOT NULL,
	[Numero] [int] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[SolicitanteId] [uniqueidentifier] NOT NULL,
	[ResponsavelId] [uniqueidentifier] NULL,
	[CategoriaId] [int] NULL,
	[Titulo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Status] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
	[PrimeiraRespostaEm] [datetime2](7) NULL,
	[ResolvidoEm] [datetime2](7) NULL,
	[EncerradoEm] [datetime2](7) NULL,
	[Versao] [int] NOT NULL,
	[FuncionalidadeId] [int] NULL,
	[SolucaoId] [int] NULL,
	[ResponsavelGrupoId] [int] NULL,
	[LiderAtendimentoId] [uniqueidentifier] NULL,
	[AtendimentoAssumidoEm] [datetime2](7) NULL,
	[TipoId] [int] NOT NULL,
	[PrioridadeId] [int] NOT NULL,
	[PrimeiraRespostaLimiteEm] [datetime2](7) NULL,
	[ResolucaoLimiteEm] [datetime2](7) NULL,
	[SlaPausadoEm] [datetime2](7) NULL,
	[SlaRegraId] [int] NULL,
	[SlaStatus] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[SlaTempoPausadoMinutos] [int] NOT NULL,
 CONSTRAINT [Chamados_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_Chamados_EmpresaId_Numero] UNIQUE NONCLUSTERED 
(
	[EmpresaId] ASC,
	[Numero] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoResponsavelSolucoes](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ResponsavelId] [int] NOT NULL,
	[SolucaoId] [int] NOT NULL,
	[ResponsavelGeral] [bit] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoResponsavelSolucoes_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ChamadoResponsavelSolucoes_ResponsavelId_SolucaoId] UNIQUE NONCLUSTERED 
(
	[ResponsavelId] ASC,
	[SolucaoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[EquipeRecursos](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[EquipeId] [uniqueidentifier] NOT NULL,
	[RecursoId] [uniqueidentifier] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_EquipeRecursos] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoApontamentoPeriodos](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[Competencia] [nvarchar](7) COLLATE Latin1_General_CI_AS NOT NULL,
	[Situacao] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[FechadoPorId] [uniqueidentifier] NOT NULL,
	[FechadoEm] [datetime2](7) NOT NULL,
	[ReabertoPorId] [uniqueidentifier] NULL,
	[ReabertoEm] [datetime2](7) NULL,
	[MotivoReabertura] [nvarchar](500) COLLATE Latin1_General_CI_AS NULL,
	[Versao] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoApontamentoPeriodos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ProjetoApontamentoPeriodos_Projeto_Competencia] UNIQUE NONCLUSTERED 
(
	[ProjetoId] ASC,
	[Competencia] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoOperacoesIdempotentes](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[UsuarioId] [uniqueidentifier] NOT NULL,
	[Operacao] [nvarchar](60) COLLATE Latin1_General_CI_AS NOT NULL,
	[Chave] [nvarchar](100) COLLATE Latin1_General_CI_AS NOT NULL,
	[RequisicaoHash] [nvarchar](64) COLLATE Latin1_General_CI_AS NOT NULL,
	[Status] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[Resposta] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[Erro] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[ExpiraEm] [datetime2](7) NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoOperacoesIdempotentes_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ProjetoOperacoesIdempotentes_Escopo] UNIQUE NONCLUSTERED 
(
	[ProjetoId] ASC,
	[UsuarioId] ASC,
	[Operacao] ASC,
	[Chave] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoMembros](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[UsuarioId] [uniqueidentifier] NOT NULL,
	[Papel] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[IncluidoEm] [datetime2](7) NOT NULL,
	[Origem] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
 CONSTRAINT [ProjetoMembros_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoMarcos](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[Nome] [nvarchar](160) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[ResponsavelId] [uniqueidentifier] NOT NULL,
	[Status] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[DataPrevistaEm] [date] NOT NULL,
	[DataRealizadaEm] [date] NULL,
	[Versao] [int] NOT NULL,
	[CriadoPorId] [uniqueidentifier] NOT NULL,
	[ArquivadoEm] [datetime2](7) NULL,
	[ArquivadoPorId] [uniqueidentifier] NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoMarcos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoItens](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[Numero] [int] NOT NULL,
	[Chave] [nvarchar](30) COLLATE Latin1_General_CI_AS NOT NULL,
	[Tipo] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[Titulo] [nvarchar](200) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[Status] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[Prioridade] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[ResponsavelId] [uniqueidentifier] NULL,
	[AutorId] [uniqueidentifier] NOT NULL,
	[PaiId] [uniqueidentifier] NULL,
	[InicioPrevistoEm] [date] NULL,
	[FimPrevistoEm] [date] NULL,
	[EstimativaMinutos] [int] NULL,
	[ConcluidoEm] [datetime2](7) NULL,
	[Versao] [int] NOT NULL,
	[ArquivadoEm] [datetime2](7) NULL,
	[ArquivadoPorId] [uniqueidentifier] NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
	[OrdemBacklog] [int] NOT NULL,
 CONSTRAINT [ProjetoItens_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ProjetoItens_ProjetoId_Chave] UNIQUE NONCLUSTERED 
(
	[ProjetoId] ASC,
	[Chave] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ProjetoItens_ProjetoId_Numero] UNIQUE NONCLUSTERED 
(
	[ProjetoId] ASC,
	[Numero] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoRecursos](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[Versao] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
	[RecursoId] [uniqueidentifier] NOT NULL,
	[VinculoDireto] [bit] NOT NULL,
 CONSTRAINT [ProjetoRecursos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ProjetoRecursos_Projeto_Recurso] UNIQUE NONCLUSTERED 
(
	[ProjetoId] ASC,
	[RecursoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoEventos](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[UsuarioId] [uniqueidentifier] NULL,
	[Entidade] [nvarchar](40) COLLATE Latin1_General_CI_AS NOT NULL,
	[EntidadeId] [nvarchar](100) COLLATE Latin1_General_CI_AS NOT NULL,
	[Evento] [nvarchar](60) COLLATE Latin1_General_CI_AS NOT NULL,
	[Dados] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoEventos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoEquipes](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[EquipeId] [uniqueidentifier] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[Versao] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_ProjetoEquipes] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[FuncionalidadeAcoes](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[FuncionalidadeId] [int] NOT NULL,
	[Chave] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Nome] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Ordem] [int] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[AcaoPadrao] [bit] NOT NULL,
	[Configuracao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[ConsumerKey] [nvarchar](200) COLLATE Latin1_General_CI_AS NULL,
	[ConsumerVersion] [int] NULL,
	[VersaoDefinicao] [int] NOT NULL,
	[StatusPublicacao] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[RevisaoCatalogo] [int] NOT NULL,
	[PublicadoEm] [datetime2](7) NULL,
 CONSTRAINT [FuncionalidadeAcoes_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoAtualizacoes](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[AutorId] [uniqueidentifier] NOT NULL,
	[Conteudo] [nvarchar](max) COLLATE Latin1_General_CI_AS NOT NULL,
	[SaudePercebida] [nvarchar](20) COLLATE Latin1_General_CI_AS NULL,
	[Versao] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoAtualizacoes_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[GrupoFuncionalidades](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[GrupoId] [int] NOT NULL,
	[FuncionalidadeId] [int] NOT NULL,
	[PodeVisualizar] [bit] NOT NULL,
	[PodeIncluir] [bit] NOT NULL,
	[PodeAlterar] [bit] NOT NULL,
	[PodeExcluir] [bit] NOT NULL,
 CONSTRAINT [GrupoFuncionalidades_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_GrupoFuncionalidades_GrupoId_FuncionalidadeId] UNIQUE NONCLUSTERED 
(
	[GrupoId] ASC,
	[FuncionalidadeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[GrupoFuncionalidadeAcoes](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[GrupoId] [int] NOT NULL,
	[FuncionalidadeAcaoId] [int] NOT NULL,
	[Permitido] [bit] NOT NULL,
 CONSTRAINT [GrupoFuncionalidadeAcoes_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoAtualizacaoHistoricos](
	[Id] [uniqueidentifier] NOT NULL,
	[AtualizacaoId] [uniqueidentifier] NOT NULL,
	[EditorId] [uniqueidentifier] NOT NULL,
	[ConteudoAnterior] [nvarchar](max) COLLATE Latin1_General_CI_AS NOT NULL,
	[SaudePercebidaAnterior] [nvarchar](20) COLLATE Latin1_General_CI_AS NULL,
	[VersaoAnterior] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoAtualizacaoHistoricos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoEntregas](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[MarcoId] [uniqueidentifier] NULL,
	[Nome] [nvarchar](160) COLLATE Latin1_General_CI_AS NOT NULL,
	[ResultadoEsperado] [nvarchar](1500) COLLATE Latin1_General_CI_AS NOT NULL,
	[CriteriosAceite] [nvarchar](3000) COLLATE Latin1_General_CI_AS NOT NULL,
	[ResponsavelId] [uniqueidentifier] NOT NULL,
	[Status] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[InicioPrevistoEm] [date] NOT NULL,
	[FimPrevistoEm] [date] NOT NULL,
	[ConcluidaEm] [datetime2](7) NULL,
	[Versao] [int] NOT NULL,
	[CriadoPorId] [uniqueidentifier] NOT NULL,
	[ArquivadoEm] [datetime2](7) NULL,
	[ArquivadoPorId] [uniqueidentifier] NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoEntregas_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoRecursoEquipes](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoRecursoId] [uniqueidentifier] NOT NULL,
	[ProjetoEquipeId] [uniqueidentifier] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_ProjetoRecursoEquipes] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoItemDependencias](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[BloqueadorId] [uniqueidentifier] NOT NULL,
	[BloqueadoId] [uniqueidentifier] NOT NULL,
	[Versao] [int] NOT NULL,
	[CriadoPorId] [uniqueidentifier] NOT NULL,
	[ArquivadoEm] [datetime2](7) NULL,
	[ArquivadoPorId] [uniqueidentifier] NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoItemDependencias_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoMarcoItens](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[MarcoId] [uniqueidentifier] NOT NULL,
	[ItemId] [uniqueidentifier] NOT NULL,
 CONSTRAINT [ProjetoMarcoItens_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoComentarios](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[AutorId] [uniqueidentifier] NOT NULL,
	[AtualizacaoId] [uniqueidentifier] NULL,
	[ItemId] [uniqueidentifier] NULL,
	[Conteudo] [nvarchar](max) COLLATE Latin1_General_CI_AS NOT NULL,
	[Versao] [int] NOT NULL,
	[EditadoEm] [datetime2](7) NULL,
	[ExcluidoEm] [datetime2](7) NULL,
	[ExcluidoPorId] [uniqueidentifier] NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoComentarios_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoNotificacoes](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[UsuarioId] [uniqueidentifier] NOT NULL,
	[ChamadoId] [uniqueidentifier] NOT NULL,
	[Tipo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Titulo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Mensagem] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[EventoChave] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[LidaEm] [datetime2](7) NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoNotificacoes_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ChamadoNotificacoes_EventoChave] UNIQUE NONCLUSTERED 
(
	[EventoChave] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoMensagens](
	[Id] [uniqueidentifier] NOT NULL,
	[ChamadoId] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[AutorId] [uniqueidentifier] NOT NULL,
	[Tipo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Conteudo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoMensagens_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoHistorico](
	[Id] [uniqueidentifier] NOT NULL,
	[ChamadoId] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[UsuarioId] [uniqueidentifier] NULL,
	[Evento] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Campo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[ValorAnterior] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[ValorNovo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[Observacao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoHistorico_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoResponsavelFuncionalidades](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ResponsavelSolucaoId] [int] NOT NULL,
	[FuncionalidadeId] [int] NOT NULL,
	[Ativo] [bit] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoResponsavelFuncionalidades_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ChamadoResponsavelFuncionalidades_ResponsavelSolucaoId_FuncionalidadeId] UNIQUE NONCLUSTERED 
(
	[ResponsavelSolucaoId] ASC,
	[FuncionalidadeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoAcompanhantes](
	[Id] [uniqueidentifier] NOT NULL,
	[ChamadoId] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[UsuarioId] [uniqueidentifier] NOT NULL,
	[AdicionadoPorId] [uniqueidentifier] NULL,
	[Ativo] [bit] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoAcompanhantes_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[CatalogoVersoes](
	[Id] [uniqueidentifier] NOT NULL,
	[SolucaoId] [int] NULL,
	[FuncionalidadeId] [int] NULL,
	[FuncionalidadeAcaoId] [int] NULL,
	[Numero] [int] NOT NULL,
	[Estado] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[Origem] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[Revisao] [int] NOT NULL,
	[VersaoDefinicao] [int] NOT NULL,
	[Snapshot] [nvarchar](max) COLLATE Latin1_General_CI_AS NOT NULL,
	[BaselineSnapshot] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[Motivo] [nvarchar](500) COLLATE Latin1_General_CI_AS NULL,
	[CriadoPorId] [uniqueidentifier] NULL,
	[PublicadoPorId] [uniqueidentifier] NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
	[PublicadoEm] [datetime2](7) NULL,
 CONSTRAINT [PK_CatalogoVersoes] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoSprintItens](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[SprintId] [uniqueidentifier] NOT NULL,
	[ItemId] [uniqueidentifier] NOT NULL,
	[IncluidoPorId] [uniqueidentifier] NOT NULL,
	[RetiradoPorId] [uniqueidentifier] NULL,
	[IncluidoEm] [datetime2](7) NOT NULL,
	[RetiradoEm] [datetime2](7) NULL,
	[EscopoInicial] [bit] NOT NULL,
	[StatusAoIniciar] [nvarchar](20) COLLATE Latin1_General_CI_AS NULL,
	[EstimativaAoIniciar] [int] NULL,
	[StatusAoEncerrar] [nvarchar](20) COLLATE Latin1_General_CI_AS NULL,
	[EstimativaAoEncerrar] [int] NULL,
	[ConcluidoNoSprint] [bit] NULL,
 CONSTRAINT [ProjetoSprintItens_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoOrcamentoCategorias](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[OrcamentoId] [uniqueidentifier] NOT NULL,
	[Nome] [nvarchar](120) COLLATE Latin1_General_CI_AS NOT NULL,
	[ValorPlanejado] [decimal](18, 2) NOT NULL,
	[ValorComprometido] [decimal](18, 2) NOT NULL,
	[ValorRealizado] [decimal](18, 2) NOT NULL,
	[Versao] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoOrcamentoCategorias_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_ProjetoOrcamentoCategorias_Orcamento_Nome] UNIQUE NONCLUSTERED 
(
	[OrcamentoId] ASC,
	[Nome] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoCustos](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[OrcamentoId] [uniqueidentifier] NOT NULL,
	[CategoriaId] [uniqueidentifier] NULL,
	[Tipo] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[Descricao] [nvarchar](240) COLLATE Latin1_General_CI_AS NOT NULL,
	[RecursoId] [uniqueidentifier] NULL,
	[QuantidadeMinutos] [int] NULL,
	[TaxaHora] [decimal](18, 4) NULL,
	[ValorPlanejado] [decimal](18, 2) NOT NULL,
	[ValorComprometido] [decimal](18, 2) NOT NULL,
	[ValorRealizado] [decimal](18, 2) NOT NULL,
	[CriadoPorId] [uniqueidentifier] NOT NULL,
	[Versao] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
	[ItemId] [uniqueidentifier] NULL,
 CONSTRAINT [ProjetoCustos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ChamadoAnexos](
	[Id] [uniqueidentifier] NOT NULL,
	[ChamadoId] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[AutorId] [uniqueidentifier] NOT NULL,
	[MensagemId] [uniqueidentifier] NULL,
	[NomeOriginal] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[NomeArquivo] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Caminho] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[MimeType] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Tamanho] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ChamadoAnexos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[CatalogoConflitos](
	[Id] [uniqueidentifier] NOT NULL,
	[VersaoId] [uniqueidentifier] NOT NULL,
	[Campo] [nvarchar](100) COLLATE Latin1_General_CI_AS NOT NULL,
	[BaselineAnterior] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[ValorCustomizado] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[BaselineNovo] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[Estado] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[ValorResolvido] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[ResolvidoPorId] [uniqueidentifier] NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[ResolvidoEm] [datetime2](7) NULL,
 CONSTRAINT [PK_CatalogoConflitos] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF),
 CONSTRAINT [UX_CatalogoConflitos_Versao_Campo] UNIQUE NONCLUSTERED 
(
	[VersaoId] ASC,
	[Campo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[CatalogoAuditorias](
	[Id] [uniqueidentifier] NOT NULL,
	[VersaoId] [uniqueidentifier] NULL,
	[Entidade] [nvarchar](30) COLLATE Latin1_General_CI_AS NOT NULL,
	[EntidadeId] [int] NOT NULL,
	[Evento] [nvarchar](30) COLLATE Latin1_General_CI_AS NOT NULL,
	[Antes] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[Depois] [nvarchar](max) COLLATE Latin1_General_CI_AS NULL,
	[Motivo] [nvarchar](500) COLLATE Latin1_General_CI_AS NULL,
	[AutorId] [uniqueidentifier] NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_CatalogoAuditorias] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoAnexos](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[AutorId] [uniqueidentifier] NOT NULL,
	[AtualizacaoId] [uniqueidentifier] NULL,
	[ComentarioId] [uniqueidentifier] NULL,
	[NomeOriginal] [nvarchar](255) COLLATE Latin1_General_CI_AS NOT NULL,
	[NomeArquivo] [nvarchar](255) COLLATE Latin1_General_CI_AS NOT NULL,
	[Caminho] [nvarchar](500) COLLATE Latin1_General_CI_AS NOT NULL,
	[MimeType] [nvarchar](150) COLLATE Latin1_General_CI_AS NOT NULL,
	[Tamanho] [int] NOT NULL,
	[ExcluidoEm] [datetime2](7) NULL,
	[ExcluidoPorId] [uniqueidentifier] NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoAnexos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoEntregaItens](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[EntregaId] [uniqueidentifier] NOT NULL,
	[ItemId] [uniqueidentifier] NOT NULL,
 CONSTRAINT [ProjetoEntregaItens_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoCustoTaxasHistorico](
	[Id] [uniqueidentifier] NOT NULL,
	[CustoId] [uniqueidentifier] NOT NULL,
	[TaxaHora] [decimal](18, 4) NOT NULL,
	[CriadoPorId] [uniqueidentifier] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoCustoTaxasHistorico_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_NULLS ON

SET QUOTED_IDENTIFIER ON

CREATE TABLE [dbo].[ProjetoApontamentos](
	[Id] [uniqueidentifier] NOT NULL,
	[EmpresaId] [int] NOT NULL,
	[ProjetoId] [uniqueidentifier] NOT NULL,
	[UsuarioId] [uniqueidentifier] NOT NULL,
	[ItemId] [uniqueidentifier] NULL,
	[DataTrabalho] [date] NOT NULL,
	[Minutos] [int] NOT NULL,
	[Descricao] [nvarchar](1000) COLLATE Latin1_General_CI_AS NOT NULL,
	[Faturavel] [bit] NOT NULL,
	[Status] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[EnviadoEm] [datetime2](7) NULL,
	[DecididoPorId] [uniqueidentifier] NULL,
	[DecididoEm] [datetime2](7) NULL,
	[Motivo] [nvarchar](500) COLLATE Latin1_General_CI_AS NULL,
	[CustoId] [uniqueidentifier] NULL,
	[TaxaHistoricoId] [uniqueidentifier] NULL,
	[TaxaHoraAplicada] [decimal](18, 4) NULL,
	[ValorCusto] [decimal](18, 2) NULL,
	[Moeda] [nvarchar](3) COLLATE Latin1_General_CI_AS NULL,
	[CustoSituacao] [nvarchar](20) COLLATE Latin1_General_CI_AS NOT NULL,
	[ArquivadoEm] [datetime2](7) NULL,
	[ArquivadoPorId] [uniqueidentifier] NULL,
	[Versao] [int] NOT NULL,
	[CriadoEm] [datetime2](7) NOT NULL,
	[AtualizadoEm] [datetime2](7) NOT NULL,
 CONSTRAINT [ProjetoApontamentos_pkey] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
)


SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_Solucoes_ChaveTecnica] ON [dbo].[Solucoes]
(
	[ChaveTecnica] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_Usuarios_Login] ON [dbo].[Usuarios]
(
	[Login] ASC
)
WHERE ([Login] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Capacitacoes_Empresa_Ativo_Nivel] ON [dbo].[Capacitacoes]
(
	[EmpresaId] ASC,
	[Ativo] ASC,
	[NivelHierarquico] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_Capacitacoes_Empresa_Nome] ON [dbo].[Capacitacoes]
(
	[EmpresaId] ASC,
	[Nome] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Equipes_Empresa_Ativo] ON [dbo].[Equipes]
(
	[EmpresaId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_Equipes_Empresa_Nome] ON [dbo].[Equipes]
(
	[EmpresaId] ASC,
	[Nome] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoPrioridades_EmpresaId_Ativo] ON [dbo].[ChamadoPrioridades]
(
	[EmpresaId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_ChamadoPrioridades_EmpresaId_Nome] ON [dbo].[ChamadoPrioridades]
(
	[EmpresaId] ASC,
	[Nome] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoTipos_EmpresaId_Ativo] ON [dbo].[ChamadoTipos]
(
	[EmpresaId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_ChamadoTipos_EmpresaId_Nome] ON [dbo].[ChamadoTipos]
(
	[EmpresaId] ASC,
	[Nome] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_FuncionalidadeAgrupamentos_ChaveTecnica] ON [dbo].[FuncionalidadeAgrupamentos]
(
	[ChaveTecnica] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_FuncionalidadeAgrupamentos_SolucaoId_Id] ON [dbo].[FuncionalidadeAgrupamentos]
(
	[SolucaoId] ASC,
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_FuncionalidadeAgrupamentos_SolucaoId_Slug] ON [dbo].[FuncionalidadeAgrupamentos]
(
	[SolucaoId] ASC,
	[Slug] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_GoogleEmailContas_EmpresaId_Ativo] ON [dbo].[GoogleEmailContas]
(
	[EmpresaId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_GoogleEmailContas_EmpresaId_Principal] ON [dbo].[GoogleEmailContas]
(
	[EmpresaId] ASC,
	[Principal] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_GoogleEmailContas_EmpresaId_EmailGoogle] ON [dbo].[GoogleEmailContas]
(
	[EmpresaId] ASC,
	[EmailGoogle] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_GoogleEmailContas_EmpresaId_Principal] ON [dbo].[GoogleEmailContas]
(
	[EmpresaId] ASC
)
WHERE ([Principal]=(1))
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Funcionalidades_SolucaoId_AgrupamentoId] ON [dbo].[Funcionalidades]
(
	[SolucaoId] ASC,
	[AgrupamentoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_Funcionalidades_ChaveTecnica] ON [dbo].[Funcionalidades]
(
	[ChaveTecnica] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Projetos_EmpresaId_ArquivadoEm] ON [dbo].[Projetos]
(
	[EmpresaId] ASC,
	[ArquivadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Projetos_EmpresaId_AtualizadoEm] ON [dbo].[Projetos]
(
	[EmpresaId] ASC,
	[AtualizadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Projetos_EmpresaId_ResponsavelId] ON [dbo].[Projetos]
(
	[EmpresaId] ASC,
	[ResponsavelId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_Projetos_EmpresaId_Chave] ON [dbo].[Projetos]
(
	[EmpresaId] ASC,
	[Chave] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoSlaRegras_EmpresaId_Ativo] ON [dbo].[ChamadoSlaRegras]
(
	[EmpresaId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_EmpresaUsuarios_EmpresaId_UsuarioId] ON [dbo].[EmpresaUsuarios]
(
	[EmpresaId] ASC,
	[UsuarioId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveis_EmpresaId_Ativo] ON [dbo].[ChamadoResponsaveis]
(
	[EmpresaId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveis_EmpresaId_GrupoId] ON [dbo].[ChamadoResponsaveis]
(
	[EmpresaId] ASC,
	[GrupoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveis_EmpresaId_Tipo] ON [dbo].[ChamadoResponsaveis]
(
	[EmpresaId] ASC,
	[Tipo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveis_EmpresaId_UsuarioId] ON [dbo].[ChamadoResponsaveis]
(
	[EmpresaId] ASC,
	[UsuarioId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Recursos_Empresa_Ativo] ON [dbo].[Recursos]
(
	[EmpresaId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Recursos_Empresa_Capacitacao] ON [dbo].[Recursos]
(
	[EmpresaId] ASC,
	[CapacitacaoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_ProjetoOrcamentos_Empresa_Status] ON [dbo].[ProjetoOrcamentos]
(
	[EmpresaId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_ProjetoSprints_EmpresaId_ProjetoId_Status] ON [dbo].[ProjetoSprints]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoSprints_ProjetoId_Periodo] ON [dbo].[ProjetoSprints]
(
	[ProjetoId] ASC,
	[InicioPrevistoEm] ASC,
	[FimPrevistoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoSprints_ProjetoId_Ativa] ON [dbo].[ProjetoSprints]
(
	[ProjetoId] ASC
)
WHERE ([Status]=N'ATIVA')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_AtualizadoEm] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[AtualizadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_FuncionalidadeId] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[FuncionalidadeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_LiderAtendimentoId] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[LiderAtendimentoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_PrioridadeId] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[PrioridadeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_ResolucaoLimiteEm] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[ResolucaoLimiteEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_ResponsavelGrupoId] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[ResponsavelGrupoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_ResponsavelId] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[ResponsavelId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_SlaStatus] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[SlaStatus] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_SolicitanteId] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[SolicitanteId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_SolucaoId] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[SolucaoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_Status] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_TipoId] ON [dbo].[Chamados]
(
	[EmpresaId] ASC,
	[TipoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoResponsavelSolucoes_SolucaoId] ON [dbo].[ChamadoResponsavelSolucoes]
(
	[SolucaoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_EquipeRecursos_Empresa_Recurso] ON [dbo].[EquipeRecursos]
(
	[EmpresaId] ASC,
	[RecursoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_EquipeRecursos_Equipe_Recurso] ON [dbo].[EquipeRecursos]
(
	[EquipeId] ASC,
	[RecursoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_ProjetoOperacoesIdempotentes_EmpresaId_ProjetoId_Status_ExpiraEm] ON [dbo].[ProjetoOperacoesIdempotentes]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[Status] ASC,
	[ExpiraEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoMembros_UsuarioId] ON [dbo].[ProjetoMembros]
(
	[UsuarioId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoMembros_ProjetoId_UsuarioId] ON [dbo].[ProjetoMembros]
(
	[ProjetoId] ASC,
	[UsuarioId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoMarcos_Empresa_Projeto_Arquivado] ON [dbo].[ProjetoMarcos]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[ArquivadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_ProjetoMarcos_Projeto_Data_Status] ON [dbo].[ProjetoMarcos]
(
	[ProjetoId] ASC,
	[DataPrevistaEm] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoItens_EmpresaId_ProjetoId_ArquivadoEm] ON [dbo].[ProjetoItens]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[ArquivadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoItens_PaiId] ON [dbo].[ProjetoItens]
(
	[PaiId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoItens_ProjetoId_OrdemBacklog_Numero] ON [dbo].[ProjetoItens]
(
	[ProjetoId] ASC,
	[OrdemBacklog] ASC,
	[Numero] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoItens_ProjetoId_ResponsavelId] ON [dbo].[ProjetoItens]
(
	[ProjetoId] ASC,
	[ResponsavelId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_ProjetoItens_ProjetoId_Status_Prioridade] ON [dbo].[ProjetoItens]
(
	[ProjetoId] ASC,
	[Status] ASC,
	[Prioridade] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoRecursos_Empresa_Recurso_Ativo] ON [dbo].[ProjetoRecursos]
(
	[EmpresaId] ASC,
	[RecursoId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoRecursos_Projeto_Ativo] ON [dbo].[ProjetoRecursos]
(
	[ProjetoId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoEventos_EmpresaId_ProjetoId_CriadoEm] ON [dbo].[ProjetoEventos]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_ProjetoEventos_ProjetoId_Entidade_EntidadeId] ON [dbo].[ProjetoEventos]
(
	[ProjetoId] ASC,
	[Entidade] ASC,
	[EntidadeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoEquipes_Empresa_Equipe_Ativo] ON [dbo].[ProjetoEquipes]
(
	[EmpresaId] ASC,
	[EquipeId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoEquipes_Projeto_Equipe] ON [dbo].[ProjetoEquipes]
(
	[ProjetoId] ASC,
	[EquipeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE UNIQUE NONCLUSTERED INDEX [UX_FuncionalidadeAcoes_FuncionalidadeId_Chave] ON [dbo].[FuncionalidadeAcoes]
(
	[FuncionalidadeId] ASC,
	[Chave] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoAtualizacoes_Empresa_Projeto_Criado] ON [dbo].[ProjetoAtualizacoes]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_GrupoFuncionalidadeAcoes_GrupoId_FuncionalidadeAcaoId] ON [dbo].[GrupoFuncionalidadeAcoes]
(
	[GrupoId] ASC,
	[FuncionalidadeAcaoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoAtualizacaoHistoricos_Atualizacao_Criado] ON [dbo].[ProjetoAtualizacaoHistoricos]
(
	[AtualizacaoId] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoEntregas_Empresa_Projeto_Arquivado] ON [dbo].[ProjetoEntregas]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[ArquivadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoEntregas_MarcoId] ON [dbo].[ProjetoEntregas]
(
	[MarcoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_ProjetoEntregas_Projeto_Fim_Status] ON [dbo].[ProjetoEntregas]
(
	[ProjetoId] ASC,
	[FimPrevistoEm] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoRecursoEquipes_Empresa_Equipe] ON [dbo].[ProjetoRecursoEquipes]
(
	[EmpresaId] ASC,
	[ProjetoEquipeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoRecursoEquipes_Recurso_Equipe] ON [dbo].[ProjetoRecursoEquipes]
(
	[ProjetoRecursoId] ASC,
	[ProjetoEquipeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoItemDependencias_Bloqueado_Arquivado] ON [dbo].[ProjetoItemDependencias]
(
	[BloqueadoId] ASC,
	[ArquivadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoItemDependencias_Bloqueador_Arquivado] ON [dbo].[ProjetoItemDependencias]
(
	[BloqueadorId] ASC,
	[ArquivadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoItemDependencias_Empresa_Projeto_Arquivado] ON [dbo].[ProjetoItemDependencias]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[ArquivadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoItemDependencias_Projeto_Relacao] ON [dbo].[ProjetoItemDependencias]
(
	[ProjetoId] ASC,
	[BloqueadorId] ASC,
	[BloqueadoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoMarcoItens_Projeto_Item] ON [dbo].[ProjetoMarcoItens]
(
	[ProjetoId] ASC,
	[ItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoMarcoItens_Marco_Item] ON [dbo].[ProjetoMarcoItens]
(
	[MarcoId] ASC,
	[ItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoComentarios_Atualizacao_Excluido] ON [dbo].[ProjetoComentarios]
(
	[AtualizacaoId] ASC,
	[ExcluidoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoComentarios_Empresa_Projeto_Criado] ON [dbo].[ProjetoComentarios]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoComentarios_Item_Excluido] ON [dbo].[ProjetoComentarios]
(
	[ItemId] ASC,
	[ExcluidoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoNotificacoes_Chamado] ON [dbo].[ChamadoNotificacoes]
(
	[ChamadoId] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoNotificacoes_Usuario] ON [dbo].[ChamadoNotificacoes]
(
	[EmpresaId] ASC,
	[UsuarioId] ASC,
	[LidaEm] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoMensagens_EmpresaId_ChamadoId_CriadoEm] ON [dbo].[ChamadoMensagens]
(
	[EmpresaId] ASC,
	[ChamadoId] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoHistorico_EmpresaId_ChamadoId_CriadoEm] ON [dbo].[ChamadoHistorico]
(
	[EmpresaId] ASC,
	[ChamadoId] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoResponsavelFuncionalidades_FuncionalidadeId] ON [dbo].[ChamadoResponsavelFuncionalidades]
(
	[FuncionalidadeId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoAcompanhantes_EmpresaId_ChamadoId_Ativo] ON [dbo].[ChamadoAcompanhantes]
(
	[EmpresaId] ASC,
	[ChamadoId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoAcompanhantes_EmpresaId_UsuarioId_Ativo] ON [dbo].[ChamadoAcompanhantes]
(
	[EmpresaId] ASC,
	[UsuarioId] ASC,
	[Ativo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_ChamadoAcompanhantes_ChamadoId_UsuarioId] ON [dbo].[ChamadoAcompanhantes]
(
	[ChamadoId] ASC,
	[UsuarioId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_CatalogoVersoes_Acao_Estado] ON [dbo].[CatalogoVersoes]
(
	[FuncionalidadeAcaoId] ASC,
	[Estado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_CatalogoVersoes_Funcionalidade_Estado] ON [dbo].[CatalogoVersoes]
(
	[FuncionalidadeId] ASC,
	[Estado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_CatalogoVersoes_Solucao_Estado] ON [dbo].[CatalogoVersoes]
(
	[SolucaoId] ASC,
	[Estado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_CatalogoVersoes_Acao_Publicada] ON [dbo].[CatalogoVersoes]
(
	[FuncionalidadeAcaoId] ASC
)
WHERE ([FuncionalidadeAcaoId] IS NOT NULL AND [Estado]=N'PUBLICADA')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_CatalogoVersoes_Acao_Rascunho] ON [dbo].[CatalogoVersoes]
(
	[FuncionalidadeAcaoId] ASC
)
WHERE ([FuncionalidadeAcaoId] IS NOT NULL AND [Estado]=N'RASCUNHO')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_CatalogoVersoes_Funcionalidade_Publicada] ON [dbo].[CatalogoVersoes]
(
	[FuncionalidadeId] ASC
)
WHERE ([FuncionalidadeId] IS NOT NULL AND [Estado]=N'PUBLICADA')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_CatalogoVersoes_Funcionalidade_Rascunho] ON [dbo].[CatalogoVersoes]
(
	[FuncionalidadeId] ASC
)
WHERE ([FuncionalidadeId] IS NOT NULL AND [Estado]=N'RASCUNHO')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_CatalogoVersoes_Solucao_Publicada] ON [dbo].[CatalogoVersoes]
(
	[SolucaoId] ASC
)
WHERE ([SolucaoId] IS NOT NULL AND [Estado]=N'PUBLICADA')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_CatalogoVersoes_Solucao_Rascunho] ON [dbo].[CatalogoVersoes]
(
	[SolucaoId] ASC
)
WHERE ([SolucaoId] IS NOT NULL AND [Estado]=N'RASCUNHO')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoSprintItens_Item_Ativo] ON [dbo].[ProjetoSprintItens]
(
	[ItemId] ASC,
	[RetiradoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoSprintItens_Projeto_Sprint_Ativo] ON [dbo].[ProjetoSprintItens]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[SprintId] ASC,
	[RetiradoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoSprintItens_Sprint_Escopo] ON [dbo].[ProjetoSprintItens]
(
	[SprintId] ASC,
	[EscopoInicial] ASC,
	[RetiradoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoSprintItens_ItemId_Ativo] ON [dbo].[ProjetoSprintItens]
(
	[ItemId] ASC
)
WHERE ([RetiradoEm] IS NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoOrcamentoCategorias_Empresa_Projeto] ON [dbo].[ProjetoOrcamentoCategorias]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoCustos_CategoriaId] ON [dbo].[ProjetoCustos]
(
	[CategoriaId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_ProjetoCustos_Empresa_Projeto_Tipo] ON [dbo].[ProjetoCustos]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[Tipo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoCustos_ItemId] ON [dbo].[ProjetoCustos]
(
	[ItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoAnexos_AutorId] ON [dbo].[ChamadoAnexos]
(
	[AutorId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoAnexos_EmpresaId_ChamadoId_CriadoEm] ON [dbo].[ChamadoAnexos]
(
	[EmpresaId] ASC,
	[ChamadoId] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ChamadoAnexos_EmpresaId_MensagemId] ON [dbo].[ChamadoAnexos]
(
	[EmpresaId] ASC,
	[MensagemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_CatalogoConflitos_Estado] ON [dbo].[CatalogoConflitos]
(
	[Estado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_CatalogoAuditorias_Entidade_Criado] ON [dbo].[CatalogoAuditorias]
(
	[Entidade] ASC,
	[EntidadeId] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoAnexos_Atualizacao_Excluido] ON [dbo].[ProjetoAnexos]
(
	[AtualizacaoId] ASC,
	[ExcluidoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoAnexos_Comentario_Excluido] ON [dbo].[ProjetoAnexos]
(
	[ComentarioId] ASC,
	[ExcluidoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoAnexos_Empresa_Projeto_Criado] ON [dbo].[ProjetoAnexos]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoEntregaItens_Projeto_Item] ON [dbo].[ProjetoEntregaItens]
(
	[ProjetoId] ASC,
	[ItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoEntregaItens_Entrega_Item] ON [dbo].[ProjetoEntregaItens]
(
	[EntregaId] ASC,
	[ItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoCustoTaxas_Custo_Criado] ON [dbo].[ProjetoCustoTaxasHistorico]
(
	[CustoId] ASC,
	[CriadoEm] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoApontamentos_CustoId] ON [dbo].[ProjetoApontamentos]
(
	[CustoId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoApontamentos_Empresa_Projeto_Data] ON [dbo].[ProjetoApontamentos]
(
	[EmpresaId] ASC,
	[ProjetoId] ASC,
	[DataTrabalho] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoApontamentos_Empresa_Usuario_Data] ON [dbo].[ProjetoApontamentos]
(
	[EmpresaId] ASC,
	[UsuarioId] ASC,
	[DataTrabalho] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

CREATE NONCLUSTERED INDEX [IX_ProjetoApontamentos_ItemId] ON [dbo].[ProjetoApontamentos]
(
	[ItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

SET ANSI_PADDING ON


CREATE NONCLUSTERED INDEX [IX_ProjetoApontamentos_Projeto_Status] ON [dbo].[ProjetoApontamentos]
(
	[ProjetoId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)

ALTER TABLE [dbo].[GruposUsuarios] ADD  CONSTRAINT [GruposUsuarios_AcessoEcommerce_df]  DEFAULT ((0)) FOR [AcessoEcommerce]

ALTER TABLE [dbo].[GruposUsuarios] ADD  CONSTRAINT [GruposUsuarios_AcessoProjetos_df]  DEFAULT ((0)) FOR [AcessoProjetos]

ALTER TABLE [dbo].[GruposUsuarios] ADD  CONSTRAINT [GruposUsuarios_AcessoHoras_df]  DEFAULT ((0)) FOR [AcessoHoras]

ALTER TABLE [dbo].[GruposUsuarios] ADD  CONSTRAINT [GruposUsuarios_AcessoConfigurador_df]  DEFAULT ((0)) FOR [AcessoConfigurador]

ALTER TABLE [dbo].[GruposUsuarios] ADD  CONSTRAINT [GruposUsuarios_PodeVisualizar_df]  DEFAULT ((1)) FOR [PodeVisualizar]

ALTER TABLE [dbo].[GruposUsuarios] ADD  CONSTRAINT [GruposUsuarios_PodeIncluir_df]  DEFAULT ((0)) FOR [PodeIncluir]

ALTER TABLE [dbo].[GruposUsuarios] ADD  CONSTRAINT [GruposUsuarios_PodeAlterar_df]  DEFAULT ((0)) FOR [PodeAlterar]

ALTER TABLE [dbo].[GruposUsuarios] ADD  CONSTRAINT [GruposUsuarios_PodeExcluir_df]  DEFAULT ((0)) FOR [PodeExcluir]

ALTER TABLE [dbo].[GruposUsuarios] ADD  CONSTRAINT [GruposUsuarios_PadraoSistema_df]  DEFAULT ((0)) FOR [PadraoSistema]

ALTER TABLE [dbo].[Empresas] ADD  CONSTRAINT [Empresas_AcessoEcommerce_df]  DEFAULT ((0)) FOR [AcessoEcommerce]

ALTER TABLE [dbo].[Empresas] ADD  CONSTRAINT [Empresas_AcessoProjetos_df]  DEFAULT ((0)) FOR [AcessoProjetos]

ALTER TABLE [dbo].[Empresas] ADD  CONSTRAINT [Empresas_AcessoHoras_df]  DEFAULT ((0)) FOR [AcessoHoras]

ALTER TABLE [dbo].[Empresas] ADD  CONSTRAINT [Empresas_PadraoSistema_df]  DEFAULT ((0)) FOR [PadraoSistema]

ALTER TABLE [dbo].[Solucoes] ADD  CONSTRAINT [Solucoes_Ordem_df]  DEFAULT ((0)) FOR [Ordem]

ALTER TABLE [dbo].[Solucoes] ADD  CONSTRAINT [Solucoes_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[Solucoes] ADD  CONSTRAINT [Solucoes_ExibirNoHub_df]  DEFAULT ((1)) FOR [ExibirNoHub]

ALTER TABLE [dbo].[Solucoes] ADD  CONSTRAINT [Solucoes_SomenteAdminSistema_df]  DEFAULT ((0)) FOR [SomenteAdminSistema]

ALTER TABLE [dbo].[Solucoes] ADD  CONSTRAINT [Solucoes_PadraoSistema_df]  DEFAULT ((0)) FOR [PadraoSistema]

ALTER TABLE [dbo].[Solucoes] ADD  CONSTRAINT [DF_Solucoes_ChaveTecnica]  DEFAULT (CONVERT([nvarchar](36),newid())) FOR [ChaveTecnica]

ALTER TABLE [dbo].[Solucoes] ADD  CONSTRAINT [DF_Solucoes_VersaoDefinicao]  DEFAULT ((1)) FOR [VersaoDefinicao]

ALTER TABLE [dbo].[Solucoes] ADD  CONSTRAINT [DF_Solucoes_StatusPublicacao]  DEFAULT (N'PUBLICADA') FOR [StatusPublicacao]

ALTER TABLE [dbo].[Solucoes] ADD  CONSTRAINT [DF_Solucoes_RevisaoCatalogo]  DEFAULT ((1)) FOR [RevisaoCatalogo]

ALTER TABLE [dbo].[Usuarios] ADD  CONSTRAINT [Usuarios_DeveAlterarSenha_df]  DEFAULT ((0)) FOR [DeveAlterarSenha]

ALTER TABLE [dbo].[Usuarios] ADD  CONSTRAINT [Usuarios_PadraoSistema_df]  DEFAULT ((0)) FOR [PadraoSistema]

ALTER TABLE [dbo].[Usuarios] ADD  CONSTRAINT [DF_Usuarios_SessaoVersao]  DEFAULT ((0)) FOR [SessaoVersao]

ALTER TABLE [dbo].[Capacitacoes] ADD  CONSTRAINT [DF_Capacitacoes_Id]  DEFAULT (newid()) FOR [Id]

ALTER TABLE [dbo].[Capacitacoes] ADD  CONSTRAINT [DF_Capacitacoes_Ativo]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[Capacitacoes] ADD  CONSTRAINT [DF_Capacitacoes_Versao]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[Capacitacoes] ADD  CONSTRAINT [DF_Capacitacoes_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[Capacitacoes] ADD  CONSTRAINT [DF_Capacitacoes_AtualizadoEm]  DEFAULT (getdate()) FOR [AtualizadoEm]

ALTER TABLE [dbo].[ChamadoCategorias] ADD  CONSTRAINT [ChamadoCategorias_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[ChamadoCategorias] ADD  CONSTRAINT [ChamadoCategorias_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ChamadoSequencias] ADD  CONSTRAINT [ChamadoSequencias_ProximoNumero_df]  DEFAULT ((1)) FOR [ProximoNumero]

ALTER TABLE [dbo].[Equipes] ADD  CONSTRAINT [DF_Equipes_Id]  DEFAULT (newid()) FOR [Id]

ALTER TABLE [dbo].[Equipes] ADD  CONSTRAINT [DF_Equipes_Ativo]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[Equipes] ADD  CONSTRAINT [DF_Equipes_Versao]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[Equipes] ADD  CONSTRAINT [DF_Equipes_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[Equipes] ADD  CONSTRAINT [DF_Equipes_AtualizadoEm]  DEFAULT (getdate()) FOR [AtualizadoEm]

ALTER TABLE [dbo].[ChamadoPrioridades] ADD  CONSTRAINT [ChamadoPrioridades_Ordem_df]  DEFAULT ((0)) FOR [Ordem]

ALTER TABLE [dbo].[ChamadoPrioridades] ADD  CONSTRAINT [ChamadoPrioridades_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[ChamadoPrioridades] ADD  CONSTRAINT [DF_ChamadoPrioridades_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ChamadoTipos] ADD  CONSTRAINT [ChamadoTipos_Ordem_df]  DEFAULT ((0)) FOR [Ordem]

ALTER TABLE [dbo].[ChamadoTipos] ADD  CONSTRAINT [ChamadoTipos_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[ChamadoTipos] ADD  CONSTRAINT [DF_ChamadoTipos_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[FuncionalidadeAgrupamentos] ADD  CONSTRAINT [DF_FuncionalidadeAgrupamentos_Ordem]  DEFAULT ((0)) FOR [Ordem]

ALTER TABLE [dbo].[FuncionalidadeAgrupamentos] ADD  CONSTRAINT [DF_FuncionalidadeAgrupamentos_Ativo]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[FuncionalidadeAgrupamentos] ADD  CONSTRAINT [DF_FuncionalidadeAgrupamentos_PadraoSistema]  DEFAULT ((0)) FOR [PadraoSistema]

ALTER TABLE [dbo].[FuncionalidadeAgrupamentos] ADD  CONSTRAINT [DF_FuncionalidadeAgrupamentos_ChaveTecnica]  DEFAULT (CONVERT([nvarchar](36),newid())) FOR [ChaveTecnica]

ALTER TABLE [dbo].[FuncionalidadeAgrupamentos] ADD  CONSTRAINT [DF_FuncionalidadeAgrupamentos_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[FuncionalidadeAgrupamentos] ADD  CONSTRAINT [DF_FuncionalidadeAgrupamentos_AtualizadoEm]  DEFAULT (getdate()) FOR [AtualizadoEm]

ALTER TABLE [dbo].[GoogleEmailContas] ADD  CONSTRAINT [GoogleEmailContas_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[GoogleEmailContas] ADD  CONSTRAINT [DF_GoogleEmailContas_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[GoogleEmailContas] ADD  CONSTRAINT [GoogleEmailContas_Principal_df]  DEFAULT ((0)) FOR [Principal]

ALTER TABLE [dbo].[Funcionalidades] ADD  CONSTRAINT [Funcionalidades_Ordem_df]  DEFAULT ((0)) FOR [Ordem]

ALTER TABLE [dbo].[Funcionalidades] ADD  CONSTRAINT [Funcionalidades_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[Funcionalidades] ADD  CONSTRAINT [Funcionalidades_SomenteAdminSistema_df]  DEFAULT ((0)) FOR [SomenteAdminSistema]

ALTER TABLE [dbo].[Funcionalidades] ADD  CONSTRAINT [Funcionalidades_PadraoSistema_df]  DEFAULT ((0)) FOR [PadraoSistema]

ALTER TABLE [dbo].[Funcionalidades] ADD  CONSTRAINT [DF_Funcionalidades_ChaveTecnica]  DEFAULT (CONVERT([nvarchar](36),newid())) FOR [ChaveTecnica]

ALTER TABLE [dbo].[Funcionalidades] ADD  CONSTRAINT [DF_Funcionalidades_VersaoDefinicao]  DEFAULT ((1)) FOR [VersaoDefinicao]

ALTER TABLE [dbo].[Funcionalidades] ADD  CONSTRAINT [DF_Funcionalidades_StatusPublicacao]  DEFAULT (N'PUBLICADA') FOR [StatusPublicacao]

ALTER TABLE [dbo].[Funcionalidades] ADD  CONSTRAINT [DF_Funcionalidades_RevisaoCatalogo]  DEFAULT ((1)) FOR [RevisaoCatalogo]

ALTER TABLE [dbo].[Projetos] ADD  CONSTRAINT [DF_Projetos_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[Projetos] ADD  CONSTRAINT [Projetos_BacklogVersao_df]  DEFAULT ((0)) FOR [BacklogVersao]

ALTER TABLE [dbo].[ChamadoSlaRegras] ADD  CONSTRAINT [ChamadoSlaRegras_ModoContagem_df]  DEFAULT ('CORRIDO') FOR [ModoContagem]

ALTER TABLE [dbo].[ChamadoSlaRegras] ADD  CONSTRAINT [ChamadoSlaRegras_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[ChamadoSlaRegras] ADD  CONSTRAINT [ChamadoSlaRegras_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ChamadoResponsaveis] ADD  CONSTRAINT [ChamadoResponsaveis_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[ChamadoResponsaveis] ADD  CONSTRAINT [ChamadoResponsaveis_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ChamadoResponsaveis] ADD  CONSTRAINT [ChamadoResponsaveis_Tipo_df]  DEFAULT ('USUARIO') FOR [Tipo]

ALTER TABLE [dbo].[Recursos] ADD  CONSTRAINT [Recursos_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[Recursos] ADD  CONSTRAINT [Recursos_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[Recursos] ADD  CONSTRAINT [Recursos_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoSequencias] ADD  CONSTRAINT [ProjetoSequencias_ProximoNumero_df]  DEFAULT ((1)) FOR [ProximoNumero]

ALTER TABLE [dbo].[ProjetoOrcamentos] ADD  CONSTRAINT [ProjetoOrcamentos_Moeda_df]  DEFAULT ('BRL') FOR [Moeda]

ALTER TABLE [dbo].[ProjetoOrcamentos] ADD  CONSTRAINT [ProjetoOrcamentos_Status_df]  DEFAULT ('RASCUNHO') FOR [Status]

ALTER TABLE [dbo].[ProjetoOrcamentos] ADD  CONSTRAINT [ProjetoOrcamentos_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoOrcamentos] ADD  CONSTRAINT [ProjetoOrcamentos_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoSprints] ADD  CONSTRAINT [ProjetoSprints_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoSprints] ADD  CONSTRAINT [ProjetoSprints_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[Chamados] ADD  CONSTRAINT [Chamados_Status_df]  DEFAULT ('ABERTO') FOR [Status]

ALTER TABLE [dbo].[Chamados] ADD  CONSTRAINT [Chamados_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[Chamados] ADD  CONSTRAINT [Chamados_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[Chamados] ADD  CONSTRAINT [Chamados_SlaStatus_df]  DEFAULT ('SEM_SLA') FOR [SlaStatus]

ALTER TABLE [dbo].[Chamados] ADD  CONSTRAINT [Chamados_SlaTempoPausadoMinutos_df]  DEFAULT ((0)) FOR [SlaTempoPausadoMinutos]

ALTER TABLE [dbo].[ChamadoResponsavelSolucoes] ADD  CONSTRAINT [ChamadoResponsavelSolucoes_ResponsavelGeral_df]  DEFAULT ((0)) FOR [ResponsavelGeral]

ALTER TABLE [dbo].[ChamadoResponsavelSolucoes] ADD  CONSTRAINT [ChamadoResponsavelSolucoes_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[ChamadoResponsavelSolucoes] ADD  CONSTRAINT [ChamadoResponsavelSolucoes_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[EquipeRecursos] ADD  CONSTRAINT [DF_EquipeRecursos_Id]  DEFAULT (newid()) FOR [Id]

ALTER TABLE [dbo].[EquipeRecursos] ADD  CONSTRAINT [DF_EquipeRecursos_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] ADD  CONSTRAINT [ProjetoApontamentoPeriodos_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] ADD  CONSTRAINT [ProjetoApontamentoPeriodos_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoOperacoesIdempotentes] ADD  CONSTRAINT [ProjetoOperacoesIdempotentes_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoMembros] ADD  CONSTRAINT [DF_ProjetoMembros_IncluidoEm]  DEFAULT (getdate()) FOR [IncluidoEm]

ALTER TABLE [dbo].[ProjetoMembros] ADD  CONSTRAINT [ProjetoMembros_Origem_df]  DEFAULT ('EQUIPE') FOR [Origem]

ALTER TABLE [dbo].[ProjetoMarcos] ADD  CONSTRAINT [ProjetoMarcos_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoMarcos] ADD  CONSTRAINT [ProjetoMarcos_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoItens] ADD  CONSTRAINT [ProjetoItens_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoItens] ADD  CONSTRAINT [ProjetoItens_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoRecursos] ADD  CONSTRAINT [ProjetoRecursos_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[ProjetoRecursos] ADD  CONSTRAINT [ProjetoRecursos_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoRecursos] ADD  CONSTRAINT [ProjetoRecursos_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoRecursos] ADD  CONSTRAINT [DF_ProjetoRecursos_VinculoDireto]  DEFAULT ((1)) FOR [VinculoDireto]

ALTER TABLE [dbo].[ProjetoEventos] ADD  CONSTRAINT [ProjetoEventos_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoEquipes] ADD  CONSTRAINT [DF_ProjetoEquipes_Id]  DEFAULT (newid()) FOR [Id]

ALTER TABLE [dbo].[ProjetoEquipes] ADD  CONSTRAINT [DF_ProjetoEquipes_Ativo]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[ProjetoEquipes] ADD  CONSTRAINT [DF_ProjetoEquipes_Versao]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoEquipes] ADD  CONSTRAINT [DF_ProjetoEquipes_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoEquipes] ADD  CONSTRAINT [DF_ProjetoEquipes_AtualizadoEm]  DEFAULT (getdate()) FOR [AtualizadoEm]

ALTER TABLE [dbo].[FuncionalidadeAcoes] ADD  CONSTRAINT [FuncionalidadeAcoes_Ordem_df]  DEFAULT ((0)) FOR [Ordem]

ALTER TABLE [dbo].[FuncionalidadeAcoes] ADD  CONSTRAINT [FuncionalidadeAcoes_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[FuncionalidadeAcoes] ADD  CONSTRAINT [FuncionalidadeAcoes_AcaoPadrao_df]  DEFAULT ((0)) FOR [AcaoPadrao]

ALTER TABLE [dbo].[FuncionalidadeAcoes] ADD  CONSTRAINT [DF_FuncionalidadeAcoes_VersaoDefinicao]  DEFAULT ((1)) FOR [VersaoDefinicao]

ALTER TABLE [dbo].[FuncionalidadeAcoes] ADD  CONSTRAINT [DF_FuncionalidadeAcoes_StatusPublicacao]  DEFAULT (N'PUBLICADA') FOR [StatusPublicacao]

ALTER TABLE [dbo].[FuncionalidadeAcoes] ADD  CONSTRAINT [DF_FuncionalidadeAcoes_RevisaoCatalogo]  DEFAULT ((1)) FOR [RevisaoCatalogo]

ALTER TABLE [dbo].[ProjetoAtualizacoes] ADD  CONSTRAINT [ProjetoAtualizacoes_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoAtualizacoes] ADD  CONSTRAINT [ProjetoAtualizacoes_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[GrupoFuncionalidades] ADD  CONSTRAINT [GrupoFuncionalidades_PodeVisualizar_df]  DEFAULT ((1)) FOR [PodeVisualizar]

ALTER TABLE [dbo].[GrupoFuncionalidades] ADD  CONSTRAINT [GrupoFuncionalidades_PodeIncluir_df]  DEFAULT ((0)) FOR [PodeIncluir]

ALTER TABLE [dbo].[GrupoFuncionalidades] ADD  CONSTRAINT [GrupoFuncionalidades_PodeAlterar_df]  DEFAULT ((0)) FOR [PodeAlterar]

ALTER TABLE [dbo].[GrupoFuncionalidades] ADD  CONSTRAINT [GrupoFuncionalidades_PodeExcluir_df]  DEFAULT ((0)) FOR [PodeExcluir]

ALTER TABLE [dbo].[GrupoFuncionalidadeAcoes] ADD  CONSTRAINT [GrupoFuncionalidadeAcoes_Permitido_df]  DEFAULT ((0)) FOR [Permitido]

ALTER TABLE [dbo].[ProjetoAtualizacaoHistoricos] ADD  CONSTRAINT [ProjetoAtualizacaoHistoricos_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoEntregas] ADD  CONSTRAINT [ProjetoEntregas_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoEntregas] ADD  CONSTRAINT [ProjetoEntregas_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoRecursoEquipes] ADD  CONSTRAINT [DF_ProjetoRecursoEquipes_Id]  DEFAULT (newid()) FOR [Id]

ALTER TABLE [dbo].[ProjetoRecursoEquipes] ADD  CONSTRAINT [DF_ProjetoRecursoEquipes_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoItemDependencias] ADD  CONSTRAINT [ProjetoItemDependencias_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoItemDependencias] ADD  CONSTRAINT [ProjetoItemDependencias_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoComentarios] ADD  CONSTRAINT [ProjetoComentarios_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoComentarios] ADD  CONSTRAINT [ProjetoComentarios_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ChamadoNotificacoes] ADD  CONSTRAINT [DF_ChamadoNotificacoes_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ChamadoMensagens] ADD  CONSTRAINT [ChamadoMensagens_Tipo_df]  DEFAULT ('PUBLICA') FOR [Tipo]

ALTER TABLE [dbo].[ChamadoMensagens] ADD  CONSTRAINT [ChamadoMensagens_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ChamadoHistorico] ADD  CONSTRAINT [ChamadoHistorico_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ChamadoResponsavelFuncionalidades] ADD  CONSTRAINT [ChamadoResponsavelFuncionalidades_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[ChamadoResponsavelFuncionalidades] ADD  CONSTRAINT [ChamadoResponsavelFuncionalidades_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ChamadoAcompanhantes] ADD  CONSTRAINT [ChamadoAcompanhantes_Ativo_df]  DEFAULT ((1)) FOR [Ativo]

ALTER TABLE [dbo].[ChamadoAcompanhantes] ADD  CONSTRAINT [ChamadoAcompanhantes_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[CatalogoVersoes] ADD  CONSTRAINT [DF_CatalogoVersoes_Id]  DEFAULT (newid()) FOR [Id]

ALTER TABLE [dbo].[CatalogoVersoes] ADD  CONSTRAINT [DF_CatalogoVersoes_Revisao]  DEFAULT ((1)) FOR [Revisao]

ALTER TABLE [dbo].[CatalogoVersoes] ADD  CONSTRAINT [DF_CatalogoVersoes_VersaoDefinicao]  DEFAULT ((1)) FOR [VersaoDefinicao]

ALTER TABLE [dbo].[CatalogoVersoes] ADD  CONSTRAINT [DF_CatalogoVersoes_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[CatalogoVersoes] ADD  CONSTRAINT [DF_CatalogoVersoes_AtualizadoEm]  DEFAULT (getdate()) FOR [AtualizadoEm]

ALTER TABLE [dbo].[ProjetoSprintItens] ADD  CONSTRAINT [ProjetoSprintItens_IncluidoEm_df]  DEFAULT (getdate()) FOR [IncluidoEm]

ALTER TABLE [dbo].[ProjetoSprintItens] ADD  CONSTRAINT [ProjetoSprintItens_EscopoInicial_df]  DEFAULT ((0)) FOR [EscopoInicial]

ALTER TABLE [dbo].[ProjetoOrcamentoCategorias] ADD  CONSTRAINT [ProjetoOrcamentoCategorias_ValorPlanejado_df]  DEFAULT ((0)) FOR [ValorPlanejado]

ALTER TABLE [dbo].[ProjetoOrcamentoCategorias] ADD  CONSTRAINT [ProjetoOrcamentoCategorias_ValorComprometido_df]  DEFAULT ((0)) FOR [ValorComprometido]

ALTER TABLE [dbo].[ProjetoOrcamentoCategorias] ADD  CONSTRAINT [ProjetoOrcamentoCategorias_ValorRealizado_df]  DEFAULT ((0)) FOR [ValorRealizado]

ALTER TABLE [dbo].[ProjetoOrcamentoCategorias] ADD  CONSTRAINT [ProjetoOrcamentoCategorias_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoOrcamentoCategorias] ADD  CONSTRAINT [ProjetoOrcamentoCategorias_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoCustos] ADD  CONSTRAINT [ProjetoCustos_ValorPlanejado_df]  DEFAULT ((0)) FOR [ValorPlanejado]

ALTER TABLE [dbo].[ProjetoCustos] ADD  CONSTRAINT [ProjetoCustos_ValorComprometido_df]  DEFAULT ((0)) FOR [ValorComprometido]

ALTER TABLE [dbo].[ProjetoCustos] ADD  CONSTRAINT [ProjetoCustos_ValorRealizado_df]  DEFAULT ((0)) FOR [ValorRealizado]

ALTER TABLE [dbo].[ProjetoCustos] ADD  CONSTRAINT [ProjetoCustos_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoCustos] ADD  CONSTRAINT [ProjetoCustos_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ChamadoAnexos] ADD  CONSTRAINT [ChamadoAnexos_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[CatalogoConflitos] ADD  CONSTRAINT [DF_CatalogoConflitos_Id]  DEFAULT (newid()) FOR [Id]

ALTER TABLE [dbo].[CatalogoConflitos] ADD  CONSTRAINT [DF_CatalogoConflitos_Estado]  DEFAULT (N'PENDENTE') FOR [Estado]

ALTER TABLE [dbo].[CatalogoConflitos] ADD  CONSTRAINT [DF_CatalogoConflitos_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[CatalogoAuditorias] ADD  CONSTRAINT [DF_CatalogoAuditorias_Id]  DEFAULT (newid()) FOR [Id]

ALTER TABLE [dbo].[CatalogoAuditorias] ADD  CONSTRAINT [DF_CatalogoAuditorias_CriadoEm]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoAnexos] ADD  CONSTRAINT [ProjetoAnexos_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoCustoTaxasHistorico] ADD  CONSTRAINT [ProjetoCustoTaxasHistorico_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[ProjetoApontamentos] ADD  CONSTRAINT [ProjetoApontamentos_Faturavel_df]  DEFAULT ((1)) FOR [Faturavel]

ALTER TABLE [dbo].[ProjetoApontamentos] ADD  CONSTRAINT [ProjetoApontamentos_Status_df]  DEFAULT ('RASCUNHO') FOR [Status]

ALTER TABLE [dbo].[ProjetoApontamentos] ADD  CONSTRAINT [ProjetoApontamentos_CustoSituacao_df]  DEFAULT ('NAO_APLICAVEL') FOR [CustoSituacao]

ALTER TABLE [dbo].[ProjetoApontamentos] ADD  CONSTRAINT [ProjetoApontamentos_Versao_df]  DEFAULT ((1)) FOR [Versao]

ALTER TABLE [dbo].[ProjetoApontamentos] ADD  CONSTRAINT [ProjetoApontamentos_CriadoEm_df]  DEFAULT (getdate()) FOR [CriadoEm]

ALTER TABLE [dbo].[Usuarios]  WITH CHECK ADD  CONSTRAINT [Usuarios_GrupoId_fkey] FOREIGN KEY([GrupoId])
REFERENCES [dbo].[GruposUsuarios] ([Id])
ON UPDATE CASCADE
ON DELETE SET NULL

ALTER TABLE [dbo].[Usuarios] CHECK CONSTRAINT [Usuarios_GrupoId_fkey]

ALTER TABLE [dbo].[Capacitacoes]  WITH CHECK ADD  CONSTRAINT [FK_Capacitacoes_Empresas_EmpresaId] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[Capacitacoes] CHECK CONSTRAINT [FK_Capacitacoes_Empresas_EmpresaId]

ALTER TABLE [dbo].[ChamadoCategorias]  WITH CHECK ADD  CONSTRAINT [ChamadoCategorias_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoCategorias] CHECK CONSTRAINT [ChamadoCategorias_EmpresaId_fkey]

ALTER TABLE [dbo].[ChamadoSequencias]  WITH CHECK ADD  CONSTRAINT [ChamadoSequencias_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoSequencias] CHECK CONSTRAINT [ChamadoSequencias_EmpresaId_fkey]

ALTER TABLE [dbo].[Equipes]  WITH CHECK ADD  CONSTRAINT [FK_Equipes_Empresas_EmpresaId] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[Equipes] CHECK CONSTRAINT [FK_Equipes_Empresas_EmpresaId]

ALTER TABLE [dbo].[EmpresaSolucoes]  WITH CHECK ADD  CONSTRAINT [EmpresaSolucoes_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[EmpresaSolucoes] CHECK CONSTRAINT [EmpresaSolucoes_EmpresaId_fkey]

ALTER TABLE [dbo].[EmpresaSolucoes]  WITH CHECK ADD  CONSTRAINT [EmpresaSolucoes_SolucaoId_fkey] FOREIGN KEY([SolucaoId])
REFERENCES [dbo].[Solucoes] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[EmpresaSolucoes] CHECK CONSTRAINT [EmpresaSolucoes_SolucaoId_fkey]

ALTER TABLE [dbo].[ChamadoPrioridades]  WITH CHECK ADD  CONSTRAINT [ChamadoPrioridades_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoPrioridades] CHECK CONSTRAINT [ChamadoPrioridades_EmpresaId_fkey]

ALTER TABLE [dbo].[ChamadoTipos]  WITH CHECK ADD  CONSTRAINT [ChamadoTipos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoTipos] CHECK CONSTRAINT [ChamadoTipos_EmpresaId_fkey]

ALTER TABLE [dbo].[FuncionalidadeAgrupamentos]  WITH CHECK ADD  CONSTRAINT [FK_FuncionalidadeAgrupamentos_Solucoes] FOREIGN KEY([SolucaoId])
REFERENCES [dbo].[Solucoes] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[FuncionalidadeAgrupamentos] CHECK CONSTRAINT [FK_FuncionalidadeAgrupamentos_Solucoes]

ALTER TABLE [dbo].[GrupoSolucoes]  WITH CHECK ADD  CONSTRAINT [GrupoSolucoes_GrupoId_fkey] FOREIGN KEY([GrupoId])
REFERENCES [dbo].[GruposUsuarios] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[GrupoSolucoes] CHECK CONSTRAINT [GrupoSolucoes_GrupoId_fkey]

ALTER TABLE [dbo].[GrupoSolucoes]  WITH CHECK ADD  CONSTRAINT [GrupoSolucoes_SolucaoId_fkey] FOREIGN KEY([SolucaoId])
REFERENCES [dbo].[Solucoes] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[GrupoSolucoes] CHECK CONSTRAINT [GrupoSolucoes_SolucaoId_fkey]

ALTER TABLE [dbo].[GoogleEmailContas]  WITH CHECK ADD  CONSTRAINT [GoogleEmailContas_CriadoPorId_fkey] FOREIGN KEY([CriadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[GoogleEmailContas] CHECK CONSTRAINT [GoogleEmailContas_CriadoPorId_fkey]

ALTER TABLE [dbo].[GoogleEmailContas]  WITH CHECK ADD  CONSTRAINT [GoogleEmailContas_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[GoogleEmailContas] CHECK CONSTRAINT [GoogleEmailContas_EmpresaId_fkey]

ALTER TABLE [dbo].[Funcionalidades]  WITH CHECK ADD  CONSTRAINT [FK_Funcionalidades_FuncionalidadeAgrupamentos] FOREIGN KEY([SolucaoId], [AgrupamentoId])
REFERENCES [dbo].[FuncionalidadeAgrupamentos] ([SolucaoId], [Id])

ALTER TABLE [dbo].[Funcionalidades] CHECK CONSTRAINT [FK_Funcionalidades_FuncionalidadeAgrupamentos]

ALTER TABLE [dbo].[Funcionalidades]  WITH CHECK ADD  CONSTRAINT [Funcionalidades_SolucaoId_fkey] FOREIGN KEY([SolucaoId])
REFERENCES [dbo].[Solucoes] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[Funcionalidades] CHECK CONSTRAINT [Funcionalidades_SolucaoId_fkey]

ALTER TABLE [dbo].[Projetos]  WITH CHECK ADD  CONSTRAINT [Projetos_ArquivadoPorId_fkey] FOREIGN KEY([ArquivadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[Projetos] CHECK CONSTRAINT [Projetos_ArquivadoPorId_fkey]

ALTER TABLE [dbo].[Projetos]  WITH CHECK ADD  CONSTRAINT [Projetos_CriadoPorId_fkey] FOREIGN KEY([CriadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[Projetos] CHECK CONSTRAINT [Projetos_CriadoPorId_fkey]

ALTER TABLE [dbo].[Projetos]  WITH CHECK ADD  CONSTRAINT [Projetos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[Projetos] CHECK CONSTRAINT [Projetos_EmpresaId_fkey]

ALTER TABLE [dbo].[Projetos]  WITH CHECK ADD  CONSTRAINT [Projetos_ResponsavelId_fkey] FOREIGN KEY([ResponsavelId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[Projetos] CHECK CONSTRAINT [Projetos_ResponsavelId_fkey]

ALTER TABLE [dbo].[ChamadoSlaRegras]  WITH CHECK ADD  CONSTRAINT [ChamadoSlaRegras_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoSlaRegras] CHECK CONSTRAINT [ChamadoSlaRegras_EmpresaId_fkey]

ALTER TABLE [dbo].[ChamadoSlaRegras]  WITH CHECK ADD  CONSTRAINT [ChamadoSlaRegras_PrioridadeId_fkey] FOREIGN KEY([PrioridadeId])
REFERENCES [dbo].[ChamadoPrioridades] ([Id])

ALTER TABLE [dbo].[ChamadoSlaRegras] CHECK CONSTRAINT [ChamadoSlaRegras_PrioridadeId_fkey]

ALTER TABLE [dbo].[EmpresaUsuarios]  WITH CHECK ADD  CONSTRAINT [EmpresaUsuarios_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])
ON UPDATE CASCADE

ALTER TABLE [dbo].[EmpresaUsuarios] CHECK CONSTRAINT [EmpresaUsuarios_EmpresaId_fkey]

ALTER TABLE [dbo].[EmpresaUsuarios]  WITH CHECK ADD  CONSTRAINT [EmpresaUsuarios_UsuarioId_fkey] FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])
ON UPDATE CASCADE

ALTER TABLE [dbo].[EmpresaUsuarios] CHECK CONSTRAINT [EmpresaUsuarios_UsuarioId_fkey]

ALTER TABLE [dbo].[ChamadoResponsaveis]  WITH CHECK ADD  CONSTRAINT [ChamadoResponsaveis_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoResponsaveis] CHECK CONSTRAINT [ChamadoResponsaveis_EmpresaId_fkey]

ALTER TABLE [dbo].[ChamadoResponsaveis]  WITH CHECK ADD  CONSTRAINT [ChamadoResponsaveis_GrupoId_fkey] FOREIGN KEY([GrupoId])
REFERENCES [dbo].[GruposUsuarios] ([Id])

ALTER TABLE [dbo].[ChamadoResponsaveis] CHECK CONSTRAINT [ChamadoResponsaveis_GrupoId_fkey]

ALTER TABLE [dbo].[ChamadoResponsaveis]  WITH CHECK ADD  CONSTRAINT [ChamadoResponsaveis_UsuarioId_fkey] FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ChamadoResponsaveis] CHECK CONSTRAINT [ChamadoResponsaveis_UsuarioId_fkey]

ALTER TABLE [dbo].[Recursos]  WITH CHECK ADD  CONSTRAINT [FK_Recursos_Capacitacoes_CapacitacaoId] FOREIGN KEY([CapacitacaoId])
REFERENCES [dbo].[Capacitacoes] ([Id])

ALTER TABLE [dbo].[Recursos] CHECK CONSTRAINT [FK_Recursos_Capacitacoes_CapacitacaoId]

ALTER TABLE [dbo].[Recursos]  WITH CHECK ADD  CONSTRAINT [Recursos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[Recursos] CHECK CONSTRAINT [Recursos_EmpresaId_fkey]

ALTER TABLE [dbo].[Recursos]  WITH CHECK ADD  CONSTRAINT [Recursos_UsuarioId_fkey] FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[Recursos] CHECK CONSTRAINT [Recursos_UsuarioId_fkey]

ALTER TABLE [dbo].[ProjetoSequencias]  WITH CHECK ADD  CONSTRAINT [ProjetoSequencias_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoSequencias] CHECK CONSTRAINT [ProjetoSequencias_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoOrcamentos]  WITH CHECK ADD  CONSTRAINT [ProjetoOrcamentos_AprovadoPorId_fkey] FOREIGN KEY([AprovadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoOrcamentos] CHECK CONSTRAINT [ProjetoOrcamentos_AprovadoPorId_fkey]

ALTER TABLE [dbo].[ProjetoOrcamentos]  WITH CHECK ADD  CONSTRAINT [ProjetoOrcamentos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoOrcamentos] CHECK CONSTRAINT [ProjetoOrcamentos_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoOrcamentos]  WITH CHECK ADD  CONSTRAINT [ProjetoOrcamentos_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoOrcamentos] CHECK CONSTRAINT [ProjetoOrcamentos_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoSprints]  WITH CHECK ADD  CONSTRAINT [ProjetoSprints_CanceladoPorId_fkey] FOREIGN KEY([CanceladoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoSprints] CHECK CONSTRAINT [ProjetoSprints_CanceladoPorId_fkey]

ALTER TABLE [dbo].[ProjetoSprints]  WITH CHECK ADD  CONSTRAINT [ProjetoSprints_CriadoPorId_fkey] FOREIGN KEY([CriadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoSprints] CHECK CONSTRAINT [ProjetoSprints_CriadoPorId_fkey]

ALTER TABLE [dbo].[ProjetoSprints]  WITH CHECK ADD  CONSTRAINT [ProjetoSprints_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoSprints] CHECK CONSTRAINT [ProjetoSprints_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoSprints]  WITH CHECK ADD  CONSTRAINT [ProjetoSprints_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoSprints] CHECK CONSTRAINT [ProjetoSprints_ProjetoId_fkey]

ALTER TABLE [dbo].[EmpresaFuncionalidades]  WITH CHECK ADD  CONSTRAINT [EmpresaFuncionalidades_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[EmpresaFuncionalidades] CHECK CONSTRAINT [EmpresaFuncionalidades_EmpresaId_fkey]

ALTER TABLE [dbo].[EmpresaFuncionalidades]  WITH CHECK ADD  CONSTRAINT [EmpresaFuncionalidades_FuncionalidadeId_fkey] FOREIGN KEY([FuncionalidadeId])
REFERENCES [dbo].[Funcionalidades] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[EmpresaFuncionalidades] CHECK CONSTRAINT [EmpresaFuncionalidades_FuncionalidadeId_fkey]

ALTER TABLE [dbo].[Chamados]  WITH CHECK ADD  CONSTRAINT [Chamados_CategoriaId_fkey] FOREIGN KEY([CategoriaId])
REFERENCES [dbo].[ChamadoCategorias] ([Id])

ALTER TABLE [dbo].[Chamados] CHECK CONSTRAINT [Chamados_CategoriaId_fkey]

ALTER TABLE [dbo].[Chamados]  WITH CHECK ADD  CONSTRAINT [Chamados_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[Chamados] CHECK CONSTRAINT [Chamados_EmpresaId_fkey]

ALTER TABLE [dbo].[Chamados]  WITH CHECK ADD  CONSTRAINT [Chamados_FuncionalidadeId_fkey] FOREIGN KEY([FuncionalidadeId])
REFERENCES [dbo].[Funcionalidades] ([Id])

ALTER TABLE [dbo].[Chamados] CHECK CONSTRAINT [Chamados_FuncionalidadeId_fkey]

ALTER TABLE [dbo].[Chamados]  WITH CHECK ADD  CONSTRAINT [Chamados_LiderAtendimentoId_fkey] FOREIGN KEY([LiderAtendimentoId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[Chamados] CHECK CONSTRAINT [Chamados_LiderAtendimentoId_fkey]

ALTER TABLE [dbo].[Chamados]  WITH CHECK ADD  CONSTRAINT [Chamados_PrioridadeId_fkey] FOREIGN KEY([PrioridadeId])
REFERENCES [dbo].[ChamadoPrioridades] ([Id])

ALTER TABLE [dbo].[Chamados] CHECK CONSTRAINT [Chamados_PrioridadeId_fkey]

ALTER TABLE [dbo].[Chamados]  WITH CHECK ADD  CONSTRAINT [Chamados_ResponsavelGrupoId_fkey] FOREIGN KEY([ResponsavelGrupoId])
REFERENCES [dbo].[GruposUsuarios] ([Id])

ALTER TABLE [dbo].[Chamados] CHECK CONSTRAINT [Chamados_ResponsavelGrupoId_fkey]

ALTER TABLE [dbo].[Chamados]  WITH CHECK ADD  CONSTRAINT [Chamados_ResponsavelId_fkey] FOREIGN KEY([ResponsavelId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[Chamados] CHECK CONSTRAINT [Chamados_ResponsavelId_fkey]

ALTER TABLE [dbo].[Chamados]  WITH CHECK ADD  CONSTRAINT [Chamados_SlaRegraId_fkey] FOREIGN KEY([SlaRegraId])
REFERENCES [dbo].[ChamadoSlaRegras] ([Id])

ALTER TABLE [dbo].[Chamados] CHECK CONSTRAINT [Chamados_SlaRegraId_fkey]

ALTER TABLE [dbo].[Chamados]  WITH CHECK ADD  CONSTRAINT [Chamados_SolicitanteId_fkey] FOREIGN KEY([SolicitanteId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[Chamados] CHECK CONSTRAINT [Chamados_SolicitanteId_fkey]

ALTER TABLE [dbo].[Chamados]  WITH CHECK ADD  CONSTRAINT [Chamados_SolucaoId_fkey] FOREIGN KEY([SolucaoId])
REFERENCES [dbo].[Solucoes] ([Id])

ALTER TABLE [dbo].[Chamados] CHECK CONSTRAINT [Chamados_SolucaoId_fkey]

ALTER TABLE [dbo].[Chamados]  WITH CHECK ADD  CONSTRAINT [Chamados_TipoId_fkey] FOREIGN KEY([TipoId])
REFERENCES [dbo].[ChamadoTipos] ([Id])

ALTER TABLE [dbo].[Chamados] CHECK CONSTRAINT [Chamados_TipoId_fkey]

ALTER TABLE [dbo].[ChamadoResponsavelSolucoes]  WITH CHECK ADD  CONSTRAINT [ChamadoResponsavelSolucoes_ResponsavelId_fkey] FOREIGN KEY([ResponsavelId])
REFERENCES [dbo].[ChamadoResponsaveis] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoResponsavelSolucoes] CHECK CONSTRAINT [ChamadoResponsavelSolucoes_ResponsavelId_fkey]

ALTER TABLE [dbo].[ChamadoResponsavelSolucoes]  WITH CHECK ADD  CONSTRAINT [ChamadoResponsavelSolucoes_SolucaoId_fkey] FOREIGN KEY([SolucaoId])
REFERENCES [dbo].[Solucoes] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoResponsavelSolucoes] CHECK CONSTRAINT [ChamadoResponsavelSolucoes_SolucaoId_fkey]

ALTER TABLE [dbo].[EquipeRecursos]  WITH CHECK ADD  CONSTRAINT [FK_EquipeRecursos_Empresas_EmpresaId] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[EquipeRecursos] CHECK CONSTRAINT [FK_EquipeRecursos_Empresas_EmpresaId]

ALTER TABLE [dbo].[EquipeRecursos]  WITH CHECK ADD  CONSTRAINT [FK_EquipeRecursos_Equipes_EquipeId] FOREIGN KEY([EquipeId])
REFERENCES [dbo].[Equipes] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[EquipeRecursos] CHECK CONSTRAINT [FK_EquipeRecursos_Equipes_EquipeId]

ALTER TABLE [dbo].[EquipeRecursos]  WITH CHECK ADD  CONSTRAINT [FK_EquipeRecursos_Recursos_RecursoId] FOREIGN KEY([RecursoId])
REFERENCES [dbo].[Recursos] ([Id])

ALTER TABLE [dbo].[EquipeRecursos] CHECK CONSTRAINT [FK_EquipeRecursos_Recursos_RecursoId]

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentoPeriodos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] CHECK CONSTRAINT [ProjetoApontamentoPeriodos_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentoPeriodos_FechadoPorId_fkey] FOREIGN KEY([FechadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] CHECK CONSTRAINT [ProjetoApontamentoPeriodos_FechadoPorId_fkey]

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentoPeriodos_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] CHECK CONSTRAINT [ProjetoApontamentoPeriodos_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentoPeriodos_ReabertoPorId_fkey] FOREIGN KEY([ReabertoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] CHECK CONSTRAINT [ProjetoApontamentoPeriodos_ReabertoPorId_fkey]

ALTER TABLE [dbo].[ProjetoOperacoesIdempotentes]  WITH CHECK ADD  CONSTRAINT [ProjetoOperacoesIdempotentes_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoOperacoesIdempotentes] CHECK CONSTRAINT [ProjetoOperacoesIdempotentes_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoOperacoesIdempotentes]  WITH CHECK ADD  CONSTRAINT [ProjetoOperacoesIdempotentes_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoOperacoesIdempotentes] CHECK CONSTRAINT [ProjetoOperacoesIdempotentes_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoOperacoesIdempotentes]  WITH CHECK ADD  CONSTRAINT [ProjetoOperacoesIdempotentes_UsuarioId_fkey] FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoOperacoesIdempotentes] CHECK CONSTRAINT [ProjetoOperacoesIdempotentes_UsuarioId_fkey]

ALTER TABLE [dbo].[ProjetoMembros]  WITH CHECK ADD  CONSTRAINT [ProjetoMembros_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoMembros] CHECK CONSTRAINT [ProjetoMembros_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoMembros]  WITH CHECK ADD  CONSTRAINT [ProjetoMembros_UsuarioId_fkey] FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoMembros] CHECK CONSTRAINT [ProjetoMembros_UsuarioId_fkey]

ALTER TABLE [dbo].[ProjetoMarcos]  WITH CHECK ADD  CONSTRAINT [ProjetoMarcos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoMarcos] CHECK CONSTRAINT [ProjetoMarcos_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoMarcos]  WITH CHECK ADD  CONSTRAINT [ProjetoMarcos_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoMarcos] CHECK CONSTRAINT [ProjetoMarcos_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoMarcos]  WITH CHECK ADD  CONSTRAINT [ProjetoMarcos_ResponsavelId_fkey] FOREIGN KEY([ResponsavelId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoMarcos] CHECK CONSTRAINT [ProjetoMarcos_ResponsavelId_fkey]

ALTER TABLE [dbo].[ProjetoItens]  WITH CHECK ADD  CONSTRAINT [ProjetoItens_ArquivadoPorId_fkey] FOREIGN KEY([ArquivadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoItens] CHECK CONSTRAINT [ProjetoItens_ArquivadoPorId_fkey]

ALTER TABLE [dbo].[ProjetoItens]  WITH CHECK ADD  CONSTRAINT [ProjetoItens_AutorId_fkey] FOREIGN KEY([AutorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoItens] CHECK CONSTRAINT [ProjetoItens_AutorId_fkey]

ALTER TABLE [dbo].[ProjetoItens]  WITH CHECK ADD  CONSTRAINT [ProjetoItens_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoItens] CHECK CONSTRAINT [ProjetoItens_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoItens]  WITH CHECK ADD  CONSTRAINT [ProjetoItens_PaiId_fkey] FOREIGN KEY([PaiId])
REFERENCES [dbo].[ProjetoItens] ([Id])

ALTER TABLE [dbo].[ProjetoItens] CHECK CONSTRAINT [ProjetoItens_PaiId_fkey]

ALTER TABLE [dbo].[ProjetoItens]  WITH CHECK ADD  CONSTRAINT [ProjetoItens_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoItens] CHECK CONSTRAINT [ProjetoItens_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoItens]  WITH CHECK ADD  CONSTRAINT [ProjetoItens_ResponsavelId_fkey] FOREIGN KEY([ResponsavelId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoItens] CHECK CONSTRAINT [ProjetoItens_ResponsavelId_fkey]

ALTER TABLE [dbo].[ProjetoRecursos]  WITH CHECK ADD  CONSTRAINT [ProjetoRecursos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoRecursos] CHECK CONSTRAINT [ProjetoRecursos_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoRecursos]  WITH CHECK ADD  CONSTRAINT [ProjetoRecursos_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoRecursos] CHECK CONSTRAINT [ProjetoRecursos_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoRecursos]  WITH CHECK ADD  CONSTRAINT [ProjetoRecursos_RecursoId_fkey] FOREIGN KEY([RecursoId])
REFERENCES [dbo].[Recursos] ([Id])

ALTER TABLE [dbo].[ProjetoRecursos] CHECK CONSTRAINT [ProjetoRecursos_RecursoId_fkey]

ALTER TABLE [dbo].[ProjetoEventos]  WITH CHECK ADD  CONSTRAINT [ProjetoEventos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoEventos] CHECK CONSTRAINT [ProjetoEventos_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoEventos]  WITH CHECK ADD  CONSTRAINT [ProjetoEventos_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoEventos] CHECK CONSTRAINT [ProjetoEventos_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoEventos]  WITH CHECK ADD  CONSTRAINT [ProjetoEventos_UsuarioId_fkey] FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoEventos] CHECK CONSTRAINT [ProjetoEventos_UsuarioId_fkey]

ALTER TABLE [dbo].[ProjetoEquipes]  WITH CHECK ADD  CONSTRAINT [FK_ProjetoEquipes_Empresas_EmpresaId] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoEquipes] CHECK CONSTRAINT [FK_ProjetoEquipes_Empresas_EmpresaId]

ALTER TABLE [dbo].[ProjetoEquipes]  WITH CHECK ADD  CONSTRAINT [FK_ProjetoEquipes_Equipes_EquipeId] FOREIGN KEY([EquipeId])
REFERENCES [dbo].[Equipes] ([Id])

ALTER TABLE [dbo].[ProjetoEquipes] CHECK CONSTRAINT [FK_ProjetoEquipes_Equipes_EquipeId]

ALTER TABLE [dbo].[ProjetoEquipes]  WITH CHECK ADD  CONSTRAINT [FK_ProjetoEquipes_Projetos_ProjetoId] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoEquipes] CHECK CONSTRAINT [FK_ProjetoEquipes_Projetos_ProjetoId]

ALTER TABLE [dbo].[FuncionalidadeAcoes]  WITH CHECK ADD  CONSTRAINT [FuncionalidadeAcoes_FuncionalidadeId_fkey] FOREIGN KEY([FuncionalidadeId])
REFERENCES [dbo].[Funcionalidades] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[FuncionalidadeAcoes] CHECK CONSTRAINT [FuncionalidadeAcoes_FuncionalidadeId_fkey]

ALTER TABLE [dbo].[ProjetoAtualizacoes]  WITH CHECK ADD  CONSTRAINT [ProjetoAtualizacoes_AutorId_fkey] FOREIGN KEY([AutorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoAtualizacoes] CHECK CONSTRAINT [ProjetoAtualizacoes_AutorId_fkey]

ALTER TABLE [dbo].[ProjetoAtualizacoes]  WITH CHECK ADD  CONSTRAINT [ProjetoAtualizacoes_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoAtualizacoes] CHECK CONSTRAINT [ProjetoAtualizacoes_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoAtualizacoes]  WITH CHECK ADD  CONSTRAINT [ProjetoAtualizacoes_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoAtualizacoes] CHECK CONSTRAINT [ProjetoAtualizacoes_ProjetoId_fkey]

ALTER TABLE [dbo].[GrupoFuncionalidades]  WITH CHECK ADD  CONSTRAINT [GrupoFuncionalidades_FuncionalidadeId_fkey] FOREIGN KEY([FuncionalidadeId])
REFERENCES [dbo].[Funcionalidades] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[GrupoFuncionalidades] CHECK CONSTRAINT [GrupoFuncionalidades_FuncionalidadeId_fkey]

ALTER TABLE [dbo].[GrupoFuncionalidades]  WITH CHECK ADD  CONSTRAINT [GrupoFuncionalidades_GrupoId_fkey] FOREIGN KEY([GrupoId])
REFERENCES [dbo].[GruposUsuarios] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[GrupoFuncionalidades] CHECK CONSTRAINT [GrupoFuncionalidades_GrupoId_fkey]

ALTER TABLE [dbo].[GrupoFuncionalidadeAcoes]  WITH CHECK ADD  CONSTRAINT [GrupoFuncionalidadeAcoes_FuncionalidadeAcaoId_fkey] FOREIGN KEY([FuncionalidadeAcaoId])
REFERENCES [dbo].[FuncionalidadeAcoes] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[GrupoFuncionalidadeAcoes] CHECK CONSTRAINT [GrupoFuncionalidadeAcoes_FuncionalidadeAcaoId_fkey]

ALTER TABLE [dbo].[GrupoFuncionalidadeAcoes]  WITH CHECK ADD  CONSTRAINT [GrupoFuncionalidadeAcoes_GrupoId_fkey] FOREIGN KEY([GrupoId])
REFERENCES [dbo].[GruposUsuarios] ([Id])
ON UPDATE CASCADE
ON DELETE CASCADE

ALTER TABLE [dbo].[GrupoFuncionalidadeAcoes] CHECK CONSTRAINT [GrupoFuncionalidadeAcoes_GrupoId_fkey]

ALTER TABLE [dbo].[ProjetoAtualizacaoHistoricos]  WITH CHECK ADD  CONSTRAINT [ProjetoAtualizacaoHistoricos_AtualizacaoId_fkey] FOREIGN KEY([AtualizacaoId])
REFERENCES [dbo].[ProjetoAtualizacoes] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ProjetoAtualizacaoHistoricos] CHECK CONSTRAINT [ProjetoAtualizacaoHistoricos_AtualizacaoId_fkey]

ALTER TABLE [dbo].[ProjetoAtualizacaoHistoricos]  WITH CHECK ADD  CONSTRAINT [ProjetoAtualizacaoHistoricos_EditorId_fkey] FOREIGN KEY([EditorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoAtualizacaoHistoricos] CHECK CONSTRAINT [ProjetoAtualizacaoHistoricos_EditorId_fkey]

ALTER TABLE [dbo].[ProjetoEntregas]  WITH CHECK ADD  CONSTRAINT [ProjetoEntregas_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoEntregas] CHECK CONSTRAINT [ProjetoEntregas_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoEntregas]  WITH CHECK ADD  CONSTRAINT [ProjetoEntregas_MarcoId_fkey] FOREIGN KEY([MarcoId])
REFERENCES [dbo].[ProjetoMarcos] ([Id])

ALTER TABLE [dbo].[ProjetoEntregas] CHECK CONSTRAINT [ProjetoEntregas_MarcoId_fkey]

ALTER TABLE [dbo].[ProjetoEntregas]  WITH CHECK ADD  CONSTRAINT [ProjetoEntregas_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoEntregas] CHECK CONSTRAINT [ProjetoEntregas_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoEntregas]  WITH CHECK ADD  CONSTRAINT [ProjetoEntregas_ResponsavelId_fkey] FOREIGN KEY([ResponsavelId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoEntregas] CHECK CONSTRAINT [ProjetoEntregas_ResponsavelId_fkey]

ALTER TABLE [dbo].[ProjetoRecursoEquipes]  WITH CHECK ADD  CONSTRAINT [FK_ProjetoRecursoEquipes_Empresas_EmpresaId] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoRecursoEquipes] CHECK CONSTRAINT [FK_ProjetoRecursoEquipes_Empresas_EmpresaId]

ALTER TABLE [dbo].[ProjetoRecursoEquipes]  WITH CHECK ADD  CONSTRAINT [FK_ProjetoRecursoEquipes_ProjetoEquipes_ProjetoEquipeId] FOREIGN KEY([ProjetoEquipeId])
REFERENCES [dbo].[ProjetoEquipes] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ProjetoRecursoEquipes] CHECK CONSTRAINT [FK_ProjetoRecursoEquipes_ProjetoEquipes_ProjetoEquipeId]

ALTER TABLE [dbo].[ProjetoRecursoEquipes]  WITH CHECK ADD  CONSTRAINT [FK_ProjetoRecursoEquipes_ProjetoRecursos_ProjetoRecursoId] FOREIGN KEY([ProjetoRecursoId])
REFERENCES [dbo].[ProjetoRecursos] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ProjetoRecursoEquipes] CHECK CONSTRAINT [FK_ProjetoRecursoEquipes_ProjetoRecursos_ProjetoRecursoId]

ALTER TABLE [dbo].[ProjetoItemDependencias]  WITH CHECK ADD  CONSTRAINT [ProjetoItemDependencias_ArquivadoPorId_fkey] FOREIGN KEY([ArquivadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoItemDependencias] CHECK CONSTRAINT [ProjetoItemDependencias_ArquivadoPorId_fkey]

ALTER TABLE [dbo].[ProjetoItemDependencias]  WITH CHECK ADD  CONSTRAINT [ProjetoItemDependencias_BloqueadoId_fkey] FOREIGN KEY([BloqueadoId])
REFERENCES [dbo].[ProjetoItens] ([Id])

ALTER TABLE [dbo].[ProjetoItemDependencias] CHECK CONSTRAINT [ProjetoItemDependencias_BloqueadoId_fkey]

ALTER TABLE [dbo].[ProjetoItemDependencias]  WITH CHECK ADD  CONSTRAINT [ProjetoItemDependencias_BloqueadorId_fkey] FOREIGN KEY([BloqueadorId])
REFERENCES [dbo].[ProjetoItens] ([Id])

ALTER TABLE [dbo].[ProjetoItemDependencias] CHECK CONSTRAINT [ProjetoItemDependencias_BloqueadorId_fkey]

ALTER TABLE [dbo].[ProjetoItemDependencias]  WITH CHECK ADD  CONSTRAINT [ProjetoItemDependencias_CriadoPorId_fkey] FOREIGN KEY([CriadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoItemDependencias] CHECK CONSTRAINT [ProjetoItemDependencias_CriadoPorId_fkey]

ALTER TABLE [dbo].[ProjetoItemDependencias]  WITH CHECK ADD  CONSTRAINT [ProjetoItemDependencias_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoItemDependencias] CHECK CONSTRAINT [ProjetoItemDependencias_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoItemDependencias]  WITH CHECK ADD  CONSTRAINT [ProjetoItemDependencias_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoItemDependencias] CHECK CONSTRAINT [ProjetoItemDependencias_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoMarcoItens]  WITH CHECK ADD  CONSTRAINT [ProjetoMarcoItens_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoMarcoItens] CHECK CONSTRAINT [ProjetoMarcoItens_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoMarcoItens]  WITH CHECK ADD  CONSTRAINT [ProjetoMarcoItens_ItemId_fkey] FOREIGN KEY([ItemId])
REFERENCES [dbo].[ProjetoItens] ([Id])

ALTER TABLE [dbo].[ProjetoMarcoItens] CHECK CONSTRAINT [ProjetoMarcoItens_ItemId_fkey]

ALTER TABLE [dbo].[ProjetoMarcoItens]  WITH CHECK ADD  CONSTRAINT [ProjetoMarcoItens_MarcoId_fkey] FOREIGN KEY([MarcoId])
REFERENCES [dbo].[ProjetoMarcos] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ProjetoMarcoItens] CHECK CONSTRAINT [ProjetoMarcoItens_MarcoId_fkey]

ALTER TABLE [dbo].[ProjetoMarcoItens]  WITH CHECK ADD  CONSTRAINT [ProjetoMarcoItens_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoMarcoItens] CHECK CONSTRAINT [ProjetoMarcoItens_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoComentarios]  WITH CHECK ADD  CONSTRAINT [ProjetoComentarios_AtualizacaoId_fkey] FOREIGN KEY([AtualizacaoId])
REFERENCES [dbo].[ProjetoAtualizacoes] ([Id])

ALTER TABLE [dbo].[ProjetoComentarios] CHECK CONSTRAINT [ProjetoComentarios_AtualizacaoId_fkey]

ALTER TABLE [dbo].[ProjetoComentarios]  WITH CHECK ADD  CONSTRAINT [ProjetoComentarios_AutorId_fkey] FOREIGN KEY([AutorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoComentarios] CHECK CONSTRAINT [ProjetoComentarios_AutorId_fkey]

ALTER TABLE [dbo].[ProjetoComentarios]  WITH CHECK ADD  CONSTRAINT [ProjetoComentarios_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoComentarios] CHECK CONSTRAINT [ProjetoComentarios_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoComentarios]  WITH CHECK ADD  CONSTRAINT [ProjetoComentarios_ExcluidoPorId_fkey] FOREIGN KEY([ExcluidoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoComentarios] CHECK CONSTRAINT [ProjetoComentarios_ExcluidoPorId_fkey]

ALTER TABLE [dbo].[ProjetoComentarios]  WITH CHECK ADD  CONSTRAINT [ProjetoComentarios_ItemId_fkey] FOREIGN KEY([ItemId])
REFERENCES [dbo].[ProjetoItens] ([Id])

ALTER TABLE [dbo].[ProjetoComentarios] CHECK CONSTRAINT [ProjetoComentarios_ItemId_fkey]

ALTER TABLE [dbo].[ProjetoComentarios]  WITH CHECK ADD  CONSTRAINT [ProjetoComentarios_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoComentarios] CHECK CONSTRAINT [ProjetoComentarios_ProjetoId_fkey]

ALTER TABLE [dbo].[ChamadoNotificacoes]  WITH CHECK ADD  CONSTRAINT [ChamadoNotificacoes_ChamadoId_fkey] FOREIGN KEY([ChamadoId])
REFERENCES [dbo].[Chamados] ([Id])

ALTER TABLE [dbo].[ChamadoNotificacoes] CHECK CONSTRAINT [ChamadoNotificacoes_ChamadoId_fkey]

ALTER TABLE [dbo].[ChamadoNotificacoes]  WITH CHECK ADD  CONSTRAINT [ChamadoNotificacoes_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ChamadoNotificacoes] CHECK CONSTRAINT [ChamadoNotificacoes_EmpresaId_fkey]

ALTER TABLE [dbo].[ChamadoNotificacoes]  WITH CHECK ADD  CONSTRAINT [ChamadoNotificacoes_UsuarioId_fkey] FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ChamadoNotificacoes] CHECK CONSTRAINT [ChamadoNotificacoes_UsuarioId_fkey]

ALTER TABLE [dbo].[ChamadoMensagens]  WITH CHECK ADD  CONSTRAINT [ChamadoMensagens_AutorId_fkey] FOREIGN KEY([AutorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ChamadoMensagens] CHECK CONSTRAINT [ChamadoMensagens_AutorId_fkey]

ALTER TABLE [dbo].[ChamadoMensagens]  WITH CHECK ADD  CONSTRAINT [ChamadoMensagens_ChamadoId_fkey] FOREIGN KEY([ChamadoId])
REFERENCES [dbo].[Chamados] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoMensagens] CHECK CONSTRAINT [ChamadoMensagens_ChamadoId_fkey]

ALTER TABLE [dbo].[ChamadoMensagens]  WITH CHECK ADD  CONSTRAINT [ChamadoMensagens_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ChamadoMensagens] CHECK CONSTRAINT [ChamadoMensagens_EmpresaId_fkey]

ALTER TABLE [dbo].[ChamadoHistorico]  WITH CHECK ADD  CONSTRAINT [ChamadoHistorico_ChamadoId_fkey] FOREIGN KEY([ChamadoId])
REFERENCES [dbo].[Chamados] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoHistorico] CHECK CONSTRAINT [ChamadoHistorico_ChamadoId_fkey]

ALTER TABLE [dbo].[ChamadoHistorico]  WITH CHECK ADD  CONSTRAINT [ChamadoHistorico_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ChamadoHistorico] CHECK CONSTRAINT [ChamadoHistorico_EmpresaId_fkey]

ALTER TABLE [dbo].[ChamadoHistorico]  WITH CHECK ADD  CONSTRAINT [ChamadoHistorico_UsuarioId_fkey] FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ChamadoHistorico] CHECK CONSTRAINT [ChamadoHistorico_UsuarioId_fkey]

ALTER TABLE [dbo].[ChamadoResponsavelFuncionalidades]  WITH CHECK ADD  CONSTRAINT [ChamadoResponsavelFuncionalidades_FuncionalidadeId_fkey] FOREIGN KEY([FuncionalidadeId])
REFERENCES [dbo].[Funcionalidades] ([Id])

ALTER TABLE [dbo].[ChamadoResponsavelFuncionalidades] CHECK CONSTRAINT [ChamadoResponsavelFuncionalidades_FuncionalidadeId_fkey]

ALTER TABLE [dbo].[ChamadoResponsavelFuncionalidades]  WITH CHECK ADD  CONSTRAINT [ChamadoResponsavelFuncionalidades_ResponsavelSolucaoId_fkey] FOREIGN KEY([ResponsavelSolucaoId])
REFERENCES [dbo].[ChamadoResponsavelSolucoes] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoResponsavelFuncionalidades] CHECK CONSTRAINT [ChamadoResponsavelFuncionalidades_ResponsavelSolucaoId_fkey]

ALTER TABLE [dbo].[ChamadoAcompanhantes]  WITH CHECK ADD  CONSTRAINT [ChamadoAcompanhantes_AdicionadoPorId_fkey] FOREIGN KEY([AdicionadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ChamadoAcompanhantes] CHECK CONSTRAINT [ChamadoAcompanhantes_AdicionadoPorId_fkey]

ALTER TABLE [dbo].[ChamadoAcompanhantes]  WITH CHECK ADD  CONSTRAINT [ChamadoAcompanhantes_ChamadoId_fkey] FOREIGN KEY([ChamadoId])
REFERENCES [dbo].[Chamados] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoAcompanhantes] CHECK CONSTRAINT [ChamadoAcompanhantes_ChamadoId_fkey]

ALTER TABLE [dbo].[ChamadoAcompanhantes]  WITH CHECK ADD  CONSTRAINT [ChamadoAcompanhantes_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ChamadoAcompanhantes] CHECK CONSTRAINT [ChamadoAcompanhantes_EmpresaId_fkey]

ALTER TABLE [dbo].[ChamadoAcompanhantes]  WITH CHECK ADD  CONSTRAINT [ChamadoAcompanhantes_UsuarioId_fkey] FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ChamadoAcompanhantes] CHECK CONSTRAINT [ChamadoAcompanhantes_UsuarioId_fkey]

ALTER TABLE [dbo].[CatalogoVersoes]  WITH CHECK ADD  CONSTRAINT [FK_CatalogoVersoes_CriadoPor] FOREIGN KEY([CriadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[CatalogoVersoes] CHECK CONSTRAINT [FK_CatalogoVersoes_CriadoPor]

ALTER TABLE [dbo].[CatalogoVersoes]  WITH CHECK ADD  CONSTRAINT [FK_CatalogoVersoes_FuncionalidadeAcoes] FOREIGN KEY([FuncionalidadeAcaoId])
REFERENCES [dbo].[FuncionalidadeAcoes] ([Id])

ALTER TABLE [dbo].[CatalogoVersoes] CHECK CONSTRAINT [FK_CatalogoVersoes_FuncionalidadeAcoes]

ALTER TABLE [dbo].[CatalogoVersoes]  WITH CHECK ADD  CONSTRAINT [FK_CatalogoVersoes_Funcionalidades] FOREIGN KEY([FuncionalidadeId])
REFERENCES [dbo].[Funcionalidades] ([Id])

ALTER TABLE [dbo].[CatalogoVersoes] CHECK CONSTRAINT [FK_CatalogoVersoes_Funcionalidades]

ALTER TABLE [dbo].[CatalogoVersoes]  WITH CHECK ADD  CONSTRAINT [FK_CatalogoVersoes_PublicadoPor] FOREIGN KEY([PublicadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[CatalogoVersoes] CHECK CONSTRAINT [FK_CatalogoVersoes_PublicadoPor]

ALTER TABLE [dbo].[CatalogoVersoes]  WITH CHECK ADD  CONSTRAINT [FK_CatalogoVersoes_Solucoes] FOREIGN KEY([SolucaoId])
REFERENCES [dbo].[Solucoes] ([Id])

ALTER TABLE [dbo].[CatalogoVersoes] CHECK CONSTRAINT [FK_CatalogoVersoes_Solucoes]

ALTER TABLE [dbo].[ProjetoSprintItens]  WITH CHECK ADD  CONSTRAINT [ProjetoSprintItens_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoSprintItens] CHECK CONSTRAINT [ProjetoSprintItens_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoSprintItens]  WITH CHECK ADD  CONSTRAINT [ProjetoSprintItens_IncluidoPorId_fkey] FOREIGN KEY([IncluidoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoSprintItens] CHECK CONSTRAINT [ProjetoSprintItens_IncluidoPorId_fkey]

ALTER TABLE [dbo].[ProjetoSprintItens]  WITH CHECK ADD  CONSTRAINT [ProjetoSprintItens_ItemId_fkey] FOREIGN KEY([ItemId])
REFERENCES [dbo].[ProjetoItens] ([Id])

ALTER TABLE [dbo].[ProjetoSprintItens] CHECK CONSTRAINT [ProjetoSprintItens_ItemId_fkey]

ALTER TABLE [dbo].[ProjetoSprintItens]  WITH CHECK ADD  CONSTRAINT [ProjetoSprintItens_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoSprintItens] CHECK CONSTRAINT [ProjetoSprintItens_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoSprintItens]  WITH CHECK ADD  CONSTRAINT [ProjetoSprintItens_RetiradoPorId_fkey] FOREIGN KEY([RetiradoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoSprintItens] CHECK CONSTRAINT [ProjetoSprintItens_RetiradoPorId_fkey]

ALTER TABLE [dbo].[ProjetoSprintItens]  WITH CHECK ADD  CONSTRAINT [ProjetoSprintItens_SprintId_fkey] FOREIGN KEY([SprintId])
REFERENCES [dbo].[ProjetoSprints] ([Id])

ALTER TABLE [dbo].[ProjetoSprintItens] CHECK CONSTRAINT [ProjetoSprintItens_SprintId_fkey]

ALTER TABLE [dbo].[ProjetoOrcamentoCategorias]  WITH CHECK ADD  CONSTRAINT [ProjetoOrcamentoCategorias_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoOrcamentoCategorias] CHECK CONSTRAINT [ProjetoOrcamentoCategorias_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoOrcamentoCategorias]  WITH CHECK ADD  CONSTRAINT [ProjetoOrcamentoCategorias_OrcamentoId_fkey] FOREIGN KEY([OrcamentoId])
REFERENCES [dbo].[ProjetoOrcamentos] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ProjetoOrcamentoCategorias] CHECK CONSTRAINT [ProjetoOrcamentoCategorias_OrcamentoId_fkey]

ALTER TABLE [dbo].[ProjetoOrcamentoCategorias]  WITH CHECK ADD  CONSTRAINT [ProjetoOrcamentoCategorias_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoOrcamentoCategorias] CHECK CONSTRAINT [ProjetoOrcamentoCategorias_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoCustos]  WITH CHECK ADD  CONSTRAINT [ProjetoCustos_CategoriaId_fkey] FOREIGN KEY([CategoriaId])
REFERENCES [dbo].[ProjetoOrcamentoCategorias] ([Id])

ALTER TABLE [dbo].[ProjetoCustos] CHECK CONSTRAINT [ProjetoCustos_CategoriaId_fkey]

ALTER TABLE [dbo].[ProjetoCustos]  WITH CHECK ADD  CONSTRAINT [ProjetoCustos_CriadoPorId_fkey] FOREIGN KEY([CriadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoCustos] CHECK CONSTRAINT [ProjetoCustos_CriadoPorId_fkey]

ALTER TABLE [dbo].[ProjetoCustos]  WITH CHECK ADD  CONSTRAINT [ProjetoCustos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoCustos] CHECK CONSTRAINT [ProjetoCustos_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoCustos]  WITH CHECK ADD  CONSTRAINT [ProjetoCustos_ItemId_fkey] FOREIGN KEY([ItemId])
REFERENCES [dbo].[ProjetoItens] ([Id])

ALTER TABLE [dbo].[ProjetoCustos] CHECK CONSTRAINT [ProjetoCustos_ItemId_fkey]

ALTER TABLE [dbo].[ProjetoCustos]  WITH CHECK ADD  CONSTRAINT [ProjetoCustos_OrcamentoId_fkey] FOREIGN KEY([OrcamentoId])
REFERENCES [dbo].[ProjetoOrcamentos] ([Id])

ALTER TABLE [dbo].[ProjetoCustos] CHECK CONSTRAINT [ProjetoCustos_OrcamentoId_fkey]

ALTER TABLE [dbo].[ProjetoCustos]  WITH CHECK ADD  CONSTRAINT [ProjetoCustos_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoCustos] CHECK CONSTRAINT [ProjetoCustos_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoCustos]  WITH CHECK ADD  CONSTRAINT [ProjetoCustos_RecursoId_fkey] FOREIGN KEY([RecursoId])
REFERENCES [dbo].[ProjetoRecursos] ([Id])

ALTER TABLE [dbo].[ProjetoCustos] CHECK CONSTRAINT [ProjetoCustos_RecursoId_fkey]

ALTER TABLE [dbo].[ChamadoAnexos]  WITH CHECK ADD  CONSTRAINT [ChamadoAnexos_AutorId_fkey] FOREIGN KEY([AutorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ChamadoAnexos] CHECK CONSTRAINT [ChamadoAnexos_AutorId_fkey]

ALTER TABLE [dbo].[ChamadoAnexos]  WITH CHECK ADD  CONSTRAINT [ChamadoAnexos_ChamadoId_fkey] FOREIGN KEY([ChamadoId])
REFERENCES [dbo].[Chamados] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ChamadoAnexos] CHECK CONSTRAINT [ChamadoAnexos_ChamadoId_fkey]

ALTER TABLE [dbo].[ChamadoAnexos]  WITH CHECK ADD  CONSTRAINT [ChamadoAnexos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ChamadoAnexos] CHECK CONSTRAINT [ChamadoAnexos_EmpresaId_fkey]

ALTER TABLE [dbo].[ChamadoAnexos]  WITH CHECK ADD  CONSTRAINT [ChamadoAnexos_MensagemId_fkey] FOREIGN KEY([MensagemId])
REFERENCES [dbo].[ChamadoMensagens] ([Id])

ALTER TABLE [dbo].[ChamadoAnexos] CHECK CONSTRAINT [ChamadoAnexos_MensagemId_fkey]

ALTER TABLE [dbo].[CatalogoConflitos]  WITH CHECK ADD  CONSTRAINT [FK_CatalogoConflitos_ResolvidoPor] FOREIGN KEY([ResolvidoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[CatalogoConflitos] CHECK CONSTRAINT [FK_CatalogoConflitos_ResolvidoPor]

ALTER TABLE [dbo].[CatalogoConflitos]  WITH CHECK ADD  CONSTRAINT [FK_CatalogoConflitos_Versao] FOREIGN KEY([VersaoId])
REFERENCES [dbo].[CatalogoVersoes] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[CatalogoConflitos] CHECK CONSTRAINT [FK_CatalogoConflitos_Versao]

ALTER TABLE [dbo].[CatalogoAuditorias]  WITH CHECK ADD  CONSTRAINT [FK_CatalogoAuditorias_Autor] FOREIGN KEY([AutorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[CatalogoAuditorias] CHECK CONSTRAINT [FK_CatalogoAuditorias_Autor]

ALTER TABLE [dbo].[CatalogoAuditorias]  WITH CHECK ADD  CONSTRAINT [FK_CatalogoAuditorias_Versao] FOREIGN KEY([VersaoId])
REFERENCES [dbo].[CatalogoVersoes] ([Id])

ALTER TABLE [dbo].[CatalogoAuditorias] CHECK CONSTRAINT [FK_CatalogoAuditorias_Versao]

ALTER TABLE [dbo].[ProjetoAnexos]  WITH CHECK ADD  CONSTRAINT [ProjetoAnexos_AtualizacaoId_fkey] FOREIGN KEY([AtualizacaoId])
REFERENCES [dbo].[ProjetoAtualizacoes] ([Id])

ALTER TABLE [dbo].[ProjetoAnexos] CHECK CONSTRAINT [ProjetoAnexos_AtualizacaoId_fkey]

ALTER TABLE [dbo].[ProjetoAnexos]  WITH CHECK ADD  CONSTRAINT [ProjetoAnexos_AutorId_fkey] FOREIGN KEY([AutorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoAnexos] CHECK CONSTRAINT [ProjetoAnexos_AutorId_fkey]

ALTER TABLE [dbo].[ProjetoAnexos]  WITH CHECK ADD  CONSTRAINT [ProjetoAnexos_ComentarioId_fkey] FOREIGN KEY([ComentarioId])
REFERENCES [dbo].[ProjetoComentarios] ([Id])

ALTER TABLE [dbo].[ProjetoAnexos] CHECK CONSTRAINT [ProjetoAnexos_ComentarioId_fkey]

ALTER TABLE [dbo].[ProjetoAnexos]  WITH CHECK ADD  CONSTRAINT [ProjetoAnexos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoAnexos] CHECK CONSTRAINT [ProjetoAnexos_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoAnexos]  WITH CHECK ADD  CONSTRAINT [ProjetoAnexos_ExcluidoPorId_fkey] FOREIGN KEY([ExcluidoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoAnexos] CHECK CONSTRAINT [ProjetoAnexos_ExcluidoPorId_fkey]

ALTER TABLE [dbo].[ProjetoAnexos]  WITH CHECK ADD  CONSTRAINT [ProjetoAnexos_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoAnexos] CHECK CONSTRAINT [ProjetoAnexos_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoEntregaItens]  WITH CHECK ADD  CONSTRAINT [ProjetoEntregaItens_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoEntregaItens] CHECK CONSTRAINT [ProjetoEntregaItens_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoEntregaItens]  WITH CHECK ADD  CONSTRAINT [ProjetoEntregaItens_EntregaId_fkey] FOREIGN KEY([EntregaId])
REFERENCES [dbo].[ProjetoEntregas] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ProjetoEntregaItens] CHECK CONSTRAINT [ProjetoEntregaItens_EntregaId_fkey]

ALTER TABLE [dbo].[ProjetoEntregaItens]  WITH CHECK ADD  CONSTRAINT [ProjetoEntregaItens_ItemId_fkey] FOREIGN KEY([ItemId])
REFERENCES [dbo].[ProjetoItens] ([Id])

ALTER TABLE [dbo].[ProjetoEntregaItens] CHECK CONSTRAINT [ProjetoEntregaItens_ItemId_fkey]

ALTER TABLE [dbo].[ProjetoEntregaItens]  WITH CHECK ADD  CONSTRAINT [ProjetoEntregaItens_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoEntregaItens] CHECK CONSTRAINT [ProjetoEntregaItens_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoCustoTaxasHistorico]  WITH CHECK ADD  CONSTRAINT [ProjetoCustoTaxasHistorico_CriadoPorId_fkey] FOREIGN KEY([CriadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoCustoTaxasHistorico] CHECK CONSTRAINT [ProjetoCustoTaxasHistorico_CriadoPorId_fkey]

ALTER TABLE [dbo].[ProjetoCustoTaxasHistorico]  WITH CHECK ADD  CONSTRAINT [ProjetoCustoTaxasHistorico_CustoId_fkey] FOREIGN KEY([CustoId])
REFERENCES [dbo].[ProjetoCustos] ([Id])
ON DELETE CASCADE

ALTER TABLE [dbo].[ProjetoCustoTaxasHistorico] CHECK CONSTRAINT [ProjetoCustoTaxasHistorico_CustoId_fkey]

ALTER TABLE [dbo].[ProjetoApontamentos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentos_ArquivadoPorId_fkey] FOREIGN KEY([ArquivadoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentos] CHECK CONSTRAINT [ProjetoApontamentos_ArquivadoPorId_fkey]

ALTER TABLE [dbo].[ProjetoApontamentos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentos_CustoId_fkey] FOREIGN KEY([CustoId])
REFERENCES [dbo].[ProjetoCustos] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentos] CHECK CONSTRAINT [ProjetoApontamentos_CustoId_fkey]

ALTER TABLE [dbo].[ProjetoApontamentos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentos_DecididoPorId_fkey] FOREIGN KEY([DecididoPorId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentos] CHECK CONSTRAINT [ProjetoApontamentos_DecididoPorId_fkey]

ALTER TABLE [dbo].[ProjetoApontamentos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentos_EmpresaId_fkey] FOREIGN KEY([EmpresaId])
REFERENCES [dbo].[Empresas] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentos] CHECK CONSTRAINT [ProjetoApontamentos_EmpresaId_fkey]

ALTER TABLE [dbo].[ProjetoApontamentos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentos_ItemId_fkey] FOREIGN KEY([ItemId])
REFERENCES [dbo].[ProjetoItens] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentos] CHECK CONSTRAINT [ProjetoApontamentos_ItemId_fkey]

ALTER TABLE [dbo].[ProjetoApontamentos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentos_ProjetoId_fkey] FOREIGN KEY([ProjetoId])
REFERENCES [dbo].[Projetos] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentos] CHECK CONSTRAINT [ProjetoApontamentos_ProjetoId_fkey]

ALTER TABLE [dbo].[ProjetoApontamentos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentos_TaxaHistoricoId_fkey] FOREIGN KEY([TaxaHistoricoId])
REFERENCES [dbo].[ProjetoCustoTaxasHistorico] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentos] CHECK CONSTRAINT [ProjetoApontamentos_TaxaHistoricoId_fkey]

ALTER TABLE [dbo].[ProjetoApontamentos]  WITH CHECK ADD  CONSTRAINT [ProjetoApontamentos_UsuarioId_fkey] FOREIGN KEY([UsuarioId])
REFERENCES [dbo].[Usuarios] ([Id])

ALTER TABLE [dbo].[ProjetoApontamentos] CHECK CONSTRAINT [ProjetoApontamentos_UsuarioId_fkey]

ALTER TABLE [dbo].[Solucoes]  WITH CHECK ADD  CONSTRAINT [CK_Solucoes_StatusPublicacao] CHECK  (([StatusPublicacao]=N'DESPUBLICADA' OR [StatusPublicacao]=N'PUBLICADA' OR [StatusPublicacao]=N'RASCUNHO'))

ALTER TABLE [dbo].[Solucoes] CHECK CONSTRAINT [CK_Solucoes_StatusPublicacao]

ALTER TABLE [dbo].[Usuarios]  WITH CHECK ADD  CONSTRAINT [CK_Usuarios_Login_SemArroba] CHECK  (([Login] IS NULL OR NOT [Login] like N'%@%'))

ALTER TABLE [dbo].[Usuarios] CHECK CONSTRAINT [CK_Usuarios_Login_SemArroba]

ALTER TABLE [dbo].[Capacitacoes]  WITH CHECK ADD  CONSTRAINT [CK_Capacitacoes_NivelHierarquico] CHECK  (([NivelHierarquico]>=(1)))

ALTER TABLE [dbo].[Capacitacoes] CHECK CONSTRAINT [CK_Capacitacoes_NivelHierarquico]

ALTER TABLE [dbo].[Funcionalidades]  WITH CHECK ADD  CONSTRAINT [CK_Funcionalidades_StatusPublicacao] CHECK  (([StatusPublicacao]=N'DESPUBLICADA' OR [StatusPublicacao]=N'PUBLICADA' OR [StatusPublicacao]=N'RASCUNHO'))

ALTER TABLE [dbo].[Funcionalidades] CHECK CONSTRAINT [CK_Funcionalidades_StatusPublicacao]

ALTER TABLE [dbo].[Projetos]  WITH CHECK ADD  CONSTRAINT [CK_Projetos_Chave] CHECK  ((len([Chave])>=(2) AND len([Chave])<=(10) AND ([Chave]) collate Latin1_General_100_BIN2 like '[A-Z]%' AND NOT ([Chave]) collate Latin1_General_100_BIN2 like '%[^A-Z0-9]%' AND ([Chave]) collate Latin1_General_100_BIN2=(upper([Chave])) collate Latin1_General_100_BIN2))

ALTER TABLE [dbo].[Projetos] CHECK CONSTRAINT [CK_Projetos_Chave]

ALTER TABLE [dbo].[Projetos]  WITH CHECK ADD  CONSTRAINT [CK_Projetos_Metodologia] CHECK  (([Metodologia]='OUTRA' OR [Metodologia]='HIBRIDA' OR [Metodologia]='KANBAN' OR [Metodologia]='SCRUM'))

ALTER TABLE [dbo].[Projetos] CHECK CONSTRAINT [CK_Projetos_Metodologia]

ALTER TABLE [dbo].[Projetos]  WITH CHECK ADD  CONSTRAINT [CK_Projetos_Saude] CHECK  (([Saude]='ATRASADO' OR [Saude]='EM_RISCO' OR [Saude]='EM_DIA'))

ALTER TABLE [dbo].[Projetos] CHECK CONSTRAINT [CK_Projetos_Saude]

ALTER TABLE [dbo].[Projetos]  WITH CHECK ADD  CONSTRAINT [CK_Projetos_Situacao] CHECK  (([Situacao]='CANCELADO' OR [Situacao]='CONCLUIDO' OR [Situacao]='PAUSADO' OR [Situacao]='EM_ANDAMENTO' OR [Situacao]='PLANEJADO' OR [Situacao]='EM_ORCAMENTO' OR [Situacao]='RASCUNHO'))

ALTER TABLE [dbo].[Projetos] CHECK CONSTRAINT [CK_Projetos_Situacao]

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos]  WITH CHECK ADD  CONSTRAINT [CK_ProjetoApontamentoPeriodos_Competencia] CHECK  (([Competencia] like '[0-9][0-9][0-9][0-9]-[0-1][0-9]' AND (right([Competencia],(2))>='01' AND right([Competencia],(2))<='12')))

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] CHECK CONSTRAINT [CK_ProjetoApontamentoPeriodos_Competencia]

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos]  WITH CHECK ADD  CONSTRAINT [CK_ProjetoApontamentoPeriodos_Situacao] CHECK  (([Situacao]='REABERTO' OR [Situacao]='FECHADO'))

ALTER TABLE [dbo].[ProjetoApontamentoPeriodos] CHECK CONSTRAINT [CK_ProjetoApontamentoPeriodos_Situacao]

ALTER TABLE [dbo].[ProjetoMembros]  WITH CHECK ADD  CONSTRAINT [CK_ProjetoMembros_Papel] CHECK  (([Papel]='OBSERVADOR' OR [Papel]='MEMBRO'))

ALTER TABLE [dbo].[ProjetoMembros] CHECK CONSTRAINT [CK_ProjetoMembros_Papel]

ALTER TABLE [dbo].[FuncionalidadeAcoes]  WITH CHECK ADD  CONSTRAINT [CK_FuncionalidadeAcoes_StatusPublicacao] CHECK  (([StatusPublicacao]=N'DESPUBLICADA' OR [StatusPublicacao]=N'PUBLICADA' OR [StatusPublicacao]=N'RASCUNHO'))

ALTER TABLE [dbo].[FuncionalidadeAcoes] CHECK CONSTRAINT [CK_FuncionalidadeAcoes_StatusPublicacao]

ALTER TABLE [dbo].[ProjetoItemDependencias]  WITH CHECK ADD  CONSTRAINT [CK_ProjetoItemDependencias_SemAutorreferencia] CHECK  (([BloqueadorId]<>[BloqueadoId]))

ALTER TABLE [dbo].[ProjetoItemDependencias] CHECK CONSTRAINT [CK_ProjetoItemDependencias_SemAutorreferencia]

ALTER TABLE [dbo].[CatalogoVersoes]  WITH CHECK ADD  CONSTRAINT [CK_CatalogoVersoes_Entidade] CHECK  ((((case when [SolucaoId] IS NULL then (0) else (1) end+case when [FuncionalidadeId] IS NULL then (0) else (1) end)+case when [FuncionalidadeAcaoId] IS NULL then (0) else (1) end)=(1)))

ALTER TABLE [dbo].[CatalogoVersoes] CHECK CONSTRAINT [CK_CatalogoVersoes_Entidade]

ALTER TABLE [dbo].[CatalogoVersoes]  WITH CHECK ADD  CONSTRAINT [CK_CatalogoVersoes_Estado] CHECK  (([Estado]=N'DESCARTADA' OR [Estado]=N'SUBSTITUIDA' OR [Estado]=N'PUBLICADA' OR [Estado]=N'RASCUNHO'))

ALTER TABLE [dbo].[CatalogoVersoes] CHECK CONSTRAINT [CK_CatalogoVersoes_Estado]

ALTER TABLE [dbo].[CatalogoVersoes]  WITH CHECK ADD  CONSTRAINT [CK_CatalogoVersoes_Origem] CHECK  (([Origem]=N'RESTAURACAO' OR [Origem]=N'CUSTOMIZACAO' OR [Origem]=N'PRODUTO'))

ALTER TABLE [dbo].[CatalogoVersoes] CHECK CONSTRAINT [CK_CatalogoVersoes_Origem]

ALTER TABLE [dbo].[CatalogoConflitos]  WITH CHECK ADD  CONSTRAINT [CK_CatalogoConflitos_Estado] CHECK  (([Estado]=N'RESOLVIDO' OR [Estado]=N'PENDENTE'))

ALTER TABLE [dbo].[CatalogoConflitos] CHECK CONSTRAINT [CK_CatalogoConflitos_Estado]

ALTER TABLE [dbo].[ProjetoApontamentos]  WITH CHECK ADD  CONSTRAINT [CK_ProjetoApontamentos_CustoSituacao] CHECK  (([CustoSituacao]='TAXA_AMBIGUA' OR [CustoSituacao]='SEM_TAXA' OR [CustoSituacao]='CALCULADO' OR [CustoSituacao]='NAO_APLICAVEL'))

ALTER TABLE [dbo].[ProjetoApontamentos] CHECK CONSTRAINT [CK_ProjetoApontamentos_CustoSituacao]

ALTER TABLE [dbo].[ProjetoApontamentos]  WITH CHECK ADD  CONSTRAINT [CK_ProjetoApontamentos_Minutos] CHECK  (([Minutos]>=(1) AND [Minutos]<=(1440)))

ALTER TABLE [dbo].[ProjetoApontamentos] CHECK CONSTRAINT [CK_ProjetoApontamentos_Minutos]

ALTER TABLE [dbo].[ProjetoApontamentos]  WITH CHECK ADD  CONSTRAINT [CK_ProjetoApontamentos_Status] CHECK  (([Status]='REJEITADO' OR [Status]='APROVADO' OR [Status]='ENVIADO' OR [Status]='RASCUNHO'))

ALTER TABLE [dbo].[ProjetoApontamentos] CHECK CONSTRAINT [CK_ProjetoApontamentos_Status]



  COMMIT TRANSACTION;

END TRY

BEGIN CATCH

  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

  THROW;

END CATCH;
