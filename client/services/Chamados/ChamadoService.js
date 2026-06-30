import { apolloClient } from "../../src/lib/apolloClient";
import {
    ALTERAR_PRIORIDADE_CHAMADO_MUTATION,
    ALTERAR_STATUS_CHAMADO_MUTATION,
    ASSUMIR_CHAMADO_MUTATION,
    ATENDENTES_DISPONIVEIS_QUERY,
    ATRIBUIR_CHAMADO_MUTATION,
    CATEGORIAS_CHAMADO_QUERY,
    CHAMADO_QUERY,
    CREATE_CHAMADO_CATEGORIA_MUTATION,
    CRIAR_CHAMADO_MUTATION,
    DELETE_CHAMADO_CATEGORIA_MUTATION,
    ENCERRAR_CHAMADO_MUTATION,
    FILA_CHAMADOS_QUERY,
    MEUS_CHAMADOS_QUERY,
    REABRIR_CHAMADO_MUTATION,
    RESOLVER_CHAMADO_MUTATION,
    RESPONDER_CHAMADO_MUTATION,
    UPDATE_CHAMADO_CATEGORIA_MUTATION
} from "../graphql/operations";

const extractErrorMessage = (error) => {
    const gqlError = error?.graphQLErrors?.[0]?.message;

    return gqlError || error?.message || "Erro inesperado ao comunicar com o servidor.";
};

const query = async ({ query, variables, select }) => {
    try {
        const response = await apolloClient.query({
            query,
            variables,
            fetchPolicy: "network-only"
        });

        return select(response?.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

const mutate = async ({ mutation, variables, select }) => {
    try {
        const response = await apolloClient.mutate({
            mutation,
            variables
        });

        return select(response?.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const getMeusChamados = (filtro) =>
    query({
        query: MEUS_CHAMADOS_QUERY,
        variables: { filtro },
        select: (data) => data?.meusChamados ?? { items: [], total: 0, page: 1, pageSize: 20 }
    });

export const getFilaChamados = (filtro) =>
    query({
        query: FILA_CHAMADOS_QUERY,
        variables: { filtro },
        select: (data) => data?.filaChamados ?? { items: [], total: 0, page: 1, pageSize: 20 }
    });

export const getChamado = (id) =>
    query({
        query: CHAMADO_QUERY,
        variables: { id },
        select: (data) => data?.chamado
    });

export const getCategoriasChamado = (ativas = true) =>
    query({
        query: CATEGORIAS_CHAMADO_QUERY,
        variables: { ativas },
        select: (data) => data?.categoriasChamado ?? []
    });

export const getAtendentesDisponiveis = () =>
    query({
        query: ATENDENTES_DISPONIVEIS_QUERY,
        select: (data) => data?.atendentesDisponiveis ?? []
    });

export const criarChamado = (input) =>
    mutate({
        mutation: CRIAR_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.criarChamado
    });

export const responderChamado = (input) =>
    mutate({
        mutation: RESPONDER_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.responderChamado
    });

export const assumirChamado = (id) =>
    mutate({
        mutation: ASSUMIR_CHAMADO_MUTATION,
        variables: { id },
        select: (data) => data?.assumirChamado
    });

export const atribuirChamado = (input) =>
    mutate({
        mutation: ATRIBUIR_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.atribuirChamado
    });

export const transferirChamado = (input) =>
    mutate({
        mutation: TRANSFERIR_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.transferirChamado
    });

export const alterarStatusChamado = (input) =>
    mutate({
        mutation: ALTERAR_STATUS_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.alterarStatusChamado
    });

export const alterarPrioridadeChamado = (input) =>
    mutate({
        mutation: ALTERAR_PRIORIDADE_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.alterarPrioridadeChamado
    });

export const resolverChamado = (id, observacao = null) =>
    mutate({
        mutation: RESOLVER_CHAMADO_MUTATION,
        variables: { id, observacao },
        select: (data) => data?.resolverChamado
    });

export const encerrarChamado = (id, observacao = null) =>
    mutate({
        mutation: ENCERRAR_CHAMADO_MUTATION,
        variables: { id, observacao },
        select: (data) => data?.encerrarChamado
    });

export const reabrirChamado = (id, observacao = null) =>
    mutate({
        mutation: REABRIR_CHAMADO_MUTATION,
        variables: { id, observacao },
        select: (data) => data?.reabrirChamado
    });

export const createChamadoCategoria = (input) =>
    mutate({
        mutation: CREATE_CHAMADO_CATEGORIA_MUTATION,
        variables: { input },
        select: (data) => data?.createChamadoCategoria
    });

export const updateChamadoCategoria = (input) =>
    mutate({
        mutation: UPDATE_CHAMADO_CATEGORIA_MUTATION,
        variables: { input: { ...input, id: Number(input.id) } },
        select: (data) => data?.updateChamadoCategoria
    });

export const deleteChamadoCategoria = (id) =>
    mutate({
        mutation: DELETE_CHAMADO_CATEGORIA_MUTATION,
        variables: { id: Number(id) },
        select: (data) => data?.deleteChamadoCategoria
    });
