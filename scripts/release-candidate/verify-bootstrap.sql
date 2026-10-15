SET NOCOUNT ON;

IF (SELECT COUNT(*) FROM [dbo].[Solucoes] WHERE [Slug] = N'custom-rc') <> 1
  THROW 51020, 'O bootstrap duplicou ou removeu a solução customizada.', 1;

IF EXISTS (
  SELECT [Slug] FROM [dbo].[Solucoes]
  WHERE [PadraoSistema] = 1
  GROUP BY [Slug] HAVING COUNT(*) > 1
)
  THROW 51021, 'O bootstrap duplicou uma solução padrão.', 1;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Solucoes] WHERE [Slug] = N'projetos' AND [PadraoSistema] = 1)
  THROW 51022, 'A solução padrão de projetos não foi reconciliada.', 1;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Solucoes] WHERE [Slug] = N'documentacao' AND [PadraoSistema] = 1)
  THROW 51023, 'A solução padrão de documentação não foi reconciliada.', 1;

IF (
  SELECT COUNT(*)
  FROM [dbo].[Funcionalidades] F
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND F.[Slug] = N'meus-apontamentos'
) <> 1
  THROW 51024, 'O bootstrap não criou Meus apontamentos uma única vez.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[Funcionalidades] F
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND F.[Slug] = N'meus-apontamentos'
    AND F.[Ativo] = 1 AND F.[StatusPublicacao] = N'PUBLICADA'
    AND F.[ProviderKey] = N'projetos.meus-apontamentos'
)
  THROW 51025, 'Meus apontamentos não ficou publicável pelo provider esperado.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[EmpresaFuncionalidades] EF
  INNER JOIN [dbo].[Empresas] E ON E.[Id] = EF.[EmpresaId]
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = EF.[FuncionalidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE E.[Nome] = N'Empresa RC' AND S.[Slug] = N'projetos' AND F.[Slug] = N'meus-apontamentos'
)
  THROW 51026, 'Meus apontamentos não herdou o contrato da empresa de Projetos.', 1;

IF EXISTS (
  SELECT 1
  FROM [dbo].[GrupoFuncionalidades] GF
  INNER JOIN [dbo].[GruposUsuarios] G ON G.[Id] = GF.[GrupoId]
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = GF.[FuncionalidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE G.[Nome] = N'Operação RC' AND S.[Slug] = N'projetos'
    AND F.[Slug] IN (N'meus-apontamentos', N'horas-do-projeto')
)
  THROW 51027, 'O bootstrap concedeu as telas de horas ao grupo comum.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[CatalogoVersoes] CV
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = CV.[FuncionalidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND F.[Slug] = N'horas-do-projeto'
    AND CV.[Estado] = N'RASCUNHO' AND CV.[Origem] = N'PRODUTO'
)
  THROW 51028, 'A nova definição de Horas do projeto não gerou o rascunho de produto.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[FuncionalidadeAcoes] A
  INNER JOIN [dbo].[Funcionalidades] F ON F.[Id] = A.[FuncionalidadeId]
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND F.[Slug] = N'horas-do-projeto'
    AND A.[Chave] = N'fechar_periodo' AND A.[Ativo] = 1 AND A.[StatusPublicacao] = N'PUBLICADA'
)
  THROW 51029, 'A ação fechar_periodo não foi registrada pelo bootstrap.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[FuncionalidadeAgrupamentos] G
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = G.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND G.[Slug] = N'controle-de-horas'
)
  THROW 51030, 'O agrupamento Controle de horas não foi criado.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM [dbo].[FuncionalidadeAgrupamentos] G
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = G.[SolucaoId]
  INNER JOIN [dbo].[Funcionalidades] M ON M.[SolucaoId] = S.[Id] AND M.[AgrupamentoId] = G.[Id]
  INNER JOIN [dbo].[Funcionalidades] H ON H.[SolucaoId] = S.[Id] AND H.[AgrupamentoId] = G.[Id]
  WHERE S.[Slug] = N'projetos' AND G.[Slug] = N'controle-de-horas'
    AND M.[Slug] = N'meus-apontamentos' AND M.[OrdemNoAgrupamento] = 1
    AND H.[Slug] = N'horas-do-projeto' AND H.[OrdemNoAgrupamento] = 2
)
  THROW 51031, 'As abas do Controle de horas não foram associadas na ordem esperada.', 1;

IF (
  SELECT COUNT(*) FROM [dbo].[FuncionalidadeAgrupamentos] G
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = G.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND G.[Slug] = N'controle-de-horas'
) <> 1
  THROW 51032, 'O bootstrap duplicou o agrupamento Controle de horas.', 1;

IF (
  SELECT COUNT(*) FROM [dbo].[Funcionalidades] F
  INNER JOIN [dbo].[Solucoes] S ON S.[Id] = F.[SolucaoId]
  WHERE S.[Slug] = N'projetos' AND F.[Slug] IN (N'templates-de-projeto', N'portfolio-de-projetos')
) <> 2
  THROW 51033, 'O bootstrap removeu ou duplicou as funcionalidades retiradas do roteiro.', 1;

IF (SELECT COUNT(*) FROM [dbo].[Solucoes] WHERE [Slug] = N'horas') <> 1
  THROW 51034, 'O bootstrap removeu ou recriou a solução Horas legada.', 1;

PRINT N'Bootstrap repetido e preservação de customizações validados.';
