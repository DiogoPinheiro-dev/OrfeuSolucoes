import { navegacaoHub, usuarioAutenticado } from "../support/graphql-mocks";

const funcionalidadeAbrirChamado = {
  __typename: "FuncionalidadeType",
  id: 31,
  slug: "abrir-chamado",
  titulo: "Abrir chamado",
  label: "Abrir chamado",
  descricao: "Registre uma solicitação",
  ordem: 1,
  ativo: true,
  registryKey: "controle-de-chamados.abrir-chamado",
  somenteAdminSistema: false,
  padraoSistema: true,
  podeVisualizar: true,
  podeIncluir: true,
  podeAlterar: false,
  podeExcluir: false,
  acoes: [],
};

const solucaoChamados = {
  __typename: "SolucaoType",
  id: 30,
  slug: "controle-de-chamados",
  nome: "Controle de chamados",
  descricao: "Atendimento e acompanhamento de solicitações",
  eyebrow: "Atendimento",
  ordem: 2,
  ativo: true,
  exibirNoHub: true,
  somenteAdminSistema: false,
  padraoSistema: true,
  funcionalidades: [funcionalidadeAbrirChamado],
};

const solucaoConfigurador = {
  __typename: "SolucaoType",
  id: 10,
  slug: "configurador",
  nome: "Configurador",
  descricao: "Cadastros administrativos",
  eyebrow: "Administração",
  ordem: 1,
  ativo: true,
  exibirNoHub: true,
  somenteAdminSistema: true,
  padraoSistema: true,
  funcionalidades: [{
    __typename: "FuncionalidadeType",
    id: 11,
    slug: "cadastro-de-grupos",
    titulo: "Cadastro de grupos",
    label: "Grupos",
    descricao: "Administre grupos e permissões",
    ordem: 1,
    ativo: true,
    registryKey: "configurador.cadastro-de-grupos",
    somenteAdminSistema: true,
    padraoSistema: true,
    podeVisualizar: true,
    podeIncluir: true,
    podeAlterar: true,
    podeExcluir: true,
    acoes: [],
  }],
};

const projetoComAcoes = {
  ...navegacaoHub[0],
  funcionalidades: navegacaoHub[0].funcionalidades.map((funcionalidade) => ({
    ...funcionalidade,
    acoes: [
      { id: 1, chave: "visualizar", nome: "Visualizar", ativo: true },
      { id: 2, chave: "incluir", nome: "Incluir", ativo: true },
      { id: 3, chave: "alterar", nome: "Alterar", ativo: true },
      { id: 4, chave: "excluir", nome: "Excluir", ativo: true },
      { id: 5, chave: "gerenciar_membros", nome: "Gerenciar membros", ativo: true },
      { id: 6, chave: "alterar_status", nome: "Alterar status", ativo: true },
      { id: 7, chave: "reativar_projeto", nome: "Reativar projeto", ativo: true },
    ],
  })),
};

const visitWithoutConsoleMessages = (path, consoleMessages) => {
  const capture = (...args) => consoleMessages.push(args.map(String).join(" "));
  cy.visit(path, {
    onBeforeLoad(window) {
      window.console.warn = capture;
      window.console.error = capture;
    },
  });
};

describe("contratação da empresa aplicada às rotas operacionais", () => {
  it("bloqueia a abertura de chamado sem contrato e mantém Horas indisponível", () => {
    const consoleMessages = [];
    cy.mockGraphql({
      Me: {
        me: {
          ...usuarioAutenticado,
          availableSolutions: ["documentacao"],
          empresa: { ...usuarioAutenticado.empresa, solucaoIds: [] },
        },
      },
      MyHubNavigation: { myHubNavigation: [navegacaoHub[1]] },
    });

    visitWithoutConsoleMessages("/hub/controle-de-chamados/abrir-chamado", consoleMessages);

    cy.contains("h2", "Abrir chamado").should("be.visible");
    cy.contains(/empresa ativa não possui soluções contratadas/i).should("be.visible");
    cy.get('button[type="submit"]').should("be.disabled");
    cy.get('select[name="solucaoId"] option').should("have.length", 1).and("contain.text", "Selecione");

    cy.window().then((window) => {
      window.history.pushState({}, "", "/hub/horas/registro-de-horas");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    cy.location("pathname").should("eq", "/hub");
    cy.contains("h1", "Bem-vindo, Administrador Cypress.").should("be.visible");
    cy.contains("a", "Documentação").should("be.visible").and("have.attr", "href", "/hub/documentacao");
    cy.contains(/controle de horas/i).should("not.exist");
    cy.wrap(consoleMessages).should("deep.equal", []);
  });

  it("carrega para abertura somente a solução contratada devolvida pelo backend", () => {
    const consoleMessages = [];
    cy.mockGraphql({
      Me: {
        me: {
          ...usuarioAutenticado,
          availableSolutions: ["controle-de-chamados"],
          empresa: { ...usuarioAutenticado.empresa, solucaoIds: [solucaoChamados.id] },
        },
      },
      MyHubNavigation: { myHubNavigation: [solucaoChamados, navegacaoHub[1]] },
      CategoriasChamado: { categoriasChamado: [{ id: 1, nome: "Atendimento" }] },
      TiposChamado: { tiposChamado: [{ id: 2, nome: "Incidente" }] },
      PrioridadesChamado: { prioridadesChamado: [{ id: 3, nome: "Normal" }] },
      OpcoesAberturaChamado: {
        opcoesAberturaChamado: {
          solucoes: [{
            id: solucaoChamados.id,
            nome: solucaoChamados.nome,
            slug: solucaoChamados.slug,
            funcionalidades: [{ id: funcionalidadeAbrirChamado.id, titulo: funcionalidadeAbrirChamado.titulo, label: funcionalidadeAbrirChamado.label, slug: funcionalidadeAbrirChamado.slug }],
          }],
        },
      },
      AcompanhantesElegiveisChamado: { acompanhantesElegiveisChamado: [] },
    });

    visitWithoutConsoleMessages("/hub/controle-de-chamados/abrir-chamado", consoleMessages);

    cy.wait("@OpcoesAberturaChamado").its("response.body.data.opcoesAberturaChamado.solucoes").should("have.length", 1);
    cy.contains("h2", "Abrir chamado").should("be.visible");
    cy.get('select[name="solucaoId"] option').should("have.length", 2);
    cy.get('select[name="solucaoId"] option').eq(1).should("have.text", "Controle de chamados");
    cy.get('select[name="solucaoId"]').should("not.contain.text", "Projetos");
    cy.get('button[type="submit"]').should("not.be.disabled");
    cy.wrap(consoleMessages).should("deep.equal", []);
  });

  it("não oferece Documentação como vínculo configurável de grupo", () => {
    const consoleMessages = [];
    cy.mockGraphql({
      Me: {
        me: {
          ...usuarioAutenticado,
          login: "admin",
          padraoSistema: true,
          availableSolutions: ["configurador", "documentacao"],
        },
      },
      MyHubNavigation: { myHubNavigation: [solucaoConfigurador, navegacaoHub[1]] },
      GruposUsuarios: { gruposUsuarios: [] },
      Solucoes: { solucoes: [solucaoConfigurador, projetoComAcoes, navegacaoHub[1]] },
    });

    visitWithoutConsoleMessages("/hub/configurador/cadastro-de-grupos", consoleMessages);

    cy.wait("@Solucoes");
    cy.contains("h2", "Cadastro de grupos").should("be.visible");
    cy.get('button[aria-label="Incluir"]').click();
    cy.get('[role="dialog"][aria-label="Cadastro de grupo"]').should("be.visible");
    cy.get('[role="tab"]').contains("Soluções").click();
    cy.contains("label", "Projetos").should("be.visible");
    cy.contains("label", "Documentação").should("not.exist");
    cy.contains("label", "Projetos").find('input[type="checkbox"]').check();
    cy.get('[role="tab"]').contains("Permissões por rotina").click();
    cy.get('button[aria-label="Marcar todas as permissões — Cadastro de projetos"]')
      .should("be.visible")
      .click();
    cy.get('input[aria-label$="— Cadastro de projetos"]').should("have.length", 7).each(($checkbox) => {
      cy.wrap($checkbox).should("be.checked");
    });
    cy.get('button[aria-label="Marcar todas as permissões — Cadastro de projetos"]').should("be.disabled");
    cy.viewport(390, 844);
    cy.get('button[aria-label="Marcar todas as permissões — Cadastro de projetos"]').should("be.visible");
    cy.document().should((document) => {
      if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
        throw new Error("O botão de seleção em massa introduziu overflow horizontal.");
      }
    });
    cy.screenshot("permissoes-marcar-todas-mobile", { capture: "viewport" });
    cy.wrap(consoleMessages).should("deep.equal", []);
  });
});
