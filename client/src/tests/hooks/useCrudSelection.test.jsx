// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCrudSelection } from "../../hooks/useCrudSelection";

const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe("useCrudSelection", () => {
    it("mantém seleção de linha separada dos registros marcados para exclusão", () => {
        const { result } = renderHook(() => useCrudSelection(rows));

        act(() => result.current.selectRow(2));
        expect(result.current.selectedId).toBe(2);
        expect(result.current.selectedIds).toEqual([]);

        act(() => result.current.toggleSelected(1));
        expect(result.current.selectedId).toBe(1);
        expect(result.current.selectedIds).toEqual([1]);

        act(() => result.current.toggleSelected(1));
        expect(result.current.selectedIds).toEqual([]);
    });

    it("marca e desmarca somente as linhas visíveis sem perder seleções de outra página", () => {
        const { result } = renderHook(() => useCrudSelection(rows));

        act(() => result.current.toggleSelected(3));
        act(() => result.current.toggleVisible(true, rows.slice(0, 2)));
        expect(result.current.selectedId).toBe(1);
        expect(result.current.selectedIds).toEqual([3, 1, 2]);

        act(() => result.current.toggleVisible(false, rows.slice(0, 2)));
        expect(result.current.selectedIds).toEqual([3]);
    });

    it("remove seleções que deixam de existir após filtro, reload ou exclusão", () => {
        const { result, rerender } = renderHook(
            ({ visibleRows }) => useCrudSelection(visibleRows),
            { initialProps: { visibleRows: rows } }
        );

        act(() => {
            result.current.selectRow(2);
            result.current.toggleSelected(2);
            result.current.toggleSelected(3);
        });

        rerender({ visibleRows: [rows[0], rows[2]] });
        expect(result.current.selectedId).toBe(3);
        expect(result.current.selectedIds).toEqual([3]);

        act(() => result.current.resetSelection());
        expect(result.current.selectedId).toBeNull();
        expect(result.current.selectedIds).toEqual([]);
    });

    it("aceita identificadores derivados sem depender da propriedade id", () => {
        const keyedRows = [{ key: "alpha" }, { key: "beta" }];
        const getRowId = (row) => row.key;
        const { result } = renderHook(() => useCrudSelection(keyedRows, getRowId));

        act(() => result.current.toggleVisible(true, keyedRows));
        expect(result.current.selectedId).toBe("alpha");
        expect(result.current.selectedIds).toEqual(["alpha", "beta"]);
    });
});
