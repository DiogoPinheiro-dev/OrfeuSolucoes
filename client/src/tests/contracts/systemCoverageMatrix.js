const CRUD_ACTIONS = ["visualizar", "incluir", "alterar", "excluir"];
const OPERATIONAL_ACTIONS = ["visualizar", "operar"];

const feature = (registryKey, domain, type = "operational") => ({
    id: registryKey,
    registryKey,
    domain,
    type,
    risk: "critical",
    actions: type === "crud" ? CRUD_ACTIONS : OPERATIONAL_ACTIONS,
    requiredLayers: ["component", "service", "authorization", "integration", "browser"]
});

export const FEATURE_COVERAGE_MATRIX = [
    feature("configurador.cadastro-de-usuarios", "configurador", "crud"),
    feature("configurador.cadastro-de-grupos", "configurador", "crud"),
    feature("configurador.cadastro-de-empresas", "configurador", "crud"),
    feature("configurador.cadastro-de-solucoes", "configurador", "crud"),
    feature("configurador.cadastro-de-funcionalidades", "configurador", "crud"),
    feature("controle-de-chamados.abrir-chamado", "chamados"),
    feature("controle-de-chamados.meus-chamados", "chamados"),
    feature("controle-de-chamados.painel-atendimento", "chamados"),
    feature("controle-de-chamados.chamados-arquivados", "chamados"),
    feature("controle-de-chamados.dashboard", "chamados"),
    feature("controle-de-chamados.relatorios", "chamados"),
    feature("controle-de-chamados.categorias", "chamados", "crud"),
    feature("controle-de-chamados.tipos", "chamados", "crud"),
    feature("controle-de-chamados.prioridades", "chamados", "crud"),
    feature("controle-de-chamados.responsaveis", "chamados", "crud"),
    feature("controle-de-chamados.sla", "chamados", "crud"),
    feature("controle-de-chamados.emails-solucoes", "chamados", "crud"),
    feature("projetos.cadastro-de-projetos", "projetos", "crud"),
    feature("projetos.backlog-de-demandas", "projetos"),
    feature("projetos.sprints", "projetos", "crud"),
    feature("projetos.marcos-e-entregas", "projetos", "crud"),
    feature("projetos.cronograma-e-gantt", "projetos"),
    feature("projetos.comunicacao-do-projeto", "projetos"),
    feature("projetos.planejamento-de-recursos", "projetos"),
    feature("projetos.orcamento-do-projeto", "projetos")
];

export const CROSS_CUTTING_COVERAGE_MATRIX = [
    {
        id: "auth.session",
        domain: "auth",
        risk: "critical",
        scenarios: ["login", "logout", "restore", "expiration", "forced-password-change"],
        requiredLayers: ["component", "service", "integration", "browser"]
    },
    {
        id: "hub.navigation",
        domain: "hub",
        risk: "critical",
        scenarios: ["strict-mode", "company-switch", "stale-response", "service-failure", "retry", "direct-url"],
        requiredLayers: ["hook", "component", "service", "integration", "browser"]
    },
    {
        id: "permissions.isolation",
        domain: "authorization",
        risk: "critical",
        scenarios: ["allowed", "denied", "different-company", "different-project", "readonly"],
        requiredLayers: ["component", "service", "authorization", "integration", "browser"]
    },
    {
        id: "shared.frontend",
        domain: "shared",
        risk: "high",
        scenarios: ["loading", "error", "empty", "keyboard", "focus", "responsive"],
        requiredLayers: ["hook", "component", "accessibility"]
    }
];

export const SYSTEM_COVERAGE_MATRIX = [
    ...FEATURE_COVERAGE_MATRIX,
    ...CROSS_CUTTING_COVERAGE_MATRIX
];
