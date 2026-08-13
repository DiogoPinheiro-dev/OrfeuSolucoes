UPDATE [dbo].[Solucoes]
SET [Descricao] = N'Central administrativa para cadastrar usuários, empresas, grupos e acessos.'
WHERE [Slug] = N'configurador' AND [PadraoSistema] = 1;

UPDATE [dbo].[Solucoes]
SET
  [Descricao] = N'Espaço para organizar projetos, backlog, entregas, marcos e comunicação entre as equipes.',
  [Eyebrow] = N'Operação'
WHERE [Slug] = N'projetos' AND [PadraoSistema] = 1;

UPDATE [dbo].[Solucoes]
SET [Descricao] = N'Registro de apontamentos, horas alocadas por atividade e visibilidade do esforço da equipe.'
WHERE [Slug] = N'horas' AND [PadraoSistema] = 1;

UPDATE [dbo].[Solucoes]
SET
  [Nome] = N'Documentação',
  [Descricao] = N'Manuais de uso e referências do sistema conforme seu nível de acesso.'
WHERE [Slug] = N'documentacao' AND [PadraoSistema] = 1;

UPDATE funcionalidade
SET
  [Titulo] = texto.[Titulo],
  [Label] = texto.[Label],
  [Descricao] = texto.[Descricao]
FROM [dbo].[Funcionalidades] AS funcionalidade
INNER JOIN [dbo].[Solucoes] AS solucao ON solucao.[Id] = funcionalidade.[SolucaoId]
INNER JOIN (VALUES
  (N'configurador', N'cadastro-de-usuarios', N'Cadastro de usuários', N'Usuários', N'Gerencie contas, dados de acesso, grupo e empresas dos usuários.'),
  (N'configurador', N'cadastro-de-grupos', N'Cadastro de grupos', N'Grupos', N'Defina grupos de usuários, soluções, funcionalidades e permissões.'),
  (N'configurador', N'cadastro-de-empresas', N'Cadastro de empresas', N'Empresas', N'Crie e mantenha empresas, liberando soluções e funcionalidades contratadas.'),
  (N'configurador', N'cadastro-de-solucoes', N'Cadastro de soluções', N'Soluções', N'Crie e mantenha as soluções exibidas no hub do sistema.'),
  (N'configurador', N'cadastro-de-funcionalidades', N'Cadastro de funcionalidades', N'Funcionalidades', N'Crie e mantenha rotas de funcionalidades vinculadas às soluções do sistema.'),

  (N'projetos', N'cadastro-de-projetos', N'Cadastro de projetos', N'Projetos', N'Cadastre projetos, responsáveis, participantes, metodologia e ciclo de vida.'),
  (N'projetos', N'backlog-de-demandas', N'Backlog de demandas', N'Backlog', N'Organize demandas, prioridades e itens planejados para o projeto.'),
  (N'projetos', N'sprints', N'Sprints', N'Sprints', N'Planeje e acompanhe períodos de execução do projeto.'),
  (N'projetos', N'marcos-e-entregas', N'Marcos e entregas', N'Marcos e entregas', N'Acompanhe marcos, entregas previstas e resultados do projeto.'),
  (N'projetos', N'cronograma-e-gantt', N'Cronograma e Gantt', N'Cronograma', N'Consulte datas, dependências e riscos do cronograma.'),
  (N'projetos', N'comunicacao-do-projeto', N'Comunicação do projeto', N'Comunicação', N'Centralize comunicados, decisões e alinhamentos do projeto.'),
  (N'projetos', N'planejamento-de-recursos', N'Planejamento de recursos', N'Planejamento de recursos', N'Gerencie os vínculos dos recursos com os projetos e suas tarefas.'),
  (N'projetos', N'orcamento-do-projeto', N'Orçamento do projeto', N'Orçamento', N'Planeje o orçamento, categorias e custos do projeto.'),
  (N'projetos', N'horas-do-projeto', N'Horas do projeto', N'Horas', N'Consulte apontamentos pertencentes ao Controle de Horas.'),
  (N'projetos', N'templates-de-projeto', N'Templates de projeto', N'Templates', N'Gerencie estruturas versionadas para novos projetos.'),
  (N'projetos', N'portfolio-de-projetos', N'Portfólio de projetos', N'Portfólio', N'Acompanhe indicadores agregados dos projetos acessíveis.'),

  (N'horas', N'registro-de-horas', N'Registro de horas', N'Apontamentos', N'Lance horas por atividade, projeto e período de execução.'),
  (N'horas', N'aprovacao-de-apontamentos', N'Aprovação de apontamentos', N'Aprovação', N'Revise apontamentos, valide registros e acompanhe pendências.'),
  (N'horas', N'relatorios-de-horas', N'Relatórios de horas', N'Relatórios', N'Visualize horas alocadas, esforço por projeto e indicadores de apontamento.'),

  (N'controle-de-chamados', N'abrir-chamado', N'Abrir chamado', N'Novo chamado', N'Registre uma nova solicitação de atendimento para a empresa selecionada.'),
  (N'controle-de-chamados', N'meus-chamados', N'Meus chamados', N'Minhas solicitações', N'Acompanhe chamados abertos por você, responda e solicite reabertura quando necessário.'),
  (N'controle-de-chamados', N'painel-atendimento', N'Painel de atendimento', N'Fila de atendimento', N'Visualize a fila da empresa, assuma, atribua, responda e movimente chamados.'),
  (N'controle-de-chamados', N'chamados-arquivados', N'Chamados arquivados', N'Arquivados', N'Visualize chamados arquivados e permita desarquivamento controlado por administradores.'),
  (N'controle-de-chamados', N'dashboard', N'Dashboard de chamados', N'Dashboard', N'Acompanhe volume, SLA e tempos médios da operação de atendimento.'),
  (N'controle-de-chamados', N'categorias', N'Categorias de chamados', N'Categorias', N'Configure categorias de chamados específicas da empresa selecionada.'),
  (N'controle-de-chamados', N'responsaveis', N'Cadastro de responsáveis', N'Responsáveis', N'Cadastre supervisores e responsáveis por solução ou funcionalidade.'),
  (N'controle-de-chamados', N'tipos', N'Tipos de chamados', N'Tipos', N'Configure os tipos usados na abertura e classificação dos chamados.'),
  (N'controle-de-chamados', N'prioridades', N'Prioridades de chamados', N'Prioridades', N'Configure as prioridades usadas na triagem e atendimento dos chamados.'),
  (N'controle-de-chamados', N'sla', N'Regras de SLA', N'SLA', N'Configure prazos de primeira resposta e resolução por prioridade.'),
  (N'controle-de-chamados', N'emails-solucoes', N'Configuração de e-mail', N'E-mail', N'Conecte a conta Google principal usada nas notificações automáticas dos chamados.'),
  (N'controle-de-chamados', N'relatorios', N'Relatórios de chamados', N'Relatórios', N'Consulte chamados por período e filtros operacionais, com exportação CSV ou Excel.')
) AS texto([SolucaoSlug], [FuncionalidadeSlug], [Titulo], [Label], [Descricao])
  ON texto.[SolucaoSlug] = solucao.[Slug]
  AND texto.[FuncionalidadeSlug] = funcionalidade.[Slug]
WHERE solucao.[PadraoSistema] = 1 AND funcionalidade.[PadraoSistema] = 1;

UPDATE acao
SET
  [Nome] = texto.[Nome],
  [Descricao] = texto.[Descricao]
FROM [dbo].[FuncionalidadeAcoes] AS acao
INNER JOIN [dbo].[Funcionalidades] AS funcionalidade ON funcionalidade.[Id] = acao.[FuncionalidadeId]
INNER JOIN [dbo].[Solucoes] AS solucao ON solucao.[Id] = funcionalidade.[SolucaoId]
INNER JOIN (VALUES
  (N'projetos', N'marcos-e-entregas', N'aprovar', N'Aprovar entregas', N'Permite aprovar compromissos de negócio.'),
  (N'projetos', N'cronograma-e-gantt', N'editar_datas', N'Editar datas', N'Permite confirmar alterações de datas no cronograma.'),
  (N'projetos', N'comunicacao-do-projeto', N'comentar', N'Comentar', N'Permite publicar e editar comentários próprios.'),
  (N'projetos', N'comunicacao-do-projeto', N'moderar', N'Moderar', N'Permite moderar comentários de outros autores.'),
  (N'projetos', N'orcamento-do-projeto', N'gerenciar_financeiro', N'Gerenciar financeiro', N'Permite alterar orçamentos e custos.'),
  (N'projetos', N'orcamento-do-projeto', N'aprovar_orcamento', N'Aprovar orçamento', N'Permite aprovar a linha de base.'),
  (N'projetos', N'horas-do-projeto', N'apontar', N'Apontar horas', N'Permite registrar esforço.'),
  (N'projetos', N'templates-de-projeto', N'publicar', N'Publicar template', N'Permite publicar uma versão imutável.'),
  (N'projetos', N'portfolio-de-projetos', N'visualizar_financeiro', N'Visualizar financeiro', N'Permite consultar agregações financeiras.'),
  (N'controle-de-chamados', N'meus-chamados', N'responder_proprio_chamado', N'Responder próprio chamado', N'Permite adicionar respostas públicas nos próprios chamados.'),
  (N'controle-de-chamados', N'meus-chamados', N'reabrir_proprio_chamado', N'Reabrir próprio chamado', N'Permite reabrir chamados próprios que foram resolvidos.')
) AS texto([SolucaoSlug], [FuncionalidadeSlug], [Chave], [Nome], [Descricao])
  ON texto.[SolucaoSlug] = solucao.[Slug]
  AND texto.[FuncionalidadeSlug] = funcionalidade.[Slug]
  AND texto.[Chave] = acao.[Chave]
WHERE solucao.[PadraoSistema] = 1 AND funcionalidade.[PadraoSistema] = 1;

UPDATE tipo
SET [Nome] = N'Solicitação'
FROM [dbo].[ChamadoTipos] AS tipo
WHERE
  tipo.[Nome] = N'Solicitacao'
  AND tipo.[Cor] = N'#ea580c'
  AND tipo.[Ordem] = 10
  AND NOT EXISTS (
    SELECT 1
    FROM [dbo].[ChamadoTipos] AS existente
    WHERE existente.[EmpresaId] = tipo.[EmpresaId] AND existente.[Nome] = N'Solicitação'
  );

UPDATE tipo
SET [Nome] = N'Dúvida'
FROM [dbo].[ChamadoTipos] AS tipo
WHERE
  tipo.[Nome] = N'Duvida'
  AND tipo.[Cor] = N'#16a34a'
  AND tipo.[Ordem] = 30
  AND NOT EXISTS (
    SELECT 1
    FROM [dbo].[ChamadoTipos] AS existente
    WHERE existente.[EmpresaId] = tipo.[EmpresaId] AND existente.[Nome] = N'Dúvida'
  );

UPDATE prioridade
SET [Nome] = N'Média'
FROM [dbo].[ChamadoPrioridades] AS prioridade
WHERE
  prioridade.[Nome] = N'Media'
  AND prioridade.[Cor] = N'#f59e0b'
  AND prioridade.[Ordem] = 20
  AND NOT EXISTS (
    SELECT 1
    FROM [dbo].[ChamadoPrioridades] AS existente
    WHERE existente.[EmpresaId] = prioridade.[EmpresaId] AND existente.[Nome] = N'Média'
  );
