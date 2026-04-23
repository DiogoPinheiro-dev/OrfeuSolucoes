const AUTH_KEY = "orfeu_auth";
const TOKEN_KEY = "orfeu_token";
const USER_KEY = "orfeu_user";

const notifySessionChange = () => {
    window.dispatchEvent(new Event("orfeu:authChanged"));
};

export const isAuthenticated = () => {
    const hasToken = !!localStorage.getItem(TOKEN_KEY);
    const hasFlag = localStorage.getItem(AUTH_KEY) === "true";

    return hasToken || hasFlag;
};

export const setSession = (token, user) => {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(AUTH_KEY, "true");
    }

    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    notifySessionChange();
};

export const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);

    notifySessionChange();
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getSessionUser = () => {
    const rawUser = localStorage.getItem(USER_KEY);

    if (!rawUser) {
        return null;
    }

    try {
        return JSON.parse(rawUser);
    } catch {
        localStorage.removeItem(USER_KEY);
        return null;
    }
};
