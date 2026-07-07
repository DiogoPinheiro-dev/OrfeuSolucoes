INSERT INTO [ChamadoTipos] ([EmpresaId], [Nome], [Descricao], [Cor], [Ordem], [Ativo], [CriadoEm], [AtualizadoEm])
SELECT E.[Id], V.[Nome], NULL, V.[Cor], V.[Ordem], 1, SYSDATETIME(), SYSDATETIME()
FROM [Empresas] E
CROSS JOIN (VALUES
  (N'Solicitacao', N'#ea580c', 10),
  (N'Incidente', N'#dc2626', 20),
  (N'Duvida', N'#16a34a', 30),
  (N'Melhoria', N'#f59e0b', 40)
) V([Nome], [Cor], [Ordem])
WHERE EXISTS (
  SELECT 1
  FROM [EmpresaSolucoes] ES
  INNER JOIN [Solucoes] S ON S.[Id] = ES.[SolucaoId]
  WHERE ES.[EmpresaId] = E.[Id]
    AND S.[Slug] = N'controle-de-chamados'
)
AND NOT EXISTS (
  SELECT 1
  FROM [ChamadoTipos] CT
  WHERE CT.[EmpresaId] = E.[Id]
    AND CT.[Nome] = V.[Nome]
);

INSERT INTO [ChamadoPrioridades] ([EmpresaId], [Nome], [Descricao], [Cor], [Ordem], [Ativo], [CriadoEm], [AtualizadoEm])
SELECT E.[Id], V.[Nome], NULL, V.[Cor], V.[Ordem], 1, SYSDATETIME(), SYSDATETIME()
FROM [Empresas] E
CROSS JOIN (VALUES
  (N'Baixa', N'#16a34a', 10),
  (N'Media', N'#f59e0b', 20),
  (N'Alta', N'#ea580c', 30),
  (N'Urgente', N'#dc2626', 40)
) V([Nome], [Cor], [Ordem])
WHERE EXISTS (
  SELECT 1
  FROM [EmpresaSolucoes] ES
  INNER JOIN [Solucoes] S ON S.[Id] = ES.[SolucaoId]
  WHERE ES.[EmpresaId] = E.[Id]
    AND S.[Slug] = N'controle-de-chamados'
)
AND NOT EXISTS (
  SELECT 1
  FROM [ChamadoPrioridades] CP
  WHERE CP.[EmpresaId] = E.[Id]
    AND CP.[Nome] = V.[Nome]
);