import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3001/graphql";

const httpLink = createHttpLink({
    uri: graphqlUrl,
    credentials: "include"
});

const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem("orfeu_token");

    return {
        headers: {
            ...headers,
            ...(token ? { authorization: `Bearer ${token}` } : {})
        }
    };
});

export const apolloClient = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
});