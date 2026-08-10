// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccessState, EmptyState, FeedbackMessage, LoadingState } from "../../components/CrudFeedback";

afterEach(cleanup);

describe("shared feedback states", () => {
    it("announces errors assertively and success politely", () => {
        const { rerender } = render(<FeedbackMessage type="error" title="Falha">Não foi possível salvar.</FeedbackMessage>);
        expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
        expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar.");
        rerender(<FeedbackMessage type="success">Registro salvo.</FeedbackMessage>);
        expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    });

    it("supports accessible dismissal and actions", async () => {
        const user = userEvent.setup();
        const onDismiss = vi.fn();
        const onRetry = vi.fn();
        render(<FeedbackMessage type="warning" onDismiss={onDismiss} action={<button type="button" onClick={onRetry}>Tentar novamente</button>}>Conexão instável.</FeedbackMessage>);
        await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
        await user.click(screen.getByRole("button", { name: "Dispensar mensagem" }));
        expect(onRetry).toHaveBeenCalledOnce();
        expect(onDismiss).toHaveBeenCalledOnce();
    });

    it("standardizes loading, empty, forbidden and readonly states", () => {
        const { rerender } = render(<LoadingState message="Carregando usuários..." overlay />);
        expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
        rerender(<EmptyState title="Nenhum usuário" description="Ajuste os filtros." action={<button type="button">Incluir</button>} />);
        expect(screen.getByText("Nenhum usuário")).toBeInTheDocument();
        rerender(<AccessState>Você não possui permissão.</AccessState>);
        expect(screen.getByRole("alert")).toHaveTextContent("Acesso não permitido");
        rerender(<AccessState type="readonly">Projeto arquivado.</AccessState>);
        expect(screen.getByRole("status")).toHaveTextContent("Modo somente leitura");
    });
});
