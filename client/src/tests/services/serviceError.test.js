import { describe, expect, it } from "vitest";

import {
    ServiceError,
    toAuthenticationServiceError,
    toServiceError
} from "../../../services/graphql/serviceError";

describe("toServiceError", () => {
    it.each([
        [401, "session", "Sua sessão expirou"],
        [403, "permission", "não possui permissão"],
        [409, "conflict", "alterado por outra pessoa"]
    ])("classifica o status %s", (statusCode, type, message) => {
        const error = toServiceError({
            graphQLErrors: [{ message: "Http Exception", extensions: { originalError: { statusCode } } }]
        });

        expect(error).toBeInstanceOf(ServiceError);
        expect(error.type).toBe(type);
        expect(error.message).toContain(message);
    });

    it("preserva erros de campo sem expor a exceção técnica", () => {
        const error = toServiceError({
            graphQLErrors: [{
                message: "Bad Request Exception",
                extensions: { originalError: { statusCode: 400, fieldErrors: { nome: ["Informe o nome."] } } }
            }]
        });

        expect(error.type).toBe("validation");
        expect(error.fieldErrors).toEqual({ nome: "Informe o nome." });
        expect(error.message).not.toContain("Exception");
    });

    it("distingue credenciais incorretas de uma sessão expirada", () => {
        const failure = {
            graphQLErrors: [{
                message: "Unauthorized Exception",
                extensions: { code: "UNAUTHENTICATED", originalError: { statusCode: 401 } }
            }]
        };

        const credentialsError = toAuthenticationServiceError(failure);
        const sessionError = toServiceError(failure);

        expect(credentialsError).toMatchObject({
            type: "credentials",
            message: "Usuário ou senha incorretos."
        });
        expect(sessionError).toMatchObject({
            type: "session",
            message: "Sua sessão expirou. Entre novamente para continuar."
        });
    });

    it("substitui mensagens internas por uma mensagem segura", () => {
        const error = toServiceError({ graphQLErrors: [{ message: "PrismaClientKnownRequestError: SQL database failure" }] });

        expect(error.message).toBe("Não foi possível concluir a operação. Tente novamente.");
    });

    it("preserva uma orientação de negócio segura", () => {
        const error = toServiceError({ graphQLErrors: [{ message: "Desative o registro antes de excluí-lo." }] });

        expect(error.message).toBe("Desative o registro antes de excluí-lo.");
    });

    describe("com preserveBusinessMessage", () => {
        const domainFailure = (statusCode, message, extra = {}) => ({
            graphQLErrors: [{ message, extensions: { originalError: { statusCode, message, ...extra } } }]
        });
        const preserving = (failure) => toServiceError(failure, undefined, { preserveBusinessMessage: true });

        it("mostra a regra recusada pelo domínio e o conflito explicado pelo backend", () => {
            const limite = domainFailure(400, "O dia já tem 23:00 lançadas e só cabem mais 01:00.");
            const competencia = domainFailure(409, "A competência 09/2026 já está fechada. Atualize os dados.");

            expect(preserving(limite)).toMatchObject({ type: "validation", message: "O dia já tem 23:00 lançadas e só cabem mais 01:00." });
            expect(preserving(competencia)).toMatchObject({ type: "conflict", message: "A competência 09/2026 já está fechada. Atualize os dados." });
            expect(toServiceError(limite).message).toBe("Revise os campos informados e tente novamente.");
        });

        it("mantém a mensagem genérica para erro de campo, permissão, coerção do GraphQL e texto técnico", () => {
            const campo = preserving(domainFailure(400, ["Informe o motivo."], { fieldErrors: { motivo: ["Informe o motivo."] } }));
            const permissao = preserving(domainFailure(403, "Usuario sem permissao para executar esta acao."));
            const coercao = preserving({ graphQLErrors: [{ message: "Variable \"$input\" got invalid value 1.5.", extensions: { code: "BAD_USER_INPUT" } }] });
            const tecnica = preserving(domainFailure(400, "Bad Request Exception"));

            expect(campo).toMatchObject({ message: "Revise os campos informados e tente novamente.", fieldErrors: { motivo: "Informe o motivo." } });
            expect(permissao.message).toBe("Você não possui permissão para realizar esta operação.");
            expect(coercao.message).toBe("Revise os campos informados e tente novamente.");
            expect(tecnica.message).toBe("Revise os campos informados e tente novamente.");
        });
    });
});
