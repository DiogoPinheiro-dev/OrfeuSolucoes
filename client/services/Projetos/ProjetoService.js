import { apolloClient } from "../../src/lib/apolloClient";
import {
    ARQUIVAR_PROJETO_MUTATION,
    ATUALIZAR_CICLO_PROJETO_MUTATION,
    CREATE_PROJETO_MUTATION,
    PROJETOS_QUERY,
    PROJETO_PARTICIPANTES_DISPONIVEIS_QUERY,
    PROJETO_QUERY,
    REATIVAR_PROJETO_MUTATION,
    SUGERIR_CHAVE_PROJETO_QUERY,
    UPDATE_PROJETO_EQUIPE_MUTATION,
    UPDATE_PROJETO_MUTATION
} from "../graphql/operations";

const extractErrorMessage = (error) => {
    const message = error?.graphQLErrors?.[0]?.message || error?.networkError?.result?.errors?.[0]?.message || error?.message;
    if (message === "Bad Request Exception") {
        const validation = error?.graphQLErrors?.[0]?.extensions?.originalError?.message;
        if (Array.isArray(validation)) return validation.join(" ");
    }
    return message || "Erro inesperado ao comunicar com o servidor.";
};

const execute = async ({ document, variables, select, mutation = false }) => {
    try {
        const response = mutation
            ? await apolloClient.mutate({ mutation: document, variables })
            : await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
        return select(response.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const getProjetos = (filtro = {}) => execute({
    document: PROJETOS_QUERY,
    variables: { filtro },
    select: (data) => data?.projetos || { items: [], total: 0, pagina: filtro.pagina || 1, limite: filtro.limite || 20, totalPaginas: 0 }
});
export const getProjeto = (id) => execute({ document: PROJETO_QUERY, variables: { id }, select: (data) => data?.projeto || null });
export const sugerirChaveProjeto = (nome) => execute({ document: SUGERIR_CHAVE_PROJETO_QUERY, variables: { nome }, select: (data) => data?.sugerirChaveProjeto || "" });
export const getProjetoParticipantesDisponiveis = () => execute({ document: PROJETO_PARTICIPANTES_DISPONIVEIS_QUERY, select: (data) => data?.projetoParticipantesDisponiveis || [] });
export const createProjeto = (input) => execute({ document: CREATE_PROJETO_MUTATION, variables: { input }, select: (data) => data.createProjeto, mutation: true });
export const updateProjeto = (input) => execute({ document: UPDATE_PROJETO_MUTATION, variables: { input }, select: (data) => data.updateProjeto, mutation: true });
export const updateProjetoEquipe = (input) => execute({ document: UPDATE_PROJETO_EQUIPE_MUTATION, variables: { input }, select: (data) => data.updateProjetoEquipe, mutation: true });
export const atualizarCicloProjeto = (input) => execute({ document: ATUALIZAR_CICLO_PROJETO_MUTATION, variables: { input }, select: (data) => data.atualizarSituacaoProjeto, mutation: true });
export const arquivarProjeto = (id) => execute({ document: ARQUIVAR_PROJETO_MUTATION, variables: { id }, select: (data) => data.arquivarProjeto, mutation: true });
export const reativarProjeto = (id) => execute({ document: REATIVAR_PROJETO_MUTATION, variables: { id }, select: (data) => data.reativarProjeto, mutation: true });