import { apolloClient } from "../../src/lib/apolloClient";
import {
    APROVAR_PROJETO_APONTAMENTOS_MUTATION,
    DESCARTAR_PROJETO_APONTAMENTO_MUTATION,
    ENVIAR_PROJETO_APONTAMENTOS_MUTATION,
    EXCLUIR_PROJETO_APONTAMENTO_MUTATION,
    FECHAR_PROJETO_APONTAMENTO_PERIODO_MUTATION,
    MEUS_PROJETO_APONTAMENTOS_QUERY,
    PROJETO_APONTAMENTO_ITENS_QUERY,
    PROJETO_APONTAMENTO_PROJETOS_QUERY,
    PROJETO_HORAS_PROJETOS_QUERY,
    PROJETO_HORAS_QUERY,
    REABRIR_PROJETO_APONTAMENTO_MUTATION,
    REABRIR_PROJETO_APONTAMENTO_PERIODO_MUTATION,
    RECALCULAR_CUSTO_PROJETO_APONTAMENTOS_MUTATION,
    RECOLHER_PROJETO_APONTAMENTO_MUTATION,
    REJEITAR_PROJETO_APONTAMENTOS_MUTATION,
    SALVAR_PROJETO_APONTAMENTO_MUTATION
} from "../graphql/operations";
import { toServiceError } from "../graphql/serviceError";

// As recusas de regra (limite diário, competência fechada, versão desatualizada) chegam do backend com a orientação
// para a pessoa; por isso este serviço preserva a mensagem de negócio.
const execute = async ({ document, variables = {}, select, mutation = false }) => {
    try {
        const response = mutation
            ? await apolloClient.mutate({ mutation: document, variables })
            : await apolloClient.query({ query: document, variables, fetchPolicy: "network-only" });
        return select(response.data);
    } catch (error) {
        throw toServiceError(error, undefined, { preserveBusinessMessage: true });
    }
};

const lista = (value) => value || [];

const paginaDoAutor = (page) => ({
    ...page,
    items: lista(page?.items),
    totaisPorDia: lista(page?.totaisPorDia),
    totaisPorProjeto: lista(page?.totaisPorProjeto),
    permissoes: { podeIncluir: false, ...page?.permissoes }
});

const paginaDoGestor = (page) => ({
    ...page,
    items: lista(page?.items),
    totaisPorUsuario: lista(page?.totaisPorUsuario),
    totaisPorItem: lista(page?.totaisPorItem),
    competencias: lista(page?.competencias),
    financeiro: page?.financeiro
        ? {
            ...page.financeiro,
            custosPorUsuario: lista(page.financeiro.custosPorUsuario),
            custosPorItem: lista(page.financeiro.custosPorItem),
            linhas: lista(page.financeiro.linhas)
        }
        : null
});

export const getApontamentoProjetos = () => execute({
    document: PROJETO_APONTAMENTO_PROJETOS_QUERY,
    select: (data) => lista(data?.projetoApontamentoProjetos)
});

export const getApontamentoItens = (projetoId) => execute({
    document: PROJETO_APONTAMENTO_ITENS_QUERY,
    variables: { projetoId },
    select: (data) => lista(data?.projetoApontamentoItens)
});

export const getMeusApontamentos = (filtro) => execute({
    document: MEUS_PROJETO_APONTAMENTOS_QUERY,
    variables: { filtro },
    select: (data) => paginaDoAutor(data?.meusProjetoApontamentos)
});

export const salvarApontamento = (input) => execute({
    document: SALVAR_PROJETO_APONTAMENTO_MUTATION,
    variables: { input },
    select: (data) => data.salvarProjetoApontamento,
    mutation: true
});

export const excluirApontamento = (input) => execute({
    document: EXCLUIR_PROJETO_APONTAMENTO_MUTATION,
    variables: { input },
    select: (data) => data.excluirProjetoApontamento,
    mutation: true
});

export const descartarApontamento = (input) => execute({
    document: DESCARTAR_PROJETO_APONTAMENTO_MUTATION,
    variables: { input },
    select: (data) => data.descartarProjetoApontamento,
    mutation: true
});

export const enviarApontamentos = (apontamentos) => execute({
    document: ENVIAR_PROJETO_APONTAMENTOS_MUTATION,
    variables: { input: { apontamentos } },
    select: (data) => lista(data?.enviarProjetoApontamentos),
    mutation: true
});

export const recolherApontamento = (input) => execute({
    document: RECOLHER_PROJETO_APONTAMENTO_MUTATION,
    variables: { input },
    select: (data) => data.recolherProjetoApontamento,
    mutation: true
});

export const getHorasProjetos = (incluirArquivados = false) => execute({
    document: PROJETO_HORAS_PROJETOS_QUERY,
    variables: { incluirArquivados },
    select: (data) => lista(data?.projetoHorasProjetos)
});

export const getHorasDoProjeto = (filtro) => execute({
    document: PROJETO_HORAS_QUERY,
    variables: { filtro },
    select: (data) => paginaDoGestor(data?.projetoHoras)
});

export const aprovarApontamentos = (input) => execute({
    document: APROVAR_PROJETO_APONTAMENTOS_MUTATION,
    variables: { input },
    select: (data) => lista(data?.aprovarProjetoApontamentos),
    mutation: true
});

export const rejeitarApontamentos = (input) => execute({
    document: REJEITAR_PROJETO_APONTAMENTOS_MUTATION,
    variables: { input },
    select: (data) => lista(data?.rejeitarProjetoApontamentos),
    mutation: true
});

export const reabrirApontamento = (input) => execute({
    document: REABRIR_PROJETO_APONTAMENTO_MUTATION,
    variables: { input },
    select: (data) => data.reabrirProjetoApontamento,
    mutation: true
});

export const fecharCompetencia = (input) => execute({
    document: FECHAR_PROJETO_APONTAMENTO_PERIODO_MUTATION,
    variables: { input },
    select: (data) => data.fecharProjetoApontamentoPeriodo,
    mutation: true
});

export const reabrirCompetencia = (input) => execute({
    document: REABRIR_PROJETO_APONTAMENTO_PERIODO_MUTATION,
    variables: { input },
    select: (data) => data.reabrirProjetoApontamentoPeriodo,
    mutation: true
});

export const recalcularCustosPendentes = (projetoId) => execute({
    document: RECALCULAR_CUSTO_PROJETO_APONTAMENTOS_MUTATION,
    variables: { input: { projetoId } },
    select: (data) => data.recalcularCustoProjetoApontamentos,
    mutation: true
});
