import { navegacaoHub, usuarioAutenticado } from "../support/graphql-mocks";

const cronogramaFeature = {
  __typename: "FuncionalidadeType",
  id: 22,
  slug: "cronograma-e-gantt",
  titulo: "Cronograma e Gantt",
  label: "Cronograma e Gantt",
  descricao: "Visualize o cronograma do projeto",
  ordem: 2,
  ativo: true,
  registryKey: "projetos.cronograma-e-gantt",
  somenteAdminSistema: false,
  padraoSistema: true,
  podeVisualizar: true,
  podeIncluir: true,
  podeAlterar: true,
  podeExcluir: true,
  acoes: [],
};

const backlogFeature = {
  ...cronogramaFeature,
  id: 21,
  slug: "backlog-de-demandas",
  titulo: "Backlog de demandas",
  label: "Backlog de demandas",
  descricao: "Cadastre e priorize as demandas do projeto",
  ordem: 1,
  registryKey: "projetos.backlog-de-demandas",
};

const budgetFeature = {
  ...cronogramaFeature,
  id: 23,
  slug: "orcamento-do-projeto",
  titulo: "Orçamento do projeto",
  label: "Orçamento do projeto",
  descricao: "Gerencie o orçamento financeiro do projeto",
  ordem: 3,
  registryKey: "projetos.orcamento-do-projeto",
};

const navegacaoProjetos = [{
  ...navegacaoHub[0],
  funcionalidades: [backlogFeature, cronogramaFeature, budgetFeature],
}];

const projeto = { id: "p1", chave: "ORF", nome: "Orfeu Evolução", arquivadoEm: null };
const elemento = {
  id: "i1",
  tipo: "ITEM",
  chave: "ORF-1",
  titulo: "Implementar autenticação",
  grupo: "Backlog",
  inicioEm: "2026-08-11",
  fimEm: "2026-08-15",
  progressoPercentual: 25,
  semPeriodo: false,
  bloqueado: false,
  riscoAtraso: false,
  arquivado: false,
  versao: 1,
};

const cronograma = {
  inicioEm: "2026-08-11",
  fimEm: "2026-08-15",
  elementos: [elemento],
  dependencias: [],
  inconsistencias: [],
  permissoes: { podeGerenciarDependencias: true, podeEditarDatas: true },
};

const backlogItem = {
  id: "i1",
  projetoId: "p1",
  chave: "ORF-1",
  titulo: "Implementar autenticação",
  descricao: "Proteger o acesso",
  tipo: "HISTORIA",
  prioridade: "ALTA",
  status: "ABERTO",
  responsavelId: null,
  responsavel: null,
  paiId: null,
  inicioPrevistoEm: null,
  fimPrevistoEm: null,
  estimativaMinutos: 120,
  ordemBacklog: 1,
  versao: 1,
  arquivadoEm: null,
  permissoes: { podeAlterar: true, podeArquivar: true, podeReativar: false },
};

const backlog = {
  items: [backlogItem],
  total: 1,
  pagina: 1,
  limite: 100,
  totalPaginas: 1,
  backlogVersao: 1,
  permissoes: { podeCriar: true, podePriorizar: true },
};

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

const assertSharedStylesLoaded = () => {
  cy.get(".gantt-toolbar").should("have.css", "display", "flex");
  cy.get(".gantt-filters").should("have.css", "display", "flex");
  cy.get('.gantt-toolbar button[aria-label="Período anterior"]')
    .should("have.css", "display", "grid")
    .and("have.css", "place-items", "center")
    .and("have.css", "height", "42px")
    .and("have.css", "border-radius", "10px");
};

const assertBacklogSharedStylesLoaded = () => {
  cy.get(".backlog-heading").should("have.css", "display", "flex");
  cy.get(".backlog-toolbar").should("have.css", "display", "flex");
  cy.get('.crud-toolbar button[aria-label="Incluir demanda"]')
    .should("have.css", "display", "grid")
    .and("have.css", "height", "42px")
    .and("have.css", "border-radius", "10px");
};

describe("carregamento visual do Cronograma e Gantt", () => {
  it("carrega o CSS compartilhado no acesso direto, no reload e em todos os viewports", () => {
    const consoleMessages = [];
    const captureConsoleMessage = (...args) => consoleMessages.push(args.map(String).join(" "));

    cy.mockGraphql({
      Me: { me: { ...usuarioAutenticado, login: "admin", availableSolutions: ["projetos"] } },
      MyHubNavigation: { myHubNavigation: navegacaoProjetos },
      ChamadoNotificacoes: { notificacoesChamado: [], notificacoesChamadoNaoLidas: 0 },
      ProjetoBacklogProjetos: { projetoBacklogProjetos: [projeto] },
      ProjetoCronograma: { projetoCronograma: cronograma },
    });

    cy.visit("/hub/projetos/cronograma-e-gantt", {
      onBeforeLoad(window) {
        window.console.warn = captureConsoleMessage;
        window.console.error = captureConsoleMessage;
      },
    });

    cy.contains("h2", "Cronograma e Gantt").should("be.visible");
    cy.wait("@ProjetoCronograma");
    cy.get(".gantt-summary").should("contain", "1 elementos");
    assertSharedStylesLoaded();

    cy.reload();
    cy.contains("h2", "Cronograma e Gantt").should("be.visible");
    cy.wait("@ProjetoCronograma");
    cy.get(".gantt-summary").should("contain", "1 elementos");
    assertSharedStylesLoaded();

    viewports.forEach(({ width, height }) => {
      cy.viewport(width, height);
      cy.window().should("have.property", "innerWidth", width);
      cy.window().should("have.property", "innerHeight", height);
      assertSharedStylesLoaded();
      cy.document().then((document) => {
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        cy.wrap(overflow).should("be.lte", 1);
      });
      cy.screenshot(`cronograma-css-${width}x${height}`, { capture: "viewport" });
    });

    cy.wrap(consoleMessages).should("deep.equal", []);
  });
});

describe("carregamento visual do Backlog de demandas", () => {
  it("carrega o CSS compartilhado no primeiro acesso direto", () => {
    cy.mockGraphql({
      Me: { me: { ...usuarioAutenticado, login: "admin", availableSolutions: ["projetos"] } },
      MyHubNavigation: { myHubNavigation: navegacaoProjetos },
      ChamadoNotificacoes: { notificacoesChamado: [], notificacoesChamadoNaoLidas: 0 },
      ProjetoBacklogProjetos: { projetoBacklogProjetos: [projeto] },
      ProjetoBacklogResponsaveis: { projetoBacklogResponsaveis: [] },
      ProjetoItens: { projetoItens: backlog },
    });

    cy.visit("/hub/projetos/backlog-de-demandas");
    cy.contains("h2", "Backlog de demandas").should("be.visible");
    cy.wait("@ProjetoItens");
    assertBacklogSharedStylesLoaded();

    [1, 2, 3].forEach(() => {
      cy.reload();
      cy.contains("h2", "Backlog de demandas").should("be.visible");
      cy.wait("@ProjetoItens");
      assertBacklogSharedStylesLoaded();
    });

    cy.screenshot("backlog-css-reloads", { capture: "viewport" });
  });
});

describe("ações financeiras do Orçamento do projeto", () => {
  it("apresenta a criação do orçamento com o botão primário do sistema", () => {
    cy.mockGraphql({
      Me: { me: { ...usuarioAutenticado, login: "admin", availableSolutions: ["projetos"] } },
      MyHubNavigation: { myHubNavigation: navegacaoProjetos },
      ChamadoNotificacoes: { notificacoesChamado: [], notificacoesChamadoNaoLidas: 0 },
      ProjetoOrcamentoProjetos: { projetoOrcamentoProjetos: [projeto] },
      ProjetoOrcamento: {
        projetoOrcamento: {
          financeiro: null,
          recursos: [],
          tarefas: [],
          permissoes: { podeVisualizarFinanceiro: true, podeGerenciarFinanceiro: true },
        },
      },
    });

    cy.visit("/hub/projetos/orcamento-do-projeto");
    cy.contains("h2", "Orçamento do projeto").should("be.visible");
    cy.wait("@ProjetoOrcamento");
    cy.get('.budget-create-controls button[type="button"]')
      .should("have.css", "display", "flex")
      .and("have.css", "min-height", "40px")
      .and("have.css", "border-radius", "9px");
    cy.screenshot("orcamento-botao-criacao", { capture: "viewport" });
  });
});
