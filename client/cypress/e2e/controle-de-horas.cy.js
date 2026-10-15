import { navegacaoHub } from "../support/graphql-mocks";

const grupoControleDeHoras = {
  __typename: "FuncionalidadeAgrupamentoType",
  id: 120,
  slug: "controle-de-horas",
  titulo: "Controle de horas",
  label: "Horas",
  descricao: "Registre apontamentos e gerencie as horas dos projetos.",
  ordem: 110,
  ativo: true,
  padraoSistema: true,
};

const funcionalidade = (id, slug, titulo, ordemNoAgrupamento) => ({
  __typename: "FuncionalidadeType",
  id,
  slug,
  titulo,
  label: titulo,
  descricao: `${titulo} no controle de horas.`,
  ordem: 100 + ordemNoAgrupamento,
  ativo: true,
  registryKey: `projetos.${slug}`,
  providerKey: `projetos.${slug}`,
  providerVersion: 1,
  somenteAdminSistema: false,
  padraoSistema: true,
  agrupamentoId: grupoControleDeHoras.id,
  ordemNoAgrupamento,
  podeVisualizar: true,
  podeIncluir: true,
  podeAlterar: true,
  podeExcluir: true,
  acoes: [],
});

const projetosComControleDeHoras = {
  ...navegacaoHub[0],
  agrupamentos: [grupoControleDeHoras],
  funcionalidades: [
    funcionalidade(121, "meus-apontamentos", "Meus apontamentos", 1),
    funcionalidade(122, "horas-do-projeto", "Horas do projeto", 2),
  ],
};

const respostas = {
  MyHubNavigation: { myHubNavigation: [projetosComControleDeHoras] },
  ProjetoHojeOperacional: { projetoHojeOperacional: "2026-10-15" },
  ProjetoApontamentoProjetos: { projetoApontamentoProjetos: [] },
  MeusProjetoApontamentos: {
    meusProjetoApontamentos: {
      items: [], total: 0, pagina: 1, limite: 10, totalPaginas: 1, totalMinutos: 0,
      totaisPorDia: [], totaisPorProjeto: [], permissoes: { podeIncluir: true },
    },
  },
  ProjetoHorasProjetos: { projetoHorasProjetos: [] },
};

const visitar = (path) => cy.visitAuthenticated(path, respostas);

describe("controle de horas agrupado no Hub de Projetos", () => {
  it("mantém abas, URL, histórico e recarga alinhados", () => {
    visitar("/hub/projetos/controle-de-horas");

    cy.location("pathname").should("eq", "/hub/projetos/meus-apontamentos");
    cy.get('[role="tablist"][aria-label="Seções de Controle de horas"]').within(() => {
      cy.contains('[role="tab"]', "Meus apontamentos").should("have.attr", "aria-selected", "true");
      cy.contains('[role="tab"]', "Horas do projeto").click();
    });
    cy.location("pathname").should("eq", "/hub/projetos/horas-do-projeto");
    cy.contains("h2", "Horas do projeto").should("be.visible");

    cy.go("back");
    cy.location("pathname").should("eq", "/hub/projetos/meus-apontamentos");
    cy.contains("h2", "Meus apontamentos").should("be.visible");

    cy.go("forward");
    cy.location("pathname").should("eq", "/hub/projetos/horas-do-projeto");
    cy.reload();
    cy.contains("h2", "Horas do projeto").should("be.visible");
    cy.contains('[role="tab"]', "Horas do projeto").should("have.attr", "aria-selected", "true");
  });

  it("troca as abas pelo teclado", () => {
    visitar("/hub/projetos/meus-apontamentos");

    cy.contains('[role="tab"]', "Meus apontamentos").focus().type("{rightarrow}");
    cy.location("pathname").should("eq", "/hub/projetos/horas-do-projeto");
    cy.contains('[role="tab"]', "Horas do projeto").should("be.focused").type("{home}");
    cy.location("pathname").should("eq", "/hub/projetos/meus-apontamentos");
    cy.contains('[role="tab"]', "Meus apontamentos").should("be.focused").type("{end}");
    cy.location("pathname").should("eq", "/hub/projetos/horas-do-projeto");
  });

  [
    [390, 844],
    [768, 1024],
    [1440, 900],
  ].forEach(([width, height]) => {
    it(`preserva as abas sem overflow em ${width}px`, () => {
      cy.viewport(width, height);
      visitar("/hub/projetos/meus-apontamentos");

      cy.get('[role="tablist"][aria-label="Seções de Controle de horas"]').should("be.visible");
      cy.get('[role="tablist"] [role="tab"]').should("have.length", 2);
      cy.document().should((document) => {
        if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
          throw new Error("O controle de horas introduziu overflow horizontal.");
        }
      });
    });
  });
});
