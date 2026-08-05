ALTER TABLE [dbo].[Funcionalidades]
ADD [PadraoSistema] BIT NOT NULL CONSTRAINT [Funcionalidades_PadraoSistema_df] DEFAULT 0;

EXEC(N'
UPDATE [dbo].[Funcionalidades]
SET [PadraoSistema] = 1
WHERE [RegistryKey] IN (
  ''configurador.cadastro-de-usuarios'',
  ''configurador.cadastro-de-grupos'',
  ''configurador.cadastro-de-empresas'',
  ''configurador.cadastro-de-solucoes'',
  ''configurador.cadastro-de-funcionalidades'',
  ''controle-de-chamados.abrir-chamado'',
  ''controle-de-chamados.meus-chamados'',
  ''controle-de-chamados.painel-atendimento'',
  ''controle-de-chamados.chamados-arquivados'',
  ''controle-de-chamados.categorias'',
  ''controle-de-chamados.responsaveis'',
  ''controle-de-chamados.tipos'',
  ''controle-de-chamados.prioridades'',
  ''controle-de-chamados.sla'',
  ''controle-de-chamados.dashboard'',
  ''controle-de-chamados.relatorios'',
  ''controle-de-chamados.emails-solucoes'',
  ''projetos.cadastro-de-projetos'',
  ''projetos.backlog-de-demandas'',
  ''projetos.sprints'',
  ''projetos.marcos-e-entregas'',
  ''projetos.cronograma-e-gantt'',
  ''projetos.comunicacao-do-projeto'',
  ''projetos.planejamento-de-recursos'',
  ''projetos.orcamento-do-projeto'',
  ''projetos.horas-do-projeto'',
  ''projetos.templates-de-projeto'',
  ''projetos.portfolio-de-projetos''
);
');
