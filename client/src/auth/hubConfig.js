export const USER_ROLE = {
    CLIENTE: "CLIENTE",
    USUARIO: "USUARIO",
    ADMIN: "ADMIN"
};

export const ROLE_LABELS = {
    [USER_ROLE.CLIENTE]: "Cliente",
    [USER_ROLE.USUARIO]: "Usuario",
    [USER_ROLE.ADMIN]: "Administrador"
};

export const HUB_SOLUTIONS = [
    {
        slug: "ecommerce",
        title: "E-commerce",
        description: "Portal comercial para pedidos, acompanhamento de compras e relacionamento com o cliente.",
        eyebrow: "Comercial",
        status: "Disponivel",
        roles: [USER_ROLE.CLIENTE, USER_ROLE.USUARIO, USER_ROLE.ADMIN],
        defaultAccess: true,
        areas: [
            {
                label: "Catalogo",
                title: "Catalogo de produtos",
                description: "Consulte produtos, servicos disponiveis e detalhes comerciais antes de iniciar um pedido."
            },
            {
                label: "Pedidos",
                title: "Meus pedidos",
                description: "Acompanhe pedidos realizados, status de compra e historico comercial."
            },
            {
                label: "Atendimento",
                title: "Relacionamento comercial",
                description: "Centralize contatos, solicitacoes e comunicacao com a equipe comercial."
            }
        ]
    },
    {
        slug: "projetos",
        title: "Gerenciador de Projetos",
        description: "Espaco para organizar backlog, entregas, marcos e comunicacao entre as equipes.",
        eyebrow: "Operacao",
        status: "Interno",
        roles: [USER_ROLE.CLIENTE, USER_ROLE.ADMIN],
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
        description: "Registro de apontamentos, horas alocadas por atividade e visibilidade do esforço da equipe.",
        eyebrow: "People Ops",
        status: "Interno",
        roles: [USER_ROLE.CLIENTE, USER_ROLE.ADMIN],
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
        description: "Central administrativa para cadastrar usuários, cadastrar empresas e vincular usuários às empresas.",
        eyebrow: "Administracao",
        status: "Admin",
        roles: [USER_ROLE.ADMIN],
        requiresCompanyAdmin: true,
        areas: [
            {
                label: "Usuarios",
                title: "Cadastro de usuarios",
                description: "Gerencie contas, dados de acesso e perfis operacionais dos usuarios da empresa."
            },
            {
                label: "Empresas",
                title: "Cadastro de empresas",
                description: "Crie e mantenha empresas, liberando as solucoes contratadas para cada uma."
            },
            {
                label: "Vinculos",
                title: "Usuario x empresa",
                description: "Associe usuarios às empresas corretas para controlar o acesso ao ambiente selecionado no login."
            }
        ]
    }
];

export const getSolutionsForUser = (user) => {
    if (!user) {
        return [];
    }

    if (user.tipo === USER_ROLE.ADMIN) {
        return HUB_SOLUTIONS;
    }

    if (user.tipo === USER_ROLE.USUARIO) {
        return HUB_SOLUTIONS.filter((solution) => solution.slug === "ecommerce");
    }

    const allowedSolutions = user.availableSolutions ?? [];

    return HUB_SOLUTIONS.filter((solution) => allowedSolutions.includes(solution.slug));
};

export const getSolutionsForRole = (role) =>
    getSolutionsForUser({
        tipo: role,
        availableSolutions: role === USER_ROLE.USUARIO ? ["ecommerce"] : undefined
    });

export const getSolutionBySlug = (slug) =>
    HUB_SOLUTIONS.find((solution) => solution.slug === slug);

export const getAreaAnchor = (title = "") =>
    title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

export const canAccessSolution = (userOrRole, slug) => {
    const solution = getSolutionBySlug(slug);

    if (!solution) {
        return false;
    }

    if (typeof userOrRole === "string") {
        return getSolutionsForRole(userOrRole).some((item) => item.slug === slug);
    }

    return getSolutionsForUser(userOrRole).some((item) => item.slug === slug);
};
