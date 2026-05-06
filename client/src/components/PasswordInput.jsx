import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import "../styles/passwordInput.css";

export default function PasswordInput({ className = "", disabled, ...props }) {
    const [visible, setVisible] = useState(false);
    const inputType = visible ? "text" : "password";
    const toggleLabel = visible ? "Ocultar senha" : "Mostrar senha";

    return (
        <div className={`password-input ${className}`.trim()}>
            <input
                {...props}
                type={inputType}
                disabled={disabled}
            />
            <button
                type="button"
                className="password-input-toggle"
                onClick={() => setVisible((current) => !current)}
                aria-label={toggleLabel}
                aria-pressed={visible}
                disabled={disabled}
            >
                {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
        </div>
    );
}
