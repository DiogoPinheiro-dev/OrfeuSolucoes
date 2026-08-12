import { useEffect, useState } from "react";

import { getMyHubNavigation } from "../../services/Solucoes/SolucaoService";
import { includeSystemSolutions, normalizeSolutions } from "../auth/hubConfig";
import { HUB_NAVIGATION_CHANGED_EVENT } from "../auth/hubNavigationEvents";
import { useAuth } from "./useAuth";
import { useLatestRequest } from "./useLatestRequest";

export function useHubNavigation() {
    const { isAuthenticated, user } = useAuth();
    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(isAuthenticated);
    const [error, setError] = useState("");
    const navigationRequest = useLatestRequest();

    useEffect(() => {
        if (!isAuthenticated) {
            navigationRequest.invalidate();
            setSolutions([]);
            setLoading(false);
            setError("");
            return undefined;
        }

        const loadNavigation = () => {
            setLoading(true);
            setError("");

            return navigationRequest.run(getMyHubNavigation, {
                onSuccess: (navigation) => {
                    setSolutions(includeSystemSolutions(normalizeSolutions(navigation)));
                },
                onError: (loadError) => {
                    setError(loadError.message || "Não foi possível carregar o hub.");
                    setSolutions(includeSystemSolutions());
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
    }, [isAuthenticated, navigationRequest, user?.empresa?.id]);

    return { error, loading, solutions };
}
