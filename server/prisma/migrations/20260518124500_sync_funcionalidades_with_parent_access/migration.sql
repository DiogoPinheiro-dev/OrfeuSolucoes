BEGIN TRY

BEGIN TRAN;

INSERT INTO [dbo].[GrupoFuncionalidades] (
  [GrupoId],
  [FuncionalidadeId],
  [PodeVisualizar],
  [PodeIncluir],
  [PodeAlterar],
  [PodeExcluir]
)
SELECT
  [gs].[GrupoId],
  [f].[Id],
  ISNULL([g].[PodeVisualizar], 1),
  ISNULL([g].[PodeIncluir], 0),
  ISNULL([g].[PodeAlterar], 0),
  ISNULL([g].[PodeExcluir], 0)
FROM [dbo].[GrupoSolucoes] [gs]
JOIN [dbo].[GruposUsuarios] [g] ON [g].[Id] = [gs].[GrupoId]
JOIN [dbo].[Funcionalidades] [f] ON [f].[SolucaoId] = [gs].[SolucaoId]
WHERE NOT EXISTS (
  SELECT 1
  FROM [dbo].[GrupoFuncionalidades] [gf]
  WHERE [gf].[GrupoId] = [gs].[GrupoId]
    AND [gf].[FuncionalidadeId] = [f].[Id]
);

INSERT INTO [dbo].[EmpresaFuncionalidades] ([EmpresaId], [FuncionalidadeId])
SELECT
  [es].[EmpresaId],
  [f].[Id]
FROM [dbo].[EmpresaSolucoes] [es]
JOIN [dbo].[Funcionalidades] [f] ON [f].[SolucaoId] = [es].[SolucaoId]
WHERE NOT EXISTS (
  SELECT 1
  FROM [dbo].[EmpresaFuncionalidades] [ef]
  WHERE [ef].[EmpresaId] = [es].[EmpresaId]
    AND [ef].[FuncionalidadeId] = [f].[Id]
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
