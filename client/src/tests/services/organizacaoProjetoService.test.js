// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apolloClient } from "../../lib/apolloClient";
import {
  excluirCapacitacao,
  excluirEquipe,
  getProjetoOrganizacao,
  salvarCapacitacao,
  salvarEquipe
} from "../../../services/Projetos/OrganizacaoProjetoService";
import { ServiceError } from "../../../services/graphql/serviceError";

vi.mock("../../lib/apolloClient", () => ({
  apolloClient: { query: vi.fn(), mutate: vi.fn() }
}));

describe("OrganizacaoProjetoService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta a organização sem cache local", async () => {
    const painel = { capacitacoes: [], equipes: [], permissoes: {} };
    apolloClient.query.mockResolvedValue({ data: { projetoOrganizacao: painel } });

    await expect(getProjetoOrganizacao()).resolves.toBe(painel);
    expect(apolloClient.query).toHaveBeenCalledWith(expect.objectContaining({
      variables: {},
      fetchPolicy: "network-only"
    }));
  });

  it.each([
    ["salvar capacitação", salvarCapacitacao, "salvarCapacitacao", { nome: "Backend", ativo: true }],
    ["excluir capacitação", excluirCapacitacao, "excluirCapacitacao", { id: "c1", versao: 1 }],
    ["salvar equipe", salvarEquipe, "salvarEquipe", { nome: "Produto", ativo: true }],
    ["excluir equipe", excluirEquipe, "excluirEquipe", { id: "e1", versao: 1 }]
  ])("%s envia exatamente a variável input", async (_label, operation, responseKey, input) => {
    const response = { id: input.id || "novo" };
    apolloClient.mutate.mockResolvedValue({ data: { [responseKey]: response } });

    await expect(operation(input)).resolves.toBe(response);
    expect(apolloClient.mutate).toHaveBeenCalledWith(expect.objectContaining({ variables: { input } }));
  });

  it.each([
    ["consulta", getProjetoOrganizacao],
    ["mutation", () => salvarEquipe({ nome: "Produto", ativo: true })]
  ])("normaliza falha técnica da %s", async (_label, operation) => {
    apolloClient.query.mockRejectedValue(new Error("Network error: failed to fetch"));
    apolloClient.mutate.mockRejectedValue(new Error("Network error: failed to fetch"));

    await expect(operation()).rejects.toBeInstanceOf(ServiceError);
  });
});
