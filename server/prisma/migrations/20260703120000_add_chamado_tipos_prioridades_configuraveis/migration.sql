CREATE TABLE [ChamadoTipos] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [EmpresaId] INT NOT NULL,
    [Chave] NVARCHAR(1000) NOT NULL,
    [Nome] NVARCHAR(1000) NOT NULL,
    [Descricao] NVARCHAR(1000),
    [Cor] NVARCHAR(1000),
    [Ordem] INT NOT NULL CONSTRAINT [DF_ChamadoTipos_Ordem] DEFAULT 0,
    [Ativo] BIT NOT NULL CONSTRAINT [DF_ChamadoTipos_Ativo] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_ChamadoTipos_CriadoEm] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [PK_ChamadoTipos] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_ChamadoTipos_Empresas_EmpresaId] FOREIGN KEY ([EmpresaId]) REFERENCES [Empresas]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE [ChamadoPrioridades] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [EmpresaId] INT NOT NULL,
    [Chave] NVARCHAR(1000) NOT NULL,
    [Nome] NVARCHAR(1000) NOT NULL,
    [Descricao] NVARCHAR(1000),
    [Cor] NVARCHAR(1000),
    [Ordem] INT NOT NULL CONSTRAINT [DF_ChamadoPrioridades_Ordem] DEFAULT 0,
    [Ativo] BIT NOT NULL CONSTRAINT [DF_ChamadoPrioridades_Ativo] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_ChamadoPrioridades_CriadoEm] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [PK_ChamadoPrioridades] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_ChamadoPrioridades_Empresas_EmpresaId] FOREIGN KEY ([EmpresaId]) REFERENCES [Empresas]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX [UX_ChamadoTipos_EmpresaId_Chave] ON [ChamadoTipos]([EmpresaId], [Chave]);
CREATE UNIQUE INDEX [UX_ChamadoTipos_EmpresaId_Nome] ON [ChamadoTipos]([EmpresaId], [Nome]);
CREATE INDEX [IX_ChamadoTipos_EmpresaId_Ativo] ON [ChamadoTipos]([EmpresaId], [Ativo]);

CREATE UNIQUE INDEX [UX_ChamadoPrioridades_EmpresaId_Chave] ON [ChamadoPrioridades]([EmpresaId], [Chave]);
CREATE UNIQUE INDEX [UX_ChamadoPrioridades_EmpresaId_Nome] ON [ChamadoPrioridades]([EmpresaId], [Nome]);
CREATE INDEX [IX_ChamadoPrioridades_EmpresaId_Ativo] ON [ChamadoPrioridades]([EmpresaId], [Ativo]);

INSERT INTO [ChamadoTipos] ([EmpresaId], [Chave], [Nome], [Descricao], [Cor], [Ordem], [Ativo], [CriadoEm], [AtualizadoEm])
SELECT e.[Id], v.[Chave], v.[Nome], NULL, v.[Cor], v.[Ordem], 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM [Empresas] e
CROSS APPLY (VALUES
    ('SOLICITACAO', 'Solicitacao', '#ea580c', 10),
    ('INCIDENTE', 'Incidente', '#dc2626', 20),
    ('DUVIDA', 'Duvida', '#16a34a', 30),
    ('MELHORIA', 'Melhoria', '#f59e0b', 40)
) v([Chave], [Nome], [Cor], [Ordem])
WHERE NOT EXISTS (
    SELECT 1 FROM [ChamadoTipos] t WHERE t.[EmpresaId] = e.[Id] AND t.[Chave] = v.[Chave]
);

INSERT INTO [ChamadoPrioridades] ([EmpresaId], [Chave], [Nome], [Descricao], [Cor], [Ordem], [Ativo], [CriadoEm], [AtualizadoEm])
SELECT e.[Id], v.[Chave], v.[Nome], NULL, v.[Cor], v.[Ordem], 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM [Empresas] e
CROSS APPLY (VALUES
    ('BAIXA', 'Baixa', '#16a34a', 10),
    ('MEDIA', 'Media', '#f59e0b', 20),
    ('ALTA', 'Alta', '#ea580c', 30),
    ('URGENTE', 'Urgente', '#dc2626', 40)
) v([Chave], [Nome], [Cor], [Ordem])
WHERE NOT EXISTS (
    SELECT 1 FROM [ChamadoPrioridades] p WHERE p.[EmpresaId] = e.[Id] AND p.[Chave] = v.[Chave]
);