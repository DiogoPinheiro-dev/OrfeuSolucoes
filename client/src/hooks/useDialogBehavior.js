import { useEffect, useRef } from "react";

let scrollLockCount = 0;
let originalBodyOverflow = "";

const focusableSelector = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
].join(",");

function focusableElements(container) {
    return Array.from(container?.querySelectorAll(focusableSelector) || []).filter((element) => !element.hidden);
}

export function useDialogBehavior({ open = true, onRequestClose, closeOnEscape = true, processing = false, initialFocusRef }) {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!open || typeof document === "undefined") return undefined;

        const previouslyFocused = document.activeElement;
        if (scrollLockCount === 0) {
            originalBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
        }
        scrollLockCount += 1;

        const focusTimer = window.setTimeout(() => {
            const target = initialFocusRef?.current || focusableElements(dialogRef.current)[0] || dialogRef.current;
            target?.focus();
        }, 0);

        return () => {
            window.clearTimeout(focusTimer);
            scrollLockCount = Math.max(0, scrollLockCount - 1);
            if (scrollLockCount === 0) document.body.style.overflow = originalBodyOverflow;
            if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) previouslyFocused.focus();
        };
    }, [initialFocusRef, open]);

    const onKeyDown = (event) => {
        if (event.key === "Escape" && closeOnEscape && !processing) {
            event.preventDefault();
            event.stopPropagation();
            onRequestClose?.();
            return;
        }

        if (event.key !== "Tab") return;
        const elements = focusableElements(dialogRef.current);
        if (!elements.length) {
            event.preventDefault();
            dialogRef.current?.focus();
            return;
        }

        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return { dialogRef, onKeyDown };
}
