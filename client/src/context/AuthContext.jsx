import { useEffect, useState } from "react";

import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "../../services/Auth/AuthService";
import { clearSession, getSessionUser, getToken, setSession } from "../../services/Auth/session";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getSessionUser());
    const [bootstrapping, setBootstrapping] = useState(true);

    useEffect(() => {
        let active = true;

        const restoreSession = async () => {
            const token = getToken();

            if (!token) {
                setBootstrapping(false);
                return;
            }

            try {
                const currentUser = await getCurrentUser();

                if (!active || !currentUser) {
                    return;
                }

                setUser(currentUser);
                setSession(token, currentUser);
            } catch {
                clearSession();
                if (active) {
                    setUser(null);
                }
            } finally {
                if (active) {
                    setBootstrapping(false);
                }
            }
        };

        void restoreSession();

        return () => {
            active = false;
        };
    }, []);

    const signIn = async (credentials) => {
        const loggedUser = await loginRequest(credentials);
        setUser(loggedUser);
        return loggedUser;
    };

    const signOut = async () => {
        await logoutRequest();
        setUser(null);
    };

    const refreshUser = async () => {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
            setSession(getToken(), currentUser);
        }

        return currentUser;
    };

    const value = {
        user,
        role: user?.tipo ?? null,
        isAuthenticated: !!user,
        bootstrapping,
        signIn,
        signOut,
        refreshUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
