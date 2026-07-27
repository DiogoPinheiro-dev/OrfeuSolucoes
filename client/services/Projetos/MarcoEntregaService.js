import { gql } from "@apollo/client";
import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";

const ITEM = gql`
    fragment ProjetoCompromissoItemFields on ProjetoCompromissoItemType {
        id chave titulo status estimativaMinutos
    }
`;
const MARCO = gql`
    fragment ProjetoMarcoFields on ProjetoMarcoType {
        id projetoId nome descricao status dataPrevistaEm dataRealizadaEm versao
        atrasado progressoPercentual itensSemEstimativa arquivadoEm criadoEm atualizadoEm
        responsavel { id nome login email }
        itens { ...ProjetoCompromissoItemFields }
    }
    ${ITEM}
`;
const ENTREGA = gql`
    fragment ProjetoEntregaFields on ProjetoEntregaType {
        id projetoId nome resultadoEsperado criteriosAceite status
        inicioPrevistoEm fimPrevistoEm concluidaEm marcoId marcoNome versao
        atrasada progressoPercentual itensSemEstimativa arquivadoEm criadoEm atualizadoEm
        responsavel { id nome login email }
        itens { ...ProjetoCompromissoItemFields }
    }
    ${ITEM}
`;
const PANEL = gql`
    query ProjetoMarcosEntregas($projetoId: String!, $incluirArquivados: Boolean) {
        projetoMarcosEntregas(projetoId: $projetoId, incluirArquivados: $incluirArquivados) {
            marcos { ...ProjetoMarcoFields }
            entregas { ...ProjetoEntregaFields }
            itensDisponiveis { ...ProjetoCompromissoItemFields }
            responsaveis { id nome login email }
            permissoes { podeVisualizar podeCriar podeEditar podeArquivar podeReativar }
        }
    }
    ${MARCO}
    ${ENTREGA}
`;
const CREATE_MARCO = gql`mutation CreateProjetoMarco($input: CreateProjetoMarcoInput!) { createProjetoMarco(input: $input) { ...ProjetoMarcoFields } } ${MARCO}`;
const UPDATE_MARCO = gql`mutation UpdateProjetoMarco($input: UpdateProjetoMarcoInput!) { updateProjetoMarco(input: $input) { ...ProjetoMarcoFields } } ${MARCO}`;
const CREATE_ENTREGA = gql`mutation CreateProjetoEntrega($input: CreateProjetoEntregaInput!) { createProjetoEntrega(input: $input) { ...ProjetoEntregaFields } } ${ENTREGA}`;
const UPDATE_ENTREGA = gql`mutation UpdateProjetoEntrega($input: UpdateProjetoEntregaInput!) { updateProjetoEntrega(input: $input) { ...ProjetoEntregaFields } } ${ENTREGA}`;
const ARCHIVE_MARCO = gql`mutation ArquivarProjetoMarco($input: VersionarProjetoCompromissoInput!) { arquivarProjetoMarco(input: $input) { id } }`;
const REACTIVATE_MARCO = gql`mutation ReativarProjetoMarco($input: VersionarProjetoCompromissoInput!) { reativarProjetoMarco(input: $input) { id } }`;
const ARCHIVE_ENTREGA = gql`mutation ArquivarProjetoEntrega($input: VersionarProjetoCompromissoInput!) { arquivarProjetoEntrega(input: $input) { id } }`;
const REACTIVATE_ENTREGA = gql`mutation ReativarProjetoEntrega($input: VersionarProjetoCompromissoInput!) { reativarProjetoEntrega(input: $input) { id } }`;

const query = async (document, variables, pick) => {
    try {
        const { data } = await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
        return pick(data);
    } catch (error) {
        throw toServiceError(error);
    }
};
const mutate = async (document, input, pick) => {
    try {
        const { data } = await apolloClient.mutate({ mutation: document, variables: { input } });
        return pick(data);
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getMarcoEntregaPainel = (projetoId, incluirArquivados = false) =>
    query(PANEL, { projetoId, incluirArquivados }, (data) => data.projetoMarcosEntregas);
export const createMarco = (input) => mutate(CREATE_MARCO, input, (data) => data.createProjetoMarco);
export const updateMarco = (input) => mutate(UPDATE_MARCO, input, (data) => data.updateProjetoMarco);
export const createEntrega = (input) => mutate(CREATE_ENTREGA, input, (data) => data.createProjetoEntrega);
export const updateEntrega = (input) => mutate(UPDATE_ENTREGA, input, (data) => data.updateProjetoEntrega);
export const archiveMarco = (input, reactivate = false) => mutate(reactivate ? REACTIVATE_MARCO : ARCHIVE_MARCO, input, (data) => reactivate ? data.reativarProjetoMarco : data.arquivarProjetoMarco);
export const archiveEntrega = (input, reactivate = false) => mutate(reactivate ? REACTIVATE_ENTREGA : ARCHIVE_ENTREGA, input, (data) => reactivate ? data.reativarProjetoEntrega : data.arquivarProjetoEntrega);
