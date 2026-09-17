/* global expect */

import { usuarioAutenticado } from "../support/graphql-mocks";

const funcionalidade = ({ id, slug, titulo, registryKey }) => ({
  __typename: "FuncionalidadeType",
  id,
  slug,
  titulo,
  label: titulo,
  descricao: titulo,
  ordem: id,
  ativo: true,
  registryKey,
  providerKey: registryKey,
  providerVersion: 1,
  somenteAdminSistema: false,
  padraoSistema: true,
  podeVisualizar: true,
  podeIncluir: true,
  podeAlterar: true,
  podeExcluir: true,
  acoes: [],
});

const abrirChamado = funcionalidade({
  id: 31,
  slug: "abrir-chamado",
  titulo: "Abrir chamado",
  registryKey: "controle-de-chamados.abrir-chamado",
});

const relatorios = funcionalidade({
  id: 32,
  slug: "relatorios",
  titulo: "Relatórios",
  registryKey: "controle-de-chamados.relatorios",
});

const solucaoChamados = {
  __typename: "SolucaoType",
  id: 30,
  slug: "controle-de-chamados",
  nome: "Controle de chamados",
  descricao: "Atendimento e acompanhamento de solicitações",
  eyebrow: "Atendimento",
  ordem: 1,
  ativo: true,
  exibirNoHub: true,
  somenteAdminSistema: false,
  padraoSistema: true,
  funcionalidades: [abrirChamado, relatorios],
};

const respostasComuns = {
  Me: {
    me: {
      ...usuarioAutenticado,
      availableSolutions: ["controle-de-chamados"],
      empresa: { ...usuarioAutenticado.empresa, solucaoIds: [solucaoChamados.id] },
    },
  },
  MyHubNavigation: { myHubNavigation: [solucaoChamados] },
};

const respostasAbertura = {
  ...respostasComuns,
  CategoriasChamado: { categoriasChamado: [{ id: 1, nome: "Atendimento" }] },
  TiposChamado: { tiposChamado: [{ id: 2, nome: "Solicitação" }] },
  PrioridadesChamado: { prioridadesChamado: [{ id: 3, nome: "Baixa" }] },
  OpcoesAberturaChamado: {
    opcoesAberturaChamado: {
      solucoes: [{
        id: solucaoChamados.id,
        nome: solucaoChamados.nome,
        slug: solucaoChamados.slug,
        funcionalidades: [{
          id: abrirChamado.id,
          titulo: abrirChamado.titulo,
          label: abrirChamado.label,
          slug: abrirChamado.slug,
        }],
      }],
    },
  },
  AcompanhantesElegiveisChamado: { acompanhantesElegiveisChamado: [] },
};

const respostasRelatorio = {
  ...respostasComuns,
  CategoriasChamado: { categoriasChamado: [] },
  PrioridadesChamado: { prioridadesChamado: [] },
  AtendentesDisponiveis: { atendentesDisponiveis: [] },
  ChamadoRelatorio: {
    relatorioChamados: { items: [], total: 0, page: 1, pageSize: 25, totalPages: 1 },
  },
};

const viewports = [
  { width: 320, height: 760, label: "celular estreito" },
  { width: 390, height: 844, label: "celular" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1440, height: 900, label: "desktop" },
];

const assertChildrenInside = (containerSelector, childrenSelector) => {
  cy.get(containerSelector).should("be.visible").then(($container) => {
    const containerRect = $container[0].getBoundingClientRect();
    cy.get(childrenSelector).each(($child) => {
      const childRect = $child[0].getBoundingClientRect();
      expect(childRect.left, `${childrenSelector} à esquerda`).to.be.at.least(containerRect.left - 1);
      expect(childRect.right, `${childrenSelector} à direita`).to.be.at.most(containerRect.right + 1);
    });
  });
};

describe("responsividade do Controle de Chamados", () => {
  viewports.forEach(({ width, height, label }) => {
    it(`mantém os campos da abertura contidos em ${label}`, () => {
      cy.viewport(width, height);
      cy.visitAuthenticated("/hub/controle-de-chamados/abrir-chamado", respostasAbertura);
      cy.contains("h2", "Abrir chamado").should("be.visible");
      cy.get(".chamado-form-grid").should(($grid) => {
        expect($grid[0].scrollWidth).to.be.at.most($grid[0].clientWidth + 1);
      });
      assertChildrenInside(".workspace-feature-crud", ".chamado-form");
      assertChildrenInside(".chamado-form", ".chamado-form select");
      if (width === 390) {
        cy.screenshot("chamados-abertura-responsiva-celular", { capture: "viewport" });
      }
    });

    it(`mantém os controles do relatório contidos em ${label}`, () => {
      cy.viewport(width, height);
      cy.visitAuthenticated("/hub/controle-de-chamados/relatorios", respostasRelatorio);
      cy.contains("h2", "Relatórios de chamados").should("be.visible");
      cy.get(".report-pagination").should(($pagination) => {
        expect($pagination[0].scrollWidth).to.be.at.most($pagination[0].clientWidth + 1);
        expect($pagination[0].getBoundingClientRect().height).to.be.greaterThan(50);
      });
      assertChildrenInside(".workspace-feature-crud", ".chamado-report-table");
      assertChildrenInside(".report-pagination", ".report-pagination > *");
      cy.get(".report-pagination > *").each(($control) => {
        cy.wrap($control).should("be.visible");
      });
      cy.get(".report-pagination button").each(($button) => {
        expect($button[0].getBoundingClientRect().height).to.be.at.least(44);
      });
    });
  });
});
