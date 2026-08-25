BEGIN TRY

BEGIN TRAN;

UPDATE [dbo].[Solucoes]
SET
  [Nome] = N'Controle de Horas',
  [Descricao] = N'Registro de apontamentos, horas alocadas por atividade e visibilidade do esforço da equipe.',
  [Eyebrow] = N'Operação',
  [Ordem] = 20,
  [Ativo] = 0,
  [ExibirNoHub] = 0,
  [SomenteAdminSistema] = 0,
  [PadraoSistema] = 1
WHERE [Slug] = N'horas';

UPDATE [dbo].[Solucoes]
SET
  [Nome] = N'Configurador',
  [Descricao] = N'Central administrativa para cadastrar usuários, empresas, grupos e acessos.',
  [Eyebrow] = N'Administração',
  [SomenteAdminSistema] = 1,
  [PadraoSistema] = 1
WHERE [Slug] = N'configurador';

UPDATE [dbo].[GruposUsuarios]
SET
  [Nome] = N'Administradores',
  [Descricao] = N'Grupo inicial com acesso a todas as soluções.',
  [PadraoSistema] = 1
WHERE [PadraoSistema] = 1;

UPDATE funcionalidade
SET
  [Titulo] = texto.[Titulo],
  [Label] = texto.[Label],
  [Descricao] = texto.[Descricao],
  [Ordem] = texto.[Ordem],
  [Ativo] = 0,
  [RegistryKey] = texto.[RegistryKey],
  [SomenteAdminSistema] = 0,
  [PadraoSistema] = 1
FROM [dbo].[Funcionalidades] AS funcionalidade
INNER JOIN [dbo].[Solucoes] AS solucao ON solucao.[Id] = funcionalidade.[SolucaoId]
INNER JOIN (VALUES
  (N'registro-de-horas', N'Registro de horas', N'Apontamentos', N'Lance horas por atividade, projeto e período de execução.', 10, N'horas.registro-de-horas'),
  (N'aprovacao-de-apontamentos', N'Aprovação de apontamentos', N'Aprovação', N'Revise apontamentos, valide registros e acompanhe pendências.', 20, N'horas.aprovacao-de-apontamentos'),
  (N'relatorios-de-horas', N'Relatórios de horas', N'Relatórios', N'Visualize horas alocadas, esforço por projeto e indicadores de apontamento.', 30, N'horas.relatorios-de-horas')
) AS texto([Slug], [Titulo], [Label], [Descricao], [Ordem], [RegistryKey]) ON texto.[Slug] = funcionalidade.[Slug]
WHERE solucao.[Slug] = N'horas';

DELETE permissao
FROM [dbo].[GrupoFuncionalidadeAcoes] AS permissao
INNER JOIN [dbo].[FuncionalidadeAcoes] AS acao ON acao.[Id] = permissao.[FuncionalidadeAcaoId]
INNER JOIN [dbo].[Funcionalidades] AS funcionalidade ON funcionalidade.[Id] = acao.[FuncionalidadeId]
INNER JOIN [dbo].[Solucoes] AS solucao ON solucao.[Id] = funcionalidade.[SolucaoId]
WHERE solucao.[Slug] = N'horas';

DELETE acesso
FROM [dbo].[GrupoFuncionalidades] AS acesso
INNER JOIN [dbo].[Funcionalidades] AS funcionalidade ON funcionalidade.[Id] = acesso.[FuncionalidadeId]
INNER JOIN [dbo].[Solucoes] AS solucao ON solucao.[Id] = funcionalidade.[SolucaoId]
WHERE solucao.[Slug] = N'horas';

DELETE acesso
FROM [dbo].[EmpresaFuncionalidades] AS acesso
INNER JOIN [dbo].[Funcionalidades] AS funcionalidade ON funcionalidade.[Id] = acesso.[FuncionalidadeId]
INNER JOIN [dbo].[Solucoes] AS solucao ON solucao.[Id] = funcionalidade.[SolucaoId]
WHERE solucao.[Slug] = N'horas';

DELETE acesso
FROM [dbo].[GrupoSolucoes] AS acesso
INNER JOIN [dbo].[Solucoes] AS solucao ON solucao.[Id] = acesso.[SolucaoId]
WHERE solucao.[Slug] = N'horas';

DELETE acesso
FROM [dbo].[EmpresaSolucoes] AS acesso
INNER JOIN [dbo].[Solucoes] AS solucao ON solucao.[Id] = acesso.[SolucaoId]
WHERE solucao.[Slug] = N'horas';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
  ROLLBACK TRAN;
END;
THROW

END CATCH
