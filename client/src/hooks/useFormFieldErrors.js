import { useCallback, useEffect, useRef, useState } from "react";

const messageFromError = (error, fallback) => {
    if (typeof error === "string") return error;
    return error?.message || fallback;
};

const normalizeFieldErrors = (fieldErrors) => Object.fromEntries(
    Object.entries(fieldErrors || {})
        .map(([field, message]) => [field, Array.isArray(message) ? message.join(" ") : String(message || "")])
        .filter(([, message]) => message)
);

export function useFormFieldErrors({
    formId,
    fieldOrder = [],
    fieldTabs = {},
    fieldMatchers = {},
    setActiveTab
}) {
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [focusRequest, setFocusRequest] = useState(null);
    const focusSequence = useRef(0);

    useEffect(() => {
        if (!focusRequest) return undefined;

        const timer = window.setTimeout(() => {
            const form = document.getElementById(formId);
            const named = form?.elements?.namedItem(focusRequest.field);
            const field = form?.querySelector(`[data-form-field="${focusRequest.field}"]`)
                || (named instanceof RadioNodeList ? named[0] : named);

            field?.focus?.();
            field?.scrollIntoView?.({ block: "center", behavior: "smooth" });
        }, 0);

        return () => window.clearTimeout(timer);
    }, [focusRequest, formId]);

    const showFieldErrors = useCallback((errors) => {
        const normalized = normalizeFieldErrors(errors);
        const firstField = fieldOrder.find((field) => normalized[field]) || Object.keys(normalized)[0];

        setFieldErrors(normalized);
        setGeneralError("");

        if (firstField) {
            if (fieldTabs[firstField]) setActiveTab?.(fieldTabs[firstField]);
            focusSequence.current += 1;
            setFocusRequest({ field: firstField, sequence: focusSequence.current });
        }
    }, [fieldOrder, fieldTabs, setActiveTab]);

    const applyError = useCallback((error, fallback) => {
        const structured = normalizeFieldErrors(error?.fieldErrors);
        if (Object.keys(structured).length) {
            showFieldErrors(structured);
            return true;
        }

        const message = messageFromError(error, fallback);
        const inferred = {};
        for (const [field, matchers] of Object.entries(fieldMatchers)) {
            if ((matchers || []).some((matcher) => matcher.test(message))) inferred[field] = message;
        }

        if (Object.keys(inferred).length) {
            showFieldErrors(inferred);
            return true;
        }

        setFieldErrors({});
        setGeneralError(message);
        return false;
    }, [fieldMatchers, showFieldErrors]);

    const clearFieldError = useCallback((field) => {
        setFieldErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    }, []);

    const clearErrors = useCallback(() => {
        setFieldErrors({});
        setGeneralError("");
        setFocusRequest(null);
    }, []);

    const fieldErrorProps = useCallback((field) => ({
        "aria-invalid": fieldErrors[field] ? "true" : undefined,
        "aria-describedby": fieldErrors[field] ? `${formId}-${field}-error` : undefined
    }), [fieldErrors, formId]);

    return {
        applyError,
        clearErrors,
        clearFieldError,
        fieldErrorProps,
        fieldErrors,
        generalError,
        showFieldErrors
    };
}
