export const HUB_SOLUTIONS = [
    {
        slug: "projetos",
        title: "Gerenciador de Projetos",
        description: "Espaco para organizar backlog, entregas, marcos e comunicacao entre as equipes.",
        eyebrow: "Operacao",
        status: "Interno",
        areas: [
            {
                label: "Backlog",
                title: "Backlog de demandas",
                description: "Organize demandas, prioridades e escopo planejado para cada projeto."
            },
            {
                label: "Entregas",
                title: "Marcos e entregas",
                description: "Acompanhe etapas, entregaveis, prazos e progresso operacional."
            },
            {
                label: "Comunicacao",
                title: "Comunicacao do projeto",
                description: "Registre alinhamentos, decisoes e historico de interacoes do projeto."
            }
        ]
    },
    {
        slug: "horas",
        title: "Controle de Horas",
        description: "Registro de apontamentos, horas alocadas por atividade e visibilidade do esforco da equipe.",
        eyebrow: "People Ops",
        status: "Interno",
        areas: [
            {
                label: "Apontamentos",
                title: "Registro de horas",
                description: "Lance horas por atividade, projeto e periodo de execucao."
            },
            {
                label: "Aprovacao",
                title: "Aprovacao de apontamentos",
                description: "Revise apontamentos, valide registros e acompanhe pendencias."
            },
            {
                label: "Relatorios",
                title: "Relatorios de horas",
                description: "Visualize horas alocadas, esforco por projeto e indicadores de capacidade."
            }
        ]
    },
    {
        slug: "configurador",
        title: "Configurador",
        description: "Central administrativa para cadastrar usuarios, empresas e grupos de acesso.",
        eyebrow: "Administracao",
        status: "Admin",
        areas: [
            {
                label: "Usuarios",
                title: "Cadastro de usuarios",
                description: "Gerencie contas, dados de acesso, grupo e permissoes dos usuarios."
            },
            {
                label: "Grupos",
                title: "Cadastro de grupos",
                description: "Defina grupos de usuarios e quais solucoes cada grupo pode acessar."
            },
            {
                label: "Empresas",
                title: "Cadastro de empresas",
                description: "Crie e mantenha empresas, liberando as solucoes contratadas para cada uma."
            }
        ]
    }
];

export const hasFullGroupAccess = (grupo) => !!(
    grupo?.acessoEcommerce &&
    grupo.acessoProjetos &&
    grupo.acessoHoras &&
    grupo.acessoConfigurador
);

export const isSystemAdmin = (user) => user?.login?.toLowerCase?.() === "admin";

export const isGroupAdmin = (user) => hasFullGroupAccess(user?.grupo);

export const getSolutionsForUser = (user) => {
    if (!user) {
        return [];
    }

    const allowedSolutions = user.availableSolutions?.length ? user.availableSolutions : [];

    return HUB_SOLUTIONS.filter((solution) => allowedSolutions.includes(solution.slug));
};

export const getSolutionBySlug = (slug) =>
    HUB_SOLUTIONS.find((solution) => solution.slug === slug);

export const getAreaAnchor = (title = "") =>
    title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

export const canAccessSolution = (user, slug) =>
    getSolutionsForUser(user).some((item) => item.slug === slug);

export const getUserGroupLabel = (user) =>
    user?.grupo?.nome || "Sem grupo";
