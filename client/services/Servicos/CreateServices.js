import { apolloClient } from "../../src/lib/apolloClient";
import { CREATE_SERVICO_MUTATION } from "../graphql/operations";

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
        console.error("Error creating service:", error);
        throw error;
    }
};