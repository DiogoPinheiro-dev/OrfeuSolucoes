export const HORAS_SOLUTION_DEFINITION = {
  slug: 'horas',
  nome: 'Controle de Horas',
  descricao: 'Registro de apontamentos, horas alocadas por atividade e visibilidade do esforço da equipe.',
  eyebrow: 'Operação',
  ordem: 20,
  ativo: false,
  exibirNoHub: false,
  somenteAdminSistema: false,
  padraoSistema: true
} as const;

export const HORAS_FEATURE_DEFINITIONS = [
  {
    slug: 'registro-de-horas',
    titulo: 'Registro de horas',
    label: 'Apontamentos',
    descricao: 'Lance horas por atividade, projeto e período de execução.',
    ordem: 10,
    registryKey: 'horas.registro-de-horas'
  },
  {
    slug: 'aprovacao-de-apontamentos',
    titulo: 'Aprovação de apontamentos',
    label: 'Aprovação',
    descricao: 'Revise apontamentos, valide registros e acompanhe pendências.',
    ordem: 20,
    registryKey: 'horas.aprovacao-de-apontamentos'
  },
  {
    slug: 'relatorios-de-horas',
    titulo: 'Relatórios de horas',
    label: 'Relatórios',
    descricao: 'Visualize horas alocadas, esforço por projeto e indicadores de apontamento.',
    ordem: 30,
    registryKey: 'horas.relatorios-de-horas'
  }
] as const;
