describe("navegação principal no navegador", () => {
  it("restaura a sessão e carrega as soluções autorizadas", () => {
    cy.visitAuthenticated("/hub");
    cy.contains("h1", "Bem-vindo, Administrador Cypress.").should("be.visible");
    cy.contains("2 solução(ões) disponível(is) neste momento.").should("be.visible");
    cy.contains("Projetos").should("be.visible");
    cy.contains("a", "Documentação").should("have.attr", "href", "/hub/documentacao");
  });
});
