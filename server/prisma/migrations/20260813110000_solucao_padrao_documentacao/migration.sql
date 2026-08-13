ALTER TABLE [dbo].[Solucoes]
ADD [PadraoSistema] BIT NOT NULL CONSTRAINT [Solucoes_PadraoSistema_df] DEFAULT 0;

EXEC(N'
UPDATE [dbo].[Solucoes]
SET [PadraoSistema] = 1;

MERGE [dbo].[Solucoes] AS target
USING (SELECT
  N''documentacao'' AS [Slug],
  N''Documentacao'' AS [Nome],
  N''Manuais de uso e referencias do sistema conforme seu nivel de acesso.'' AS [Descricao],
  N''Central de conhecimento'' AS [Eyebrow],
  900 AS [Ordem]
) AS source
ON target.[Slug] = source.[Slug]
WHEN MATCHED THEN UPDATE SET
  [Nome] = source.[Nome],
  [Descricao] = source.[Descricao],
  [Eyebrow] = source.[Eyebrow],
  [Ordem] = source.[Ordem],
  [Ativo] = 1,
  [ExibirNoHub] = 1,
  [SomenteAdminSistema] = 0,
  [PadraoSistema] = 1
WHEN NOT MATCHED THEN INSERT
  ([Slug], [Nome], [Descricao], [Eyebrow], [Ordem], [Ativo], [ExibirNoHub], [SomenteAdminSistema], [PadraoSistema])
VALUES
  (source.[Slug], source.[Nome], source.[Descricao], source.[Eyebrow], source.[Ordem], 1, 1, 0, 1);
');
