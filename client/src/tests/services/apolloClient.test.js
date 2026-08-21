import { describe, expect, it, vi } from "vitest";

const apolloMocks = vi.hoisted(() => ({
    client: { kind: "apollo-client" },
    cache: { kind: "apollo-cache" },
    httpLink: { kind: "http-link" },
    ApolloClient: vi.fn(function ApolloClient() {
        return apolloMocks.client;
    }),
    InMemoryCache: vi.fn(function InMemoryCache() {
        return apolloMocks.cache;
    }),
    createHttpLink: vi.fn(() => apolloMocks.httpLink)
}));

vi.mock("@apollo/client", () => ({
    ApolloClient: apolloMocks.ApolloClient,
    InMemoryCache: apolloMocks.InMemoryCache,
    createHttpLink: apolloMocks.createHttpLink
}));

import { apolloClient } from "../../lib/apolloClient";

describe("Apollo Client", () => {
    it("envia credenciais pelo cookie sem montar um link Bearer", () => {
        expect(apolloMocks.createHttpLink).toHaveBeenCalledWith({
            uri: expect.stringMatching(/\/graphql$/),
            credentials: "include"
        });
        expect(apolloMocks.ApolloClient).toHaveBeenCalledWith(expect.objectContaining({
            link: apolloMocks.httpLink,
            cache: apolloMocks.cache
        }));
        expect(apolloClient).toBe(apolloMocks.client);
    });
});
