import { apolloClient } from "../../src/lib/apolloClient";
import { CREATE_SERVICO_MUTATION } from "../graphql/operations";
import { toServiceError } from "../graphql/serviceError";

export const createService = async (serviceData) => {
    try {
        const response = await apolloClient.mutate({
            mutation: CREATE_SERVICO_MUTATION,
            variables: {
                input: {
                    titulo: serviceData?.titulo,
                    descricao: serviceData?.descricao,
                    valor: serviceData?.valor,
                    desconto: serviceData?.desconto,
                    vendas: serviceData?.vendas
                }
            }
        });

        return response?.data?.createServico;
    } catch (error) {
        throw toServiceError(error);
    }
};
