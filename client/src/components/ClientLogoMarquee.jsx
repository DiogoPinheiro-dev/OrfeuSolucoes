import { useState } from "react";

import "../styles/clientLogoMarquee.css";

const CLIENT_MARQUEE_REPETITIONS = 8;

function getInitials(text) {
    if (!text) {
        return "CL";
    }

    const parts = String(text).trim().split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1]?.[0] || ""}`.toUpperCase();
}

function getClientName(client) {
    return client.nome || "Cliente";
}

function ClientLogoItem({ client, hidden }) {
    const [failed, setFailed] = useState(false);
    const showLogo = client.logo && !failed;
    const clientName = getClientName(client);

    return (
        <div className="client-logo-card" aria-hidden={hidden}>
            {showLogo ? (
                <img
                    src={client.logo}
                    alt={hidden ? "" : `Logo ${clientName}`}
                    loading="lazy"
                    onError={() => setFailed(true)}
                    onLoad={() => setFailed(false)}
                />
            ) : (
                <div className="client-initials client-marquee-initials" aria-hidden="true">
                    {getInitials(clientName)}
                </div>
            )}
        </div>
    );
}

export default function ClientLogoMarquee({ clients = [] }) {
    const marqueeClients = Array.from({ length: CLIENT_MARQUEE_REPETITIONS }, () => clients).flat();

    return (
        <div className="clients-marquee" aria-label="Clientes atendidos pela Orfeu Solucoes">
            <div className="clients-strip">
                {[0, 1].map((groupIndex) => (
                    <div className="clients-strip-group" key={groupIndex}>
                        {marqueeClients.map((client, clientIndex) => (
                            <ClientLogoItem
                                client={client}
                                key={`${client.id}-${groupIndex}-${clientIndex}`}
                                hidden={groupIndex > 0}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
