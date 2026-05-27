export const HUB_NAVIGATION_CHANGED_EVENT = "orfeu:hub-navigation-changed";

export const notifyHubNavigationChanged = () => {
    if (typeof window === "undefined") {
        return;
    }

    window.dispatchEvent(new CustomEvent(HUB_NAVIGATION_CHANGED_EVENT));
};
