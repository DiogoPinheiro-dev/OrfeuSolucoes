BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[Solucoes] (
  [Id] INT NOT NULL IDENTITY(1,1),
  [Slug] NVARCHAR(1000) NOT NULL,
  [Nome] NVARCHAR(1000) NOT NULL,
  [Descricao] NVARCHAR(1000),
  [Eyebrow] NVARCHAR(1000),
  [Status] NVARCHAR(1000),
  [Ordem] INT NOT NULL CONSTRAINT [Solucoes_Ordem_df] DEFAULT 0,
  [Ativo] BIT NOT NULL CONSTRAINT [Solucoes_Ativo_df] DEFAULT 1,
  [ExibirNoHub] BIT NOT NULL CONSTRAINT [Solucoes_ExibirNoHub_df] DEFAULT 1,
  [SomenteAdminSistema] BIT NOT NULL CONSTRAINT [Solucoes_SomenteAdminSistema_df] DEFAULT 0,
  CONSTRAINT [Solucoes_pkey] PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UX_Solucoes_Slug] UNIQUE NONCLUSTERED ([Slug])
);

CREATE TABLE [dbo].[Funcionalidades] (
  [Id] INT NOT NULL IDENTITY(1,1),
  [SolucaoId] INT NOT NULL,
  [Slug] NVARCHAR(1000) NOT NULL,
  [Titulo] NVARCHAR(1000) NOT NULL,
  [Label] NVARCHAR(1000),
  [Descricao] NVARCHAR(1000),
  [Ordem] INT NOT NULL CONSTRAINT [Funcionalidades_Ordem_df] DEFAULT 0,
  [Ativo] BIT NOT NULL CONSTRAINT [Funcionalidades_Ativo_df] DEFAULT 1,
  [RegistryKey] NVARCHAR(1000),
  [SomenteAdminSistema] BIT NOT NULL CONSTRAINT [Funcionalidades_SomenteAdminSistema_df] DEFAULT 0,
  CONSTRAINT [Funcionalidades_pkey] PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UX_Funcionalidades_SolucaoId_Slug] UNIQUE NONCLUSTERED ([SolucaoId], [Slug])
);

CREATE TABLE [dbo].[GrupoSolucoes] (
  [Id] INT NOT NULL IDENTITY(1,1),
  [GrupoId] INT NOT NULL,
  [SolucaoId] INT NOT NULL,
  CONSTRAINT [GrupoSolucoes_pkey] PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UX_GrupoSolucoes_GrupoId_SolucaoId] UNIQUE NONCLUSTERED ([GrupoId], [SolucaoId])
);

CREATE TABLE [dbo].[EmpresaSolucoes] (
  [Id] INT NOT NULL IDENTITY(1,1),
  [EmpresaId] INT NOT NULL,
  [SolucaoId] INT NOT NULL,
  CONSTRAINT [EmpresaSolucoes_pkey] PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UX_EmpresaSolucoes_EmpresaId_SolucaoId] UNIQUE NONCLUSTERED ([EmpresaId], [SolucaoId])
);

CREATE TABLE [dbo].[GrupoFuncionalidades] (
  [Id] INT NOT NULL IDENTITY(1,1),
  [GrupoId] INT NOT NULL,
  [FuncionalidadeId] INT NOT NULL,
  CONSTRAINT [GrupoFuncionalidades_pkey] PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UX_GrupoFuncionalidades_GrupoId_FuncionalidadeId] UNIQUE NONCLUSTERED ([GrupoId], [FuncionalidadeId])
);

CREATE TABLE [dbo].[EmpresaFuncionalidades] (
  [Id] INT NOT NULL IDENTITY(1,1),
  [EmpresaId] INT NOT NULL,
  [FuncionalidadeId] INT NOT NULL,
  CONSTRAINT [EmpresaFuncionalidades_pkey] PRIMARY KEY CLUSTERED ([Id]),
  CONSTRAINT [UX_EmpresaFuncionalidades_EmpresaId_FuncionalidadeId] UNIQUE NONCLUSTERED ([EmpresaId], [FuncionalidadeId])
);

ALTER TABLE [dbo].[Funcionalidades] ADD CONSTRAINT [Funcionalidades_SolucaoId_fkey] FOREIGN KEY ([SolucaoId]) REFERENCES [dbo].[Solucoes]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[GrupoSolucoes] ADD CONSTRAINT [GrupoSolucoes_GrupoId_fkey] FOREIGN KEY ([GrupoId]) REFERENCES [dbo].[GruposUsuarios]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[GrupoSolucoes] ADD CONSTRAINT [GrupoSolucoes_SolucaoId_fkey] FOREIGN KEY ([SolucaoId]) REFERENCES [dbo].[Solucoes]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[EmpresaSolucoes] ADD CONSTRAINT [EmpresaSolucoes_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[EmpresaSolucoes] ADD CONSTRAINT [EmpresaSolucoes_SolucaoId_fkey] FOREIGN KEY ([SolucaoId]) REFERENCES [dbo].[Solucoes]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[GrupoFuncionalidades] ADD CONSTRAINT [GrupoFuncionalidades_GrupoId_fkey] FOREIGN KEY ([GrupoId]) REFERENCES [dbo].[GruposUsuarios]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[GrupoFuncionalidades] ADD CONSTRAINT [GrupoFuncionalidades_FuncionalidadeId_fkey] FOREIGN KEY ([FuncionalidadeId]) REFERENCES [dbo].[Funcionalidades]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[EmpresaFuncionalidades] ADD CONSTRAINT [EmpresaFuncionalidades_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[EmpresaFuncionalidades] ADD CONSTRAINT [EmpresaFuncionalidades_FuncionalidadeId_fkey] FOREIGN KEY ([FuncionalidadeId]) REFERENCES [dbo].[Funcionalidades]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO [dbo].[Solucoes] ([Slug], [Nome], [Descricao], [Eyebrow], [Status], [Ordem], [Ativo], [ExibirNoHub], [SomenteAdminSistema])
VALUES
  ('projetos', 'Gerenciador de Projetos', 'Espaco para organizar backlog, entregas, marcos e comunicacao entre as equipes.', 'Operacao', 'Interno', 10, 1, 1, 0),
  ('horas', 'Controle de Horas', 'Registro de apontamentos, horas alocadas por atividade e visibilidade do esforco da equipe.', 'People Ops', 'Interno', 20, 1, 1, 0),
  ('configurador', 'Configurador', 'Central administrativa para cadastrar usuarios, empresas, grupos e acessos.', 'Administracao', 'Admin', 30, 1, 1, 1);

DECLARE @projetosId INT = (SELECT [Id] FROM [dbo].[Solucoes] WHERE [Slug] = 'projetos');
DECLARE @horasId INT = (SELECT [Id] FROM [dbo].[Solucoes] WHERE [Slug] = 'horas');
DECLARE @configuradorId INT = (SELECT [Id] FROM [dbo].[Solucoes] WHERE [Slug] = 'configurador');

INSERT INTO [dbo].[Funcionalidades] ([SolucaoId], [Slug], [Titulo], [Label], [Descricao], [Ordem], [Ativo], [RegistryKey], [SomenteAdminSistema])
VALUES
  (@projetosId, 'backlog-de-demandas', 'Backlog de demandas', 'Backlog', 'Organize demandas, prioridades e escopo planejado para cada projeto.', 10, 1, 'projetos.backlog-de-demandas', 0),
  (@projetosId, 'marcos-e-entregas', 'Marcos e entregas', 'Entregas', 'Acompanhe etapas, entregaveis, prazos e progresso operacional.', 20, 1, 'projetos.marcos-e-entregas', 0),
  (@projetosId, 'comunicacao-do-projeto', 'Comunicacao do projeto', 'Comunicacao', 'Registre alinhamentos, decisoes e historico de interacoes do projeto.', 30, 1, 'projetos.comunicacao-do-projeto', 0),
  (@horasId, 'registro-de-horas', 'Registro de horas', 'Apontamentos', 'Lance horas por atividade, projeto e periodo de execucao.', 10, 1, 'horas.registro-de-horas', 0),
  (@horasId, 'aprovacao-de-apontamentos', 'Aprovacao de apontamentos', 'Aprovacao', 'Revise apontamentos, valide registros e acompanhe pendencias.', 20, 1, 'horas.aprovacao-de-apontamentos', 0),
  (@horasId, 'relatorios-de-horas', 'Relatorios de horas', 'Relatorios', 'Visualize horas alocadas, esforco por projeto e indicadores de capacidade.', 30, 1, 'horas.relatorios-de-horas', 0),
  (@configuradorId, 'cadastro-de-usuarios', 'Cadastro de usuarios', 'Usuarios', 'Gerencie contas, dados de acesso, grupo e empresas dos usuarios.', 10, 1, 'configurador.cadastro-de-usuarios', 1),
  (@configuradorId, 'cadastro-de-grupos', 'Cadastro de grupos', 'Grupos', 'Defina grupos de usuarios, solucoes, funcionalidades e permissoes.', 20, 1, 'configurador.cadastro-de-grupos', 1),
  (@configuradorId, 'cadastro-de-empresas', 'Cadastro de empresas', 'Empresas', 'Crie e mantenha empresas, liberando solucoes e funcionalidades contratadas.', 30, 1, 'configurador.cadastro-de-empresas', 1);

INSERT INTO [dbo].[GrupoSolucoes] ([GrupoId], [SolucaoId])
SELECT [g].[Id], [s].[Id]
FROM [dbo].[GruposUsuarios] [g]
CROSS JOIN [dbo].[Solucoes] [s]
WHERE
  ([s].[Slug] = 'projetos' AND [g].[AcessoProjetos] = 1)
  OR ([s].[Slug] = 'horas' AND [g].[AcessoHoras] = 1)
  OR ([s].[Slug] = 'configurador' AND [g].[AcessoConfigurador] = 1);

INSERT INTO [dbo].[GrupoFuncionalidades] ([GrupoId], [FuncionalidadeId])
SELECT DISTINCT [gs].[GrupoId], [f].[Id]
FROM [dbo].[GrupoSolucoes] [gs]
JOIN [dbo].[Funcionalidades] [f] ON [f].[SolucaoId] = [gs].[SolucaoId];

INSERT INTO [dbo].[EmpresaSolucoes] ([EmpresaId], [SolucaoId])
SELECT [e].[Id], [s].[Id]
FROM [dbo].[Empresas] [e]
CROSS JOIN [dbo].[Solucoes] [s]
WHERE
  ([s].[Slug] = 'projetos' AND [e].[AcessoProjetos] = 1)
  OR ([s].[Slug] = 'horas' AND [e].[AcessoHoras] = 1);

INSERT INTO [dbo].[EmpresaFuncionalidades] ([EmpresaId], [FuncionalidadeId])
SELECT DISTINCT [es].[EmpresaId], [f].[Id]
FROM [dbo].[EmpresaSolucoes] [es]
JOIN [dbo].[Funcionalidades] [f] ON [f].[SolucaoId] = [es].[SolucaoId];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
