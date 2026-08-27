import { useContext } from "react";

import { HubNavigationContext } from "../context/hub-navigation-context";

export function useHubNavigation() {
    const context = useContext(HubNavigationContext);

    if (!context) {
        throw new Error("useHubNavigation must be used within HubNavigationProvider");
    }

    return context;
}
