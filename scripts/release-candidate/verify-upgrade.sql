SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.ProjetoTarefas', N'U') IS NOT NULL
  THROW 51000, 'ProjetoTarefas ainda existe após a migration.', 1;

IF OBJECT_ID(N'dbo.ProjetoAlocacoes', N'U') IS NOT NULL
  THROW 51001, 'ProjetoAlocacoes ainda existe após a migration.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[ProjetoCustos] C
  INNER JOIN [dbo].[ProjetoItens] I ON I.[Id] = C.[ItemId]
  WHERE C.[Id] = '70000000-0000-0000-0000-000000000001'
    AND I.[ProjetoId] = '20000000-0000-0000-0000-000000000001'
    AND I.[Titulo] = N'Implementar fluxo legado'
    AND I.[EstimativaMinutos] = 480
)
  THROW 51002, 'O custo legado não foi reconciliado com o item de backlog esperado.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[ProjetoRecursos] PR
  INNER JOIN [dbo].[Recursos] R ON R.[Id] = PR.[RecursoId]
  INNER JOIN [dbo].[ProjetoEquipes] PE ON PE.[ProjetoId] = PR.[ProjetoId]
  INNER JOIN [dbo].[Equipes] E ON E.[Id] = PE.[EquipeId]
  WHERE PR.[Id] = '40000000-0000-0000-0000-000000000001'
    AND E.[Nome] = N'Equipe RC'
)
  THROW 51003, 'Recursos e equipes não sobreviveram à atualização.', 1;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Solucoes] WHERE [Slug] = N'custom-rc' AND [Nome] = N'Customização RC')
  THROW 51004, 'A customização do catálogo foi perdida.', 1;

IF EXISTS (
  SELECT 1
  FROM [dbo].[GrupoFuncionalidades] GF
  INNER JOIN [dbo].[GruposUsuarios] G ON G.[Id] = GF.[GrupoId]
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = GF.[FuncionalidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE G.[Nome] = N'Operação RC' AND S.[Slug] = N'projetos' AND F.[Slug] = N'horas-do-projeto'
)
  THROW 51005, 'O grupo comum manteve acesso herdado a Horas do projeto.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[EmpresaFuncionalidades] EF
  INNER JOIN [dbo].[Empresas] E ON E.[Id] = EF.[EmpresaId]
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = EF.[FuncionalidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE E.[Nome] = N'Empresa RC' AND S.[Slug] = N'projetos' AND F.[Slug] = N'horas-do-projeto'
)
  THROW 51006, 'O contrato da empresa para Horas do projeto foi removido indevidamente.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[FuncionalidadeAcoes] A
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = A.[FuncionalidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND F.[Slug] = N'horas-do-projeto'
    AND A.[Chave] = N'apontar' AND A.[StatusPublicacao] = N'DESPUBLICADA'
)
  THROW 51007, 'A ação apontar não foi despublicada.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[CatalogoAuditorias] CA
  INNER JOIN [dbo].[FuncionalidadeAcoes] A ON A.[Id] = CA.[EntidadeId]
  WHERE CA.[Entidade] = N'ACAO' AND CA.[Evento] = N'DESPUBLICADA'
    AND A.[Chave] = N'apontar' AND CA.[Antes] IS NOT NULL AND CA.[Depois] IS NOT NULL
)
  THROW 51008, 'A despublicação de apontar não foi auditada com snapshots.', 1;

IF NOT EXISTS (
  SELECT 1 FROM [dbo].[Solucoes]
  WHERE [Slug] = N'horas' AND [Ativo] = 0 AND [ExibirNoHub] = 0 AND [StatusPublicacao] = N'DESPUBLICADA'
)
  THROW 51009, 'A solução Horas legada não foi aposentada.', 1;

IF EXISTS (
  SELECT 1
  FROM [dbo].[Funcionalidades] F
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'horas' AND (F.[Ativo] <> 0 OR F.[StatusPublicacao] <> N'DESPUBLICADA')
)
  THROW 51013, 'Uma funcionalidade da solução Horas legada permaneceu publicada ou ativa.', 1;

IF EXISTS (
  SELECT 1 FROM [dbo].[GrupoSolucoes] GS
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = GS.[SolucaoId]
  WHERE S.[Slug] = N'horas'
  UNION ALL
  SELECT 1 FROM [dbo].[EmpresaSolucoes] ES
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = ES.[SolucaoId]
  WHERE S.[Slug] = N'horas'
)
  THROW 51014, 'A solução Horas legada manteve vínculos de acesso.', 1;

IF EXISTS (
  SELECT 1
  FROM [dbo].[Funcionalidades] F
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos'
    AND F.[Slug] IN (N'templates-de-projeto', N'portfolio-de-projetos')
    AND (F.[Ativo] <> 0 OR F.[StatusPublicacao] <> N'DESPUBLICADA')
)
  THROW 51015, 'Templates ou Portfólio permaneceram publicados no catálogo.', 1;

IF EXISTS (
  SELECT 1
  FROM [dbo].[GrupoFuncionalidades] GF
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = GF.[FuncionalidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND F.[Slug] IN (N'templates-de-projeto', N'portfolio-de-projetos')
  UNION ALL
  SELECT 1
  FROM [dbo].[EmpresaFuncionalidades] EF
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = EF.[FuncionalidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND F.[Slug] IN (N'templates-de-projeto', N'portfolio-de-projetos')
)
  THROW 51016, 'Templates ou Portfólio mantiveram vínculos de acesso.', 1;

IF (
  SELECT COUNT(*)
  FROM [dbo].[CatalogoAuditorias] CA
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = CA.[EntidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE CA.[Entidade] = N'FUNCIONALIDADE' AND CA.[Evento] = N'DESPUBLICADA'
    AND S.[Slug] = N'projetos' AND F.[Slug] IN (N'templates-de-projeto', N'portfolio-de-projetos')
) <> 2
  THROW 51017, 'A retirada de Templates e Portfólio não gerou a auditoria esperada.', 1;

PRINT N'Migration e reconciliação de dados validadas.';
