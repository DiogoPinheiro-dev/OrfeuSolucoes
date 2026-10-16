// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TooltipLayer from "../../components/TooltipLayer";
import { actionAvailabilityProps, tooltipProps } from "../../utils/tooltip";

const tooltip = () => document.querySelector(".ui-tooltip");

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe("TooltipLayer", () => {
    it("mostra o título e o motivo depois de uma pausa sobre o elemento e some ao sair", () => {
        render(<><TooltipLayer /><button type="button" {...actionAvailabilityProps("Aprovar selecionados", "Marque apontamentos enviados.")}>Aprovar</button></>);
        const button = screen.getByRole("button", { name: "Aprovar selecionados. Indisponível: Marque apontamentos enviados." });

        fireEvent.pointerOver(button, { pointerType: "mouse" });
        expect(tooltip()).not.toBeInTheDocument();
        act(() => vi.advanceTimersByTime(250));
        expect(tooltip()).toHaveClass("is-visible");
        expect(tooltip()).toHaveAttribute("aria-hidden", "true");
        expect(tooltip()).toHaveTextContent("Aprovar selecionadosMarque apontamentos enviados.");

        fireEvent.pointerOut(button, { relatedTarget: document.body });
        expect(tooltip()).not.toBeInTheDocument();
    });

    it("não abre no toque nem quando o ponteiro sai antes da pausa", () => {
        render(<><TooltipLayer /><span {...tooltipProps("Texto completo")}>Texto</span></>);
        const span = screen.getByText("Texto");

        fireEvent.pointerOver(span, { pointerType: "touch" });
        act(() => vi.advanceTimersByTime(500));
        expect(tooltip()).not.toBeInTheDocument();

        fireEvent.pointerOver(span, { pointerType: "mouse" });
        fireEvent.pointerOut(span, { relatedTarget: document.body });
        fireEvent.pointerDown(document.body);
        act(() => vi.advanceTimersByTime(500));
        expect(tooltip()).not.toBeInTheDocument();
    });

    it("fecha com Escape e ao rolar a página", () => {
        render(<><TooltipLayer /><button type="button" {...tooltipProps("Notificações")}>Sino</button></>);
        const button = screen.getByRole("button", { name: "Sino" });

        fireEvent.pointerOver(button, { pointerType: "mouse" });
        act(() => vi.advanceTimersByTime(250));
        expect(tooltip()).toHaveTextContent("Notificações");
        fireEvent.keyDown(document, { key: "Escape" });
        expect(tooltip()).not.toBeInTheDocument();

        fireEvent.pointerOver(document.body, { pointerType: "mouse" });
        fireEvent.pointerOver(button, { pointerType: "mouse" });
        act(() => vi.advanceTimersByTime(250));
        fireEvent.scroll(window);
        expect(tooltip()).not.toBeInTheDocument();
    });

    it("sem texto, não gera atributos de aviso", () => {
        expect(tooltipProps("")).toEqual({});
        expect(actionAvailabilityProps("Incluir", "")).toEqual({ "aria-label": "Incluir", disabled: false, "data-tooltip": "Incluir" });
    });
});
