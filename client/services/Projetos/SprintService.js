import { gql } from "@apollo/client";
import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";

const SPRINT_ITEM_FIELDS = gql`
    fragment ProjetoSprintItemFields on ProjetoSprintItemType {
        vinculoId
        itemId
        chave
        titulo
        tipo
        status
        prioridade
        estimativaMinutos
        escopoInicial
        adicionadoAposInicio
        retiradoAposInicio
        incluidoEm
        retiradoEm
        statusAoIniciar
        estimativaAoIniciar
        statusAoEncerrar
        estimativaAoEncerrar
        concluidoNoSprint
    }
`;

const SPRINT_FIELDS = gql`
    fragment ProjetoSprintFields on ProjetoSprintType {
        id
        projetoId
        nome
        objetivo
        status
        inicioPrevistoEm
        fimPrevistoEm
        inicioRealEm
        fimRealEm
        resultado
        versao
        escopoInicialItens
        escopoInicialEstimativa
        itensConcluidos
        estimativaConcluida
        itensAdicionadosAposInicio
        itensRetiradosAposInicio
        totalItens
        totalConcluidos
        progressoPercentual
        itens { ...ProjetoSprintItemFields }
        criadoEm
        atualizadoEm
    }
    ${SPRINT_ITEM_FIELDS}
`;

const PAINEL_QUERY = gql`
    query ProjetoSprints($projetoId: String!) {
        projetoSprints(projetoId: $projetoId) {
            planejadas { ...ProjetoSprintFields }
            ativa { ...ProjetoSprintFields }
            historico { ...ProjetoSprintFields }
            candidatos {
                id
                chave
                titulo
                tipo
                status
                prioridade
                estimativaMinutos
            }
            permissoes {
                podeVisualizar
                podeCriar
                podeEditar
                podePlanejar
                podeIniciar
                podeConcluir
                podeCancelar
            }
        }
    }
    ${SPRINT_FIELDS}
`;

const CREATE_MUTATION = gql`
    mutation CreateProjetoSprint($input: CreateProjetoSprintInput!) {
        createProjetoSprint(input: $input) { ...ProjetoSprintFields }
    }
    ${SPRINT_FIELDS}
`;
const UPDATE_MUTATION = gql`
    mutation UpdateProjetoSprint($input: UpdateProjetoSprintInput!) {
        updateProjetoSprint(input: $input) { ...ProjetoSprintFields }
    }
    ${SPRINT_FIELDS}
`;
const ADD_ITEM_MUTATION = gql`
    mutation AdicionarItemProjetoSprint($input: AlterarEscopoProjetoSprintInput!) {
        adicionarItemProjetoSprint(input: $input) { ...ProjetoSprintFields }
    }
    ${SPRINT_FIELDS}
`;
const REMOVE_ITEM_MUTATION = gql`
    mutation RemoverItemProjetoSprint($input: AlterarEscopoProjetoSprintInput!) {
        removerItemProjetoSprint(input: $input) { ...ProjetoSprintFields }
    }
    ${SPRINT_FIELDS}
`;
const START_MUTATION = gql`
    mutation IniciarProjetoSprint($input: TransicionarProjetoSprintInput!) {
        iniciarProjetoSprint(input: $input) { ...ProjetoSprintFields }
    }
    ${SPRINT_FIELDS}
`;
const COMPLETE_MUTATION = gql`
    mutation ConcluirProjetoSprint($input: ConcluirProjetoSprintInput!) {
        concluirProjetoSprint(input: $input) { ...ProjetoSprintFields }
    }
    ${SPRINT_FIELDS}
`;
const CANCEL_MUTATION = gql`
    mutation CancelarProjetoSprint($input: TransicionarProjetoSprintInput!) {
        cancelarProjetoSprint(input: $input) { ...ProjetoSprintFields }
    }
    ${SPRINT_FIELDS}
`;

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

const mutate = async (document, input, select) => {
    try {
        const response = await apolloClient.mutate({
            mutation: document,
            variables: { input }
        });
        return select(response.data);
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getSprintPainel = (projetoId) =>
    query(PAINEL_QUERY, { projetoId }, (data) => data.projetoSprints);
export const createSprint = (input) =>
    mutate(CREATE_MUTATION, input, (data) => data.createProjetoSprint);
export const updateSprint = (input) =>
    mutate(UPDATE_MUTATION, input, (data) => data.updateProjetoSprint);
export const addSprintItem = (input) =>
    mutate(ADD_ITEM_MUTATION, input, (data) => data.adicionarItemProjetoSprint);
export const removeSprintItem = (input) =>
    mutate(REMOVE_ITEM_MUTATION, input, (data) => data.removerItemProjetoSprint);
export const startSprint = (input) =>
    mutate(START_MUTATION, input, (data) => data.iniciarProjetoSprint);
export const completeSprint = (input) =>
    mutate(COMPLETE_MUTATION, input, (data) => data.concluirProjetoSprint);
export const cancelSprint = (input) =>
    mutate(CANCEL_MUTATION, input, (data) => data.cancelarProjetoSprint);
