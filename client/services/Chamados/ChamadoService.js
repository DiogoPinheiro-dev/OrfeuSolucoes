import { apolloClient } from "../../src/lib/apolloClient";
import {
    ALTERAR_PRIORIDADE_CHAMADO_MUTATION,
    ALTERAR_STATUS_CHAMADO_MUTATION,
    ACOMPANHANTES_ELEGIVEIS_CHAMADO_QUERY,
    ARQUIVAR_CHAMADO_MUTATION,
    ASSUMIR_CHAMADO_MUTATION,
    ATENDENTES_DISPONIVEIS_QUERY,
    ATUALIZAR_ACOMPANHANTES_CHAMADO_MUTATION,
    ATRIBUIR_CHAMADO_MUTATION,
    CATEGORIAS_CHAMADO_QUERY,
    CHAMADOS_ARQUIVADOS_QUERY,
    CHAMADO_QUERY,
    CREATE_CHAMADO_CATEGORIA_MUTATION,
    CREATE_CHAMADO_RESPONSAVEL_MUTATION,
    CRIAR_CHAMADO_MUTATION,
    DELETE_CHAMADO_CATEGORIA_MUTATION,
    DELETE_CHAMADO_RESPONSAVEL_MUTATION,
    ENCERRAR_CHAMADO_MUTATION,
    FILA_CHAMADOS_QUERY,
    LIBERAR_ATENDIMENTO_CHAMADO_MUTATION,
    MEUS_CHAMADOS_QUERY,
    OPCOES_ABERTURA_CHAMADO_QUERY,
    REABRIR_CHAMADO_MUTATION,
    RESPONSAVEIS_CHAMADO_OPTIONS_QUERY,
    RESPONSAVEIS_PARA_ABERTURA_CHAMADO_QUERY,
    RESPONSAVEIS_CHAMADO_QUERY,
    RESOLVER_CHAMADO_MUTATION,
    RESPONDER_CHAMADO_MUTATION,
    TRANSFERIR_CHAMADO_MUTATION,
    UPDATE_CHAMADO_CATEGORIA_MUTATION,
    UPDATE_CHAMADO_RESPONSAVEL_MUTATION
} from "../graphql/operations";

const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3001/graphql";
const apiBaseUrl = (import.meta.env.VITE_API_URL ?? graphqlUrl.replace(/\/graphql\/?$/, "")).replace(/\/$/, "");

const getAuthHeaders = () => {
    const token = localStorage.getItem("orfeu_token");

    return token ? { Authorization: `Bearer ${token}` } : {};
};

const extractRestErrorMessage = async (response) => {
    try {
        const payload = await response.json();
        const message = Array.isArray(payload?.message) ? payload.message.join(" ") : payload?.message;

        return message || payload?.error || "Erro inesperado ao comunicar com o servidor.";
    } catch {
        return response.statusText || "Erro inesperado ao comunicar com o servidor.";
    }
};

const extractErrorMessage = (error) => {
    const gqlError = error?.graphQLErrors?.[0]?.message;

    return gqlError || error?.message || "Erro inesperado ao comunicar com o servidor.";
};

const query = async ({ query, variables, select }) => {
    try {
        const response = await apolloClient.query({
            query,
            variables,
            fetchPolicy: "network-only"
        });

        return select(response?.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

const mutate = async ({ mutation, variables, select }) => {
    try {
        const response = await apolloClient.mutate({
            mutation,
            variables
        });

        return select(response?.data);
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
};

export const getMeusChamados = (filtro) =>
    query({
        query: MEUS_CHAMADOS_QUERY,
        variables: { filtro },
        select: (data) => data?.meusChamados ?? { items: [], total: 0, page: 1, pageSize: 20 }
    });

export const getFilaChamados = (filtro) =>
    query({
        query: FILA_CHAMADOS_QUERY,
        variables: { filtro },
        select: (data) => data?.filaChamados ?? { items: [], total: 0, page: 1, pageSize: 20 }
    });

export const getChamadosArquivados = (filtro) =>
    query({
        query: CHAMADOS_ARQUIVADOS_QUERY,
        variables: { filtro },
        select: (data) => data?.chamadosArquivados ?? { items: [], total: 0, page: 1, pageSize: 20 }
    });

export const getChamado = (id) =>
    query({
        query: CHAMADO_QUERY,
        variables: { id },
        select: (data) => data?.chamado
    });

export const getCategoriasChamado = (ativas = true) =>
    query({
        query: CATEGORIAS_CHAMADO_QUERY,
        variables: { ativas },
        select: (data) => data?.categoriasChamado ?? []
    });

export const getAtendentesDisponiveis = () =>
    query({
        query: ATENDENTES_DISPONIVEIS_QUERY,
        select: (data) => data?.atendentesDisponiveis ?? []
    });

export const getOpcoesAberturaChamado = () =>
    query({
        query: OPCOES_ABERTURA_CHAMADO_QUERY,
        select: (data) => data?.opcoesAberturaChamado ?? { usuarios: [], grupos: [], solucoes: [] }
    });

export const getResponsaveisParaAberturaChamado = ({ solucaoId, funcionalidadeId = null }) =>
    query({
        query: RESPONSAVEIS_PARA_ABERTURA_CHAMADO_QUERY,
        variables: {
            solucaoId: Number(solucaoId),
            funcionalidadeId: funcionalidadeId ? Number(funcionalidadeId) : null
        },
        select: (data) => data?.responsaveisParaAberturaChamado ?? []
    });

export const getAcompanhantesElegiveisChamado = (chamadoId = null) =>
    query({
        query: ACOMPANHANTES_ELEGIVEIS_CHAMADO_QUERY,
        variables: { chamadoId },
        select: (data) => data?.acompanhantesElegiveisChamado ?? []
    });
export const criarChamado = (input) =>
    mutate({
        mutation: CRIAR_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.criarChamado
    });

export const responderChamado = (input) =>
    mutate({
        mutation: RESPONDER_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.responderChamado
    });

export const atualizarAcompanhantesChamado = (input) =>
    mutate({
        mutation: ATUALIZAR_ACOMPANHANTES_CHAMADO_MUTATION,
        variables: { input: { chamadoId: input.chamadoId, usuarioIds: input.usuarioIds || [] } },
        select: (data) => data?.atualizarAcompanhantesChamado
    });

export const uploadChamadoAnexos = async (chamadoId, files, mensagemId = null) => {
    const selectedFiles = Array.from(files || []);

    if (!selectedFiles.length) {
        return [];
    }

    const formData = new FormData();

    selectedFiles.forEach((file) => formData.append("files", file));

    if (mensagemId) {
        formData.append("mensagemId", mensagemId);
    }

    const response = await fetch(`${apiBaseUrl}/chamados/${chamadoId}/anexos`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: formData
    });

    if (!response.ok) {
        throw new Error(await extractRestErrorMessage(response));
    }

    return response.json();
};

export const chamadoAnexoDownloadUrl = (downloadUrl) => {
    if (!downloadUrl) {
        return "#";
    }

    if (/^https?:\/\//i.test(downloadUrl)) {
        return downloadUrl;
    }

    const normalizedPath = downloadUrl.startsWith("/") ? downloadUrl : `/${downloadUrl}`;

    return `${apiBaseUrl}${normalizedPath}`;
};

const extractFilenameFromDisposition = (contentDisposition) => {
    if (!contentDisposition) {
        return null;
    }

    const encodedFilename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];

    if (encodedFilename) {
        try {
            return decodeURIComponent(encodedFilename);
        } catch {
            return encodedFilename;
        }
    }

    return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] || null;
};

export const abrirChamadoAnexo = async (downloadUrl, fallbackName = "anexo") => {
    const url = chamadoAnexoDownloadUrl(downloadUrl);

    if (!url || url === "#") {
        throw new Error("Link do anexo indisponivel.");
    }

    const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        throw new Error(await extractRestErrorMessage(response));
    }

    const blob = await response.blob();

    return {
        objectUrl: URL.createObjectURL(blob),
        nomeArquivo: extractFilenameFromDisposition(response.headers.get("content-disposition")) || fallbackName,
        mimeType: blob.type || response.headers.get("content-type") || "application/octet-stream"
    };
};

export const assumirChamado = (id) =>
    mutate({
        mutation: ASSUMIR_CHAMADO_MUTATION,
        variables: { id },
        select: (data) => data?.assumirChamado
    });


export const liberarAtendimentoChamado = (id) =>
    mutate({
        mutation: LIBERAR_ATENDIMENTO_CHAMADO_MUTATION,
        variables: { id },
        select: (data) => data?.liberarAtendimentoChamado
    });
export const atribuirChamado = (input) =>
    mutate({
        mutation: ATRIBUIR_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.atribuirChamado
    });

export const transferirChamado = (input) =>
    mutate({
        mutation: TRANSFERIR_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.transferirChamado
    });

export const alterarStatusChamado = (input) =>
    mutate({
        mutation: ALTERAR_STATUS_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.alterarStatusChamado
    });

export const alterarPrioridadeChamado = (input) =>
    mutate({
        mutation: ALTERAR_PRIORIDADE_CHAMADO_MUTATION,
        variables: { input },
        select: (data) => data?.alterarPrioridadeChamado
    });

export const resolverChamado = (id, observacao = null) =>
    mutate({
        mutation: RESOLVER_CHAMADO_MUTATION,
        variables: { id, observacao },
        select: (data) => data?.resolverChamado
    });

export const encerrarChamado = (id, observacao = null) =>
    mutate({
        mutation: ENCERRAR_CHAMADO_MUTATION,
        variables: { id, observacao },
        select: (data) => data?.encerrarChamado
    });

export const arquivarChamado = (id, observacao = null) =>
    mutate({
        mutation: ARQUIVAR_CHAMADO_MUTATION,
        variables: { id, observacao },
        select: (data) => data?.arquivarChamado
    });

export const reabrirChamado = (id, observacao = null) =>
    mutate({
        mutation: REABRIR_CHAMADO_MUTATION,
        variables: { id, observacao },
        select: (data) => data?.reabrirChamado
    });


export const getResponsaveisChamado = (ativas = false) =>
    query({
        query: RESPONSAVEIS_CHAMADO_QUERY,
        variables: { ativas },
        select: (data) => data?.responsaveisChamado ?? []
    });

export const getResponsaveisChamadoOptions = () =>
    query({
        query: RESPONSAVEIS_CHAMADO_OPTIONS_QUERY,
        select: (data) => data?.responsaveisChamadoOptions ?? { usuarios: [], grupos: [], solucoes: [] }
    });

const normalizeResponsavelInput = (input) => ({
    ...input,
    ...(input.id !== undefined ? { id: Number(input.id) } : {}),
    ...(input.grupoId !== undefined && input.grupoId !== null && input.grupoId !== "" ? { grupoId: Number(input.grupoId) } : {}),
    solucoes: (input.solucoes || []).map((solucao) => ({
        solucaoId: Number(solucao.solucaoId),
        responsavelGeral: !!solucao.responsavelGeral,
        funcionalidadeIds: (solucao.funcionalidadeIds || []).map((funcionalidadeId) => Number(funcionalidadeId))
    }))
});

export const createChamadoResponsavel = (input) =>
    mutate({
        mutation: CREATE_CHAMADO_RESPONSAVEL_MUTATION,
        variables: { input: normalizeResponsavelInput(input) },
        select: (data) => data?.createChamadoResponsavel
    });

export const updateChamadoResponsavel = (input) =>
    mutate({
        mutation: UPDATE_CHAMADO_RESPONSAVEL_MUTATION,
        variables: { input: normalizeResponsavelInput(input) },
        select: (data) => data?.updateChamadoResponsavel
    });

export const deleteChamadoResponsavel = (id) =>
    mutate({
        mutation: DELETE_CHAMADO_RESPONSAVEL_MUTATION,
        variables: { id: Number(id) },
        select: (data) => data?.deleteChamadoResponsavel
    });
export const createChamadoCategoria = (input) =>
    mutate({
        mutation: CREATE_CHAMADO_CATEGORIA_MUTATION,
        variables: { input },
        select: (data) => data?.createChamadoCategoria
    });

export const updateChamadoCategoria = (input) =>
    mutate({
        mutation: UPDATE_CHAMADO_CATEGORIA_MUTATION,
        variables: { input: { ...input, id: Number(input.id) } },
        select: (data) => data?.updateChamadoCategoria
    });

export const deleteChamadoCategoria = (id) =>
    mutate({
        mutation: DELETE_CHAMADO_CATEGORIA_MUTATION,
        variables: { id: Number(id) },
        select: (data) => data?.deleteChamadoCategoria
    });
