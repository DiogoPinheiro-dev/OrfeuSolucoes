import { apolloClient } from "../../src/lib/apolloClient";
import { toServiceError } from "../graphql/serviceError";
import {
    ALTERAR_CATEGORIA_CHAMADO_MUTATION,
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
    CHAMADO_NOTIFICACOES_QUERY,
    CHAMADO_DASHBOARD_QUERY,
    CHAMADO_RELATORIO_QUERY,
    CHAMADO_QUERY,
    CREATE_CHAMADO_CATEGORIA_MUTATION,
    CREATE_CHAMADO_PRIORIDADE_MUTATION,
    CREATE_CHAMADO_TIPO_MUTATION,
    CREATE_CHAMADO_RESPONSAVEL_MUTATION,
    CREATE_CHAMADO_SLA_REGRA_MUTATION,
    GOOGLE_EMAIL_CONTAS_QUERY, GOOGLE_EMAIL_AUTH_URL_QUERY,
    CREATE_GOOGLE_EMAIL_CONTA_MUTATION, UPDATE_GOOGLE_EMAIL_CONTA_MUTATION, DELETE_GOOGLE_EMAIL_CONTA_MUTATION,
    CRIAR_CHAMADO_MUTATION,
    DELETE_CHAMADO_CATEGORIA_MUTATION,
    DELETE_CHAMADO_PRIORIDADE_MUTATION,
    DELETE_CHAMADO_TIPO_MUTATION,
    DELETE_CHAMADO_RESPONSAVEL_MUTATION,
    DELETE_CHAMADO_SLA_REGRA_MUTATION,
    ENCERRAR_CHAMADO_MUTATION,
    FILA_CHAMADOS_QUERY,
    LIBERAR_ATENDIMENTO_CHAMADO_MUTATION,
    MARCAR_CHAMADO_NOTIFICACAO_LIDA_MUTATION,
    MARCAR_TODAS_CHAMADO_NOTIFICACOES_LIDAS_MUTATION,
    MEUS_CHAMADOS_QUERY,
    OPCOES_ABERTURA_CHAMADO_QUERY,
    PRIORIDADES_CHAMADO_QUERY,
    REABRIR_CHAMADO_MUTATION,
    REGRAS_SLA_CHAMADO_QUERY,
    RESPONSAVEIS_CHAMADO_OPTIONS_QUERY,
    RESPONSAVEIS_FILTRO_CHAMADO_QUERY,
    RESPONSAVEIS_PARA_ABERTURA_CHAMADO_QUERY,
    RESPONSAVEIS_CHAMADO_QUERY,
    RESOLVER_CHAMADO_MUTATION,
    RESPONDER_CHAMADO_MUTATION,
    TIPOS_CHAMADO_QUERY,
    TRANSFERIR_CHAMADO_MUTATION,
    UPDATE_CHAMADO_CATEGORIA_MUTATION,
    UPDATE_CHAMADO_PRIORIDADE_MUTATION,
    UPDATE_CHAMADO_TIPO_MUTATION,
    UPDATE_CHAMADO_RESPONSAVEL_MUTATION,
    UPDATE_CHAMADO_SLA_REGRA_MUTATION
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

const query = async ({ query, variables, select }) => {
    try {
        const response = await apolloClient.query({
            query,
            variables,
            fetchPolicy: "network-only"
        });

        return select(response?.data);
    } catch (error) {
        throw toServiceError(error);
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
        throw toServiceError(error);
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

export const getTiposChamado = (ativas = true) =>
    query({
        query: TIPOS_CHAMADO_QUERY,
        variables: { ativas },
        select: (data) => data?.tiposChamado ?? []
    });

export const getPrioridadesChamado = (ativas = true) =>
    query({
        query: PRIORIDADES_CHAMADO_QUERY,
        variables: { ativas },
        select: (data) => data?.prioridadesChamado ?? []
    });

export const getRegrasSlaChamado = (ativas = true) =>
    query({
        query: REGRAS_SLA_CHAMADO_QUERY,
        variables: { ativas },
        select: (data) => data?.regrasSlaChamado ?? []
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

export const alterarCategoriaChamado = (input) => mutate({ mutation: ALTERAR_CATEGORIA_CHAMADO_MUTATION, variables: { input: { ...input, categoriaId: input.categoriaId == null ? null : Number(input.categoriaId) } }, select: (data) => data?.alterarCategoriaChamado });

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
export const getResponsaveisFiltroChamado = () =>
    query({
        query: RESPONSAVEIS_FILTRO_CHAMADO_QUERY,
        select: (data) => data?.responsaveisFiltroChamado ?? []
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
const normalizeChamadoConfiguracaoInput = (input) => ({
    ...input,
    ...(input.id !== undefined ? { id: Number(input.id) } : {}),
    ordem: Number(input.ordem || 0),
    descricao: input.descricao?.trim() || null,
    cor: input.cor?.trim() || null,
});

export const createChamadoTipo = (input) =>
    mutate({
        mutation: CREATE_CHAMADO_TIPO_MUTATION,
        variables: { input: normalizeChamadoConfiguracaoInput(input) },
        select: (data) => data?.createChamadoTipo
    });

export const updateChamadoTipo = (input) =>
    mutate({
        mutation: UPDATE_CHAMADO_TIPO_MUTATION,
        variables: { input: normalizeChamadoConfiguracaoInput({ ...input, id: Number(input.id) }) },
        select: (data) => data?.updateChamadoTipo
    });

export const deleteChamadoTipo = (id) =>
    mutate({
        mutation: DELETE_CHAMADO_TIPO_MUTATION,
        variables: { id: Number(id) },
        select: (data) => data?.deleteChamadoTipo
    });

export const createChamadoPrioridade = (input) =>
    mutate({
        mutation: CREATE_CHAMADO_PRIORIDADE_MUTATION,
        variables: { input: normalizeChamadoConfiguracaoInput(input) },
        select: (data) => data?.createChamadoPrioridade
    });

export const updateChamadoPrioridade = (input) =>
    mutate({
        mutation: UPDATE_CHAMADO_PRIORIDADE_MUTATION,
        variables: { input: normalizeChamadoConfiguracaoInput({ ...input, id: Number(input.id) }) },
        select: (data) => data?.updateChamadoPrioridade
    });

export const deleteChamadoPrioridade = (id) =>
    mutate({
        mutation: DELETE_CHAMADO_PRIORIDADE_MUTATION,
        variables: { id: Number(id) },
        select: (data) => data?.deleteChamadoPrioridade
    });
const normalizeChamadoSlaRegraInput = (input) => ({
    ...input,
    ...(input.id !== undefined ? { id: Number(input.id) } : {}),
    prioridadeId: Number(input.prioridadeId),
    primeiraRespostaPrazoMinutos: Number(input.primeiraRespostaPrazoMinutos),
    resolucaoPrazoMinutos: Number(input.resolucaoPrazoMinutos)
});

export const createChamadoSlaRegra = (input) =>
    mutate({
        mutation: CREATE_CHAMADO_SLA_REGRA_MUTATION,
        variables: { input: normalizeChamadoSlaRegraInput(input) },
        select: (data) => data?.createChamadoSlaRegra
    });

export const updateChamadoSlaRegra = (input) =>
    mutate({
        mutation: UPDATE_CHAMADO_SLA_REGRA_MUTATION,
        variables: { input: normalizeChamadoSlaRegraInput(input) },
        select: (data) => data?.updateChamadoSlaRegra
    });

export const deleteChamadoSlaRegra = (id) =>
    mutate({
        mutation: DELETE_CHAMADO_SLA_REGRA_MUTATION,
        variables: { id: Number(id) },
        select: (data) => data?.deleteChamadoSlaRegra
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

export const getChamadoNotificacoes = (limite = 30) =>
    apolloClient.query({
        query: CHAMADO_NOTIFICACOES_QUERY,
        variables: { limite },
        fetchPolicy: "network-only"
    }).then(({ data }) => ({
        items: data.notificacoesChamado || [],
        naoLidas: data.notificacoesChamadoNaoLidas || 0
    }));

export const marcarChamadoNotificacaoComoLida = (id) =>
    apolloClient.mutate({
        mutation: MARCAR_CHAMADO_NOTIFICACAO_LIDA_MUTATION,
        variables: { id }
    }).then(({ data }) => data.marcarChamadoNotificacaoComoLida);

export const marcarTodasChamadoNotificacoesComoLidas = () =>
    apolloClient.mutate({
        mutation: MARCAR_TODAS_CHAMADO_NOTIFICACOES_LIDAS_MUTATION
    }).then(({ data }) => data.marcarTodasChamadoNotificacoesComoLidas);
export const getGoogleEmailContas = () => query({ query: GOOGLE_EMAIL_CONTAS_QUERY, select: (data) => data?.googleEmailContasChamado || [] });
export const getGoogleEmailAuthUrl = (id) => query({ query: GOOGLE_EMAIL_AUTH_URL_QUERY, variables: { id: Number(id) }, select: (data) => data?.googleEmailAuthUrl });
export const createGoogleEmailConta = (input) => mutate({ mutation: CREATE_GOOGLE_EMAIL_CONTA_MUTATION, variables: { input }, select: (data) => data?.createGoogleEmailConta });
export const updateGoogleEmailConta = (input) => mutate({ mutation: UPDATE_GOOGLE_EMAIL_CONTA_MUTATION, variables: { input: { ...input, id: Number(input.id) } }, select: (data) => data?.updateGoogleEmailConta });
export const deleteGoogleEmailConta = (id) => mutate({ mutation: DELETE_GOOGLE_EMAIL_CONTA_MUTATION, variables: { id: Number(id) }, select: (data) => data?.deleteGoogleEmailConta });
export const getChamadoDashboard = () => query({ query: CHAMADO_DASHBOARD_QUERY, select: (data) => data?.dashboardChamados });

export const getChamadoRelatorio = (filtro) => query({ query: CHAMADO_RELATORIO_QUERY, variables: { filtro }, select: (data) => data?.relatorioChamados });
export const downloadChamadoRelatorio = async (filtro, formato) => {
    const params = new URLSearchParams({ formato });
    Object.entries(filtro || {}).forEach(([key, value]) => { if (value !== "" && value != null && key !== "page" && key !== "pageSize") params.set(key, value); });
    const response = await fetch(`${apiBaseUrl}/chamados/relatorios/exportar?${params}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error(await extractRestErrorMessage(response));
    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") || "";
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `relatorio-chamados.${formato}`;
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
};