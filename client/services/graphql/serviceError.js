const DEFAULT_MESSAGE = "Não foi possível concluir a operação. Tente novamente.";

const ERROR_MESSAGES = {
    network: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
    credentials: "Usuário ou senha incorretos.",
    session: "Sua sessão expirou. Entre novamente para continuar.",
    permission: "Você não possui permissão para realizar esta operação.",
    conflict: "Este registro foi alterado por outra pessoa. Atualize os dados e tente novamente.",
    validation: "Revise os campos informados e tente novamente."
};

const firstGraphQLError = (error) =>
    error?.graphQLErrors?.[0]
    || error?.errors?.[0]
    || error?.networkError?.result?.errors?.[0];

const normalizedFieldErrors = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};

    return Object.fromEntries(
        Object.entries(value)
            .map(([field, message]) => [field, Array.isArray(message) ? message.join(" ") : String(message || "")])
            .filter(([, message]) => message)
    );
};

const getStatus = (error, graphQLError, originalError) => Number(
    originalError?.statusCode
    ?? graphQLError?.extensions?.status
    ?? error?.networkError?.statusCode
    ?? error?.networkError?.status
    ?? 0
);

const getCode = (graphQLError, originalError) => String(
    graphQLError?.extensions?.code ?? originalError?.code ?? ""
).toUpperCase();

const classifyError = ({ error, graphQLError, originalError, fieldErrors, context }) => {
    const status = getStatus(error, graphQLError, originalError);
    const code = getCode(graphQLError, originalError);
    const rawMessage = String(graphQLError?.message ?? error?.message ?? "").toLowerCase();

    if (context === "authentication" && (status === 401 || code === "UNAUTHENTICATED")) return "credentials";
    if (status === 401 || ["UNAUTHENTICATED", "TOKEN_EXPIRED"].includes(code)) return "session";
    if (status === 403 || code === "FORBIDDEN") return "permission";
    if (status === 409 || ["CONFLICT", "VERSION_CONFLICT"].includes(code) || /vers[aã]o|conflito/.test(rawMessage)) return "conflict";
    if (status === 400 || code === "BAD_USER_INPUT" || Object.keys(fieldErrors).length > 0) return "validation";
    if (error?.networkError || /failed to fetch|network error|load failed/.test(rawMessage)) return "network";
    return "unknown";
};

const isSafeBusinessMessage = (message) => message && typeof message === "string"
    && !/exception|stack|graphql|prisma|sql|database|internal server|failed to fetch|network error|\bat\s+\w+.*\(.+:\d+:\d+\)/i.test(message);

export class ServiceError extends Error {
    constructor(message, { type = "unknown", code = "", status = 0, fieldErrors = {}, cause } = {}) {
        super(message, { cause });
        this.name = "ServiceError";
        this.type = type;
        this.code = code;
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}

// Uma regra de negócio recusada pelo backend (400 sem erro de campo ou 409) explica o que fazer, como o limite
// diário de horas. O serviço que precisa dessa explicação pede preserveBusinessMessage; erros de coerção do
// GraphQL, sem exceção de domínio, e permissão negada continuam com a mensagem genérica.
const keepsDomainMessage = ({ type, originalError, fieldErrors, preserveBusinessMessage }) => preserveBusinessMessage
    && Boolean(originalError)
    && (type === "conflict" || (type === "validation" && Object.keys(fieldErrors).length === 0));

export const toServiceError = (error, fallback = DEFAULT_MESSAGE, { context, preserveBusinessMessage = false } = {}) => {
    if (error instanceof ServiceError) return error;

    const graphQLError = firstGraphQLError(error);
    const originalError = graphQLError?.extensions?.originalError
        || error?.networkError?.result?.errors?.[0]?.extensions?.originalError;
    const fieldErrors = normalizedFieldErrors(originalError?.fieldErrors ?? graphQLError?.extensions?.fieldErrors);
    const type = classifyError({ error, graphQLError, originalError, fieldErrors, context });
    const rawMessage = originalError?.message ?? graphQLError?.message;
    const businessMessage = Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage;
    const showsBusinessMessage = type === "unknown" || keepsDomainMessage({ type, originalError, fieldErrors, preserveBusinessMessage });
    const message = showsBusinessMessage && isSafeBusinessMessage(businessMessage)
        ? businessMessage
        : ERROR_MESSAGES[type] || fallback;

    return new ServiceError(message || fallback, {
        type,
        code: getCode(graphQLError, originalError),
        status: getStatus(error, graphQLError, originalError),
        fieldErrors,
        cause: error
    });
};

export const toAuthenticationServiceError = (error, fallback) =>
    toServiceError(error, fallback, { context: "authentication" });
