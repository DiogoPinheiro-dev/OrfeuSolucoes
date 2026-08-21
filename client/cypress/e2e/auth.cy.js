import { empresaA, usuarioAutenticado } from "../support/graphql-mocks";

describe("autenticação no navegador", () => {
  it("bloqueia uma rota protegida sem sessão", () => {
    cy.visit("/hub/documentacao");
    cy.location("pathname").should("eq", "/");
    cy.get("button.header-login").should("be.visible").and("have.text", "Entrar");
  });

  it("autentica, seleciona a empresa e abre o Hub", () => {
    cy.mockGraphql({
      Me: { errors: [{ message: "Não autenticado." }] },
      LoginCompanies: { loginCompanies: [{ ...empresaA, solucaoIds: [20], solucaoSlugs: ["projetos"], solucaoNomes: ["Projetos"], funcionalidadeIds: [21] }] },
      Login: { login: { user: usuarioAutenticado } },
    });
    cy.visit("/login");
    cy.get('input[name="loginOrEmail"]').type("admin.cypress");
    cy.get('input[name="password"]').type("segredo-cypress");
    cy.contains("button", "Continuar").click();
    cy.contains("strong", "Empresa A").should("be.visible");
    cy.contains("button", "Acessar hub").click();
    cy.location("pathname").should("eq", "/hub");
    cy.contains("h1", "Bem-vindo, Administrador Cypress.").should("be.visible");
    cy.window().its("localStorage").invoke("getItem", "orfeu_token").should("be.null");
    cy.window().its("localStorage").invoke("getItem", "orfeu_auth").should("be.null");
    cy.window().its("localStorage").invoke("getItem", "orfeu_user").should("be.null");
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

  it("exige uma senha forte antes de liberar a sessão temporária", () => {
    const usuarioTemporario = { ...usuarioAutenticado, deveAlterarSenha: true };
    cy.mockGraphql({
      Me: { me: usuarioTemporario },
      ChangePassword: {
        changePassword: {
          user: { ...usuarioTemporario, deveAlterarSenha: false },
        },
      },
    });
    cy.viewport(390, 844);
    cy.visit("/hub");

    cy.contains("h2", "Troque sua senha temporária").should("be.visible");
    cy.contains("p", "entre 10 e 72 caracteres, no máximo 72 bytes").should("be.visible");
    cy.get('[role="dialog"]').should("be.visible");
    cy.viewport(768, 1024);
    cy.get('[role="dialog"]').should("be.visible");
    cy.viewport(1440, 900);
    cy.get('[role="dialog"]').should("be.visible");
    cy.get('input[name="password"]').type("senhafraca");
    cy.get('input[name="confirmPassword"]').type("senhafraca");
    cy.contains("button", "Alterar senha").click();
    cy.get('[role="alert"]').should("contain.text", "uma letra maiúscula");
    cy.get('[role="alert"]').should("contain.text", "um número");
    cy.get('[role="alert"]').should("contain.text", "um caractere especial");

    cy.get('input[name="password"]').clear().type("NovaSenha@1");
    cy.get('input[name="confirmPassword"]').clear().type("NovaSenha@1");
    cy.contains("button", "Alterar senha").click();
    cy.contains("h2", "Troque sua senha temporária").should("not.exist");
  });

  it("faz autocadastro sem enviar vínculos ou privilégios", () => {
    const novoUsuario = {
      ...usuarioAutenticado,
      id: 9,
      nome: "Ana Cypress",
      login: "ana.cypress",
      email: "ana.cypress@example.com",
      grupo: null,
      empresa: null,
      empresas: [],
      availableSolutions: [],
    };
    cy.mockGraphql({
      Me: { errors: [{ message: "Não autenticado." }] },
      RegisterUser: { registerUser: novoUsuario },
      Login: { login: { user: novoUsuario } },
    });
    cy.viewport(390, 844);
    cy.visit("/ecommerce");
    cy.contains("button", "Entrar no e-commerce").click();
    cy.contains("button", "Quero me cadastrar").click();

    cy.get('input[name="email"]').type("ana.cypress@example.com");
    cy.get('input[name="fullName"]').type("Ana Cypress");
    cy.get('input[name="login"]').type("ana.cypress");
    cy.get('input[name="password"]').type("senhafraca");
    cy.get(".lm-form").contains("button", "Cadastrar").click();
    cy.get('[role="alert"]').should("contain.text", "uma letra maiúscula");

    cy.get('input[name="password"]').clear().type("NovaSenha@1");
    cy.get(".lm-form").contains("button", "Cadastrar").click();
    cy.wait("@RegisterUser").then(({ request }) => {
      cy.wrap(request.body.variables.input).should("deep.equal", {
        nome: "Ana Cypress",
        login: "ana.cypress",
        email: "ana.cypress@example.com",
        senha: "NovaSenha@1",
      });
    });
    cy.wait("@Login");

    cy.location("pathname").should("eq", "/ecommerce");
    cy.contains("Bem-vindo, Ana Cypress.").should("be.visible");
    cy.window().its("localStorage").invoke("getItem", "orfeu_token").should("be.null");
  });
});
