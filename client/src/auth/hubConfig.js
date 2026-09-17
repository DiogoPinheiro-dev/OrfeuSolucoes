export const normalizeSolutions = (solutions = []) =>
    solutions.map((solution) => ({
        id: solution.id,
        slug: solution.slug,
        title: solution.nome,
        description: solution.descricao,
        eyebrow: solution.eyebrow,
        padraoSistema: !!solution.padraoSistema,
        groups: (solution.agrupamentos || []).map((group) => ({
            id: group.id,
            slug: group.slug,
            title: group.titulo,
            label: group.label,
            description: group.descricao,
            order: group.ordem ?? 0
        })),
        areas: (solution.funcionalidades || []).map((feature) => ({
            id: feature.id,
            slug: feature.slug,
            label: feature.label,
            title: feature.titulo,
            description: feature.descricao,
            order: feature.ordem ?? 0,
            groupId: feature.agrupamentoId ?? null,
            groupOrder: feature.ordemNoAgrupamento ?? null,
            registryKey: feature.registryKey,
            providerKey: feature.providerKey,
            providerVersion: feature.providerVersion,
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

export const getFeaturePath = (solution, area) =>
    `/hub/${solution.slug}/${area.slug || getAreaAnchor(area.title)}`;

export const getGroupBySlug = (solution, slug) =>
    solution?.groups?.find((group) => group.slug === slug);

const byGroupOrder = (left, right) =>
    (left.groupOrder ?? Number.MAX_SAFE_INTEGER) - (right.groupOrder ?? Number.MAX_SAFE_INTEGER) ||
    (left.order ?? 0) - (right.order ?? 0);

/** Abas do agrupamento: somente funcionalidades que a navegação autorizou para o usuário. */
export const getGroupTabs = (solution, groupId) =>
    (solution?.areas || [])
        .filter((area) => area.groupId === groupId)
        .sort(byGroupOrder);

/** O agrupamento só vira tela com abas quando há duas ou mais funcionalidades visíveis. */
export const getAreaGroup = (solution, area) => {
    if (!area?.groupId) {
        return null;
    }

    const group = solution?.groups?.find((item) => item.id === area.groupId);
    const tabs = group ? getGroupTabs(solution, group.id) : [];

    return tabs.length > 1 ? { ...group, tabs } : null;
};

/** Itens do workspace e do menu: um por agrupamento com abas e um por funcionalidade isolada. */
export const getWorkspaceEntries = (solution) => {
    const entries = [];
    const presentedGroups = new Set();

    for (const area of solution?.areas || []) {
        const group = getAreaGroup(solution, area);

        if (!group) {
            entries.push({
                type: "area",
                key: `area-${area.id ?? area.slug}`,
                title: area.title,
                label: area.label,
                description: area.description,
                order: area.order ?? 0,
                path: getFeaturePath(solution, area)
            });
            continue;
        }

        if (presentedGroups.has(group.id)) {
            continue;
        }

        presentedGroups.add(group.id);
        entries.push({
            type: "group",
            key: `group-${group.id}`,
            title: group.title,
            label: group.label,
            description: group.description,
            order: group.order ?? 0,
            path: getFeaturePath(solution, group.tabs[0]),
            tabs: group.tabs
        });
    }

    return entries
        .map((entry, index) => ({ entry, index }))
        .sort((left, right) => left.entry.order - right.entry.order || left.index - right.index)
        .map(({ entry }) => entry);
};

export const canAccessSolution = (solutions, slug) =>
    solutions.some((item) => item.slug === slug);

export const isAssignableSolution = (solution) => !!(
    solution?.ativo &&
    !solution.somenteAdminSistema &&
    solution.slug !== "documentacao"
);

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
