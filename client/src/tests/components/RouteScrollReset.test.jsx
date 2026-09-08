// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";

import RouteScrollReset from "../../components/RouteScrollReset";

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("RouteScrollReset", () => {
    it("returns the document to the top when the route pathname changes", async () => {
        const user = userEvent.setup();
        const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

        render(
            <MemoryRouter initialEntries={["/origem"]}>
                <RouteScrollReset />
                <Link to="/destino">Abrir destino</Link>
                <Routes>
                    <Route path="*" element={null} />
                </Routes>
            </MemoryRouter>
        );
        scrollTo.mockClear();

        await user.click(screen.getByRole("link", { name: "Abrir destino" }));

        await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" }));
    });
});
