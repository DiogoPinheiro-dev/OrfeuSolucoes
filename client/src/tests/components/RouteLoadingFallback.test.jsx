// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RouteLoadingFallback from "../../components/RouteLoadingFallback";

describe("RouteLoadingFallback", () => {
    it("mantém o carregamento de rotas dentro do padrão visual global", () => {
        const { container } = render(<RouteLoadingFallback />);

        expect(screen.getByRole("status")).toHaveClass("auth-loading-card", "route-loading-card");
        expect(screen.getByRole("heading", { name: "Carregando página..." })).toBeInTheDocument();
        expect(container.querySelector("main")).toHaveClass("auth-loading-shell");
        expect(container.querySelector(".route-loading-indicator")).toHaveAttribute("aria-hidden", "true");
    });
});
