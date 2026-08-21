export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_MAX_BYTES = 72;

const FORBIDDEN_PASSWORDS = new Set([
    "admin",
    "admin123",
    "password",
    "password123",
    "senha",
    "senha123"
]);

export const PASSWORD_REQUIREMENTS_TEXT =
    `entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres, no máximo ${PASSWORD_MAX_BYTES} bytes, ` +
    "com letra maiúscula, letra minúscula, número e caractere especial";

const getUtf8ByteLength = (value) => new TextEncoder().encode(value).length;

export const getPasswordPolicyIssues = (rawPassword = "") => {
    const password = rawPassword.trim();
    const issues = [];

    if (password.length < PASSWORD_MIN_LENGTH) {
        issues.push(`ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`);
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
        issues.push(`ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`);
    }

    if (getUtf8ByteLength(password) > PASSWORD_MAX_BYTES) {
        issues.push(`usar no máximo ${PASSWORD_MAX_BYTES} bytes em UTF-8`);
    }

    if (!/[A-Z]/.test(password)) {
        issues.push("conter uma letra maiúscula");
    }

    if (!/[a-z]/.test(password)) {
        issues.push("conter uma letra minúscula");
    }

    if (!/\d/.test(password)) {
        issues.push("conter um número");
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        issues.push("conter um caractere especial");
    }

    if (FORBIDDEN_PASSWORDS.has(password.toLowerCase())) {
        issues.push("ser diferente das senhas temporárias conhecidas");
    }

    return issues;
};

export const formatPasswordPolicyIssues = (issues) => {
    if (issues.length < 2) {
        return issues[0] ?? "";
    }

    return `${issues.slice(0, -1).join(", ")} e ${issues.at(-1)}`;
};
