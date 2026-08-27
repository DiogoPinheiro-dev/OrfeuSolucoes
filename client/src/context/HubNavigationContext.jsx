import { useEffect, useMemo, useState } from "react";

import { getMyHubNavigation } from "../../services/Solucoes/SolucaoService";
import { normalizeSolutions } from "../auth/hubConfig";
import { HUB_NAVIGATION_CHANGED_EVENT } from "../auth/hubNavigationEvents";
import { useAuth } from "../hooks/useAuth";
import { useLatestRequest } from "../hooks/useLatestRequest";
import { HubNavigationContext } from "./hub-navigation-context";

export function HubNavigationProvider({ children }) {
    const { isAuthenticated, user } = useAuth();
    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(isAuthenticated);
    const [error, setError] = useState("");
    const [loadedScope, setLoadedScope] = useState(null);
    const navigationRequest = useLatestRequest();
    const navigationScope = isAuthenticated ? `company:${user?.empresa?.id ?? "none"}` : null;

    useEffect(() => {
        if (!isAuthenticated) {
            navigationRequest.invalidate();
            setSolutions([]);
            setLoading(false);
            setError("");
            setLoadedScope(null);
            return undefined;
        }

        const loadNavigation = () => {
            setLoading(true);
            setError("");

            return navigationRequest.run(getMyHubNavigation, {
                onSuccess: (navigation) => {
                    setSolutions(normalizeSolutions(navigation));
                    setLoadedScope(navigationScope);
                },
                onError: (loadError) => {
                    setError(loadError.message || "Não foi possível carregar o hub.");
                    setSolutions([]);
                    setLoadedScope(navigationScope);
                },
                onSettled: () => setLoading(false)
            });
        };

        const handleHubNavigationChanged = () => {
            void loadNavigation();
        };

        void loadNavigation();
        window.addEventListener(HUB_NAVIGATION_CHANGED_EVENT, handleHubNavigationChanged);

        return () => {
            navigationRequest.invalidate();
            window.removeEventListener(HUB_NAVIGATION_CHANGED_EVENT, handleHubNavigationChanged);
        };
    }, [isAuthenticated, navigationRequest, navigationScope]);

    const scopePending = isAuthenticated && loadedScope !== navigationScope;
    const value = useMemo(() => ({
        error: scopePending ? "" : error,
        loading: scopePending || loading,
        solutions: scopePending ? [] : solutions
    }), [error, loading, scopePending, solutions]);

    return <HubNavigationContext.Provider value={value}>{children}</HubNavigationContext.Provider>;
}
