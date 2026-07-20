CREATE TABLE [dbo].[Projetos] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Projetos_Id] DEFAULT NEWID(),
    [EmpresaId] INT NOT NULL,
    [Chave] NVARCHAR(10) NOT NULL,
    [Nome] NVARCHAR(200) NOT NULL,
    [Objetivo] NVARCHAR(500) NULL,
    [Descricao] NVARCHAR(1000) NULL,
    [Metodologia] NVARCHAR(20) NOT NULL,
    [Situacao] NVARCHAR(20) NOT NULL,
    [Saude] NVARCHAR(20) NOT NULL,
    [InicioPrevistoEm] DATE NULL,
    [FimPrevistoEm] DATE NULL,
    [InicioRealEm] DATE NULL,
    [FimRealEm] DATE NULL,
    [ResponsavelId] UNIQUEIDENTIFIER NOT NULL,
    [CriadoPorId] UNIQUEIDENTIFIER NOT NULL,
    [ArquivadoEm] DATETIME2 NULL,
    [ArquivadoPorId] UNIQUEIDENTIFIER NULL,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_Projetos_CriadoEm] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [PK_Projetos] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [CK_Projetos_Chave] CHECK (
        LEN([Chave]) BETWEEN 2 AND 10
        AND [Chave] COLLATE Latin1_General_100_BIN2 LIKE '[A-Z]%'
        AND [Chave] COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^A-Z0-9]%'
        AND [Chave] COLLATE Latin1_General_100_BIN2 = UPPER([Chave]) COLLATE Latin1_General_100_BIN2
    ),
    CONSTRAINT [CK_Projetos_Metodologia] CHECK ([Metodologia] IN ('SCRUM', 'KANBAN', 'HIBRIDA', 'OUTRA')),
    CONSTRAINT [CK_Projetos_Situacao] CHECK ([Situacao] IN ('RASCUNHO', 'PLANEJADO', 'EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO')),
    CONSTRAINT [CK_Projetos_Saude] CHECK ([Saude] IN ('EM_DIA', 'EM_RISCO', 'ATRASADO')),
    CONSTRAINT [FK_Projetos_Empresas_EmpresaId] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas] ([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [FK_Projetos_Usuarios_ResponsavelId] FOREIGN KEY ([ResponsavelId]) REFERENCES [dbo].[Usuarios] ([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [FK_Projetos_Usuarios_CriadoPorId] FOREIGN KEY ([CriadoPorId]) REFERENCES [dbo].[Usuarios] ([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [FK_Projetos_Usuarios_ArquivadoPorId] FOREIGN KEY ([ArquivadoPorId]) REFERENCES [dbo].[Usuarios] ([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE UNIQUE NONCLUSTERED INDEX [UX_Projetos_EmpresaId_Chave]
ON [dbo].[Projetos] ([EmpresaId], [Chave]);

CREATE NONCLUSTERED INDEX [IX_Projetos_EmpresaId_ArquivadoEm]
ON [dbo].[Projetos] ([EmpresaId], [ArquivadoEm]);

CREATE NONCLUSTERED INDEX [IX_Projetos_EmpresaId_AtualizadoEm]
ON [dbo].[Projetos] ([EmpresaId], [AtualizadoEm]);

CREATE NONCLUSTERED INDEX [IX_Projetos_EmpresaId_ResponsavelId]
ON [dbo].[Projetos] ([EmpresaId], [ResponsavelId]);

CREATE TABLE [dbo].[ProjetoMembros] (
    [Id] INT NOT NULL IDENTITY(1, 1),
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [Papel] NVARCHAR(20) NOT NULL,
    [IncluidoEm] DATETIME2 NOT NULL CONSTRAINT [DF_ProjetoMembros_IncluidoEm] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProjetoMembros] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [CK_ProjetoMembros_Papel] CHECK ([Papel] IN ('MEMBRO', 'OBSERVADOR')),
    CONSTRAINT [FK_ProjetoMembros_Projetos_ProjetoId] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos] ([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [FK_ProjetoMembros_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios] ([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE UNIQUE NONCLUSTERED INDEX [UX_ProjetoMembros_ProjetoId_UsuarioId]
ON [dbo].[ProjetoMembros] ([ProjetoId], [UsuarioId]);

CREATE NONCLUSTERED INDEX [IX_ProjetoMembros_UsuarioId]
ON [dbo].[ProjetoMembros] ([UsuarioId]);
