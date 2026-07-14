CREATE TABLE [dbo].[GoogleEmailContas] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [EmpresaId] INT NOT NULL,
    [Nome] NVARCHAR(1000) NOT NULL,
    [Tipo] NVARCHAR(1000) NOT NULL,
    [EmailGoogle] NVARCHAR(1000) NOT NULL,
    [RefreshTokenCriptografado] NVARCHAR(MAX) NULL,
    [ConectadoEm] DATETIME2 NULL,
    [CriadoPorId] UNIQUEIDENTIFIER NOT NULL,
    [Ativo] BIT NOT NULL CONSTRAINT [DF_GoogleEmailContas_Ativo] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_GoogleEmailContas_CriadoEm] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_GoogleEmailContas_AtualizadoEm] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_GoogleEmailContas] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_GoogleEmailContas_Empresas] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]),
    CONSTRAINT [FK_GoogleEmailContas_Usuarios] FOREIGN KEY ([CriadoPorId]) REFERENCES [dbo].[Usuarios]([Id])
);
CREATE UNIQUE NONCLUSTERED INDEX [UX_GoogleEmailContas_EmpresaId_EmailGoogle] ON [dbo].[GoogleEmailContas]([EmpresaId], [EmailGoogle]);
CREATE NONCLUSTERED INDEX [IX_GoogleEmailContas_EmpresaId_Ativo] ON [dbo].[GoogleEmailContas]([EmpresaId], [Ativo]);

CREATE TABLE [dbo].[ChamadoSolucaoEmails] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [EmpresaId] INT NOT NULL,
    [SolucaoId] INT NOT NULL,
    [GoogleContaId] INT NOT NULL,
    [RemetenteEmail] NVARCHAR(1000) NOT NULL,
    [RemetenteNome] NVARCHAR(1000) NULL,
    [ResponderParaEmail] NVARCHAR(1000) NULL,
    [Ativo] BIT NOT NULL CONSTRAINT [DF_ChamadoSolucaoEmails_Ativo] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_ChamadoSolucaoEmails_CriadoEm] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_ChamadoSolucaoEmails_AtualizadoEm] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ChamadoSolucaoEmails] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_ChamadoSolucaoEmails_Empresas] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]),
    CONSTRAINT [FK_ChamadoSolucaoEmails_Solucoes] FOREIGN KEY ([SolucaoId]) REFERENCES [dbo].[Solucoes]([Id]),
    CONSTRAINT [FK_ChamadoSolucaoEmails_GoogleEmailContas] FOREIGN KEY ([GoogleContaId]) REFERENCES [dbo].[GoogleEmailContas]([Id])
);
CREATE UNIQUE NONCLUSTERED INDEX [UX_ChamadoSolucaoEmails_EmpresaId_SolucaoId] ON [dbo].[ChamadoSolucaoEmails]([EmpresaId], [SolucaoId]);
CREATE NONCLUSTERED INDEX [IX_ChamadoSolucaoEmails_GoogleContaId_Ativo] ON [dbo].[ChamadoSolucaoEmails]([GoogleContaId], [Ativo]);