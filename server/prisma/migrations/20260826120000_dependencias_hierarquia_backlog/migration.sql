BEGIN TRY

BEGIN TRAN;

UPDATE dependencia
SET
  [ArquivadoEm] = NULL,
  [ArquivadoPorId] = NULL,
  [Versao] = dependencia.[Versao] + 1,
  [AtualizadoEm] = GETDATE()
FROM [dbo].[ProjetoItemDependencias] AS dependencia
INNER JOIN [dbo].[ProjetoItens] AS filho
  ON filho.[ProjetoId] = dependencia.[ProjetoId]
  AND filho.[PaiId] = dependencia.[BloqueadorId]
  AND filho.[Id] = dependencia.[BloqueadoId]
INNER JOIN [dbo].[ProjetoItens] AS pai ON pai.[Id] = filho.[PaiId]
WHERE dependencia.[ArquivadoEm] IS NOT NULL
  AND filho.[ArquivadoEm] IS NULL
  AND pai.[ArquivadoEm] IS NULL;

INSERT INTO [dbo].[ProjetoItemDependencias] (
  [Id],
  [EmpresaId],
  [ProjetoId],
  [BloqueadorId],
  [BloqueadoId],
  [Versao],
  [CriadoPorId],
  [CriadoEm],
  [AtualizadoEm]
)
SELECT
  NEWID(),
  filho.[EmpresaId],
  filho.[ProjetoId],
  filho.[PaiId],
  filho.[Id],
  1,
  filho.[AutorId],
  GETDATE(),
  GETDATE()
FROM [dbo].[ProjetoItens] AS filho
INNER JOIN [dbo].[ProjetoItens] AS pai ON pai.[Id] = filho.[PaiId]
WHERE filho.[PaiId] IS NOT NULL
  AND filho.[ArquivadoEm] IS NULL
  AND pai.[ArquivadoEm] IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM [dbo].[ProjetoItemDependencias] AS dependencia
    WHERE dependencia.[ProjetoId] = filho.[ProjetoId]
      AND dependencia.[BloqueadorId] = filho.[PaiId]
      AND dependencia.[BloqueadoId] = filho.[Id]
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
