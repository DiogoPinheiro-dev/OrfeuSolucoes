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

PRINT N'Seed anterior à migration destrutiva criado com sucesso.';
