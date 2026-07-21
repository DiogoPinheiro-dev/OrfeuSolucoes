ALTER TABLE [dbo].[GoogleEmailContas]
ADD [Principal] BIT NOT NULL
    CONSTRAINT [GoogleEmailContas_Principal_df] DEFAULT 0;

EXEC sp_executesql N'
WITH [ContasOrdenadas] AS (
    SELECT
        [Id],
        ROW_NUMBER() OVER (
            PARTITION BY [EmpresaId]
            ORDER BY
                CASE WHEN [RefreshTokenCriptografado] IS NOT NULL THEN 0 ELSE 1 END,
                [Id]
        ) AS [Ordem]
    FROM [dbo].[GoogleEmailContas]
    WHERE [Ativo] = 1
)
UPDATE [GoogleEmailContas]
SET [Principal] = 1
WHERE [Id] IN (
    SELECT [Id]
    FROM [ContasOrdenadas]
    WHERE [Ordem] = 1
);';

EXEC sp_executesql N'
CREATE NONCLUSTERED INDEX [IX_GoogleEmailContas_EmpresaId_Principal]
ON [dbo].[GoogleEmailContas]([EmpresaId], [Principal]);';

EXEC sp_executesql N'
CREATE UNIQUE NONCLUSTERED INDEX [UX_GoogleEmailContas_EmpresaId_Principal]
ON [dbo].[GoogleEmailContas]([EmpresaId])
WHERE [Principal] = 1;';

IF OBJECT_ID(N'[dbo].[ChamadoSolucaoEmails]', N'U') IS NOT NULL
BEGIN
    DROP TABLE [dbo].[ChamadoSolucaoEmails];
END;
