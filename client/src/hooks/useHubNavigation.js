import { useEffect, useState } from "react";

import { getMyHubNavigation } from "../../services/Solucoes/SolucaoService";
import { normalizeSolutions } from "../auth/hubConfig";
import { useAuth } from "./useAuth";

export function useHubNavigation() {
    const { isAuthenticated, user } = useAuth();
    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(isAuthenticated);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        if (!isAuthenticated) {
            setSolutions([]);
            setLoading(false);
            setError("");
            return () => {
                active = false;
            };
        }

        const loadNavigation = async () => {
            setLoading(true);
            setError("");

            try {
                const navigation = await getMyHubNavigation();

                if (active) {
                    setSolutions(normalizeSolutions(navigation));
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError.message || "Não foi possível carregar o hub.");
                    setSolutions([]);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void loadNavigation();

        return () => {
            active = false;
        };
    }, [isAuthenticated, user?.empresa?.id]);

    return { error, loading, solutions };
}
