import { ApolloClient, ApolloLink, InMemoryCache, Observable } from "@apollo/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apolloCacheTypePolicies } from "../../lib/apolloClient";
import {
    MY_HUB_NAVIGATION_QUERY,
    SOLUCOES_QUERY,
    UPDATE_SOLUCAO_MUTATION
} from "../../../services/graphql/operations";

const acao = {
    __typename: "FuncionalidadeAcaoType",
    id: 101,
    funcionalidadeId: 11,
    chave: "visualizar",
    nome: "Visualizar",
    descricao: "Permite consultar usuários",
    ordem: 1,
    ativo: true,
    acaoPadrao: true,
    configuracao: null,
    statusPublicacao: "PUBLICADA",
    permitido: true
};

const funcionalidade = {
    __typename: "FuncionalidadeType",
    id: 11,
    slug: "usuarios",
    titulo: "Usuários",
    label: "Usuários",
    descricao: "Cadastro de usuários",
    ordem: 1,
    ativo: true,
    registryKey: "configurador.cadastro-de-usuarios",
    somenteAdminSistema: true,
    padraoSistema: true,
    chaveTecnica: "configurador.cadastro-de-usuarios",
    providerKey: "configurador.cadastro-de-usuarios",
    providerVersion: 1,
    statusPublicacao: "PUBLICADA",
    revisaoCatalogo: 1,
    agrupamentoId: null,
    ordemNoAgrupamento: null,
    podeVisualizar: true,
    podeIncluir: true,
    podeAlterar: true,
    podeExcluir: false,
    acoes: [acao]
};

const solucao = {
    __typename: "SolucaoType",
    id: 1,
    slug: "configurador",
    nome: "Configurador",
    descricao: "Cadastros administrativos",
    eyebrow: "Administração",
    ordem: 1,
    ativo: true,
    exibirNoHub: true,
    somenteAdminSistema: true,
    padraoSistema: true,
    chaveTecnica: "configurador",
    statusPublicacao: "PUBLICADA",
    revisaoCatalogo: 1,
    funcionalidades: [funcionalidade],
    agrupamentos: []
};

// O catálogo administrativo inclui rascunhos e agrupamentos inativos que a navegação do Hub omite.
const catalogo = {
    ...solucao,
    funcionalidades: [
        {
            ...funcionalidade,
            agrupamentoId: 7,
            ordemNoAgrupamento: 1,
            acoes: [acao, { ...acao, id: 102, chave: "exportar", nome: "Exportar", ordem: 2, acaoPadrao: false, statusPublicacao: "RASCUNHO" }]
        },
        { ...funcionalidade, id: 12, slug: "grupos", titulo: "Grupos", label: "Grupos", ordem: 2, statusPublicacao: "RASCUNHO", acoes: [] }
    ],
    agrupamentos: [{
        __typename: "FuncionalidadeAgrupamentoType",
        id: 7,
        solucaoId: 1,
        slug: "acessos",
        titulo: "Acessos",
        label: "Acessos",
        descricao: "Usuários e grupos",
        ordem: 1,
        ativo: false,
        padraoSistema: false,
        chaveTecnica: "agrupamento-acessos"
    }]
};

const createClient = (responses) => new ApolloClient({
    cache: new InMemoryCache({ typePolicies: apolloCacheTypePolicies }),
    link: new ApolloLink((operation) => new Observable((observer) => {
        observer.next({ data: responses[operation.operationName] });
        observer.complete();
    }))
});

const captureConsole = () => {
    const messages = [];
    vi.spyOn(console, "warn").mockImplementation((...args) => messages.push(args.join(" ")));
    vi.spyOn(console, "error").mockImplementation((...args) => messages.push(args.join(" ")));
    return messages;
};

const cacheLossWarnings = (messages) => messages.filter((message) => message.includes("Cache data may be lost"));

const summarize = (item) => ({
    agrupamentos: item.agrupamentos.map((agrupamento) => agrupamento.id),
    funcionalidades: item.funcionalidades.map((feature) => ({
        id: feature.id,
        agrupamentoId: feature.agrupamentoId,
        acoes: feature.acoes.map((action) => action.id)
    }))
});

describe("cache Apollo de soluções", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("preserva funcionalidades, permissões e ações após atualizar a solução", async () => {
        const consoleMessages = captureConsole();
        const client = createClient({
            Solucoes: { solucoes: [solucao] },
            UpdateSolucao: { updateSolucao: { ...solucao, nome: "Configurador atualizado" } }
        });

        await client.query({ query: SOLUCOES_QUERY, fetchPolicy: "network-only" });
        await client.mutate({
            mutation: UPDATE_SOLUCAO_MUTATION,
            variables: { input: { id: 1, nome: "Configurador atualizado" } }
        });

        const cached = client.cache.readQuery({ query: SOLUCOES_QUERY });
        expect(cached.solucoes[0]).toMatchObject({
            nome: "Configurador atualizado",
            funcionalidades: [{
                id: 11,
                podeVisualizar: true,
                podeExcluir: false,
                acoes: [{ id: 101, chave: "visualizar", permitido: true }]
            }]
        });
        expect(cacheLossWarnings(consoleMessages)).toEqual([]);
    });

    it("alterna entre os recortes do catálogo e da navegação sem aviso de perda de dados", async () => {
        const consoleMessages = captureConsole();
        const client = createClient({
            Solucoes: { solucoes: [catalogo] },
            MyHubNavigation: { myHubNavigation: [solucao] }
        });

        await client.query({ query: SOLUCOES_QUERY, fetchPolicy: "network-only" });
        const navegacao = await client.query({ query: MY_HUB_NAVIGATION_QUERY, fetchPolicy: "network-only" });
        const catalogoRecarregado = await client.query({ query: SOLUCOES_QUERY, fetchPolicy: "network-only" });

        expect(summarize(navegacao.data.myHubNavigation[0])).toEqual({
            agrupamentos: [],
            funcionalidades: [{ id: 11, agrupamentoId: null, acoes: [101] }]
        });
        expect(summarize(catalogoRecarregado.data.solucoes[0])).toEqual({
            agrupamentos: [7],
            funcionalidades: [
                { id: 11, agrupamentoId: 7, acoes: [101, 102] },
                { id: 12, agrupamentoId: null, acoes: [] }
            ]
        });
        expect(cacheLossWarnings(consoleMessages)).toEqual([]);
    });
});
