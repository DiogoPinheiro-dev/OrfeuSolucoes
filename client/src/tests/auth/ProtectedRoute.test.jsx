// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../hooks/useAuth";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));

function LocationProbe() {
    const location = useLocation();
    return <span>{location.pathname}:{location.state?.from || ""}</span>;
}

const renderRoute = () => render(
    <MemoryRouter initialEntries={["/hub/projetos"]}>
        <LocationProbe />
        <Routes>
            <Route element={<ProtectedRoute />}>
                <Route path="/hub/projetos" element={<h1>Área protegida</h1>} />
            </Route>
            <Route path="/" element={<h1>Início</h1>} />
        </Routes>
    </MemoryRouter>
);

describe("ProtectedRoute", () => {
    beforeEach(() => vi.clearAllMocks());

    it("mantém uma tela explícita enquanto a sessão está sendo validada", () => {
        useAuth.mockReturnValue({ bootstrapping: true, isAuthenticated: false });
        renderRoute();
        expect(screen.getByText("Validando seu acesso...")).toBeInTheDocument();
        expect(screen.queryByText("Área protegida")).not.toBeInTheDocument();
    });

    it("redireciona usuário anônimo preservando a rota de origem", async () => {
        useAuth.mockReturnValue({ bootstrapping: false, isAuthenticated: false });
        renderRoute();
        expect(await screen.findByText("Início")).toBeInTheDocument();
        expect(screen.getByText("/:/hub/projetos")).toBeInTheDocument();
    });

    it("renderiza a rota para sessão autenticada", () => {
        useAuth.mockReturnValue({ bootstrapping: false, isAuthenticated: true });
        renderRoute();
        expect(screen.getByText("Área protegida")).toBeInTheDocument();
    });
});
