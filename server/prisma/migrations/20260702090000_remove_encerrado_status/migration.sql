UPDATE [dbo].[Chamados]
SET [Status] = 'ARQUIVADO'
WHERE [Status] = 'ENCERRADO';