export type AgrupamentoPadraoDefinition = {
  slug: string;
  titulo: string;
  label: string;
  descricao: string;
  ordem: number;
  /** Slugs das funcionalidades, na ordem das abas. */
  funcionalidades: string[];
};

export const CONFIGURADOR_AGRUPAMENTOS_PADRAO: AgrupamentoPadraoDefinition[] = [
  {
    slug: 'acessos',
    titulo: 'Usuários e acessos',
    label: 'Acessos',
    descricao: 'Cadastre usuários, grupos de acesso e as empresas atendidas.',
    ordem: 10,
    funcionalidades: ['cadastro-de-usuarios', 'cadastro-de-grupos', 'cadastro-de-empresas']
  },
  {
    slug: 'catalogo',
    titulo: 'Catálogo do Hub',
    label: 'Catálogo',
    descricao: 'Mantenha as soluções, as funcionalidades e os agrupamentos apresentados no Hub.',
    ordem: 35,
    funcionalidades: ['cadastro-de-solucoes', 'cadastro-de-funcionalidades']
  }
];

export const CHAMADOS_AGRUPAMENTOS_PADRAO: AgrupamentoPadraoDefinition[] = [
  {
    slug: 'indicadores',
    titulo: 'Indicadores do atendimento',
    label: 'Indicadores',
    descricao: 'Acompanhe o dashboard da operação e consulte os relatórios dos chamados.',
    ordem: 45,
    funcionalidades: ['dashboard', 'relatorios']
  },
  {
    slug: 'configuracoes-do-atendimento',
    titulo: 'Configurações do atendimento',
    label: 'Configurações',
    descricao: 'Configure categorias, tipos, prioridades, SLA, responsáveis e o e-mail usados no atendimento.',
    ordem: 50,
    funcionalidades: ['categorias', 'tipos', 'prioridades', 'sla', 'responsaveis', 'emails-solucoes']
  }
];

export const PROJETOS_AGRUPAMENTOS_PADRAO: AgrupamentoPadraoDefinition[] = [
  {
    slug: 'execucao-do-projeto',
    titulo: 'Execução do projeto',
    label: 'Execução',
    descricao: 'Planeje sprints, acompanhe marcos e entregas e consulte o cronograma do projeto.',
    ordem: 30,
    funcionalidades: ['sprints', 'marcos-e-entregas', 'cronograma-e-gantt']
  },
  {
    slug: 'recursos-e-equipes',
    titulo: 'Recursos e equipes',
    label: 'Organização',
    descricao: 'Cadastre recursos e capacitações e organize as equipes que atendem os projetos.',
    ordem: 70,
    funcionalidades: ['planejamento-de-recursos', 'equipes']
  }
];
