BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Usuarios] (
    [Id] UNIQUEIDENTIFIER NOT NULL,
    [Nome] NVARCHAR(1000),
    [Email] NVARCHAR(1000) NOT NULL,
    [Senha] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Usuarios_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UX_Usuarios_Email] UNIQUE NONCLUSTERED ([Email])
);

-- CreateTable
CREATE TABLE [dbo].[Servicos] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [Titulo] NVARCHAR(1000),
    [Descricao] NVARCHAR(1000),
    [Valor] DECIMAL(18,2),
    [Desconto] DECIMAL(18,2),
    [Vendas] INT,
    CONSTRAINT [Servicos_pkey] PRIMARY KEY CLUSTERED ([Id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
