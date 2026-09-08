import { usuarioAutenticado } from "../support/graphql-mocks";

const funcionalidades = [{
  __typename: "FuncionalidadeType",
  id: 11,
  slug: "cadastro-de-usuarios",
  titulo: "Cadastro de usuários",
  label: "Usuários",
  descricao: "Cadastre usuários",
  ordem: 1,
  ativo: true,
  registryKey: "configurador.cadastro-de-usuarios",
  providerKey: "configurador.cadastro-de-usuarios",
  providerVersion: 1,
  somenteAdminSistema: true,
  padraoSistema: true,
  podeVisualizar: true,
  podeIncluir: true,
  podeAlterar: true,
  podeExcluir: false,
  acoes: [{
    __typename: "FuncionalidadeAcaoType",
    id: 101,
    funcionalidadeId: 11,
    chave: "visualizar",
    nome: "Visualizar",
    descricao: "Permite consultar usuários",
    ordem: 1,
    ativo: true,
    acaoPadrao: true,
    configuracao: null,
    permitido: true,
  }],
}, {
  __typename: "FuncionalidadeType",
  id: 12,
  slug: "rotina-customizada",
  titulo: "Rotina customizada",
  label: "Rotina customizada",
  descricao: "Rotina inativa",
  ordem: 2,
  ativo: false,
  registryKey: "configurador.rotina-customizada",
  providerKey: "configurador.rotina-customizada",
  providerVersion: 1,
  somenteAdminSistema: false,
  padraoSistema: false,
  podeVisualizar: true,
  podeIncluir: true,
  podeAlterar: true,
  podeExcluir: true,
  acoes: [],
}];

const solucao = {
  __typename: "SolucaoType",
  id: 1,
  slug: "configurador",
  nome: "Configurador",
  descricao: "Cadastros administrativos",
  eyebrow: "Administração",
  ordem: 1,
  ativo: true,
  exibirNoHub: true,
  somenteAdminSistema: true,
  padraoSistema: false,
  funcionalidades,
};

const navegacaoConfigurador = [{
  ...solucao,
  funcionalidades: [{
    ...funcionalidades[0],
    slug: "cadastro-de-solucoes",
    titulo: "Cadastro de soluções",
    label: "Soluções",
    registryKey: "configurador.cadastro-de-solucoes",
    providerKey: "configurador.cadastro-de-solucoes",
    providerVersion: 1,
  }],
}];

describe("cache e contagem de soluções no navegador", () => {
  it("mantém a árvore completa e explica funcionalidades ativas e cadastradas", () => {
    cy.viewport(1200, 800);
    const cacheWarnings = [];
    const inspectConsole = (...args) => {
      const message = args.join(" ");
      if (message.includes("Cache data may be lost")) cacheWarnings.push(message);
    };

    cy.mockGraphql({
      Me: { me: { ...usuarioAutenticado, login: "admin", availableSolutions: ["configurador"] } },
      MyHubNavigation: { myHubNavigation: navegacaoConfigurador },
      ChamadoNotificacoes: { notificacoesChamado: [], notificacoesChamadoNaoLidas: 0 },
      Solucoes: { solucoes: [solucao] },
      UpdateSolucao: { updateSolucao: { ...solucao, descricao: "Cadastros administrativos atualizados" } },
    });
    cy.visit("/hub", {
      onBeforeLoad(window) {
        window.console.warn = inspectConsole;
        window.console.error = inspectConsole;
      },
    });

    cy.wait("@MyHubNavigation").its("response.body.data.myHubNavigation.0.slug").should("eq", "configurador");
    cy.window().then((window) => {
      window.history.pushState({}, "", "/hub/configurador/cadastro-de-solucoes");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    cy.contains("h2", "Cadastro de soluções").should("be.visible");
    cy.contains("td", "1 ativa / 2 cadastradas").should("be.visible");
    cy.contains("td", "Configurador").click();
    cy.get('button[aria-label="Alterar"]').click();
    cy.get('#solucao-descricao').clear().type("Cadastros administrativos atualizados");
    cy.contains("button", "Salvar").click();

    cy.wait("@UpdateSolucao");
    cy.get(".crud-table-wrap").scrollTo("right");
    cy.contains("td", "1 ativa / 2 cadastradas").should("be.visible");
    cy.wrap(cacheWarnings).should("deep.equal", []);
    cy.screenshot("fase-4-contagem-funcionalidades");
  });
});
