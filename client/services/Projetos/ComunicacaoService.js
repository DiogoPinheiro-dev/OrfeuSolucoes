import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";
import {
    CREATE_PROJETO_ATUALIZACAO_MUTATION,
    CREATE_PROJETO_COMENTARIO_MUTATION,
    EXCLUIR_PROJETO_COMENTARIO_MUTATION,
    PROJETO_COMUNICACAO_PROJETOS_QUERY,
    PROJETO_COMUNICACAO_QUERY,
    UPDATE_PROJETO_ATUALIZACAO_MUTATION,
    UPDATE_PROJETO_COMENTARIO_MUTATION
} from "../graphql/operations";

const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3001/graphql";
const apiBaseUrl = (import.meta.env.VITE_API_URL ?? graphqlUrl.replace(/\/graphql\/?$/, "")).replace(/\/$/, "");
const authHeaders = () => {
    const token = localStorage.getItem("orfeu_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};
const restError = async (response) => {
    try {
        const payload = await response.json();
        return Array.isArray(payload?.message) ? payload.message.join(" ") : payload?.message || "Não foi possível concluir a operação.";
    } catch { return "Não foi possível concluir a operação."; }
};
const execute = async ({ document, variables, select, mutation = false }) => {
    try {
        const response = mutation
            ? await apolloClient.mutate({ mutation: document, variables })
            : await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
        return select(response.data);
    } catch (error) { throw toServiceError(error); }
};

export const getComunicacaoProjetos = () => execute({ document: PROJETO_COMUNICACAO_PROJETOS_QUERY, select: (data) => data.projetoComunicacaoProjetos || [] });
export const getProjetoComunicacao = (projetoId, feed = {}) => execute({ document: PROJETO_COMUNICACAO_QUERY, variables: { projetoId, feed }, select: (data) => data.projetoComunicacao });
export const createProjetoAtualizacao = (input) => execute({ document: CREATE_PROJETO_ATUALIZACAO_MUTATION, variables: { input }, select: (data) => data.createProjetoAtualizacao, mutation: true });
export const updateProjetoAtualizacao = (input) => execute({ document: UPDATE_PROJETO_ATUALIZACAO_MUTATION, variables: { input }, select: (data) => data.updateProjetoAtualizacao, mutation: true });
export const createProjetoComentario = (input) => execute({ document: CREATE_PROJETO_COMENTARIO_MUTATION, variables: { input }, select: (data) => data.createProjetoComentario, mutation: true });
export const updateProjetoComentario = (input) => execute({ document: UPDATE_PROJETO_COMENTARIO_MUTATION, variables: { input }, select: (data) => data.updateProjetoComentario, mutation: true });
export const excluirProjetoComentario = (input) => execute({ document: EXCLUIR_PROJETO_COMENTARIO_MUTATION, variables: { input }, select: (data) => data.excluirProjetoComentario, mutation: true });

export const uploadProjetoAnexos = async (projetoId, files, target = {}) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    if (target.atualizacaoId) form.append("atualizacaoId", target.atualizacaoId);
    if (target.comentarioId) form.append("comentarioId", target.comentarioId);
    const response = await fetch(`${apiBaseUrl}/projetos/${projetoId}/anexos`, { method: "POST", headers: authHeaders(), body: form });
    if (!response.ok) throw new Error(await restError(response));
    return response.json();
};
export const abrirProjetoAnexo = async (downloadUrl, nomeOriginal) => {
    const response = await fetch(`${apiBaseUrl}${downloadUrl}`, { headers: authHeaders() });
    if (!response.ok) throw new Error(await restError(response));
    const blob = await response.blob();
    return { objectUrl: URL.createObjectURL(blob), nomeArquivo: nomeOriginal };
};
export const excluirProjetoAnexo = async (projetoId, anexoId) => {
    const response = await fetch(`${apiBaseUrl}/projetos/${projetoId}/anexos/${anexoId}`, { method: "DELETE", headers: authHeaders() });
    if (!response.ok) throw new Error(await restError(response));
    return response.json();
};