describe("Central de Documentação no navegador", () => {
  it("abre um artigo pelo catálogo e monta seu sumário", () => {
    cy.visitAuthenticated("/hub/documentacao");
    cy.contains("h1", "Documentação").should("be.visible");
    cy.contains("a", "Backlog — visão geral").click();
    cy.location("pathname").should("eq", "/hub/documentacao/backlog-visao-geral");
    cy.contains("h1", "Backlog — visão geral").should("be.visible");
    cy.get('aside[aria-label="Nesta página"]').should("contain.text", "Consultar o backlog");
    cy.title().should("contain", "Backlog — visão geral");
  });

  it("pesquisa no backend e abre o resultado encontrado", () => {
    cy.visitAuthenticated("/hub/documentacao");
    cy.get('input[type="search"]').type("prioridades");
    cy.contains("button", "Backlog — visão geral").should("be.visible").click();
    cy.location("pathname").should("eq", "/hub/documentacao/backlog-visao-geral");
    cy.contains("h2", "Consultar o backlog").should("be.visible");
  });
});
