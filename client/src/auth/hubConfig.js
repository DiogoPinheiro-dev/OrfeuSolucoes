export const USER_ROLE = {
    CLIENTE: "CLIENTE",
    FUNCIONARIO: "FUNCIONARIO",
    ADMIN: "ADMIN"
};

export const ROLE_LABELS = {
    [USER_ROLE.CLIENTE]: "Cliente",
    [USER_ROLE.FUNCIONARIO]: "Funcionario",
    [USER_ROLE.ADMIN]: "Administrador"
};

export const HUB_SOLUTIONS = [
    {
        slug: "ecommerce",
        title: "E-commerce",
        description: "Portal comercial para pedidos, acompanhamento de compras e relacionamento com o cliente.",
        eyebrow: "Comercial",
        status: "Disponivel",
        roles: [USER_ROLE.CLIENTE, USER_ROLE.FUNCIONARIO, USER_ROLE.ADMIN]
    },
    {
        slug: "projetos",
        title: "Gerenciador de Projetos",
        description: "Espaco para organizar backlog, entregas, marcos e comunicacao entre as equipes.",
        eyebrow: "Operacao",
        status: "Interno",
        roles: [USER_ROLE.FUNCIONARIO, USER_ROLE.ADMIN]
    },
    {
        slug: "horas",
        title: "Controle de Horas",
        description: "Registro de apontamentos, horas alocadas por atividade e visibilidade do esforço da equipe.",
        eyebrow: "People Ops",
        status: "Interno",
        roles: [USER_ROLE.FUNCIONARIO, USER_ROLE.ADMIN]
    }
];

export const getSolutionsForRole = (role) =>
    HUB_SOLUTIONS.filter((solution) => solution.roles.includes(role));

export const getSolutionBySlug = (slug) =>
    HUB_SOLUTIONS.find((solution) => solution.slug === slug);

export const canAccessSolution = (role, slug) => {
    const solution = getSolutionBySlug(slug);
    return !!solution && solution.roles.includes(role);
};
