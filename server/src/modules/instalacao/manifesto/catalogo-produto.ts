export type AcessoInicialProduto = 'PADRAO_DA_SOLUCAO' | 'SOMENTE_ADMINISTRADORES';

export type AcaoProdutoDefinition = {
  chave: string;
  nome: string;
  descricao?: string | null;
  ordem: number;
  ativo: boolean;
  acaoPadrao?: boolean;
  configuracao?: string | null;
};

export type FuncionalidadeProdutoDefinition = {
  slug: string;
  titulo: string;
  label: string;
  descricao: string;
  ordem: number;
  ativo: boolean;
  registryKey: string;
  providerKey: string;
  providerVersion: number;
  somenteAdminSistema: boolean;
  acoes: AcaoProdutoDefinition[];
  acessoInicial?: AcessoInicialProduto;
  copiarAcessoDe?: string;
};

export type AgrupamentoProdutoDefinition = {
  slug: string;
  titulo: string;
  label: string;
  descricao: string;
  ordem: number;
  funcionalidades: string[];
};

export type SolucaoProdutoDefinition = {
  slug: string;
  nome: string;
  descricao: string;
  eyebrow: string;
  ordem: number;
  ativo: boolean;
  exibirNoHub: boolean;
  somenteAdminSistema: boolean;
  funcionalidades: FuncionalidadeProdutoDefinition[];
  agrupamentos: AgrupamentoProdutoDefinition[];
};

export type CatalogoProdutoManifest = {
  versao: number;
  solucoes: SolucaoProdutoDefinition[];
};

export const ACOES_CRUD_PADRAO: AcaoProdutoDefinition[] = [
  { chave: 'visualizar', nome: 'Visualizar', ordem: 10, ativo: true, acaoPadrao: true },
  { chave: 'incluir', nome: 'Incluir', ordem: 20, ativo: true, acaoPadrao: true },
  { chave: 'alterar', nome: 'Alterar', ordem: 30, ativo: true, acaoPadrao: true },
  { chave: 'excluir', nome: 'Excluir', ordem: 40, ativo: true, acaoPadrao: true }
];

const acao = (
  chave: string,
  nome: string,
  ordem: number,
  descricao?: string
): AcaoProdutoDefinition => ({
  chave,
  nome,
  ordem,
  ...(descricao ? { descricao } : {}),
  configuracao: chave,
  ativo: true
});

const funcionalidade = (
  definition: Omit<FuncionalidadeProdutoDefinition, 'providerKey' | 'providerVersion' | 'acoes'> & {
    acoes?: AcaoProdutoDefinition[];
  }
): FuncionalidadeProdutoDefinition => ({
  ...definition,
  providerKey: definition.registryKey,
  providerVersion: 1,
  acoes: [
    ...ACOES_CRUD_PADRAO.map((item) => ({ ...item })),
    ...(definition.acoes ?? [])
  ]
});

export const CONFIGURADOR_PRODUTO: SolucaoProdutoDefinition = {
  slug: 'configurador',
  nome: 'Configurador',
  descricao: 'Central administrativa para cadastrar usuários, empresas, grupos e acessos.',
  eyebrow: 'Administração',
  ordem: 30,
  ativo: true,
  exibirNoHub: true,
  somenteAdminSistema: true,
  funcionalidades: [
    funcionalidade({
      slug: 'cadastro-de-usuarios',
      titulo: 'Cadastro de usuários',
      label: 'Usuários',
      descricao: 'Gerencie contas, dados de acesso, grupo e empresas dos usuários.',
      ordem: 10,
      ativo: true,
      registryKey: 'configurador.cadastro-de-usuarios',
      somenteAdminSistema: true
    }),
    funcionalidade({
      slug: 'cadastro-de-grupos',
      titulo: 'Cadastro de grupos',
      label: 'Grupos',
      descricao: 'Defina grupos de usuários, soluções, funcionalidades e permissões.',
      ordem: 20,
      ativo: true,
      registryKey: 'configurador.cadastro-de-grupos',
      somenteAdminSistema: true
    }),
    funcionalidade({
      slug: 'cadastro-de-empresas',
      titulo: 'Cadastro de empresas',
      label: 'Empresas',
      descricao: 'Crie e mantenha empresas, liberando soluções e funcionalidades contratadas.',
      ordem: 30,
      ativo: true,
      registryKey: 'configurador.cadastro-de-empresas',
      somenteAdminSistema: true
    }),
    funcionalidade({
      slug: 'cadastro-de-solucoes',
      titulo: 'Cadastro de soluções',
      label: 'Soluções',
      descricao: 'Crie e mantenha as soluções exibidas no hub do sistema.',
      ordem: 35,
      ativo: true,
      registryKey: 'configurador.cadastro-de-solucoes',
      somenteAdminSistema: true
    }),
    funcionalidade({
      slug: 'cadastro-de-funcionalidades',
      titulo: 'Cadastro de funcionalidades',
      label: 'Funcionalidades',
      descricao: 'Crie e mantenha rotas de funcionalidades vinculadas às soluções do sistema.',
      ordem: 40,
      ativo: true,
      registryKey: 'configurador.cadastro-de-funcionalidades',
      somenteAdminSistema: true
    })
  ],
  agrupamentos: [
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
  ]
};

export const CONTROLE_CHAMADOS_PRODUTO: SolucaoProdutoDefinition = {
  slug: 'controle-de-chamados',
  nome: 'Controle de Chamados',
  descricao: 'Abertura, acompanhamento e atendimento de chamados por empresa.',
  eyebrow: 'Atendimento',
  ordem: 40,
  ativo: true,
  exibirNoHub: true,
  somenteAdminSistema: false,
  funcionalidades: [
    funcionalidade({
      slug: 'abrir-chamado',
      titulo: 'Abrir chamado',
      label: 'Novo chamado',
      descricao: 'Registre uma nova solicitação de atendimento para a empresa selecionada.',
      ordem: 10,
      ativo: true,
      registryKey: 'controle-de-chamados.abrir-chamado',
      somenteAdminSistema: false
    }),
    funcionalidade({
      slug: 'meus-chamados',
      titulo: 'Meus chamados',
      label: 'Minhas solicitações',
      descricao: 'Acompanhe chamados abertos por você, responda e solicite reabertura quando necessário.',
      ordem: 20,
      ativo: true,
      registryKey: 'controle-de-chamados.meus-chamados',
      somenteAdminSistema: false,
      acoes: [
        acao('responder_proprio_chamado', 'Responder próprio chamado', 50, 'Permite adicionar respostas públicas nos próprios chamados.'),
        acao('reabrir_proprio_chamado', 'Reabrir próprio chamado', 60, 'Permite reabrir chamados próprios que foram resolvidos.')
      ]
    }),
    funcionalidade({
      slug: 'painel-atendimento',
      titulo: 'Painel de atendimento',
      label: 'Fila de atendimento',
      descricao: 'Visualize a fila da empresa, assuma, atribua, responda e movimente chamados.',
      ordem: 30,
      ativo: true,
      registryKey: 'controle-de-chamados.painel-atendimento',
      somenteAdminSistema: false,
      acoes: [
        acao('visualizar_fila', 'Visualizar fila', 50),
        acao('assumir_chamado', 'Assumir chamado', 60),
        acao('atribuir_chamado', 'Atribuir chamado', 70),
        acao('transferir_chamado', 'Transferir chamado', 80),
        acao('responder_chamado', 'Responder chamado', 90),
        acao('adicionar_nota_interna', 'Adicionar nota interna', 100),
        acao('alterar_prioridade', 'Alterar prioridade', 110),
        acao('alterar_categoria', 'Alterar categoria', 115),
        acao('alterar_status', 'Alterar status', 120),
        acao('resolver_chamado', 'Resolver chamado', 130),
        acao('encerrar_chamado', 'Encerrar chamado', 140),
        acao('reabrir_chamado', 'Reabrir chamado', 150)
      ]
    }),
    funcionalidade({
      slug: 'chamados-arquivados',
      titulo: 'Chamados arquivados',
      label: 'Arquivados',
      descricao: 'Visualize chamados arquivados e permita desarquivamento controlado por administradores.',
      ordem: 40,
      ativo: true,
      registryKey: 'controle-de-chamados.chamados-arquivados',
      somenteAdminSistema: false,
      acoes: [
        acao('reabrir_chamado', 'Desarquivar chamado', 50)
      ]
    }),
    funcionalidade({
      slug: 'categorias',
      titulo: 'Categorias de chamados',
      label: 'Categorias',
      descricao: 'Configure categorias de chamados específicas da empresa selecionada.',
      ordem: 50,
      ativo: true,
      registryKey: 'controle-de-chamados.categorias',
      somenteAdminSistema: false
    }),
    funcionalidade({
      slug: 'responsaveis',
      titulo: 'Cadastro de responsáveis',
      label: 'Responsáveis',
      descricao: 'Cadastre supervisores e responsáveis por solução ou funcionalidade.',
      ordem: 60,
      ativo: true,
      registryKey: 'controle-de-chamados.responsaveis',
      somenteAdminSistema: false
    }),
    funcionalidade({
      slug: 'tipos',
      titulo: 'Tipos de chamados',
      label: 'Tipos',
      descricao: 'Configure os tipos usados na abertura e classificação dos chamados.',
      ordem: 70,
      ativo: true,
      registryKey: 'controle-de-chamados.tipos',
      somenteAdminSistema: false
    }),
    funcionalidade({
      slug: 'prioridades',
      titulo: 'Prioridades de chamados',
      label: 'Prioridades',
      descricao: 'Configure as prioridades usadas na triagem e atendimento dos chamados.',
      ordem: 80,
      ativo: true,
      registryKey: 'controle-de-chamados.prioridades',
      somenteAdminSistema: false
    }),
    funcionalidade({
      slug: 'sla',
      titulo: 'Regras de SLA',
      label: 'SLA',
      descricao: 'Configure prazos de primeira resposta e resolução por prioridade.',
      ordem: 90,
      ativo: true,
      registryKey: 'controle-de-chamados.sla',
      somenteAdminSistema: false
    }),
    funcionalidade({
      slug: 'dashboard',
      titulo: 'Dashboard de chamados',
      label: 'Dashboard',
      descricao: 'Acompanhe volume, SLA e tempos médios da operação de atendimento.',
      ordem: 45,
      ativo: true,
      registryKey: 'controle-de-chamados.dashboard',
      somenteAdminSistema: false
    }),
    funcionalidade({
      slug: 'relatorios',
      titulo: 'Relatórios de chamados',
      label: 'Relatórios',
      descricao: 'Consulte chamados por período e filtros operacionais, com exportação CSV ou Excel.',
      ordem: 110,
      ativo: true,
      registryKey: 'controle-de-chamados.relatorios',
      somenteAdminSistema: false
    }),
    funcionalidade({
      slug: 'emails-solucoes',
      titulo: 'Configuração de e-mail',
      label: 'E-mail',
      descricao: 'Conecte a conta Google principal usada nas notificações automáticas dos chamados.',
      ordem: 100,
      ativo: true,
      registryKey: 'controle-de-chamados.emails-solucoes',
      somenteAdminSistema: false
    })
  ],
  agrupamentos: [
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
  ]
};

export const PROJETOS_PRODUTO: SolucaoProdutoDefinition = {
  slug: 'projetos',
  nome: 'Gerenciador de Projetos',
  descricao: 'Espaço para organizar projetos, backlog, entregas, marcos e comunicação entre as equipes.',
  eyebrow: 'Operação',
  ordem: 10,
  ativo: true,
  exibirNoHub: true,
  somenteAdminSistema: false,
  funcionalidades: [
    funcionalidade({
      slug: 'cadastro-de-projetos',
      titulo: 'Cadastro de projetos',
      label: 'Projetos',
      descricao: 'Cadastre projetos, responsáveis, participantes, metodologia e ciclo de vida.',
      ordem: 10,
      ativo: true,
      registryKey: 'projetos.cadastro-de-projetos',
      somenteAdminSistema: false,
      acoes: [
        acao('gerenciar_membros', 'Gerenciar membros', 50, 'Permite adicionar, alterar e remover membros do projeto.'),
        acao('alterar_status', 'Alterar status', 60, 'Permite alterar o status e o ciclo de vida do projeto.'),
        acao('reativar_projeto', 'Reativar projeto', 70, 'Permite reativar projetos arquivados.')
      ]
    }),
    funcionalidade({
      slug: 'backlog-de-demandas',
      titulo: 'Backlog de demandas',
      label: 'Backlog',
      descricao: 'Organize demandas, prioridades e itens planejados para o projeto.',
      ordem: 20,
      ativo: true,
      registryKey: 'projetos.backlog-de-demandas',
      somenteAdminSistema: false,
      acoes: [
        acao('priorizar', 'Priorizar backlog', 50, 'Permite alterar a ordem persistente dos itens.')
      ]
    }),
    funcionalidade({
      slug: 'sprints',
      titulo: 'Sprints',
      label: 'Sprints',
      descricao: 'Planeje e acompanhe períodos de execução do projeto.',
      ordem: 30,
      ativo: true,
      registryKey: 'projetos.sprints',
      somenteAdminSistema: false,
      acoes: [
        acao('planejar', 'Planejar sprints', 50, 'Permite definir o escopo planejado.'),
        acao('iniciar', 'Iniciar sprint', 60, 'Permite ativar uma sprint planejada.'),
        acao('concluir', 'Concluir sprint', 70, 'Permite encerrar uma sprint ativa.'),
        acao('cancelar', 'Cancelar sprint', 80, 'Permite cancelar uma sprint.')
      ]
    }),
    funcionalidade({
      slug: 'marcos-e-entregas',
      titulo: 'Marcos e entregas',
      label: 'Marcos e entregas',
      descricao: 'Acompanhe marcos, entregas previstas e resultados do projeto.',
      ordem: 40,
      ativo: true,
      registryKey: 'projetos.marcos-e-entregas',
      somenteAdminSistema: false,
      acoes: [
        acao('aprovar', 'Aprovar entregas', 50, 'Permite aprovar compromissos de negócio.')
      ]
    }),
    funcionalidade({
      slug: 'cronograma-e-gantt',
      titulo: 'Cronograma e Gantt',
      label: 'Cronograma',
      descricao: 'Consulte datas, dependências e riscos do cronograma.',
      ordem: 50,
      ativo: true,
      registryKey: 'projetos.cronograma-e-gantt',
      somenteAdminSistema: false,
      acoes: [
        acao('editar_datas', 'Editar datas', 50, 'Permite confirmar alterações de datas no cronograma.')
      ]
    }),
    funcionalidade({
      slug: 'comunicacao-do-projeto',
      titulo: 'Comunicação do projeto',
      label: 'Comunicação',
      descricao: 'Centralize comunicados, decisões e alinhamentos do projeto.',
      ordem: 60,
      ativo: true,
      registryKey: 'projetos.comunicacao-do-projeto',
      somenteAdminSistema: false,
      acoes: [
        acao('comentar', 'Comentar', 50, 'Permite publicar e editar comentários próprios.'),
        acao('moderar', 'Moderar', 60, 'Permite moderar comentários de outros autores.'),
        acao('gerenciar_anexos', 'Gerenciar anexos', 70, 'Permite gerenciar anexos autorizados.')
      ]
    }),
    funcionalidade({
      slug: 'planejamento-de-recursos',
      titulo: 'Cadastro de recursos',
      label: 'Recursos',
      descricao: 'Cadastre os recursos da empresa e a grade de capacitações usada no planejamento dos projetos.',
      ordem: 70,
      ativo: true,
      registryKey: 'projetos.planejamento-de-recursos',
      somenteAdminSistema: false
    }),
    funcionalidade({
      slug: 'equipes',
      titulo: 'Cadastro de equipes',
      label: 'Equipes',
      descricao: 'Organize os recursos em equipes e vincule as equipes aos projetos atendidos.',
      ordem: 75,
      ativo: true,
      registryKey: 'projetos.equipes',
      somenteAdminSistema: false,
      copiarAcessoDe: 'planejamento-de-recursos'
    }),
    funcionalidade({
      slug: 'orcamento-do-projeto',
      titulo: 'Orçamento do projeto',
      label: 'Orçamento',
      descricao: 'Planeje o orçamento, categorias e custos do projeto.',
      ordem: 100,
      ativo: true,
      registryKey: 'projetos.orcamento-do-projeto',
      somenteAdminSistema: false,
      acoes: [
        acao('visualizar_financeiro', 'Visualizar financeiro', 50, 'Permite consultar dados financeiros.'),
        acao('gerenciar_financeiro', 'Gerenciar financeiro', 60, 'Permite alterar orçamentos e custos.'),
        acao('aprovar_orcamento', 'Aprovar orçamento', 70, 'Permite aprovar a linha de base.')
      ]
    }),
    funcionalidade({
      slug: 'meus-apontamentos',
      titulo: 'Meus apontamentos',
      label: 'Meus apontamentos',
      descricao: 'Registre as horas trabalhadas nos projetos e acompanhe o envio para aprovação.',
      ordem: 105,
      ativo: true,
      registryKey: 'projetos.meus-apontamentos',
      somenteAdminSistema: false,
      acessoInicial: 'SOMENTE_ADMINISTRADORES'
    }),
    funcionalidade({
      slug: 'horas-do-projeto',
      titulo: 'Horas do projeto',
      label: 'Horas',
      descricao: 'Aprove apontamentos, reabra lançamentos e controle o fechamento dos períodos do projeto.',
      ordem: 110,
      ativo: true,
      registryKey: 'projetos.horas-do-projeto',
      somenteAdminSistema: false,
      acessoInicial: 'SOMENTE_ADMINISTRADORES',
      acoes: [
        acao('aprovar_horas', 'Aprovar horas', 60, 'Permite aprovar apontamentos.'),
        acao('reabrir_horas', 'Reabrir horas', 70, 'Permite reabrir apontamentos com auditoria.'),
        acao('fechar_periodo', 'Fechar período', 80, 'Permite fechar o período mensal de apontamentos do projeto.')
      ]
    })
  ],
  agrupamentos: [
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
    },
    {
      slug: 'controle-de-horas',
      titulo: 'Controle de horas',
      label: 'Horas',
      descricao: 'Registre apontamentos e gerencie a aprovação e o fechamento das horas dos projetos.',
      ordem: 110,
      funcionalidades: ['meus-apontamentos', 'horas-do-projeto']
    }
  ]
};

export const DOCUMENTACAO_PRODUTO: SolucaoProdutoDefinition = {
  slug: 'documentacao',
  nome: 'Documentação',
  descricao: 'Manuais de uso e referências do sistema conforme seu nível de acesso.',
  eyebrow: 'Central de conhecimento',
  ordem: 900,
  ativo: true,
  exibirNoHub: true,
  somenteAdminSistema: false,
  funcionalidades: [],
  agrupamentos: []
};

export const CATALOGO_PRODUTO: CatalogoProdutoManifest = {
  versao: 1,
  solucoes: [
    PROJETOS_PRODUTO,
    CONFIGURADOR_PRODUTO,
    CONTROLE_CHAMADOS_PRODUTO,
    DOCUMENTACAO_PRODUTO
  ]
};

export function obterSolucaoProduto(slug: string): SolucaoProdutoDefinition {
  const solucao = CATALOGO_PRODUTO.solucoes.find((item) => item.slug === slug);

  if (!solucao) {
    throw new Error(`A solução ${slug} não existe no manifesto do produto.`);
  }

  return solucao;
}

export function obterFuncionalidadeProduto(
  solucao: SolucaoProdutoDefinition,
  slug: string
): FuncionalidadeProdutoDefinition {
  const funcionalidadeProduto = solucao.funcionalidades.find((item) => item.slug === slug);

  if (!funcionalidadeProduto) {
    throw new Error(`A funcionalidade ${solucao.slug}.${slug} não existe no manifesto do produto.`);
  }

  return funcionalidadeProduto;
}
