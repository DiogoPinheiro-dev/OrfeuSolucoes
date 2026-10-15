import { apolloClient } from "../../src/lib/apolloClient";
import { notifyHubNavigationChanged } from "../../src/auth/hubNavigationEvents";
import { toServiceError } from "../graphql/serviceError";
import {
    CREATE_GRUPO_USUARIO_MUTATION,
    DELETE_GRUPO_USUARIO_MUTATION,
    GRUPOS_USUARIOS_QUERY,
    UPDATE_GRUPO_USUARIO_MUTATION
} from "../graphql/operations";


export const getGruposUsuarios = async () => {
    try {
        const response = await apolloClient.query({
            query: GRUPOS_USUARIOS_QUERY,
            fetchPolicy: "network-only"
        });

        return response?.data?.gruposUsuarios ?? [];
    } catch (error) {
        throw toServiceError(error);
    }
};

export const createGrupoUsuario = async (input) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CREATE_GRUPO_USUARIO_MUTATION,
            variables: { input }
        });

        const grupo = response?.data?.createGrupoUsuario;
        notifyHubNavigationChanged();
        return grupo;
    } catch (error) {
        throw toServiceError(error);
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

        const grupo = response?.data?.updateGrupoUsuario;
        notifyHubNavigationChanged();
        return grupo;
    } catch (error) {
        throw toServiceError(error);
    }
};

export const deleteGrupoUsuario = async (id) => {
    try {
        const response = await apolloClient.mutate({
            mutation: DELETE_GRUPO_USUARIO_MUTATION,
            variables: { id: Number(id) }
        });

        const deleted = response?.data?.deleteGrupoUsuario;
        notifyHubNavigationChanged();
        return deleted;
    } catch (error) {
        throw toServiceError(error);
    }
};
