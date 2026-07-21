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

export const toServiceError = (error, fallback = "Erro inesperado ao comunicar com o servidor.") => {
    const graphQLError = firstGraphQLError(error);
    const originalError = graphQLError?.extensions?.originalError
        || error?.networkError?.result?.errors?.[0]?.extensions?.originalError;
    const rawMessage = originalError?.message ?? graphQLError?.message ?? error?.message;
    const message = Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage || fallback;
    const serviceError = new Error(message === "Bad Request Exception" ? fallback : message);

    serviceError.fieldErrors = normalizedFieldErrors(originalError?.fieldErrors);
    return serviceError;
};
