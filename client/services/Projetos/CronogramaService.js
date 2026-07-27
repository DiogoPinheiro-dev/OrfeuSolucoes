import { gql } from "@apollo/client";
import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";

const ITEM_REF = gql`
    fragment ProjetoCronogramaItemReferenciaFields on ProjetoCronogramaItemReferenciaType {
        id chave titulo status inicioPrevistoEm fimPrevistoEm arquivadoEm
    }
`;

const DEPENDENCY = gql`
    fragment ProjetoItemDependenciaFields on ProjetoItemDependenciaType {
        id projetoId versao arquivadoEm criadoEm atualizadoEm
        bloqueador { ...ProjetoCronogramaItemReferenciaFields }
        bloqueado { ...ProjetoCronogramaItemReferenciaFields }
    }
    ${ITEM_REF}
`;

const ELEMENT = gql`
    fragment ProjetoCronogramaElementoFields on ProjetoCronogramaElementoType {
        id tipo titulo chave status grupo inicioEm fimEm versao
        progressoPercentual semPeriodo bloqueado riscoAtraso arquivado itemIds
    }
`;

const PANEL = gql`
    query ProjetoCronograma($filtro: ProjetoCronogramaFiltroInput!) {
        projetoCronograma(filtro: $filtro) {
            inicioEm fimEm
            permissoes {
                podeVisualizar
                podeGerenciarDependencias
                podeEditarDatas
            }
            elementos { ...ProjetoCronogramaElementoFields }
            dependencias { ...ProjetoItemDependenciaFields }
            inconsistencias { codigo severidade mensagem elementoIds }
        }
    }
    ${ELEMENT}
    ${DEPENDENCY}
`;

const CREATE_DEPENDENCY = gql`
    mutation CreateProjetoItemDependencia($input: CreateProjetoItemDependenciaInput!) {
        createProjetoItemDependencia(input: $input) {
            ...ProjetoItemDependenciaFields
        }
    }
    ${DEPENDENCY}
`;

const ARCHIVE_DEPENDENCY = gql`
    mutation ArquivarProjetoItemDependencia($input: VersionarProjetoItemDependenciaInput!) {
        arquivarProjetoItemDependencia(input: $input) {
            ...ProjetoItemDependenciaFields
        }
    }
    ${DEPENDENCY}
`;

const REACTIVATE_DEPENDENCY = gql`
    mutation ReativarProjetoItemDependencia($input: VersionarProjetoItemDependenciaInput!) {
        reativarProjetoItemDependencia(input: $input) {
            ...ProjetoItemDependenciaFields
        }
    }
    ${DEPENDENCY}
`;

const UPDATE_DATES = gql`
    mutation UpdateProjetoCronogramaItemDatas($input: UpdateProjetoCronogramaItemDatasInput!) {
        updateProjetoCronogramaItemDatas(input: $input) {
            ...ProjetoCronogramaElementoFields
        }
    }
    ${ELEMENT}
`;

const query = async (document, variables, pick) => {
    try {
        const { data } = await apolloClient.query({
            query: document,
            variables,
            fetchPolicy: "network-only"
        });
        return pick(data);
    } catch (error) {
        throw toServiceError(error);
    }
};

const mutate = async (document, input, pick) => {
    try {
        const { data } = await apolloClient.mutate({
            mutation: document,
            variables: { input }
        });
        return pick(data);
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getCronograma = (filtro) =>
    query(PANEL, { filtro }, (data) => data.projetoCronograma);

export const createDependencia = (input) =>
    mutate(CREATE_DEPENDENCY, input, (data) => data.createProjetoItemDependencia);

export const archiveDependencia = (input, reactivate = false) =>
    mutate(
        reactivate ? REACTIVATE_DEPENDENCY : ARCHIVE_DEPENDENCY,
        input,
        (data) => reactivate
            ? data.reativarProjetoItemDependencia
            : data.arquivarProjetoItemDependencia
    );

export const updateCronogramaItemDatas = (input) =>
    mutate(UPDATE_DATES, input, (data) => data.updateProjetoCronogramaItemDatas);
