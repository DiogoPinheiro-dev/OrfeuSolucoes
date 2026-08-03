ALTER TABLE [ProjetoCustos]
ADD [TarefaId] UNIQUEIDENTIFIER NULL;

CREATE INDEX [IX_ProjetoCustos_TarefaId]
ON [ProjetoCustos]([TarefaId]);

ALTER TABLE [ProjetoCustos]
ADD CONSTRAINT [FK_ProjetoCustos_ProjetoTarefas_TarefaId]
FOREIGN KEY ([TarefaId]) REFERENCES [ProjetoTarefas]([Id])
ON DELETE NO ACTION ON UPDATE NO ACTION;
