UPDATE [dbo].[Funcionalidades]
SET [Descricao] = N'Visualize horas alocadas, esforco por projeto e indicadores de apontamento.'
WHERE [RegistryKey] = N'horas.relatorios-de-horas'
  AND [Descricao] LIKE N'%capacidade%';
