CREATE TABLE [dbo].[FuncionalidadeAcoes] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [FuncionalidadeId] INT NOT NULL,
    [Chave] NVARCHAR(1000) NOT NULL,
    [Nome] NVARCHAR(1000) NOT NULL,
    [Descricao] NVARCHAR(1000),
    [Ordem] INT NOT NULL CONSTRAINT [DF_FuncionalidadeAcoes_Ordem] DEFAULT 0,
    [Ativo] BIT NOT NULL CONSTRAINT [DF_FuncionalidadeAcoes_Ativo] DEFAULT 1,
    [AcaoPadrao] BIT NOT NULL CONSTRAINT [DF_FuncionalidadeAcoes_AcaoPadrao] DEFAULT 0,
    [Configuracao] NVARCHAR(1000),
    CONSTRAINT [PK_FuncionalidadeAcoes] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_FuncionalidadeAcoes_Funcionalidades_FuncionalidadeId] FOREIGN KEY ([FuncionalidadeId]) REFERENCES [dbo].[Funcionalidades]([Id]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE NONCLUSTERED INDEX [UX_FuncionalidadeAcoes_FuncionalidadeId_Chave] ON [dbo].[FuncionalidadeAcoes]([FuncionalidadeId], [Chave]);

CREATE TABLE [dbo].[GrupoFuncionalidadeAcoes] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [GrupoId] INT NOT NULL,
    [FuncionalidadeAcaoId] INT NOT NULL,
    [Permitido] BIT NOT NULL CONSTRAINT [DF_GrupoFuncionalidadeAcoes_Permitido] DEFAULT 0,
    CONSTRAINT [PK_GrupoFuncionalidadeAcoes] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_GrupoFuncionalidadeAcoes_GruposUsuarios_GrupoId] FOREIGN KEY ([GrupoId]) REFERENCES [dbo].[GruposUsuarios]([Id]) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT [FK_GrupoFuncionalidadeAcoes_FuncionalidadeAcoes_FuncionalidadeAcaoId] FOREIGN KEY ([FuncionalidadeAcaoId]) REFERENCES [dbo].[FuncionalidadeAcoes]([Id]) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE NONCLUSTERED INDEX [UX_GrupoFuncionalidadeAcoes_GrupoId_FuncionalidadeAcaoId] ON [dbo].[GrupoFuncionalidadeAcoes]([GrupoId], [FuncionalidadeAcaoId]);

INSERT INTO [dbo].[FuncionalidadeAcoes] ([FuncionalidadeId], [Chave], [Nome], [Ordem], [Ativo], [AcaoPadrao])
SELECT [Id], 'visualizar', 'Visualizar', 10, 1, 1 FROM [dbo].[Funcionalidades]
UNION ALL
SELECT [Id], 'incluir', 'Incluir', 20, 1, 1 FROM [dbo].[Funcionalidades]
UNION ALL
SELECT [Id], 'alterar', 'Alterar', 30, 1, 1 FROM [dbo].[Funcionalidades]
UNION ALL
SELECT [Id], 'excluir', 'Excluir', 40, 1, 1 FROM [dbo].[Funcionalidades];

INSERT INTO [dbo].[GrupoFuncionalidadeAcoes] ([GrupoId], [FuncionalidadeAcaoId], [Permitido])
SELECT gf.[GrupoId], fa.[Id],
    CASE fa.[Chave]
        WHEN 'visualizar' THEN gf.[PodeVisualizar]
        WHEN 'incluir' THEN gf.[PodeIncluir]
        WHEN 'alterar' THEN gf.[PodeAlterar]
        WHEN 'excluir' THEN gf.[PodeExcluir]
        ELSE 0
    END
FROM [dbo].[GrupoFuncionalidades] gf
INNER JOIN [dbo].[FuncionalidadeAcoes] fa ON fa.[FuncionalidadeId] = gf.[FuncionalidadeId];
