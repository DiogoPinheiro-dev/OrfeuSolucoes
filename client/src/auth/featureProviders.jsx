import { lazy } from "react";

const provider = (loader, options = {}) => ({
    loader: lazy(loader),
    version: 1,
    aliases: [],
    ...options
});

export const FEATURE_PROVIDERS = Object.freeze({
    "configurador.cadastro-de-usuarios": provider(() => import("../components/UserManagement")),
    "configurador.cadastro-de-grupos": provider(() => import("../components/GroupManagement")),
    "configurador.cadastro-de-empresas": provider(() => import("../components/CompanyManagement")),
    "configurador.cadastro-de-solucoes": provider(() => import("../components/SolutionManagement")),
    "configurador.cadastro-de-funcionalidades": provider(() => import("../components/FeatureManagement")),
    "controle-de-chamados.abrir-chamado": provider(() => import("../components/ChamadoCreate")),
    "controle-de-chamados.meus-chamados": provider(() => import("../components/MeusChamados")),
    "controle-de-chamados.painel-atendimento": provider(() => import("../components/PainelAtendimento")),
    "controle-de-chamados.chamados-arquivados": provider(() => import("../components/ChamadosArquivados")),
    "controle-de-chamados.dashboard": provider(() => import("../components/ChamadoDashboard")),
    "controle-de-chamados.relatorios": provider(() => import("../components/ChamadoRelatorio")),
    "controle-de-chamados.categorias": provider(() => import("../components/CategoriaChamadoManagement")),
    "controle-de-chamados.tipos": provider(() => import("../components/ChamadoConfiguracaoManagement"), { props: { kind: "tipos" } }),
    "controle-de-chamados.prioridades": provider(() => import("../components/ChamadoConfiguracaoManagement"), { props: { kind: "prioridades" } }),
    "controle-de-chamados.responsaveis": provider(() => import("../components/ResponsavelChamadoManagement")),
    "controle-de-chamados.sla": provider(() => import("../components/SlaChamadoManagement")),
    "controle-de-chamados.emails-solucoes": provider(() => import("../components/GoogleEmailManagement")),
    "projetos.cadastro-de-projetos": provider(() => import("../components/ProjectManagement")),
    "projetos.backlog-de-demandas": provider(() => import("../components/BacklogManagement")),
    "projetos.sprints": provider(() => import("../components/SprintManagement")),
    "projetos.marcos-e-entregas": provider(() => import("../components/MarcoEntregaManagement")),
    "projetos.cronograma-e-gantt": provider(() => import("../components/CronogramaManagement")),
    "projetos.comunicacao-do-projeto": provider(() => import("../components/ProjectCommunicationManagement")),
    "projetos.planejamento-de-recursos": provider(() => import("../components/ProjectResourcePlanningManagement"), {
        aliases: ["projetos.recursos-do-projeto", "projetos.grade-de-capacitacao"]
    }),
    "projetos.orcamento-do-projeto": provider(() => import("../components/ProjectBudgetManagement"))
});

const PROVIDER_ALIASES = new Map(
    Object.entries(FEATURE_PROVIDERS).flatMap(([key, definition]) =>
        definition.aliases.map((alias) => [alias, key])
    )
);

export const FEATURE_PROVIDER_KEYS = Object.freeze(Object.keys(FEATURE_PROVIDERS));

export const resolveFeatureProvider = (key, requiredVersion = 1) => {
    const canonicalKey = PROVIDER_ALIASES.get(key) || key;
    const definition = FEATURE_PROVIDERS[canonicalKey];

    if (!definition || definition.version < (requiredVersion || 1)) {
        return null;
    }

    return { ...definition, key: canonicalKey };
};
