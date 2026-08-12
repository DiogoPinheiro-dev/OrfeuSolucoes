import { empresaA, usuarioAutenticado } from "../support/graphql-mocks";

describe("autenticação no navegador", () => {
  it("bloqueia uma rota protegida sem sessão", () => {
    cy.visit("/hub/documentacao");
    cy.location("pathname").should("eq", "/");
    cy.get("button.header-login").should("be.visible").and("have.text", "Entrar");
  });

  it("autentica, seleciona a empresa e abre o Hub", () => {
    cy.mockGraphql({
      LoginCompanies: { loginCompanies: [{ ...empresaA, solucaoIds: [20], solucaoSlugs: ["projetos"], solucaoNomes: ["Projetos"], funcionalidadeIds: [21] }] },
      Login: { login: { accessToken: "token-cypress", user: usuarioAutenticado } },
    });
    cy.visit("/login");
    cy.get('input[name="loginOrEmail"]').type("admin.cypress");
    cy.get('input[name="password"]').type("segredo-cypress");
    cy.contains("button", "Continuar").click();
    cy.contains("strong", "Empresa A").should("be.visible");
    cy.contains("button", "Acessar hub").click();
    cy.location("pathname").should("eq", "/hub");
    cy.contains("h1", "Bem-vindo, Administrador Cypress.").should("be.visible");
    cy.window().its("localStorage.orfeu_token").should("eq", "token-cypress");
  });

  it("apresenta a mensagem devolvida para credenciais inválidas", () => {
    cy.mockGraphql({ LoginCompanies: { errors: [{ message: "Credenciais inválidas." }] } });
    cy.visit("/login");
    cy.get('input[name="loginOrEmail"]').type("usuario.invalido");
    cy.get('input[name="password"]').type("senha-invalida");
    cy.contains("button", "Continuar").click();
    cy.get('[role="alert"]').should("contain.text", "Credenciais inválidas.");
    cy.location("pathname").should("eq", "/login");
  });
});
