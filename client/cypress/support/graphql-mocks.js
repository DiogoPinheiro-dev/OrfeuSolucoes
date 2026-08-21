export const graphqlUrl = "**/graphql";
export const empresaA = { id: 1, nome: "Empresa A", acessoEcommerce: false, acessoProjetos: true, acessoHoras: false };
export const empresaB = { id: 2, nome: "Empresa B", acessoEcommerce: false, acessoProjetos: true, acessoHoras: false };
export const usuarioAutenticado = {
  id: 7, nome: "Administrador Cypress", login: "admin.cypress", email: "cypress@orfeu.local",
  podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true,
  deveAlterarSenha: false, padraoSistema: false, availableSolutions: ["projetos"],
  grupo: { id: 1, nome: "Administradores", descricao: "Administração", acessoEcommerce: false, acessoProjetos: true, acessoHoras: false, acessoConfigurador: true, podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true },
  empresa: empresaA, empresas: [empresaA, empresaB],
};
export const navegacaoHub = [{
  id: 20, slug: "projetos", nome: "Projetos", descricao: "Gestão de projetos", eyebrow: "Planejamento", ordem: 1, ativo: true, exibirNoHub: true, somenteAdminSistema: false, padraoSistema: false,
  funcionalidades: [{ id: 21, slug: "cadastro-de-projetos", titulo: "Cadastro de projetos", label: "Projetos", descricao: "Cadastre e acompanhe projetos", ordem: 1, ativo: true, registryKey: "projetos.cadastro-de-projetos", somenteAdminSistema: false, padraoSistema: true, podeVisualizar: true, podeIncluir: true, podeAlterar: true, podeExcluir: true, acoes: [] }],
}, {
  id: 90, slug: "documentacao", nome: "Documentação", descricao: "Manuais de uso e referências do sistema conforme seu nível de acesso.", eyebrow: "Central de conhecimento", ordem: 900, ativo: true, exibirNoHub: true, somenteAdminSistema: false, padraoSistema: true, funcionalidades: [],
}];
export const artigoIndice = { id: "projetos-backlog-visao-geral", slug: "backlog-visao-geral", titulo: "Backlog — visão geral", resumo: "Como consultar e organizar o backlog do projeto.", categoria: "Operação", audiencia: ["usuario"], ordem: 10, validadoEm: "2026-08-12", palavrasChave: ["backlog", "projeto"], solucao: "projetos", funcionalidade: "Backlog", registryKey: "projetos.backlog" };

const defaultResponses = {
  Me: { me: usuarioAutenticado },
  MyHubNavigation: { myHubNavigation: navegacaoHub },
  DocumentacaoIndice: { documentacaoIndice: [artigoIndice] },
  DocumentacaoArtigo: { documentacaoArtigo: { ...artigoIndice, conteudo: "# Backlog — visão geral\n\n## Consultar o backlog\n\nUse os filtros para localizar itens.\n\n## Organizar prioridades\n\nRevise a ordem com a equipe." } },
  BuscarDocumentacao: { buscarDocumentacao: [{ ...artigoIndice, trecho: "Organize prioridades do backlog do projeto." }] },
};

Cypress.Commands.add("mockGraphql", (overrides = {}) => {
  const responses = { ...defaultResponses, ...overrides };
  cy.intercept("POST", graphqlUrl, (request) => {
    const operationName = request.body?.operationName;
    request.alias = operationName;
    const response = responses[operationName];
    if (!response) return request.reply({ statusCode: 500, body: { errors: [{ message: `Operação GraphQL sem mock: ${operationName}` }] } });
    request.reply({ statusCode: 200, body: response.errors ? response : { data: response } });
  }).as("graphql");
});

Cypress.Commands.add("visitAuthenticated", (path, overrides = {}) => {
  cy.mockGraphql(overrides);
  cy.visit(path);
});
