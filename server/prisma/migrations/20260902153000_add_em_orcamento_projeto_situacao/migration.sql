ALTER TABLE [dbo].[Projetos]
DROP CONSTRAINT [CK_Projetos_Situacao];

ALTER TABLE [dbo].[Projetos]
ADD CONSTRAINT [CK_Projetos_Situacao]
CHECK ([Situacao] IN (
    'RASCUNHO',
    'EM_ORCAMENTO',
    'PLANEJADO',
    'EM_ANDAMENTO',
    'PAUSADO',
    'CONCLUIDO',
    'CANCELADO'
));
