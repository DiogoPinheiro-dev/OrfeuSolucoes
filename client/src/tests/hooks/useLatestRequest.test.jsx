// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useLatestRequest } from "../../hooks/useLatestRequest";

const deferred = () => {
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    return { promise, resolve };
};

describe("useLatestRequest", () => {
    it("aplica apenas a resposta mais recente", async () => {
        const first = deferred();
        const second = deferred();
        const onSuccess = vi.fn();
        const { result } = renderHook(() => useLatestRequest());

        let firstRun;
        let secondRun;
        act(() => {
            firstRun = result.current.run(() => first.promise, { onSuccess });
            secondRun = result.current.run(() => second.promise, { onSuccess });
        });
        await act(async () => { second.resolve("nova"); await secondRun; });
        await act(async () => { first.resolve("antiga"); await firstRun; });

        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledWith("nova");
    });

    it("não atualiza depois da desmontagem", async () => {
        const pending = deferred();
        const onSuccess = vi.fn();
        const { result, unmount } = renderHook(() => useLatestRequest());
        let request;

        act(() => { request = result.current.run(() => pending.promise, { onSuccess }); });
        unmount();
        await act(async () => { pending.resolve("resultado"); await request; });

        expect(onSuccess).not.toHaveBeenCalled();
    });
});
