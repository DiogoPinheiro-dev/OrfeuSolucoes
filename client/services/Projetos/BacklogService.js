import { apolloClient } from "../../src/lib/apolloClient";
import {
    ALTERAR_STATUS_PROJETO_ITEM_MUTATION,
    ARQUIVAR_PROJETO_ITEM_MUTATION,
    CREATE_PROJETO_ITEM_MUTATION,
    MOVER_PROJETO_ITEM_BACKLOG_MUTATION,
    PROJETO_BACKLOG_PROJETOS_QUERY,
    PROJETO_BACKLOG_RESPONSAVEIS_QUERY,
    PROJETO_ITEM_HISTORICO_QUERY,
    PROJETO_ITEM_QUERY,
    PROJETO_ITENS_QUERY,
    REATIVAR_PROJETO_ITEM_MUTATION,
    UPDATE_PROJETO_ITEM_MUTATION
} from "../graphql/operations";
import { toServiceError } from "../graphql/serviceError";

const execute = async ({ document, variables, select, mutation = false }) => {
    try {
        const response = mutation
            ? await apolloClient.mutate({ mutation: document, variables })
            : await apolloClient.query({
                query: document,
                variables,
                fetchPolicy: "network-only"
            });
        return select(response.data);
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getBacklogProjetos = (incluirArquivados = false) => execute({
    document: PROJETO_BACKLOG_PROJETOS_QUERY,
    variables: { incluirArquivados },
    select: (data) => data?.projetoBacklogProjetos || []
});

export const getBacklogResponsaveis = (projetoId) => execute({
    document: PROJETO_BACKLOG_RESPONSAVEIS_QUERY,
    variables: { projetoId },
    select: (data) => data?.projetoBacklogResponsaveis || []
});

export const getBacklogItens = (filtro) => execute({
    document: PROJETO_ITENS_QUERY,
    variables: { filtro },
    select: (data) => data?.projetoItens || {
        items: [],
        total: 0,
        pagina: filtro.pagina || 1,
        limite: filtro.limite || 100,
        totalPaginas: 0,
        backlogVersao: 0,
        permissoes: {}
    }
});

export const getBacklogItem = (id) => execute({
    document: PROJETO_ITEM_QUERY,
    variables: { id },
    select: (data) => data?.projetoItem || null
});

export const getBacklogItemHistorico = (id) => execute({
    document: PROJETO_ITEM_HISTORICO_QUERY,
    variables: { id },
    select: (data) => data?.projetoItemHistorico || []
});

export const createBacklogItem = (input) => execute({
    document: CREATE_PROJETO_ITEM_MUTATION,
    variables: { input },
    select: (data) => data.createProjetoItem,
    mutation: true
});

export const updateBacklogItem = (input) => execute({
    document: UPDATE_PROJETO_ITEM_MUTATION,
    variables: { input },
    select: (data) => data.updateProjetoItem,
    mutation: true
});

export const alterarStatusBacklogItem = (input) => execute({
    document: ALTERAR_STATUS_PROJETO_ITEM_MUTATION,
    variables: { input },
    select: (data) => data.alterarStatusProjetoItem,
    mutation: true
});

export const arquivarBacklogItem = (input) => execute({
    document: ARQUIVAR_PROJETO_ITEM_MUTATION,
    variables: { input },
    select: (data) => data.arquivarProjetoItem,
    mutation: true
});

export const reativarBacklogItem = (input) => execute({
    document: REATIVAR_PROJETO_ITEM_MUTATION,
    variables: { input },
    select: (data) => data.reativarProjetoItem,
    mutation: true
});

export const moverBacklogItem = (input) => execute({
    document: MOVER_PROJETO_ITEM_BACKLOG_MUTATION,
    variables: { input },
    select: (data) => data.moverProjetoItemBacklog,
    mutation: true
});
