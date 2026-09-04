/*
  Substitui definitivamente o cadastro paralelo de tarefas pelos itens do backlog.
  Custos associados a tarefas legadas recebem um item equivalente no projeto antes
  da remoção das estruturas antigas. Alocações antigas não possuem mais consumidor
  funcional e são removidas junto com o cadastro paralelo.
*/

ALTER TABLE [dbo].[ProjetoCustos] ADD [ItemId] UNIQUEIDENTIFIER NULL;

CREATE TABLE [dbo].[MigracaoTarefaItem] (
    [TarefaId] UNIQUEIDENTIFIER NOT NULL,
    [ProjetoId] UNIQUEIDENTIFIER NOT NULL,
    [ItemId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [PK_MigracaoTarefaItem] PRIMARY KEY ([TarefaId], [ProjetoId])
);

DECLARE @TarefaId UNIQUEIDENTIFIER;
DECLARE @ProjetoId UNIQUEIDENTIFIER;
DECLARE @EmpresaId INT;
DECLARE @Titulo NVARCHAR(500);
DECLARE @EstimativaMinutos INT;
DECLARE @ResponsavelId UNIQUEIDENTIFIER;
DECLARE @AutorId UNIQUEIDENTIFIER;
DECLARE @Numero INT;
DECLARE @ItemId UNIQUEIDENTIFIER;
DECLARE @ChaveProjeto NVARCHAR(10);

DECLARE tarefas_cursor CURSOR LOCAL FAST_FORWARD FOR
SELECT DISTINCT
    T.[Id],
    C.[ProjetoId],
    C.[EmpresaId],
    T.[Funcionalidade],
    T.[EstimativaMinutos],
    R.[UsuarioId],
    P.[CriadoPorId],
    P.[Chave]
FROM [dbo].[ProjetoCustos] C
INNER JOIN [dbo].[ProjetoTarefas] T ON T.[Id] = C.[TarefaId]
LEFT JOIN [dbo].[ProjetoRecursos] PR ON PR.[Id] = C.[RecursoId]
LEFT JOIN [dbo].[Recursos] R ON R.[Id] = PR.[RecursoId]
INNER JOIN [dbo].[Projetos] P ON P.[Id] = C.[ProjetoId]
WHERE C.[TarefaId] IS NOT NULL;

OPEN tarefas_cursor;
FETCH NEXT FROM tarefas_cursor INTO @TarefaId, @ProjetoId, @EmpresaId, @Titulo, @EstimativaMinutos, @ResponsavelId, @AutorId, @ChaveProjeto;

WHILE @@FETCH_STATUS = 0
BEGIN
    SELECT @ItemId = MIN([Id])
    FROM [dbo].[ProjetoItens]
    WHERE [ProjetoId] = @ProjetoId
      AND [Titulo] = LEFT(@Titulo, 200)
      AND [ArquivadoEm] IS NULL;

    IF @ItemId IS NULL
    BEGIN
        SELECT @Numero = ISNULL(MAX([Numero]), 0) + 1
        FROM [dbo].[ProjetoItens] WITH (UPDLOCK, HOLDLOCK)
        WHERE [ProjetoId] = @ProjetoId;

        SET @ItemId = NEWID();

        INSERT INTO [dbo].[ProjetoItens] (
            [Id], [EmpresaId], [ProjetoId], [Numero], [Chave], [OrdemBacklog],
            [Tipo], [Titulo], [Descricao], [Status], [Prioridade], [ResponsavelId],
            [AutorId], [PaiId], [InicioPrevistoEm], [FimPrevistoEm],
            [EstimativaMinutos], [ConcluidoEm], [Versao], [ArquivadoEm],
            [ArquivadoPorId], [CriadoEm], [AtualizadoEm]
        ) VALUES (
            @ItemId, @EmpresaId, @ProjetoId, @Numero,
            CONCAT(@ChaveProjeto, N'-', CONVERT(NVARCHAR(12), @Numero)), @Numero,
            N'TAREFA', LEFT(@Titulo, 200), N'Item migrado do cadastro antigo de tarefas.',
            N'A_FAZER', N'MEDIA', @ResponsavelId, @AutorId, NULL, NULL, NULL,
            NULLIF(@EstimativaMinutos, 0), NULL, 1, NULL, NULL, SYSUTCDATETIME(), SYSUTCDATETIME()
        );
    END;

    INSERT INTO [dbo].[MigracaoTarefaItem] ([TarefaId], [ProjetoId], [ItemId])
    VALUES (@TarefaId, @ProjetoId, @ItemId);

    SET @ItemId = NULL;
    FETCH NEXT FROM tarefas_cursor INTO @TarefaId, @ProjetoId, @EmpresaId, @Titulo, @EstimativaMinutos, @ResponsavelId, @AutorId, @ChaveProjeto;
END;

CLOSE tarefas_cursor;
DEALLOCATE tarefas_cursor;

UPDATE C
SET C.[ItemId] = M.[ItemId]
FROM [dbo].[ProjetoCustos] C
INNER JOIN [dbo].[MigracaoTarefaItem] M
    ON M.[TarefaId] = C.[TarefaId]
   AND M.[ProjetoId] = C.[ProjetoId];

DROP INDEX [IX_ProjetoCustos_TarefaId] ON [dbo].[ProjetoCustos];
ALTER TABLE [dbo].[ProjetoCustos] DROP CONSTRAINT [FK_ProjetoCustos_ProjetoTarefas_TarefaId];
ALTER TABLE [dbo].[ProjetoCustos] DROP COLUMN [TarefaId];

CREATE INDEX [IX_ProjetoCustos_ItemId] ON [dbo].[ProjetoCustos]([ItemId]);
ALTER TABLE [dbo].[ProjetoCustos]
ADD CONSTRAINT [ProjetoCustos_ItemId_fkey]
FOREIGN KEY ([ItemId]) REFERENCES [dbo].[ProjetoItens]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

DROP TABLE [dbo].[MigracaoTarefaItem];
DROP TABLE [dbo].[ProjetoAlocacoes];
DROP TABLE [dbo].[ProjetoTarefaTaxasHistorico];
DROP TABLE [dbo].[ProjetoTarefaRecursos];
DROP TABLE [dbo].[ProjetoTarefas];

UPDATE [dbo].[Funcionalidades]
SET [Titulo] = N'Recursos, equipes e planejamento',
    [Label] = N'Recursos e equipes',
    [Descricao] = N'Gerencie recursos, equipes e a atribuição dos itens do backlog.'
WHERE [RegistryKey] = N'projetos.planejamento-de-recursos'
  AND [Titulo] = N'Planejamento de recursos'
  AND [Descricao] = N'Gerencie os vínculos dos recursos com os projetos e suas tarefas.';
