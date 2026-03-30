import { useState, useEffect, useRef } from "react";
import "../styles/clientCarrosel.css";
import ClientCard from "./ClientCard"; // ADICIONADO

export default function ClientCarrosel({ clients = [] }) {
    const [current, setCurrent] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const intervalRef = useRef(null);

    const items = Array.isArray(clients)
        ? clients.map((c, i) => {
            if (typeof c === "string") return { id: `c-${i}`, logo: c, name: undefined, summary: undefined, link: undefined };
            if (c && typeof c === "object") return {
                id: c.id ?? `c-${i}`,
                logo: c.logo ?? "",
                name: c.name,
                summary: c.summary,
                link: c.link  // Adicionando a propriedade link
            };
            return { id: `c-${i}`, logo: "", name: undefined, summary: undefined, link: undefined };
        })
        : [];

    // uma página por cliente (cada página contém exatamente um item)
    const pages = items.length ? items.map(item => [item]) : [];
    const total = pages.length;

    const ANIM_DURATION = 350; // ms
    const AUTO_INTERVAL = 10000; // 10s

    function clearAuto() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }

    function startAuto() {
        clearAuto();
        if (total <= 1) return;
        intervalRef.current = setInterval(() => {
            setIsAnimating(true);
            setCurrent(c => (c + 1) % total);
            setTimeout(() => setIsAnimating(false), ANIM_DURATION);
        }, AUTO_INTERVAL);
    }

    useEffect(() => {
        startAuto();
        return () => clearAuto();
    }, [total]);

    useEffect(() => {
        if (pages.length === 0) {
            setCurrent(0);
            return;
        }
        if (current >= pages.length) setCurrent(0);
    }, [pages.length, current]);

    function resetAuto() {
        startAuto();
    }

    function prev() {
        if (isAnimating || total === 0) return;
        setIsAnimating(true);
        setCurrent(c => (c === 0 ? total - 1 : c - 1));
        setTimeout(() => setIsAnimating(false), ANIM_DURATION);
        resetAuto();
    }
    function next() {
        if (isAnimating || total === 0) return;
        setIsAnimating(true);
        setCurrent(c => (c + 1) % total);
        setTimeout(() => setIsAnimating(false), ANIM_DURATION);
        resetAuto();
    }

    function goTo(index) {
        if (isAnimating || index === current || pages.length === 0) return;
        setIsAnimating(true);
        setCurrent(index);
        setTimeout(() => setIsAnimating(false), ANIM_DURATION);
        resetAuto();
    }

    // cada página ocupa 100% da viewport do carrossel.
    const trackWidth = `${pages.length * 100}%`;
    const translateX = `-${current * 100}%`;

    if (!pages.length) {
        return null;
    }

    return (
        <div className="client-carrosel" aria-roledescription="carrossel de clientes">
            <div className="cc-controls">
                <button onClick={prev} disabled={isAnimating || pages.length <= 1} aria-label="Anterior cliente">‹</button>
                <button onClick={next} disabled={isAnimating || pages.length <= 1} aria-label="Próximo cliente">›</button>
            </div>

            <div className="cc-viewport">
                <div
                    className="cc-track"
                    style={{ transform: `translateX(${translateX})`, width: trackWidth }}
                >
                    {pages.map((page, idx) => (
                        // cada página ocupa 100% (uma logo por página)
                        <div className="cc-page" key={idx} style={{ width: `100%` }}>
                            {page.map(client => (
                                <div className="cc-card" key={client.id}>
                                    <ClientCard
                                        logo={client.logo}
                                        name={client.name}
                                        // summary={client.summary}
                                        link={client.link}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="cc-dots">
                {pages.map((_, i) => (
                    <button
                        key={i}
                        className={i === current ? 'active' : ''}
                        onClick={() => goTo(i)}
                        aria-label={`Página ${i + 1}`}
                        disabled={isAnimating}
                    />
                ))}
            </div>
        </div>
    );
}