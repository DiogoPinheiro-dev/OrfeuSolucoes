BEGIN TRY

BEGIN TRAN;

-- Chamado: permite responsavel oficial por grupo e lideranca temporaria de atendimento.
ALTER TABLE [dbo].[Chamados] ADD [ResponsavelGrupoId] INT NULL;
ALTER TABLE [dbo].[Chamados] ADD [LiderAtendimentoId] UNIQUEIDENTIFIER NULL;
ALTER TABLE [dbo].[Chamados] ADD [AtendimentoAssumidoEm] DATETIME2 NULL;

CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_ResponsavelGrupoId] ON [dbo].[Chamados]([EmpresaId], [ResponsavelGrupoId]);
CREATE NONCLUSTERED INDEX [IX_Chamados_EmpresaId_LiderAtendimentoId] ON [dbo].[Chamados]([EmpresaId], [LiderAtendimentoId]);

ALTER TABLE [dbo].[Chamados] ADD CONSTRAINT [Chamados_ResponsavelGrupoId_fkey] FOREIGN KEY ([ResponsavelGrupoId]) REFERENCES [dbo].[GruposUsuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[Chamados] ADD CONSTRAINT [Chamados_LiderAtendimentoId_fkey] FOREIGN KEY ([LiderAtendimentoId]) REFERENCES [dbo].[Usuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Responsaveis de chamados: o alvo pode ser usuario ou grupo.
ALTER TABLE [dbo].[ChamadoResponsaveis] DROP CONSTRAINT [UX_ChamadoResponsaveis_EmpresaId_UsuarioId];
ALTER TABLE [dbo].[ChamadoResponsaveis] ADD [Tipo] NVARCHAR(20) NOT NULL CONSTRAINT [ChamadoResponsaveis_Tipo_df] DEFAULT N'USUARIO';
ALTER TABLE [dbo].[ChamadoResponsaveis] ADD [GrupoId] INT NULL;
ALTER TABLE [dbo].[ChamadoResponsaveis] ALTER COLUMN [UsuarioId] UNIQUEIDENTIFIER NULL;

CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveis_EmpresaId_Tipo] ON [dbo].[ChamadoResponsaveis]([EmpresaId], [Tipo]);
CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveis_EmpresaId_UsuarioId] ON [dbo].[ChamadoResponsaveis]([EmpresaId], [UsuarioId]);
CREATE NONCLUSTERED INDEX [IX_ChamadoResponsaveis_EmpresaId_GrupoId] ON [dbo].[ChamadoResponsaveis]([EmpresaId], [GrupoId]);

ALTER TABLE [dbo].[ChamadoResponsaveis] ADD CONSTRAINT [ChamadoResponsaveis_GrupoId_fkey] FOREIGN KEY ([GrupoId]) REFERENCES [dbo].[GruposUsuarios]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH