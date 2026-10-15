import { apolloClient } from "../../src/lib/apolloClient";
import { notifyHubNavigationChanged } from "../../src/auth/hubNavigationEvents";
import { toServiceError } from "../graphql/serviceError";
import {
    CREATE_EMPRESA_MUTATION,
    DELETE_EMPRESA_MUTATION,
    EMPRESAS_QUERY,
    UPDATE_EMPRESA_MUTATION
} from "../graphql/operations";


export const getEmpresas = async () => {
    try {
        const response = await apolloClient.query({
            query: EMPRESAS_QUERY,
            fetchPolicy: "network-only"
        });

        return response?.data?.empresas ?? [];
    } catch (error) {
        throw toServiceError(error);
    }
};

export const createEmpresa = async ({
    nome,
    acessoProjetos,
    acessoHoras,
    solucaoIds,
    funcionalidadeIds
}) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CREATE_EMPRESA_MUTATION,
            variables: {
                input: {
                    nome,
                    acessoProjetos,
                    acessoHoras,
                    solucaoIds,
                    funcionalidadeIds
                }
            }
        });

        const empresa = response?.data?.createEmpresa;
        notifyHubNavigationChanged();
        return empresa;
    } catch (error) {
        throw toServiceError(error);
    }
};

export const updateEmpresa = async ({ id, nome, acessoProjetos, acessoHoras, solucaoIds, funcionalidadeIds }) => {
    try {
        const response = await apolloClient.mutate({
            mutation: UPDATE_EMPRESA_MUTATION,
            variables: {
                input: {
                    id: Number(id),
                    nome,
                    acessoProjetos,
                    acessoHoras,
                    solucaoIds,
                    funcionalidadeIds
                }
            }
        });

        const empresa = response?.data?.updateEmpresa;
        notifyHubNavigationChanged();
        return empresa;
    } catch (error) {
        throw toServiceError(error);
    }
};

export const deleteEmpresa = async (id) => {
    try {
        const response = await apolloClient.mutate({
            mutation: DELETE_EMPRESA_MUTATION,
            variables: { id: Number(id) }
        });

        const deleted = response?.data?.deleteEmpresa;
        notifyHubNavigationChanged();
        return deleted;
    } catch (error) {
        throw toServiceError(error);
    }
};
