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

PRINT N'Bootstrap repetido e preservação de customizações validados.';
