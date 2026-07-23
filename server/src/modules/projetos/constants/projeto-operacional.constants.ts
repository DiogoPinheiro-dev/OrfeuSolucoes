export const PROJETOS_SOLUTION_SLUG = 'projetos';

export const ProjetoFuncionalidade = {
  CADASTRO: 'cadastro-de-projetos',
  BACKLOG: 'backlog-de-demandas',
  SPRINTS: 'sprints',
  MARCOS_ENTREGAS: 'marcos-e-entregas',
  CRONOGRAMA: 'cronograma-e-gantt',
  COMUNICACAO: 'comunicacao-do-projeto',
  ORCAMENTO_RECURSOS: 'orcamento-e-recursos',
  HORAS: 'horas-do-projeto',
  TEMPLATES: 'templates-de-projeto',
  PORTFOLIO: 'portfolio-de-projetos'
} as const;

export type ProjetoFuncionalidadeSlug =
  typeof ProjetoFuncionalidade[keyof typeof ProjetoFuncionalidade];

export const ProjetoAcao = {
  VISUALIZAR: 'visualizar',
  INCLUIR: 'incluir',
  ALTERAR: 'alterar',
  EXCLUIR: 'excluir',
  GERENCIAR_MEMBROS: 'gerenciar_membros',
  ALTERAR_STATUS: 'alterar_status',
  REATIVAR_PROJETO: 'reativar_projeto',
  PRIORIZAR: 'priorizar',
  PLANEJAR: 'planejar',
  INICIAR: 'iniciar',
  CONCLUIR: 'concluir',
  CANCELAR: 'cancelar',
  APROVAR: 'aprovar',
  EDITAR_DATAS: 'editar_datas',
  COMENTAR: 'comentar',
  MODERAR: 'moderar',
  GERENCIAR_ANEXOS: 'gerenciar_anexos',
  VISUALIZAR_FINANCEIRO: 'visualizar_financeiro',
  GERENCIAR_FINANCEIRO: 'gerenciar_financeiro',
  APROVAR_ORCAMENTO: 'aprovar_orcamento',
  APONTAR: 'apontar',
  APROVAR_HORAS: 'aprovar_horas',
  REABRIR_HORAS: 'reabrir_horas',
  PUBLICAR: 'publicar',
  INSTANCIAR: 'instanciar'
} as const;

