import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import "../styles/tooltip.css";

const SELECTOR = "[data-tooltip]";
const HOVER_DELAY_MS = 250;
const GAP = 10;
const MARGIN = 8;

const readTarget = (element) => ({
    element,
    title: element.getAttribute("data-tooltip-title") || "",
    text: element.getAttribute("data-tooltip") || ""
});

/**
 * Camada única de avisos do sistema. Montada uma vez na raiz, mostra um balão para qualquer elemento
 * com `data-tooltip` (ver utils/tooltip.js) ao passar o mouse ou receber foco pelo teclado.
 * O balão é visual: o nome acessível do elemento continua sendo a fonte para leitores de tela.
 */
export default function TooltipLayer() {
    const [current, setCurrent] = useState(null);
    const [position, setPosition] = useState(null);
    const bubbleRef = useRef(null);
    const timerRef = useRef(null);
    const currentRef = useRef(null);

    const hide = useCallback(() => {
        window.clearTimeout(timerRef.current);
        currentRef.current = null;
        setCurrent(null);
        setPosition(null);
    }, []);

    const show = useCallback((element, delay) => {
        window.clearTimeout(timerRef.current);
        const open = () => {
            if (!element.isConnected || !element.getAttribute("data-tooltip")) return;
            currentRef.current = element;
            setPosition(null);
            setCurrent(readTarget(element));
        };
        if (delay) timerRef.current = window.setTimeout(open, delay);
        else open();
    }, []);

    useEffect(() => {
        const handlePointerOver = (event) => {
            if (event.pointerType === "touch") return;
            const element = event.target.closest?.(SELECTOR);
            if (!element || element === currentRef.current) return;
            show(element, HOVER_DELAY_MS);
        };
        const handlePointerOut = (event) => {
            const element = event.target.closest?.(SELECTOR);
            if (!element || element.contains(event.relatedTarget)) return;
            hide();
        };
        const handleFocusIn = (event) => {
            const element = event.target.closest?.(SELECTOR);
            if (element && element.matches(":focus-visible")) show(element, 0);
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && currentRef.current) hide();
        };

        document.addEventListener("pointerover", handlePointerOver);
        document.addEventListener("pointerout", handlePointerOut);
        document.addEventListener("focusin", handleFocusIn);
        document.addEventListener("focusout", hide);
        document.addEventListener("pointerdown", hide);
        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("scroll", hide, true);
        window.addEventListener("resize", hide);
        return () => {
            window.clearTimeout(timerRef.current);
            document.removeEventListener("pointerover", handlePointerOver);
            document.removeEventListener("pointerout", handlePointerOut);
            document.removeEventListener("focusin", handleFocusIn);
            document.removeEventListener("focusout", hide);
            document.removeEventListener("pointerdown", hide);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("scroll", hide, true);
            window.removeEventListener("resize", hide);
        };
    }, [hide, show]);

    useLayoutEffect(() => {
        if (!current || !bubbleRef.current) return;
        const anchor = current.element.getBoundingClientRect();
        const bubble = bubbleRef.current.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
        const anchorCenter = anchor.left + anchor.width / 2;
        const left = Math.min(Math.max(MARGIN, anchorCenter - bubble.width / 2), Math.max(MARGIN, viewportWidth - bubble.width - MARGIN));
        const placeBelow = anchor.top - bubble.height - GAP < MARGIN;
        const top = placeBelow ? anchor.bottom + GAP : anchor.top - bubble.height - GAP;
        const arrow = Math.min(Math.max(12, anchorCenter - left), Math.max(12, bubble.width - 12));
        setPosition({ top, left, arrow, placement: placeBelow ? "bottom" : "top" });
    }, [current]);

    if (!current) return null;

    return createPortal(
        <div
            ref={bubbleRef}
            className={`ui-tooltip${position ? ` ui-tooltip--${position.placement} is-visible` : ""}`}
            role="tooltip"
            aria-hidden="true"
            style={position ? { top: position.top, left: position.left, "--ui-tooltip-arrow": `${position.arrow}px` } : undefined}
        >
            {current.title && <strong className="ui-tooltip-title">{current.title}</strong>}
            <span className="ui-tooltip-text">{current.text}</span>
        </div>,
        document.body
    );
}
