import { apolloClient } from "../../src/lib/apolloClient";
import {
    BUSCAR_DOCUMENTACAO_QUERY,
    DOCUMENTACAO_ARTIGO_QUERY,
    DOCUMENTACAO_INDICE_QUERY
} from "../graphql/operations";
import { toServiceError } from "../graphql/serviceError";

const query = async (document, variables, select) => {
    try {
        const response = await apolloClient.query({
            query: document,
            variables,
            fetchPolicy: "network-only"
        });
        return select(response.data);
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getDocumentacaoIndice = (filtro) => query(
    DOCUMENTACAO_INDICE_QUERY,
    { filtro: filtro || null },
    (data) => data?.documentacaoIndice || []
);

export const getDocumentacaoArtigo = (slug) => query(
    DOCUMENTACAO_ARTIGO_QUERY,
    { slug },
    (data) => data?.documentacaoArtigo || null
);

export const buscarDocumentacao = (termo, filtro) => query(
    BUSCAR_DOCUMENTACAO_QUERY,
    { termo, filtro: filtro || null },
    (data) => data?.buscarDocumentacao || []
);
