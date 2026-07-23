import { FuncionalidadeAcaoInput } from '../dto/funcionalidade-acao.input';

export type ProjetoFeatureDefinition = {
  slug: string;
  titulo: string;
  label: string;
  descricao: string;
  ordem: number;
  registryKey: string;
  ativo: boolean;
  acoes?: FuncionalidadeAcaoInput[];
};

const action = (
  chave: string,
  nome: string,
  ordem: number,
  descricao: string
): FuncionalidadeAcaoInput => ({
  chave,
  nome,
  ordem,
  descricao,
  configuracao: chave,
  ativo: true
});

export const PROJETO_FEATURE_DEFINITIONS: ProjetoFeatureDefinition[] = [
  {
    slug: 'cadastro-de-projetos',
    titulo: 'Cadastro de projetos',
    label: 'Projetos',
    descricao: 'Cadastre projetos, responsaveis, participantes, metodologia e ciclo de vida.',
    ordem: 10,
    registryKey: 'projetos.cadastro-de-projetos',
    ativo: true,
    acoes: [
      action('gerenciar_membros', 'Gerenciar membros', 50, 'Permite adicionar, alterar e remover membros do projeto.'),
      action('alterar_status', 'Alterar status', 60, 'Permite alterar o status e o ciclo de vida do projeto.'),
      action('reativar_projeto', 'Reativar projeto', 70, 'Permite reativar projetos arquivados.')
    ]
  },
  {
    slug: 'backlog-de-demandas',
    titulo: 'Backlog de demandas',
    label: 'Backlog',
    descricao: 'Organize demandas, prioridades e itens planejados para o projeto.',
    ordem: 20,
    registryKey: 'projetos.backlog-de-demandas',
    ativo: true,
    acoes: [
      action('priorizar', 'Priorizar backlog', 50, 'Permite alterar a ordem persistente dos itens.')
    ]
  },
  {
    slug: 'sprints',
    titulo: 'Sprints',
    label: 'Sprints',
    descricao: 'Planeje e acompanhe periodos de execucao do projeto.',
    ordem: 30,
    registryKey: 'projetos.sprints',
    ativo: false,
    acoes: [
      action('planejar', 'Planejar sprints', 50, 'Permite definir o escopo planejado.'),
      action('iniciar', 'Iniciar sprint', 60, 'Permite ativar uma sprint planejada.'),
      action('concluir', 'Concluir sprint', 70, 'Permite encerrar uma sprint ativa.'),
      action('cancelar', 'Cancelar sprint', 80, 'Permite cancelar uma sprint.')
    ]
  },
  {
    slug: 'marcos-e-entregas',
    titulo: 'Marcos e entregas',
    label: 'Marcos e entregas',
    descricao: 'Acompanhe marcos, entregas previstas e resultados do projeto.',
    ordem: 40,
    registryKey: 'projetos.marcos-e-entregas',
    ativo: false,
    acoes: [
      action('aprovar', 'Aprovar entregas', 50, 'Permite aprovar compromissos de negocio.')
    ]
  },
  {
    slug: 'cronograma-e-gantt',
    titulo: 'Cronograma e Gantt',
    label: 'Cronograma',
    descricao: 'Consulte datas, dependencias e riscos do cronograma.',
    ordem: 50,
    registryKey: 'projetos.cronograma-e-gantt',
    ativo: false,
    acoes: [
      action('editar_datas', 'Editar datas', 50, 'Permite confirmar alteracoes de datas no cronograma.')
    ]
  },
  {
    slug: 'comunicacao-do-projeto',
    titulo: 'Comunicacao do projeto',
    label: 'Comunicacao',
    descricao: 'Centralize comunicados, decisoes e alinhamentos do projeto.',
    ordem: 60,
    registryKey: 'projetos.comunicacao-do-projeto',
    ativo: false,
    acoes: [
      action('comentar', 'Comentar', 50, 'Permite publicar e editar comentarios proprios.'),
      action('moderar', 'Moderar', 60, 'Permite moderar comentarios de outros autores.'),
      action('gerenciar_anexos', 'Gerenciar anexos', 70, 'Permite gerenciar anexos autorizados.')
    ]
  },
  {
    slug: 'orcamento-e-recursos',
    titulo: 'Orcamento e recursos',
    label: 'Orcamento e recursos',
    descricao: 'Planeje capacidade, alocacoes, orcamento e custos.',
    ordem: 70,
    registryKey: 'projetos.orcamento-e-recursos',
    ativo: false,
    acoes: [
      action('visualizar_financeiro', 'Visualizar financeiro', 50, 'Permite consultar dados financeiros.'),
      action('gerenciar_financeiro', 'Gerenciar financeiro', 60, 'Permite alterar orcamentos e custos.'),
      action('aprovar_orcamento', 'Aprovar orcamento', 70, 'Permite aprovar a linha de base.')
    ]
  },
  {
    slug: 'horas-do-projeto',
    titulo: 'Horas do projeto',
    label: 'Horas',
    descricao: 'Consulte apontamentos pertencentes ao Controle de Horas.',
    ordem: 80,
    registryKey: 'projetos.horas-do-projeto',
    ativo: false,
    acoes: [
      action('apontar', 'Apontar horas', 50, 'Permite registrar esforco.'),
      action('aprovar_horas', 'Aprovar horas', 60, 'Permite aprovar apontamentos.'),
      action('reabrir_horas', 'Reabrir horas', 70, 'Permite reabrir apontamentos com auditoria.')
    ]
  },
  {
    slug: 'templates-de-projeto',
    titulo: 'Templates de projeto',
    label: 'Templates',
    descricao: 'Gerencie estruturas versionadas para novos projetos.',
    ordem: 90,
    registryKey: 'projetos.templates-de-projeto',
    ativo: false,
    acoes: [
      action('publicar', 'Publicar template', 50, 'Permite publicar uma versao imutavel.'),
      action('instanciar', 'Instanciar template', 60, 'Permite criar projeto a partir de template.')
    ]
  },
  {
    slug: 'portfolio-de-projetos',
    titulo: 'Portfolio de projetos',
    label: 'Portfolio',
    descricao: 'Acompanhe indicadores agregados dos projetos acessiveis.',
    ordem: 100,
    registryKey: 'projetos.portfolio-de-projetos',
    ativo: false,
    acoes: [
      action('visualizar_financeiro', 'Visualizar financeiro', 50, 'Permite consultar agregacoes financeiras.')
    ]
  }
];
