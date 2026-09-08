import { navegacaoHub, usuarioAutenticado } from "../support/graphql-mocks";

const viewports = [
  { width: 390, height: 844, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1440, height: 900, label: "desktop" },
];

const planejamento = {
  __typename: "FuncionalidadeType",
  id: 29,
  slug: "planejamento-de-recursos",
  titulo: "Recursos, equipes e planejamento",
  label: "Recursos, equipes e planejamento",
  descricao: "Organize recursos, equipes e itens atribuídos",
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

const navegacaoPlanejamento = [{
  ...navegacaoHub[0],
  funcionalidades: [planejamento],
}];

const organizacaoVazia = {
  candidatos: [],
  recursos: [],
  capacitacoes: [],
  equipes: [],
  projetos: [],
  permissoes: { podeIncluir: false, podeAlterar: false, podeExcluir: false },
};

const respostasPlanejamento = {
  Me: { me: { ...usuarioAutenticado, login: "admin", availableSolutions: ["projetos"] } },
  MyHubNavigation: { myHubNavigation: navegacaoPlanejamento },
  ChamadoNotificacoes: { notificacoesChamado: [], notificacoesChamadoNaoLidas: 0 },
  ProjetoOrganizacao: { projetoOrganizacao: organizacaoVazia },
  ProjetoBacklogProjetos: { projetoBacklogProjetos: [] },
};

const assertSemOverflowHorizontal = () => {
  cy.document().then((document) => {
    cy.wrap(document.documentElement.scrollWidth).should("be.lte", document.documentElement.clientWidth + 1);
  });
};

describe("homologação visual integral", () => {
  viewports.forEach(({ width, height, label }) => {
    it(`mantém Landing e Hub íntegros em ${label}`, () => {
      cy.viewport(width, height);
      cy.visit("/");
      cy.get('header[aria-label="Navegação principal"]').should("be.visible");
      cy.get(".hero").should("be.visible");
      cy.contains("h3", "Destaques").should("be.visible");
      assertSemOverflowHorizontal();

      cy.mockGraphql(respostasPlanejamento);
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

    it(`mantém recursos, equipes e planejamento íntegros em ${label}`, () => {
      cy.viewport(width, height);
      cy.visitAuthenticated("/hub/projetos/planejamento-de-recursos?tab=recursos", respostasPlanejamento);
      cy.contains("h2", "Recursos, equipes e planejamento").should("be.visible");
      cy.contains("Nenhum recurso cadastrado.").should("be.visible");
      cy.contains("Nenhuma capacitação cadastrada.").should("be.visible");
      cy.get('[role="tab"][aria-selected="true"]').should("have.text", "Recursos");
      cy.get('[role="tab"]').contains("Equipes").click();
      cy.location("search").should("contain", "tab=equipes");
      cy.contains("Nenhuma equipe cadastrada.").should("be.visible");
      cy.get('[role="tab"]').contains("Planejamento").click();
      cy.location("search").should("contain", "tab=planejamento");
      assertSemOverflowHorizontal();
      cy.screenshot(`homologacao-planejamento-${label}`, { capture: "viewport" });
    });
  });

  it("preserva abas na URL, teclado, histórico e recarga", () => {
    cy.viewport(1440, 900);
    cy.visitAuthenticated("/hub/projetos/planejamento-de-recursos?tab=recursos", respostasPlanejamento);
    cy.get('[role="tab"]').contains("Recursos").focus().type("{rightarrow}");
    cy.location("search").should("contain", "tab=equipes");
    cy.focused().should("have.text", "Equipes").type("{end}");
    cy.location("search").should("contain", "tab=planejamento");
    cy.go("back");
    cy.location("search").should("contain", "tab=equipes");
    cy.go("forward");
    cy.location("search").should("contain", "tab=planejamento");
    cy.reload();
    cy.get('[role="tab"][aria-selected="true"]').should("have.text", "Planejamento");
  });

  it("apresenta erro controlado sem quebrar o layout", () => {
    cy.viewport(390, 844);
    cy.visitAuthenticated("/hub/projetos/planejamento-de-recursos?tab=recursos", {
      ...respostasPlanejamento,
      ProjetoOrganizacao: { errors: [{ message: "Falha visual controlada." }] },
    });
    cy.get('[role="alert"]').should("contain.text", "Falha visual controlada.");
    assertSemOverflowHorizontal();
  });

  it("mantém ações sem permissão desabilitadas", () => {
    cy.viewport(390, 844);
    cy.visitAuthenticated("/hub/projetos/planejamento-de-recursos?tab=recursos", respostasPlanejamento);
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
