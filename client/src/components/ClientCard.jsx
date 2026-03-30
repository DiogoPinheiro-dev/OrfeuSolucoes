import { useState } from "react";
import "../styles/clientCard.css";

export default function ClientCard({ logo, name, /*summary,*/ link }) {
    const [failed, setFailed] = useState(false);

    function getInitials(text) {
        if (!text) return "CL";
        const parts = String(text).trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + (parts[1][0] || "")).toUpperCase();
    }

    const initials = getInitials(name);

    const content = logo && !failed ? (
        <img
            src={logo}
            alt={name || "Cliente"}
            className="client-logo"
            loading="lazy"
            onError={() => setFailed(true)}
            onLoad={() => setFailed(false)}
        />
    ) : (
        <div className="client-initials" aria-hidden="true">{initials}</div>
    );

    return (
        <div className="client-card">
            <div className="client-left">
                {link ? (
                    // Link apenas no logo
                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="client-link"
                        aria-label={name ? `Abrir site de ${name}` : "Abrir site do cliente"}
                        title={name ? `Abrir site de ${name}` : "Abrir site do cliente"}
                    >
                        {content}
                    </a>
                ) : (
                    content
                )}
                {name && <div className="client-name">{name}</div>}
            </div>
        </div>
    );
}