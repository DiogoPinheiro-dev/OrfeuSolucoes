import { navegacaoHub, usuarioAutenticado } from "../support/graphql-mocks";

const navegacaoProjetos = [navegacaoHub[0]];

const viewports = [
  { width: 390, height: 844, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1440, height: 900, label: "desktop" },
];

const assertTabsFit = () => {
  cy.get(".crud-modal-tabs").should(($tablist) => {
    const container = $tablist[0];
    const bounds = container.getBoundingClientRect();
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    const clipped = tabs.some((tab) => {
      const tabBounds = tab.getBoundingClientRect();
      return tabBounds.left < bounds.left - 1 || tabBounds.right > bounds.right + 1;
    });

    if (clipped || container.scrollWidth > container.clientWidth + 1) {
      throw new Error("As abas Geral e Planejamento não cabem integralmente no modal.");
    }
  });
  cy.get("[role=dialog]").should(($dialog) => {
    const bounds = $dialog[0].getBoundingClientRect();
    const viewportWidth = $dialog[0].ownerDocument.documentElement.clientWidth;
    if (bounds.left < 0 || bounds.right > viewportWidth + 1) {
      throw new Error("O modal ultrapassa horizontalmente a área visível.");
    }
  });
  cy.document().should((document) => {
    const root = document.documentElement;
    if (root.scrollWidth > root.clientWidth + 1) {
      throw new Error(`A página possui overflow horizontal: ${root.scrollWidth}px para ${root.clientWidth}px disponíveis.`);
    }
  });
};

describe("responsividade das abas do modal compartilhado", () => {
  it("mantém Geral e Planejamento visíveis em mobile, tablet e desktop", () => {
    const consoleMessages = [];
    const captureConsoleMessage = (...args) => consoleMessages.push(args.map(String).join(" "));
    cy.viewport(390, 844);
    cy.mockGraphql({
      Me: { me: { ...usuarioAutenticado, login: "admin", availableSolutions: ["projetos"] } },
      MyHubNavigation: { myHubNavigation: navegacaoProjetos },
      ChamadoNotificacoes: { notificacoesChamado: [], notificacoesChamadoNaoLidas: 0 },
      Projetos: { projetos: { items: [], total: 0, pagina: 1, limite: 20, totalPaginas: 0 } },
    });
    cy.visit("/hub", {
      onBeforeLoad(window) {
        window.console.warn = captureConsoleMessage;
        window.console.error = captureConsoleMessage;
      },
    });
    cy.wait("@MyHubNavigation").its("response.body.data.myHubNavigation.0.slug").should("eq", "projetos");
    cy.contains("1 solução(ões) disponível(is) neste momento.").should("be.visible");
    cy.window().then((window) => {
      window.history.pushState({}, "", "/hub/projetos/cadastro-de-projetos");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    cy.contains("h2", "Cadastro de projetos").should("be.visible");
    cy.get('button[aria-label="Incluir"]').click();
    cy.get('[role="dialog"][aria-label="Cadastrar projeto"]').should("be.visible");

    viewports.forEach(({ width, height, label }) => {
      cy.viewport(width, height);
      cy.window().should((appWindow) => {
        if (appWindow.innerWidth !== width || appWindow.innerHeight !== height) {
          throw new Error(`Viewport esperado: ${width}x${height}; obtido: ${appWindow.innerWidth}x${appWindow.innerHeight}.`);
        }
      });
      assertTabsFit();
      cy.screenshot(`fase-5-abas-projeto-${label}`, { capture: "viewport" });
    });
    cy.wrap(consoleMessages).should("deep.equal", []);
  });
});
