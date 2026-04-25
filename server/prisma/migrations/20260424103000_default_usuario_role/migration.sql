IF OBJECT_ID(N'[dbo].[Usuarios]', N'U') IS NOT NULL
BEGIN
    UPDATE [dbo].[Usuarios]
    SET [Tipo] = 'USUARIO'
    WHERE [Tipo] = 'FUNCIONARIO';

    IF OBJECT_ID(N'[dbo].[Usuarios_Tipo_df]', N'D') IS NOT NULL
    BEGIN
        ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT [Usuarios_Tipo_df];
    END

    ALTER TABLE [dbo].[Usuarios] ADD CONSTRAINT [Usuarios_Tipo_df] DEFAULT 'USUARIO' FOR [Tipo];
END
