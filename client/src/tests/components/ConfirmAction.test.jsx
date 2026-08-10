// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useConfirmAction } from "../../hooks/useConfirmAction";

afterEach(cleanup);

function Harness({ onResult }) {
    const { requestConfirmation, confirmationDialog } = useConfirmAction();
    const ask = async () => onResult(await requestConfirmation({ title: "Excluir registro", message: "Confirma a exclusão?", confirmLabel: "Excluir", variant: "destructive" }));
    return <><button type="button" onClick={ask}>Solicitar confirmação</button>{confirmationDialog}</>;
}

describe("useConfirmAction", () => {
    it("resolves true only after explicit confirmation", async () => {
        const user = userEvent.setup();
        const onResult = vi.fn();
        render(<Harness onResult={onResult} />);
        await user.click(screen.getByRole("button", { name: "Solicitar confirmação" }));
        expect(screen.getByRole("alertdialog", { name: "Excluir registro" })).toHaveClass("confirm-dialog--destructive");
        await user.click(screen.getByRole("button", { name: "Excluir" }));
        expect(onResult).toHaveBeenCalledWith(true);
    });

    it("resolves false when cancelled", async () => {
        const user = userEvent.setup();
        const onResult = vi.fn();
        render(<Harness onResult={onResult} />);
        await user.click(screen.getByRole("button", { name: "Solicitar confirmação" }));
        await user.click(screen.getByRole("button", { name: "Cancelar" }));
        expect(onResult).toHaveBeenCalledWith(false);
    });
});
