export const FEATURE_COMPONENT_REGISTRY = {
    "configurador.cadastro-de-usuarios": "user-management",
    "configurador.cadastro-de-grupos": "group-management",
    "configurador.cadastro-de-empresas": "company-management",
    "configurador.cadastro-de-funcionalidades": "feature-management",
    "configurador.teste": "test-feature"
};

export const normalizeSolutions = (solutions = []) =>
    solutions.map((solution) => ({
        id: solution.id,
        slug: solution.slug,
        title: solution.nome,
        description: solution.descricao,
        eyebrow: solution.eyebrow,
        status: solution.status,
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

export const canUseFeatureAction = (user, feature, action) => {
    if (isSystemAdmin(user)) {
        return true;
    }

    const dynamicAction = feature?.acoes?.find((item) => item.chave === action || item.configuracao === action);

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
