import { useCallback, useEffect, useMemo, useRef } from "react";

export function useLatestRequest() {
    const mountedRef = useRef(true);
    const requestIdRef = useRef(0);

    useEffect(() => () => {
        mountedRef.current = false;
        requestIdRef.current += 1;
    }, []);

    const invalidate = useCallback(() => {
        requestIdRef.current += 1;
    }, []);

    const run = useCallback(async (request, handlers = {}) => {
        const requestId = ++requestIdRef.current;

        try {
            const value = await request();
            if (mountedRef.current && requestId === requestIdRef.current) {
                handlers.onSuccess?.(value);
                return { current: true, value };
            }
            return { current: false, value };
        } catch (error) {
            if (mountedRef.current && requestId === requestIdRef.current) {
                handlers.onError?.(error);
                return { current: true, error };
            }
            return { current: false, error };
        } finally {
            if (mountedRef.current && requestId === requestIdRef.current) {
                handlers.onSettled?.();
            }
        }
    }, []);

    return useMemo(() => ({ invalidate, run }), [invalidate, run]);
}
