BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ProjetoAtualizacoes] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [AutorId] UNIQUEIDENTIFIER NOT NULL,
    [Conteudo] NVARCHAR(max) NOT NULL,
    [SaudePercebida] NVARCHAR(20),
    [Versao] INT NOT NULL CONSTRAINT [ProjetoAtualizacoes_Versao_df] DEFAULT 1,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoAtualizacoes_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoAtualizacoes_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[ProjetoAtualizacaoHistoricos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [AtualizacaoId] UNIQUEIDENTIFIER NOT NULL,
    [EditorId] UNIQUEIDENTIFIER NOT NULL,
    [ConteudoAnterior] NVARCHAR(max) NOT NULL,
    [SaudePercebidaAnterior] NVARCHAR(20),
    [VersaoAnterior] INT NOT NULL,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoAtualizacaoHistoricos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjetoAtualizacaoHistoricos_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[ProjetoComentarios] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [AutorId] UNIQUEIDENTIFIER NOT NULL,
    [AtualizacaoId] UNIQUEIDENTIFIER,
    [ItemId] UNIQUEIDENTIFIER,
    [Conteudo] NVARCHAR(max) NOT NULL,
    [Versao] INT NOT NULL CONSTRAINT [ProjetoComentarios_Versao_df] DEFAULT 1,
    [EditadoEm] DATETIME2,
    [ExcluidoEm] DATETIME2,
    [ExcluidoPorId] UNIQUEIDENTIFIER,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoComentarios_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    [AtualizadoEm] DATETIME2 NOT NULL,
    CONSTRAINT [ProjetoComentarios_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[ProjetoAnexos] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [EmpresaId] INT NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [AutorId] UNIQUEIDENTIFIER NOT NULL,
    [AtualizacaoId] UNIQUEIDENTIFIER,
    [ComentarioId] UNIQUEIDENTIFIER,
    [NomeOriginal] NVARCHAR(255) NOT NULL,
    [NomeArquivo] NVARCHAR(255) NOT NULL,
    [Caminho] NVARCHAR(500) NOT NULL,
    [MimeType] NVARCHAR(150) NOT NULL,
    [Tamanho] INT NOT NULL,
    [ExcluidoEm] DATETIME2,
    [ExcluidoPorId] UNIQUEIDENTIFIER,
    [CriadoEm] DATETIME2 NOT NULL CONSTRAINT [ProjetoAnexos_CriadoEm_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ProjetoAnexos_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoAtualizacoes_Empresa_Projeto_Criado] ON [dbo].[ProjetoAtualizacoes]([EmpresaId], [ProjetoId], [CriadoEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoAtualizacaoHistoricos_Atualizacao_Criado] ON [dbo].[ProjetoAtualizacaoHistoricos]([AtualizacaoId], [CriadoEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoComentarios_Empresa_Projeto_Criado] ON [dbo].[ProjetoComentarios]([EmpresaId], [ProjetoId], [CriadoEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoComentarios_Atualizacao_Excluido] ON [dbo].[ProjetoComentarios]([AtualizacaoId], [ExcluidoEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoComentarios_Item_Excluido] ON [dbo].[ProjetoComentarios]([ItemId], [ExcluidoEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoAnexos_Empresa_Projeto_Criado] ON [dbo].[ProjetoAnexos]([EmpresaId], [ProjetoId], [CriadoEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoAnexos_Atualizacao_Excluido] ON [dbo].[ProjetoAnexos]([AtualizacaoId], [ExcluidoEm]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProjetoAnexos_Comentario_Excluido] ON [dbo].[ProjetoAnexos]([ComentarioId], [ExcluidoEm]);

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAtualizacoes] ADD CONSTRAINT [ProjetoAtualizacoes_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAtualizacoes] ADD CONSTRAINT [ProjetoAtualizacoes_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAtualizacoes] ADD CONSTRAINT [ProjetoAtualizacoes_AutorId_fkey] FOREIGN KEY ([AutorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAtualizacaoHistoricos] ADD CONSTRAINT [ProjetoAtualizacaoHistoricos_AtualizacaoId_fkey] FOREIGN KEY ([AtualizacaoId]) REFERENCES [dbo].[ProjetoAtualizacoes]([Id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAtualizacaoHistoricos] ADD CONSTRAINT [ProjetoAtualizacaoHistoricos_EditorId_fkey] FOREIGN KEY ([EditorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoComentarios] ADD CONSTRAINT [ProjetoComentarios_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoComentarios] ADD CONSTRAINT [ProjetoComentarios_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoComentarios] ADD CONSTRAINT [ProjetoComentarios_AutorId_fkey] FOREIGN KEY ([AutorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoComentarios] ADD CONSTRAINT [ProjetoComentarios_ExcluidoPorId_fkey] FOREIGN KEY ([ExcluidoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoComentarios] ADD CONSTRAINT [ProjetoComentarios_AtualizacaoId_fkey] FOREIGN KEY ([AtualizacaoId]) REFERENCES [dbo].[ProjetoAtualizacoes]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoComentarios] ADD CONSTRAINT [ProjetoComentarios_ItemId_fkey] FOREIGN KEY ([ItemId]) REFERENCES [dbo].[ProjetoItens]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAnexos] ADD CONSTRAINT [ProjetoAnexos_EmpresaId_fkey] FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAnexos] ADD CONSTRAINT [ProjetoAnexos_ProjetoId_fkey] FOREIGN KEY ([ProjetoId]) REFERENCES [dbo].[Projetos]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAnexos] ADD CONSTRAINT [ProjetoAnexos_AutorId_fkey] FOREIGN KEY ([AutorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAnexos] ADD CONSTRAINT [ProjetoAnexos_ExcluidoPorId_fkey] FOREIGN KEY ([ExcluidoPorId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAnexos] ADD CONSTRAINT [ProjetoAnexos_AtualizacaoId_fkey] FOREIGN KEY ([AtualizacaoId]) REFERENCES [dbo].[ProjetoAtualizacoes]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjetoAnexos] ADD CONSTRAINT [ProjetoAnexos_ComentarioId_fkey] FOREIGN KEY ([ComentarioId]) REFERENCES [dbo].[ProjetoComentarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
