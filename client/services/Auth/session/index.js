const AUTH_KEY = "orfeu_auth";
const TOKEN_KEY = "orfeu_token";

export const isAuthenticated = () => {
    const hasToken = !!localStorage.getItem(TOKEN_KEY);
    const hasFlag = localStorage.getItem(AUTH_KEY) === "true";

    return hasToken || hasFlag;
};

export const setSession = (token) => {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(AUTH_KEY, "true");
    }

    window.dispatchEvent(new Event("orfeu:authChanged"));
};

export const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);

    window.dispatchEvent(new Event("orfeu:authChanged"));
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);