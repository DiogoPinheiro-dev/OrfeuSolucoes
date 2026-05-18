import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import "../styles/customDropdown.css";

export default function CustomDropdown({
    ariaLabel,
    className = "",
    disabled = false,
    name,
    onChange,
    options = [],
    placeholder = "Selecione",
    value = ""
}) {
    const id = useId();
    const rootRef = useRef(null);
    const [open, setOpen] = useState(false);
    const selectedValue = value === undefined || value === null ? "" : String(value);
    const selectedOption = useMemo(
        () => options.find((option) => String(option.value) === selectedValue),
        [options, selectedValue]
    );

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);

        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [open]);

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
        if (disabled || option.disabled) {
            return;
        }

        emitChange(option.value);
        setOpen(false);
    };

    const handleButtonKeyDown = (event) => {
        if (disabled) {
            return;
        }

        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
        }

        if (event.key === "Escape") {
            setOpen(false);
        }
    };

    const handleOptionKeyDown = (event, option) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectOption(option);
        }

        if (event.key === "Escape") {
            setOpen(false);
        }
    };

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

            {open && (
                <div className="custom-dropdown__menu" role="listbox" id={`${id}-listbox`} aria-label={ariaLabel}>
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
            )}
        </div>
    );
}
