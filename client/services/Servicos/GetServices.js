import { apolloClient } from "../../src/lib/apolloClient";
import { GET_SERVICOS_QUERY } from "../graphql/operations";

export const getAllServices = async () => {
    try {
        const response = await apolloClient.query({
            query: GET_SERVICOS_QUERY,
            fetchPolicy: "no-cache"
        });

        return response?.data?.servicos ?? [];
    } catch (error) {
        console.error("Error fetching services:", error);
        throw error;
    }
};