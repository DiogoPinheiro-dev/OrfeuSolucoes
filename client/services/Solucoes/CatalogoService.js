import { apolloClient } from "../../src/lib/apolloClient";
import { notifyHubNavigationChanged } from "../../src/auth/hubNavigationEvents";
import { toServiceError } from "../graphql/serviceError";
import {
    CATALOGO_PROVIDERS_QUERY,
    CATALOGO_RASCUNHO_ACAO_QUERY,
    CATALOGO_RASCUNHO_FUNCIONALIDADE_QUERY,
    CRIAR_RASCUNHO_ACAO_MUTATION,
    CRIAR_RASCUNHO_FUNCIONALIDADE_MUTATION,
    CRIAR_RASCUNHO_SOLUCAO_MUTATION,
    PUBLICAR_RASCUNHO_ACAO_MUTATION,
    PUBLICAR_RASCUNHO_FUNCIONALIDADE_MUTATION,
    PUBLICAR_RASCUNHO_SOLUCAO_MUTATION,
    SALVAR_RASCUNHO_ACAO_MUTATION,
    SALVAR_RASCUNHO_FUNCIONALIDADE_MUTATION,
    SALVAR_RASCUNHO_SOLUCAO_MUTATION,
    VALIDAR_RASCUNHO_ACAO_QUERY,
    VALIDAR_RASCUNHO_FUNCIONALIDADE_QUERY
} from "../graphql/operations";

const mutateCatalog = async (mutation, variables, responseKey, notifyHub = false) => {
    try {
        const response = await apolloClient.mutate({ mutation, variables });
        if (notifyHub) notifyHubNavigationChanged();
        return response?.data?.[responseKey] ?? null;
    } catch (error) {
        throw toServiceError(error);
    }
};

const queryCatalog = async (query, variables, responseKey, fallback = []) => {
    try {
        const response = await apolloClient.query({ query, variables, fetchPolicy: "network-only" });
        return response?.data?.[responseKey] ?? fallback;
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getCatalogProviders = () => queryCatalog(
    CATALOGO_PROVIDERS_QUERY,
    undefined,
    "catalogoProviders"
);

export const getFeatureDraft = (featureId) => queryCatalog(
    CATALOGO_RASCUNHO_FUNCIONALIDADE_QUERY,
    { funcionalidadeId: Number(featureId) },
    "catalogoRascunhoFuncionalidade",
    null
);

export const getActionDraft = (actionId) => queryCatalog(
    CATALOGO_RASCUNHO_ACAO_QUERY,
    { acaoId: Number(actionId) },
    "catalogoRascunhoAcao",
    null
);

export const createSolutionDraft = (solutionId, reason = null) => mutateCatalog(
    CRIAR_RASCUNHO_SOLUCAO_MUTATION,
    { solucaoId: Number(solutionId), motivo: reason?.trim() || null },
    "criarRascunhoSolucao"
);

export const saveSolutionDraft = (input) => mutateCatalog(
    SALVAR_RASCUNHO_SOLUCAO_MUTATION,
    { input },
    "salvarRascunhoSolucao"
);

export const publishSolutionDraft = ({ versionId, expectedRevision, reason = null }) => mutateCatalog(
    PUBLICAR_RASCUNHO_SOLUCAO_MUTATION,
    { versaoId: versionId, revisaoEsperada: Number(expectedRevision), motivo: reason?.trim() || null },
    "publicarRascunhoSolucao",
    true
);

export const createFeatureDraft = (featureId, reason = null) => mutateCatalog(
    CRIAR_RASCUNHO_FUNCIONALIDADE_MUTATION,
    { funcionalidadeId: Number(featureId), motivo: reason?.trim() || null },
    "criarRascunhoFuncionalidade"
);

export const validateFeatureDraft = (versionId) => queryCatalog(
    VALIDAR_RASCUNHO_FUNCIONALIDADE_QUERY,
    { versaoId: versionId },
    "validarRascunhoFuncionalidade"
);

export const saveFeatureDraft = (input) => mutateCatalog(
    SALVAR_RASCUNHO_FUNCIONALIDADE_MUTATION,
    { input },
    "salvarRascunhoFuncionalidade"
);

export const publishFeatureDraft = ({ versionId, expectedRevision, reason = null }) => mutateCatalog(
    PUBLICAR_RASCUNHO_FUNCIONALIDADE_MUTATION,
    { versaoId: versionId, revisaoEsperada: Number(expectedRevision), motivo: reason?.trim() || null },
    "publicarRascunhoFuncionalidade",
    true
);

export const createActionDraft = (actionId, reason = null) => mutateCatalog(
    CRIAR_RASCUNHO_ACAO_MUTATION,
    { acaoId: Number(actionId), motivo: reason?.trim() || null },
    "criarRascunhoAcao"
);

export const validateActionDraft = (versionId) => queryCatalog(
    VALIDAR_RASCUNHO_ACAO_QUERY,
    { versaoId: versionId },
    "validarRascunhoAcao"
);

export const saveActionDraft = (input) => mutateCatalog(
    SALVAR_RASCUNHO_ACAO_MUTATION,
    { input },
    "salvarRascunhoAcao"
);

export const publishActionDraft = ({ versionId, expectedRevision, reason = null }) => mutateCatalog(
    PUBLICAR_RASCUNHO_ACAO_MUTATION,
    { versaoId: versionId, revisaoEsperada: Number(expectedRevision), motivo: reason?.trim() || null },
    "publicarRascunhoAcao",
    true
);
