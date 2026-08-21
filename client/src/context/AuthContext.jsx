import { useEffect, useState } from "react";

import {
    changePassword as changePasswordRequest,
    getCurrentUser,
    login as loginRequest,
    logout as logoutRequest,
    switchCompany as switchCompanyRequest
} from "../../services/Auth/AuthService";
import { clearLegacySessionStorage } from "../../services/Auth/legacySession";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [bootstrapping, setBootstrapping] = useState(true);
    const [switchingCompany, setSwitchingCompany] = useState(false);

    useEffect(() => {
        let active = true;

        const restoreSession = async () => {
            clearLegacySessionStorage();

            try {
                const currentUser = await getCurrentUser();

                if (!active) {
                    return;
                }

                setUser(currentUser);
            } catch {
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
        try {
            await logoutRequest();
        } finally {
            setUser(null);
        }
    };

    const refreshUser = async () => {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        return currentUser;
    };

    const changePassword = async (novaSenha) => {
        const updatedUser = await changePasswordRequest({ novaSenha });
        setUser(updatedUser);
        return updatedUser;
    };

    const switchCompany = async (empresaId) => {
        setSwitchingCompany(true);

        try {
            const updatedUser = await switchCompanyRequest({ empresaId });
            setUser(updatedUser);
            return updatedUser;
        } finally {
            setSwitchingCompany(false);
        }
    };

    const value = {
        user,
        role: user?.grupo?.nome ?? null,
        isAuthenticated: !!user,
        bootstrapping,
        switchingCompany,
        signIn,
        signOut,
        changePassword,
        refreshUser,
        switchCompany
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
