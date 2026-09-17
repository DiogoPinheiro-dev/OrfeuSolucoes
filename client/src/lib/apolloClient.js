import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL ?? "/graphql";

const httpLink = createHttpLink({
    uri: graphqlUrl,
    credentials: "include"
});

export const apolloCacheTypePolicies = {
    ChamadoType: {
        fields: {
            historico: {
                merge(existing = [], incoming = []) {
                    return incoming.length === 0 && existing.length > 0 ? existing : incoming;
                }
            }
        }
    },
    // A navegação do Hub e o catálogo administrativo devolvem recortes diferentes das mesmas entidades
    // (funcionalidades, agrupamentos e ações). A lista mais recente substitui a anterior; os itens continuam normalizados pelo id.
    SolucaoType: {
        fields: {
            funcionalidades: { merge: false },
            agrupamentos: { merge: false }
        }
    },
    FuncionalidadeType: {
        fields: {
            acoes: { merge: false }
        }
    }
};

export const apolloClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache({ typePolicies: apolloCacheTypePolicies })
});
