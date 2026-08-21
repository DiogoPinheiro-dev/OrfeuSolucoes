const LEGACY_SESSION_KEYS = ["orfeu_token", "orfeu_auth", "orfeu_user"];

export const clearLegacySessionStorage = () => {
    try {
        LEGACY_SESSION_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
        // A sessão atual depende apenas do cookie HttpOnly; armazenamento local indisponível não impede o bootstrap.
    }
};
