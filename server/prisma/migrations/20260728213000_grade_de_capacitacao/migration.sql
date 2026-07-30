IF COL_LENGTH(N'dbo.ProjetoAlocacoes', N'Atividade') IS NULL
BEGIN
    ALTER TABLE [dbo].[ProjetoAlocacoes]
        ADD [Atividade] NVARCHAR(500) NULL;
END;

DECLARE @SolucaoProjetosId INT = (
    SELECT TOP (1) [Id]
    FROM [dbo].[Solucoes]
    WHERE [Slug] = N'projetos'
);

IF @SolucaoProjetosId IS NOT NULL
BEGIN
    UPDATE [dbo].[Funcionalidades]
       SET [Titulo] = N'Cadastro de recursos',
           [Label] = N'Recursos',
           [Descricao] = N'Cadastre recursos da empresa e vincule-os aos projetos em que podem atuar.',
           [Ordem] = 70,
           [RegistryKey] = N'projetos.recursos-do-projeto',
           [Ativo] = 1
     WHERE [SolucaoId] = @SolucaoProjetosId
       AND [Slug] = N'recursos-do-projeto';

    IF EXISTS (
        SELECT 1 FROM [dbo].[Funcionalidades]
        WHERE [SolucaoId] = @SolucaoProjetosId
          AND [Slug] = N'grade-de-capacitacao'
    )
    BEGIN
        UPDATE [dbo].[Funcionalidades]
           SET [Titulo] = N'Grade de capacitacao',
               [Label] = N'Grade de capacitacao',
               [Descricao] = N'Planeje capacidade, alocacao e as atividades que cada recurso executara nos projetos.',
               [Ordem] = 80,
               [RegistryKey] = N'projetos.grade-de-capacitacao',
               [Ativo] = 1
         WHERE [SolucaoId] = @SolucaoProjetosId
           AND [Slug] = N'grade-de-capacitacao';
    END;

    UPDATE [dbo].[Funcionalidades]
       SET [Ordem] = CASE [Slug]
           WHEN N'orcamento-do-projeto' THEN 90
           WHEN N'horas-do-projeto' THEN 100
           WHEN N'templates-de-projeto' THEN 110
           WHEN N'portfolio-de-projetos' THEN 120
           ELSE [Ordem]
       END
     WHERE [SolucaoId] = @SolucaoProjetosId
       AND [Slug] IN (N'orcamento-do-projeto', N'horas-do-projeto', N'templates-de-projeto', N'portfolio-de-projetos');
END;
