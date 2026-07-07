DELETE FROM [ChamadoAnexos];
DELETE FROM [ChamadoMensagens];
DELETE FROM [ChamadoHistorico];
DELETE FROM [ChamadoAcompanhantes];
DELETE FROM [Chamados];
DELETE FROM [ChamadoSequencias];
DELETE FROM [ChamadoResponsavelFuncionalidades];
DELETE FROM [ChamadoResponsavelSolucoes];
DELETE FROM [ChamadoResponsaveis];
DELETE FROM [ChamadoCategorias];
DELETE FROM [ChamadoTipos];
DELETE FROM [ChamadoPrioridades];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Chamados_EmpresaId_Prioridade' AND object_id = OBJECT_ID(N'[Chamados]'))
  DROP INDEX [IX_Chamados_EmpresaId_Prioridade] ON [Chamados];

DECLARE @defaultConstraintName NVARCHAR(128);
DECLARE @dropDefaultSql NVARCHAR(MAX);

SELECT @defaultConstraintName = dc.[name]
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON c.[object_id] = dc.parent_object_id AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID(N'[Chamados]') AND c.[name] = N'Tipo';

IF @defaultConstraintName IS NOT NULL
BEGIN
  SET @dropDefaultSql = N'ALTER TABLE [Chamados] DROP CONSTRAINT [' + @defaultConstraintName + N']';
  EXEC sp_executesql @dropDefaultSql;
END;

SET @defaultConstraintName = NULL;
SET @dropDefaultSql = NULL;

SELECT @defaultConstraintName = dc.[name]
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON c.[object_id] = dc.parent_object_id AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID(N'[Chamados]') AND c.[name] = N'Prioridade';

IF @defaultConstraintName IS NOT NULL
BEGIN
  SET @dropDefaultSql = N'ALTER TABLE [Chamados] DROP CONSTRAINT [' + @defaultConstraintName + N']';
  EXEC sp_executesql @dropDefaultSql;
END;

IF COL_LENGTH('Chamados', 'Tipo') IS NOT NULL
  ALTER TABLE [Chamados] DROP COLUMN [Tipo];

IF COL_LENGTH('Chamados', 'Prioridade') IS NOT NULL
  ALTER TABLE [Chamados] DROP COLUMN [Prioridade];

IF COL_LENGTH('Chamados', 'TipoId') IS NULL
  ALTER TABLE [Chamados] ADD [TipoId] INT NOT NULL;

IF COL_LENGTH('Chamados', 'PrioridadeId') IS NULL
  ALTER TABLE [Chamados] ADD [PrioridadeId] INT NOT NULL;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_ChamadoTipos_EmpresaId_Chave' AND object_id = OBJECT_ID(N'[ChamadoTipos]'))
  DROP INDEX [UX_ChamadoTipos_EmpresaId_Chave] ON [ChamadoTipos];

IF COL_LENGTH('ChamadoTipos', 'Chave') IS NOT NULL
  ALTER TABLE [ChamadoTipos] DROP COLUMN [Chave];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_ChamadoPrioridades_EmpresaId_Chave' AND object_id = OBJECT_ID(N'[ChamadoPrioridades]'))
  DROP INDEX [UX_ChamadoPrioridades_EmpresaId_Chave] ON [ChamadoPrioridades];

IF COL_LENGTH('ChamadoPrioridades', 'Chave') IS NOT NULL
  ALTER TABLE [ChamadoPrioridades] DROP COLUMN [Chave];

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Chamados_EmpresaId_TipoId' AND object_id = OBJECT_ID(N'[Chamados]'))
  CREATE INDEX [IX_Chamados_EmpresaId_TipoId] ON [Chamados]([EmpresaId], [TipoId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Chamados_EmpresaId_PrioridadeId' AND object_id = OBJECT_ID(N'[Chamados]'))
  CREATE INDEX [IX_Chamados_EmpresaId_PrioridadeId] ON [Chamados]([EmpresaId], [PrioridadeId]);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Chamados_ChamadoTipos_TipoId')
  ALTER TABLE [Chamados] ADD CONSTRAINT [FK_Chamados_ChamadoTipos_TipoId] FOREIGN KEY ([TipoId]) REFERENCES [ChamadoTipos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Chamados_ChamadoPrioridades_PrioridadeId')
  ALTER TABLE [Chamados] ADD CONSTRAINT [FK_Chamados_ChamadoPrioridades_PrioridadeId] FOREIGN KEY ([PrioridadeId]) REFERENCES [ChamadoPrioridades]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;