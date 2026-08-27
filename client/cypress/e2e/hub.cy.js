describe("navegação principal no navegador", () => {
  it("restaura a sessão e carrega as soluções autorizadas", () => {
    cy.visitAuthenticated("/hub");
    cy.contains("h1", "Bem-vindo, Administrador Cypress.").should("be.visible");
    cy.contains("2 solução(ões) disponível(is) neste momento.").should("be.visible");
    cy.contains("Projetos").should("be.visible");
    cy.contains("a", "Documentação").should("have.attr", "href", "/hub/documentacao");
  });

  it("reutiliza a navegação carregada ao abrir outra solução", () => {
    let navigationRequests = 0;

    cy.visitAuthenticated("/hub", {}, (operationName) => {
      if (operationName === "MyHubNavigation") navigationRequests += 1;
    });
    cy.wait("@MyHubNavigation");
    cy.get('a[href="/hub/projetos"]').should("have.length", 1).click();
    cy.contains("h1", "Projetos").should("be.visible");
    cy.then(() => cy.wrap(navigationRequests).should("eq", 1));
  });
});
