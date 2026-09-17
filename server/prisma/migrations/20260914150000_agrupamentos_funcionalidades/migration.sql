BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[FuncionalidadeAgrupamentos] (
  [Id] INT NOT NULL IDENTITY(1,1),
  [SolucaoId] INT NOT NULL,
  [Slug] NVARCHAR(200) NOT NULL,
  [Titulo] NVARCHAR(200) NOT NULL,
  [Label] NVARCHAR(200) NULL,
  [Descricao] NVARCHAR(500) NULL,
  [Ordem] INT NOT NULL CONSTRAINT [DF_FuncionalidadeAgrupamentos_Ordem] DEFAULT 0,
  [Ativo] BIT NOT NULL CONSTRAINT [DF_FuncionalidadeAgrupamentos_Ativo] DEFAULT 1,
  [PadraoSistema] BIT NOT NULL CONSTRAINT [DF_FuncionalidadeAgrupamentos_PadraoSistema] DEFAULT 0,
  [ChaveTecnica] NVARCHAR(200) NOT NULL CONSTRAINT [DF_FuncionalidadeAgrupamentos_ChaveTecnica] DEFAULT CONVERT(NVARCHAR(36), NEWID()),
  [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_FuncionalidadeAgrupamentos_CriadoEm] DEFAULT GETDATE(),
  [AtualizadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_FuncionalidadeAgrupamentos_AtualizadoEm] DEFAULT GETDATE(),
  CONSTRAINT [PK_FuncionalidadeAgrupamentos] PRIMARY KEY ([Id]),
  CONSTRAINT [FK_FuncionalidadeAgrupamentos_Solucoes] FOREIGN KEY ([SolucaoId]) REFERENCES [dbo].[Solucoes]([Id]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX [UX_FuncionalidadeAgrupamentos_SolucaoId_Slug] ON [dbo].[FuncionalidadeAgrupamentos]([SolucaoId], [Slug]);
CREATE UNIQUE INDEX [UX_FuncionalidadeAgrupamentos_SolucaoId_Id] ON [dbo].[FuncionalidadeAgrupamentos]([SolucaoId], [Id]);
CREATE UNIQUE INDEX [UX_FuncionalidadeAgrupamentos_ChaveTecnica] ON [dbo].[FuncionalidadeAgrupamentos]([ChaveTecnica]);

ALTER TABLE [dbo].[Funcionalidades] ADD
  [AgrupamentoId] INT NULL,
  [OrdemNoAgrupamento] INT NULL;

-- A chave composta impede que uma funcionalidade aponte para o agrupamento de outra solução.
-- NO ACTION evita um segundo caminho de cascata a partir de Solucoes.
EXEC(N'ALTER TABLE [dbo].[Funcionalidades] ADD CONSTRAINT [FK_Funcionalidades_FuncionalidadeAgrupamentos]
  FOREIGN KEY ([SolucaoId], [AgrupamentoId]) REFERENCES [dbo].[FuncionalidadeAgrupamentos]([SolucaoId], [Id])
  ON DELETE NO ACTION ON UPDATE NO ACTION;');

EXEC(N'CREATE INDEX [IX_Funcionalidades_SolucaoId_AgrupamentoId] ON [dbo].[Funcionalidades]([SolucaoId], [AgrupamentoId]);');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
  ROLLBACK TRAN;
END;
THROW

END CATCH
