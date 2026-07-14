CREATE TABLE [dbo].[ChamadoNotificacoes] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_ChamadoNotificacoes_Id] DEFAULT NEWID(),
    [EmpresaId] INT NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [ChamadoId] UNIQUEIDENTIFIER NOT NULL,
    [Tipo] NVARCHAR(1000) NOT NULL,
    [Titulo] NVARCHAR(1000) NOT NULL,
    [Mensagem] NVARCHAR(1000) NOT NULL,
    [EventoChave] NVARCHAR(450) NOT NULL,
    [LidaEm] DATETIME2 NULL,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [DF_ChamadoNotificacoes_CriadoEm] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ChamadoNotificacoes] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [FK_ChamadoNotificacoes_Empresas] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]),
    CONSTRAINT [FK_ChamadoNotificacoes_Usuarios] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]),
    CONSTRAINT [FK_ChamadoNotificacoes_Chamados] FOREIGN KEY ([ChamadoId]) REFERENCES [dbo].[Chamados]([Id])
);

CREATE UNIQUE NONCLUSTERED INDEX [UX_ChamadoNotificacoes_EventoChave]
ON [dbo].[ChamadoNotificacoes]([EventoChave]);

CREATE NONCLUSTERED INDEX [IX_ChamadoNotificacoes_Usuario]
ON [dbo].[ChamadoNotificacoes]([EmpresaId], [UsuarioId], [LidaEm], [CriadoEm]);

CREATE NONCLUSTERED INDEX [IX_ChamadoNotificacoes_Chamado]
ON [dbo].[ChamadoNotificacoes]([ChamadoId], [CriadoEm]);