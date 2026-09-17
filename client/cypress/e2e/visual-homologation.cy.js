import { navegacaoHub, usuarioAutenticado } from "../support/graphql-mocks";

const viewports = [
  { width: 390, height: 844, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1440, height: 900, label: "desktop" },
];

const recursos = {
  __typename: "FuncionalidadeType",
  id: 29,
  slug: "planejamento-de-recursos",
  titulo: "Cadastro de recursos",
  label: "Recursos",
  descricao: "Cadastre os recursos da empresa e a grade de capacitações.",
  agrupamentoId: "recursos-equipes",
  ordemNoAgrupamento: 0,
  ordem: 2,
  ativo: true,
  registryKey: "projetos.planejamento-de-recursos",
  providerKey: "projetos.planejamento-de-recursos",
  providerVersion: 1,
  somenteAdminSistema: false,
  padraoSistema: true,
  podeVisualizar: true,
  podeIncluir: true,
  podeAlterar: true,
  podeExcluir: true,
  acoes: [],
};

const equipes = {
  ...recursos,
  id: 33,
  slug: "equipes",
  titulo: "Cadastro de equipes",
  label: "Equipes",
  registryKey: "projetos.equipes",
  providerKey: "projetos.equipes",
  ordemNoAgrupamento: 1,
};

const backlog = {
  ...recursos,
  id: 24,
  slug: "backlog-de-demandas",
  titulo: "Backlog de demandas",
  label: "Backlog",
  registryKey: "projetos.backlog-de-demandas",
  providerKey: "projetos.backlog-de-demandas",
  agrupamentoId: null,
  ordemNoAgrupamento: null,
};

const navegacaoOrganizacao = [{
  ...navegacaoHub[0],
  funcionalidades: [recursos, equipes, backlog],
  agrupamentos: [{
    __typename: "FuncionalidadeAgrupamentoType",
    id: "recursos-equipes",
    slug: "recursos-e-equipes",
    titulo: "Recursos e equipes",
    label: "Organização",
    descricao: "Cadastre recursos e capacitações e organize as equipes que atendem os projetos.",
    ordem: 70,
    padraoSistema: true,
  }],
}];

const organizacaoVazia = {
  candidatos: [],
  recursos: [],
  capacitacoes: [],
  equipes: [],
  projetos: [],
  permissoes: { podeIncluir: false, podeAlterar: false, podeExcluir: false },
  permissoesEquipes: { podeIncluir: false, podeAlterar: false, podeExcluir: false },
};

const respostasOrganizacao = {
  Me: { me: { ...usuarioAutenticado, login: "admin", availableSolutions: ["projetos"] } },
  MyHubNavigation: { myHubNavigation: navegacaoOrganizacao },
  ChamadoNotificacoes: { notificacoesChamado: [], notificacoesChamadoNaoLidas: 0 },
  ProjetoOrganizacao: { projetoOrganizacao: organizacaoVazia },
  ProjetoBacklogProjetos: { projetoBacklogProjetos: [] },
};


const gruposFase5 = [
  {
    solucao: "controle-de-chamados",
    nomeSolucao: "Controle de chamados",
    slug: "indicadores",
    titulo: "Indicadores do atendimento",
    label: "Indicadores",
    abas: [
      { slug: "dashboard", label: "Dashboard", titulo: "Dashboard de chamados" },
      { slug: "relatorios", label: "Relatórios", titulo: "Relatórios de chamados" },
    ],
  },
  {
    solucao: "configurador",
    nomeSolucao: "Configurador",
    slug: "acessos",
    titulo: "Usuários e acessos",
    label: "Acessos",
    abas: [
      { slug: "cadastro-de-usuarios", label: "Usuários", titulo: "Cadastro de usuários" },
      { slug: "cadastro-de-grupos", label: "Grupos", titulo: "Cadastro de grupos" },
      { slug: "cadastro-de-empresas", label: "Empresas", titulo: "Cadastro de empresas" },
    ],
  },
  {
    solucao: "configurador",
    nomeSolucao: "Configurador",
    slug: "catalogo",
    titulo: "Catálogo do Hub",
    label: "Catálogo",
    abas: [
      { slug: "cadastro-de-solucoes", label: "Soluções", titulo: "Cadastro de soluções" },
      { slug: "cadastro-de-funcionalidades", label: "Funcionalidades", titulo: "Cadastro de funcionalidades" },
    ],
  },
];

const respostasGrupo = (grupo) => ({
  Me: { me: { ...usuarioAutenticado, login: "admin", availableSolutions: [grupo.solucao] } },
  MyHubNavigation: {
    myHubNavigation: [{
      ...navegacaoHub[0],
      slug: grupo.solucao,
      nome: grupo.nomeSolucao,
      funcionalidades: grupo.abas.map((aba, index) => ({
        ...recursos,
        ...aba,
        id: 50 + index,
        agrupamentoId: grupo.slug,
        ordemNoAgrupamento: index,
        registryKey: `${grupo.solucao}.${aba.slug}`,
        providerKey: `${grupo.solucao}.${aba.slug}`,
      })),
      agrupamentos: [{
        __typename: "FuncionalidadeAgrupamentoType",
        id: grupo.slug,
        slug: grupo.slug,
        titulo: grupo.titulo,
        label: grupo.label,
        descricao: "",
        ordem: 1,
        padraoSistema: true,
      }],
    }],
  },
  Users: { users: [] },
  Empresas: { empresas: [] },
  GruposUsuarios: { gruposUsuarios: [] },
  Solucoes: { solucoes: [] },
  CatalogoProviders: { catalogoProviders: [] },
  ChamadoDashboard: {
    dashboardChamados: {
      totalAbertos: 0, emAtendimento: 0, pendentes: 0, resolvidos: 0, arquivados: 0, atrasados: 0,
      tempoMedioPrimeiraRespostaMinutos: null, tempoMedioResolucaoMinutos: null,
      porPrioridade: [], porCategoria: [], porAtendente: [],
    },
  },
  ChamadoRelatorio: { relatorioChamados: { items: [], total: 0, page: 1, pageSize: 25, totalPages: 1 } },
  CategoriasChamado: { categoriasChamado: [] },
  PrioridadesChamado: { prioridadesChamado: [] },
  AtendentesDisponiveis: { atendentesDisponiveis: [] },
});

const assertSemOverflowHorizontal = () => {
  cy.document().then((document) => {
    cy.wrap(document.documentElement.scrollWidth).should("be.lte", document.documentElement.clientWidth + 1);
  });
};

describe("navegação e layout com dados simulados", () => {
  viewports.forEach(({ width, height, label }) => {
    it(`mantém Landing e Hub íntegros em ${label}`, () => {
      cy.viewport(width, height);
      cy.visit("/");
      cy.get('header[aria-label="Navegação principal"]').should("be.visible");
      cy.get(".hero").should("be.visible");
      cy.contains("h3", "Destaques").should("be.visible");
      assertSemOverflowHorizontal();

      cy.mockGraphql(respostasOrganizacao);
      cy.visit("/hub");
      cy.contains("h1", "Bem-vindo, Administrador Cypress.").should("be.visible");
      cy.get('button[aria-label^="Notificações de chamados"]').should("be.visible").click();
      cy.contains("Nenhuma notificação.").should("be.visible");
      if (width === 390) {
        cy.get('button[aria-label="Abrir menu"]').click();
        cy.get('button[aria-label="Fechar menu"]').should("be.visible");
      }
      assertSemOverflowHorizontal();
      cy.screenshot(`homologacao-landing-hub-${label}`, { capture: "viewport" });
    });


    it(`preserva o modal de Equipes em somente leitura em ${label}`, () => {
      cy.viewport(width, height);
      const nome = "Equipe de desenvolvimento e atendimento de projetos da empresa";
      cy.visitAuthenticated("/hub/projetos/equipes", {
        ...respostasOrganizacao,
        ProjetoOrganizacao: { projetoOrganizacao: {
          ...organizacaoVazia,
          equipes: [{ id: "equipe-1", nome, descricao: "Equipe usada na validação do layout.", ativo: true, versao: 1, recursos: [], projetos: [] }],
        } },
      });
      cy.contains("td", nome).click();
      cy.get('button[aria-label^="Visualizar"]').click();
      cy.get('[role="dialog"]').should("be.visible").within(() => {
        cy.contains("Visualizar equipe").should("be.visible");
        cy.get("input, textarea").each(($campo) => cy.wrap($campo).should("be.disabled"));
        cy.contains("button", "Salvar").should("not.exist");
      });
      assertSemOverflowHorizontal();
      cy.screenshot(`homologacao-equipe-modal-${label}`, { capture: "viewport" });
      cy.get('[role="dialog"]').contains("button", "Fechar").click();
      cy.get('[role="dialog"]').should("not.exist");
      cy.get('button[aria-label^="Visualizar"]').should("be.focused");
    });

    it(`mantém Recursos e Equipes íntegros em ${label}`, () => {
      cy.viewport(width, height);
      cy.visitAuthenticated("/hub/projetos/planejamento-de-recursos?tab=recursos", respostasOrganizacao);
      cy.contains("h2", "Recursos e equipes").should("be.visible");
      cy.get('[role="tablist"]').should("have.length", 1);
      cy.get('[role="tab"]').should("have.length", 2);
      cy.contains("Nenhum recurso cadastrado.").should("be.visible");
      cy.contains("Nenhuma capacitação cadastrada.").should("be.visible");
      cy.get('[role="tab"][aria-selected="true"]').should("have.text", "Recursos");
      assertSemOverflowHorizontal();
      cy.screenshot(`homologacao-recursos-${label}`, { capture: "viewport" });
      cy.get('[role="tab"]').contains("Equipes").click();
      cy.location("pathname").should("equal", "/hub/projetos/equipes");
      cy.get('[role="tab"][aria-selected="true"]').should("have.text", "Equipes");
      cy.contains("Nenhuma equipe cadastrada.").should("be.visible");
      cy.contains("Nenhum recurso cadastrado.").should("not.exist");
      cy.get('[role="tabpanel"]').should("have.length", 1);
      assertSemOverflowHorizontal();
      cy.screenshot(`homologacao-equipes-${label}`, { capture: "viewport" });
    });
  });

  it("preserva abas na URL, teclado, histórico e recarga", () => {
    cy.viewport(1440, 900);
    cy.visitAuthenticated("/hub/projetos/planejamento-de-recursos?tab=recursos", respostasOrganizacao);
    cy.get('[role="tab"]').contains("Recursos").focus().type("{rightarrow}");
    cy.location("pathname").should("equal", "/hub/projetos/equipes");
    cy.focused().should("have.text", "Equipes").type("{home}");
    cy.location("pathname").should("equal", "/hub/projetos/planejamento-de-recursos");
    cy.focused().should("have.text", "Recursos").type("{end}");
    cy.location("pathname").should("equal", "/hub/projetos/equipes");
    cy.focused().should("have.text", "Equipes").type("{leftarrow}");
    cy.location("pathname").should("equal", "/hub/projetos/planejamento-de-recursos");
    cy.go("back");
    cy.location("pathname").should("equal", "/hub/projetos/equipes");
    cy.go("forward");
    cy.location("pathname").should("equal", "/hub/projetos/planejamento-de-recursos");
    cy.reload();
    cy.get('[role="tab"][aria-selected="true"]').should("have.text", "Recursos");
  });

  it("abre o agrupamento e preserva os links antigos de Equipes e Planejamento", () => {
    cy.visitAuthenticated("/hub/projetos/recursos-e-equipes", respostasOrganizacao);
    cy.location("pathname").should("equal", "/hub/projetos/planejamento-de-recursos");
    cy.get('[role="tab"][aria-selected="true"]').should("have.text", "Recursos");
    cy.visit("/hub/projetos/planejamento-de-recursos?tab=equipes");
    cy.location("pathname").should("equal", "/hub/projetos/equipes");
    cy.contains("Nenhuma equipe cadastrada.").should("be.visible");
    cy.visit("/hub/projetos/planejamento-de-recursos?tab=planejamento");
    cy.location("pathname").should("equal", "/hub/projetos/backlog-de-demandas");
    cy.contains("h2", "Backlog de demandas").should("be.visible");
    cy.get('[role="tablist"]').should("not.exist");
  });

  [recursos, equipes].forEach((funcionalidade) => {
    it(`abre somente a funcionalidade autorizada: ${funcionalidade.label}`, () => {
      const operacoes = [];
      cy.visitAuthenticated(`/hub/projetos/${funcionalidade.slug}`, {
        ...respostasOrganizacao,
        Me: { me: usuarioAutenticado },
        MyHubNavigation: { myHubNavigation: [{ ...navegacaoOrganizacao[0], funcionalidades: [funcionalidade] }] },
      }, (operacao) => operacoes.push(operacao));
      cy.contains(funcionalidade === recursos ? "Nenhum recurso cadastrado." : "Nenhuma equipe cadastrada.").should("be.visible");
      cy.get('[role="tablist"]').should("not.exist");
      cy.then(() => { operacoes.length = 0; });
      cy.visit(`/hub/projetos/${funcionalidade === recursos ? equipes.slug : recursos.slug}`);
      cy.location("pathname").should("equal", "/hub/projetos");
      cy.get(".resource-planning").should("not.exist");
      cy.then(() => cy.wrap(operacoes).should("not.include", "ProjetoOrganizacao"));
    });
  });

  it("apresenta erro controlado sem quebrar o layout", () => {
    cy.viewport(390, 844);
    cy.visitAuthenticated("/hub/projetos/planejamento-de-recursos?tab=recursos", {
      ...respostasOrganizacao,
      ProjetoOrganizacao: { errors: [{ message: "Falha visual controlada." }] },
    });
    cy.get('[role="alert"]').should("contain.text", "Falha visual controlada.");
    assertSemOverflowHorizontal();
  });

  it("mantém ações sem permissão desabilitadas", () => {
    cy.viewport(390, 844);
    cy.visitAuthenticated("/hub/projetos/planejamento-de-recursos?tab=recursos", respostasOrganizacao);
    cy.contains("Nenhum recurso cadastrado.").should("be.visible");
    cy.get('button[aria-label^="Incluir"]').each(($button) => {
      cy.wrap($button).should("be.disabled").and("have.attr", "aria-label").and("contain", "Indisponível");
    });
    assertSemOverflowHorizontal();
  });

  it("respeita preferência por movimento reduzido na Landing", () => {
    Cypress.automation("remote:debugger:protocol", {
      command: "Emulation.setEmulatedMedia",
      params: { features: [{ name: "prefers-reduced-motion", value: "reduce" }] },
    });
    cy.viewport(1440, 900);
    cy.visit("/");
    cy.get(".clients-strip").then(($strip) => {
      cy.wrap(getComputedStyle($strip[0]).animationName).should("equal", "none");
    });
  });
});

describe("agrupamentos da Fase 5 com dados simulados", () => {
  viewports.forEach(({ width, height, label }) => {
    gruposFase5.forEach((grupo) => {
      it(`mantém ${grupo.titulo} em ${label}`, () => {
        cy.viewport(width, height);
        cy.visitAuthenticated(`/hub/${grupo.solucao}/${grupo.slug}`, respostasGrupo(grupo));
        cy.window().its("innerWidth").should("equal", width);
        cy.window().its("innerHeight").should("equal", height);
        cy.location("pathname").should("equal", `/hub/${grupo.solucao}/${grupo.abas[0].slug}`);
        cy.contains("h2", grupo.titulo).should("be.visible");
        cy.get('[role="tablist"]').should("have.length", 1);
        cy.get('[role="tab"]').should("have.length", grupo.abas.length);
        grupo.abas.forEach((aba) => {
          cy.contains('[role="tab"]', aba.label).click();
          cy.location("pathname").should("equal", `/hub/${grupo.solucao}/${aba.slug}`);
          cy.get('[role="tab"][aria-selected="true"]').should("have.text", aba.label);
          cy.get('[role="tabpanel"]').should("have.length", 1).contains(aba.titulo).should("be.visible");
          cy.get('[role="alert"]').should("not.exist");
          assertSemOverflowHorizontal();
          cy.screenshot(`homologacao-${grupo.slug}-${aba.slug}-${label}`, { capture: "viewport" });
        });
        cy.reload();
        cy.get('[role="tab"][aria-selected="true"]').should("have.text", grupo.abas.at(-1).label);
      });
    });
  });
});
