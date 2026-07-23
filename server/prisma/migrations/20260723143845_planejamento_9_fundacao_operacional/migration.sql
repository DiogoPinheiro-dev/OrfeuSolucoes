BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ProjetoEventos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER,
    [Entidade] NVARCHAR(40) NOT NULL,
    [EntidadeId] NVARCHAR(100) NOT NULL,
    [Evento] NVARCHAR(60) NOT NULL,
    [Dados] NVARCHAR(max),
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoEventos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjetoEventos_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[ProjetoSequencias] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [Namespace] NVARCHAR(40) NOT NULL,
    [ProximoNumero] INT NOT NULL CONSTRAINT [ProjetoSequencias_ProximoNumero_df] DEFAULT 1,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoSequencias_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ProjetoSequencias_ProjetoId_Namespace] UNIQUE NONCLUSTERED ([ProjetoId],[Namespace])
);

-- CreateTable
CREATE TABLE [dbo].[ProjetoOperacoesIdempotentes] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    [Operacao] NVARCHAR(60) NOT NULL,
    [Chave] NVARCHAR(100) NOT NULL,
    [RequisicaoHash] NVARCHAR(64) NOT NULL,
    [Status] NVARCHAR(20) NOT NULL,
    [Resposta] NVARCHAR(max),
    [Erro] NVARCHAR(max),
    [ExpiraEm] DATETIME2,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoOperacoesIdempotentes_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoOperacoesIdempotentes_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_ProjetoOperacoesIdempotentes_Escopo] UNIQUE NONCLUSTERED ([ProjetoId],[UsuarioId],[Operacao],[Chave])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoEventos_EmpresaId_ProjetoId_CriadoEm] ON [dbo].[ProjetoEventos]([EmpresaId], [ProjetoId], [CriadoEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoEventos_ProjetoId_Entidade_EntidadeId] ON [dbo].[ProjetoEventos]([ProjetoId], [Entidade], [EntidadeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoOperacoesIdempotentes_EmpresaId_ProjetoId_Status_ExpiraEm] ON [dbo].[ProjetoOperacoesIdempotentes]([EmpresaId], [ProjetoId], [Status], [ExpiraEm]);

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoEventos] ADD CONSTRAINT [ProjetoEventos_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoEventos] ADD CONSTRAINT [ProjetoEventos_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoEventos] ADD CONSTRAINT [ProjetoEventos_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoSequencias] ADD CONSTRAINT [ProjetoSequencias_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoOperacoesIdempotentes] ADD CONSTRAINT [ProjetoOperacoesIdempotentes_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoOperacoesIdempotentes] ADD CONSTRAINT [ProjetoOperacoesIdempotentes_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoOperacoesIdempotentes] ADD CONSTRAINT [ProjetoOperacoesIdempotentes_UsuarioId_fkey] FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
