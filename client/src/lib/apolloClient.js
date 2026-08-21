import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3001/graphql";

const httpLink = createHttpLink({
    uri: graphqlUrl,
    credentials: "include"
});

export const apolloClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache({
        typePolicies: {
            ChamadoType: {
                fields: {
                    historico: {
                        merge(existing = [], incoming = []) {
                            return incoming.length === 0 && existing.length > 0 ? existing : incoming;
                        }
                    }
                }
            }
        }
    })
});
