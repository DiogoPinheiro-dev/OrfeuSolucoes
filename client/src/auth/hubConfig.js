export const FEATURE_COMPONENT_REGISTRY = {
    "configurador.cadastro-de-usuarios": "user-management",
    "configurador.cadastro-de-grupos": "group-management",
    "configurador.cadastro-de-empresas": "company-management",
    "configurador.cadastro-de-solucoes": "solution-management",
    "configurador.cadastro-de-funcionalidades": "feature-management",
    "controle-de-chamados.abrir-chamado": "chamado-create",
    "controle-de-chamados.meus-chamados": "meus-chamados",
    "controle-de-chamados.painel-atendimento": "painel-atendimento",
    "controle-de-chamados.chamados-arquivados": "chamados-arquivados",
    "controle-de-chamados.categorias": "categoria-chamado-management",
    "controle-de-chamados.tipos": "tipo-chamado-management",
    "controle-de-chamados.prioridades": "prioridade-chamado-management",
    "controle-de-chamados.responsaveis": "responsavel-chamado-management"
};

export const normalizeSolutions = (solutions = []) =>
    solutions.map((solution) => ({
        id: solution.id,
        slug: solution.slug,
        title: solution.nome,
        description: solution.descricao,
        eyebrow: solution.eyebrow,
        areas: (solution.funcionalidades || []).map((feature) => ({
            id: feature.id,
            slug: feature.slug,
            label: feature.label,
            title: feature.titulo,
            description: feature.descricao,
            registryKey: feature.registryKey,
            podeVisualizar: feature.podeVisualizar !== false,
            podeIncluir: !!feature.podeIncluir,
            podeAlterar: !!feature.podeAlterar,
            podeExcluir: !!feature.podeExcluir,
            acoes: feature.acoes || []
        }))
    }));

export const hasFullGroupAccess = (grupo) => !!(
    grupo?.acessoEcommerce &&
    grupo.acessoProjetos &&
    grupo.acessoHoras &&
    grupo.acessoConfigurador
);

export const isSystemAdmin = (user) => user?.login?.toLowerCase?.() === "admin";

export const isGroupAdmin = (user) => hasFullGroupAccess(user?.grupo);

export const getSolutionBySlug = (solutions, slug) =>
    solutions.find((solution) => solution.slug === slug);

export const getFeatureBySlug = (solution, slug) =>
    solution?.areas?.find((item) => item.slug === slug);

export const getAreaAnchor = (title = "") =>
    title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

export const canAccessSolution = (solutions, slug) =>
    solutions.some((item) => item.slug === slug);

export const getUserGroupLabel = (user) =>
    user?.grupo?.nome || "Sem grupo";

const normalizeActionIdentifier = (value = "") =>
    value
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

export const canUseFeatureAction = (user, feature, action) => {
    if (isSystemAdmin(user)) {
        return true;
    }

    const requestedAction = normalizeActionIdentifier(action);
    const dynamicAction = feature?.acoes?.find((item) =>
        normalizeActionIdentifier(item.chave) === requestedAction ||
        normalizeActionIdentifier(item.configuracao || "") === requestedAction
    );

    if (dynamicAction) {
        return !!dynamicAction.permitido;
    }

    const permissionKey = {
        visualizar: "podeVisualizar",
        incluir: "podeIncluir",
        alterar: "podeAlterar",
        excluir: "podeExcluir"
    }[action];

    if (!permissionKey) {
        return false;
    }

    if (!feature) {
        return permissionKey === "podeVisualizar"
            ? user?.podeVisualizar !== false
            : !!user?.[permissionKey];
    }

    return feature?.[permissionKey] !== false && (permissionKey === "podeVisualizar" || !!feature?.[permissionKey]);
};
