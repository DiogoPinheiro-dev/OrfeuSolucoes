import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

import "../styles/customDropdown.css";

export default function CustomDropdown({
    ariaLabel,
    className = "",
    disabled = false,
    menuPlacement = "default",
    name,
    onChange,
    options = [],
    placeholder = "Selecione",
    value = ""
}) {
    const id = useId();
    const rootRef = useRef(null);
    const menuRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [portalStyle, setPortalStyle] = useState({});
    const usePortal = menuPlacement === "right";
    const selectedValue = value === undefined || value === null ? "" : String(value);
    const selectedOption = useMemo(
        () => options.find((option) => String(option.value) === selectedValue),
        [options, selectedValue]
    );

    useEffect(() => {
        if (!open) return undefined;

        const handlePointerDown = (event) => {
            if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [open]);

    const positionPortal = useCallback(() => {
        const trigger = rootRef.current?.getBoundingClientRect();
        if (!trigger) return;

        const viewportPadding = 12;
        const gap = 10;
        const width = Math.min(Math.max(220, trigger.width), window.innerWidth - viewportPadding * 2);
        const hasRoomOnRight = window.innerWidth - trigger.right >= width + gap + viewportPadding;
        const hasRoomOnLeft = trigger.left >= width + gap + viewportPadding;
        const left = hasRoomOnRight
            ? trigger.right + gap
            : hasRoomOnLeft
                ? trigger.left - width - gap
                : Math.min(Math.max(viewportPadding, trigger.left), window.innerWidth - width - viewportPadding);
        const top = hasRoomOnRight || hasRoomOnLeft ? trigger.top : trigger.bottom + gap;

        setPortalStyle({ left, top, width });
    }, []);

    useEffect(() => {
        if (!open || !usePortal) return undefined;

        positionPortal();
        window.addEventListener("resize", positionPortal);
        window.addEventListener("scroll", positionPortal, true);

        return () => {
            window.removeEventListener("resize", positionPortal);
            window.removeEventListener("scroll", positionPortal, true);
        };
    }, [open, positionPortal, usePortal]);

    const emitChange = (nextValue) => {
        onChange?.({
            target: {
                name,
                type: "select-one",
                value: String(nextValue)
            }
        });
    };

    const selectOption = (option) => {
        if (disabled || option.disabled) return;
        emitChange(option.value);
        setOpen(false);
    };

    const handleButtonKeyDown = (event) => {
        if (disabled) return;

        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
        }

        if (event.key === "Escape") setOpen(false);
    };

    const handleOptionKeyDown = (event, option) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectOption(option);
        }

        if (event.key === "Escape") setOpen(false);
    };

    const menu = (
        <div
            ref={menuRef}
            className={`custom-dropdown__menu${usePortal ? " custom-dropdown__menu--hub custom-dropdown__menu--portal" : ""}`}
            style={usePortal ? portalStyle : undefined}
            role="listbox"
            id={`${id}-listbox`}
            aria-label={ariaLabel}
        >
            {options.map((option) => {
                const optionValue = String(option.value);
                const selected = optionValue === selectedValue;

                return (
                    <button
                        key={optionValue || option.label}
                        type="button"
                        className={`custom-dropdown__option${selected ? " custom-dropdown__option--selected" : ""}`}
                        role="option"
                        aria-selected={selected}
                        disabled={option.disabled}
                        onClick={() => selectOption(option)}
                        onKeyDown={(event) => handleOptionKeyDown(event, option)}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div
            ref={rootRef}
            className={`custom-dropdown${open ? " custom-dropdown--open" : ""}${disabled ? " custom-dropdown--disabled" : ""}${className ? ` ${className}` : ""}`}
        >
            {name && <input type="hidden" name={name} value={selectedValue} />}
            <button
                type="button"
                className="custom-dropdown__button"
                onClick={() => !disabled && setOpen((current) => !current)}
                onKeyDown={handleButtonKeyDown}
                disabled={disabled}
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={ariaLabel}
                aria-controls={`${id}-listbox`}
            >
                <span className={`custom-dropdown__value${selectedOption ? "" : " custom-dropdown__value--placeholder"}`}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown className="custom-dropdown__icon" aria-hidden="true" size={16} strokeWidth={2.2} />
            </button>

            {open && (usePortal ? createPortal(menu, document.body) : menu)}
        </div>
    );
}