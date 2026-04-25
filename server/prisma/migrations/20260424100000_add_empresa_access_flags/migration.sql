IF OBJECT_ID('dbo.Empresas', 'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[Empresas] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [Nome] NVARCHAR(1000),
    [AcessoEcommerce] BIT NOT NULL CONSTRAINT [DF_Empresas_AcessoEcommerce] DEFAULT 0,
    [AcessoProjetos] BIT NOT NULL CONSTRAINT [DF_Empresas_AcessoProjetos] DEFAULT 0,
    [AcessoHoras] BIT NOT NULL CONSTRAINT [DF_Empresas_AcessoHoras] DEFAULT 0,
    CONSTRAINT [Empresas_pkey] PRIMARY KEY CLUSTERED ([Id])
  );
END;

IF OBJECT_ID('dbo.EmpresaUsuarios', 'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[EmpresaUsuarios] (
    [Id] INT NOT NULL IDENTITY(1,1),
    [EmpresaId] INT NOT NULL,
    [UsuarioId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [EmpresaUsuarios_pkey] PRIMARY KEY CLUSTERED ([Id])
  );
END;

IF COL_LENGTH('dbo.Empresas', 'AcessoEcommerce') IS NULL
BEGIN
  ALTER TABLE [dbo].[Empresas]
  ADD [AcessoEcommerce] BIT NOT NULL CONSTRAINT [DF_Empresas_AcessoEcommerce] DEFAULT 0;
END;

IF EXISTS (
  SELECT 1
  FROM sys.default_constraints
  WHERE name = 'DF_Empresas_AcessoEcommerce'
    AND parent_object_id = OBJECT_ID('dbo.Empresas')
)
BEGIN
  ALTER TABLE [dbo].[Empresas] DROP CONSTRAINT [DF_Empresas_AcessoEcommerce];
END;

ALTER TABLE [dbo].[Empresas]
ADD CONSTRAINT [DF_Empresas_AcessoEcommerce] DEFAULT 0 FOR [AcessoEcommerce];

IF COL_LENGTH('dbo.Empresas', 'AcessoProjetos') IS NULL
BEGIN
  ALTER TABLE [dbo].[Empresas]
  ADD [AcessoProjetos] BIT NOT NULL CONSTRAINT [DF_Empresas_AcessoProjetos] DEFAULT 0;
END;

IF COL_LENGTH('dbo.Empresas', 'AcessoHoras') IS NULL
BEGIN
  ALTER TABLE [dbo].[Empresas]
  ADD [AcessoHoras] BIT NOT NULL CONSTRAINT [DF_Empresas_AcessoHoras] DEFAULT 0;
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.foreign_keys
  WHERE name = 'FK_EmpresaUsuarios_Empresas'
    AND parent_object_id = OBJECT_ID('dbo.EmpresaUsuarios')
)
BEGIN
  ALTER TABLE [dbo].[EmpresaUsuarios]
  ADD CONSTRAINT [FK_EmpresaUsuarios_Empresas]
  FOREIGN KEY ([EmpresaId]) REFERENCES [dbo].[Empresas]([Id]);
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.foreign_keys
  WHERE name = 'FK_EmpresaUsuarios_Usuarios'
    AND parent_object_id = OBJECT_ID('dbo.EmpresaUsuarios')
)
BEGIN
  ALTER TABLE [dbo].[EmpresaUsuarios]
  ADD CONSTRAINT [FK_EmpresaUsuarios_Usuarios]
  FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id]);
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'UX_EmpresaUsuarios_EmpresaId_UsuarioId'
    AND object_id = OBJECT_ID('dbo.EmpresaUsuarios')
)
BEGIN
  CREATE UNIQUE NONCLUSTERED INDEX [UX_EmpresaUsuarios_EmpresaId_UsuarioId]
  ON [dbo].[EmpresaUsuarios] ([EmpresaId], [UsuarioId]);
END;
