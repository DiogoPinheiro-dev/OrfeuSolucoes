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
});
