import { apolloClient } from "../../src/lib/apolloClient";
import {
    CREATE_GRUPO_USUARIO_MUTATION,
    DELETE_GRUPO_USUARIO_MUTATION,
    GRUPOS_USUARIOS_QUERY,
    UPDATE_GRUPO_USUARIO_MUTATION
} from "../graphql/operations";

const extractErrorMessage = (error) => {
    const gqlError = error?.graphQLErrors?.[0]?.message;

    return gqlError || error?.message || "Erro inesperado ao comunicar com o servidor.";
};

export const getGruposUsuarios = async () => {
    try {
        const response = await apolloClient.query({
            query: GRUPOS_USUARIOS_QUERY,
            fetchPolicy: "network-only"
        });

        return response?.data?.gruposUsuarios ?? [];
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const createGrupoUsuario = async (input) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CREATE_GRUPO_USUARIO_MUTATION,
            variables: { input }
        });

        return response?.data?.createGrupoUsuario;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const updateGrupoUsuario = async (input) => {
    try {
        const response = await apolloClient.mutate({
            mutation: UPDATE_GRUPO_USUARIO_MUTATION,
            variables: {
                input: {
                    ...input,
                    id: Number(input.id)
                }
            }
        });

        return response?.data?.updateGrupoUsuario;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const deleteGrupoUsuario = async (id) => {
    try {
        const response = await apolloClient.mutate({
            mutation: DELETE_GRUPO_USUARIO_MUTATION,
            variables: { id: Number(id) }
        });

        return response?.data?.deleteGrupoUsuario;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};
