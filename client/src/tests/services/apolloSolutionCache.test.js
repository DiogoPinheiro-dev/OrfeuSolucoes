import { ApolloClient, ApolloLink, InMemoryCache, Observable } from "@apollo/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
    SOLUCOES_QUERY,
    UPDATE_SOLUCAO_MUTATION
} from "../../../services/graphql/operations";

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
    podeVisualizar: true,
    podeIncluir: true,
    podeAlterar: true,
    podeExcluir: false,
    acoes: [{
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
        permitido: true
    }]
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
    funcionalidades: [funcionalidade]
};

const createClient = () => new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink((operation) => new Observable((observer) => {
        const data = operation.operationName === "Solucoes"
            ? { solucoes: [solucao] }
            : { updateSolucao: { ...solucao, nome: "Configurador atualizado" } };

        observer.next({ data });
        observer.complete();
    }))
});

describe("cache Apollo de soluções", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("preserva funcionalidades, permissões e ações após atualizar a solução", async () => {
        const consoleMessages = [];
        vi.spyOn(console, "warn").mockImplementation((...args) => consoleMessages.push(args.join(" ")));
        vi.spyOn(console, "error").mockImplementation((...args) => consoleMessages.push(args.join(" ")));
        const client = createClient();

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
        expect(consoleMessages.filter((message) => message.includes("Cache data may be lost"))).toEqual([]);
    });
});
