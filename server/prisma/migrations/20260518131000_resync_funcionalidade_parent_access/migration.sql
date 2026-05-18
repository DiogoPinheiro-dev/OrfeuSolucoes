BEGIN TRY

BEGIN TRAN;

DELETE [gf]
FROM [dbo].[GrupoFuncionalidades] [gf]
JOIN [dbo].[Funcionalidades] [f] ON [f].[Id] = [gf].[FuncionalidadeId]
WHERE NOT EXISTS (
  SELECT 1
  FROM [dbo].[GrupoSolucoes] [gs]
  WHERE [gs].[GrupoId] = [gf].[GrupoId]
    AND [gs].[SolucaoId] = [f].[SolucaoId]
);

DELETE [ef]
FROM [dbo].[EmpresaFuncionalidades] [ef]
JOIN [dbo].[Funcionalidades] [f] ON [f].[Id] = [ef].[FuncionalidadeId]
WHERE NOT EXISTS (
  SELECT 1
  FROM [dbo].[EmpresaSolucoes] [es]
  WHERE [es].[EmpresaId] = [ef].[EmpresaId]
    AND [es].[SolucaoId] = [f].[SolucaoId]
);

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
