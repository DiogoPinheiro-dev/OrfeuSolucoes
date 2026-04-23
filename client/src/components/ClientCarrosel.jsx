import { useEffect, useRef, useState } from "react";
import "../styles/clientCarrosel.css";
import ClientCard from "./ClientCard";

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
                link: c.link
            };
            return { id: `c-${i}`, logo: "", name: undefined, summary: undefined, link: undefined };
        })
        : [];

    const pages = items.length ? items.map((item) => [item]) : [];
    const total = pages.length;

    const ANIM_DURATION = 350;
    const AUTO_INTERVAL = 10000;

    function clearAuto() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }

    useEffect(() => {
        clearAuto();

        if (total <= 1) {
            return () => clearAuto();
        }

        intervalRef.current = setInterval(() => {
            setIsAnimating(true);
            setCurrent((value) => (value + 1) % total);
            setTimeout(() => setIsAnimating(false), ANIM_DURATION);
        }, AUTO_INTERVAL);

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
        clearAuto();

        if (total <= 1) {
            return;
        }

        intervalRef.current = setInterval(() => {
            setIsAnimating(true);
            setCurrent((value) => (value + 1) % total);
            setTimeout(() => setIsAnimating(false), ANIM_DURATION);
        }, AUTO_INTERVAL);
    }

    function prev() {
        if (isAnimating || total === 0) return;
        setIsAnimating(true);
        setCurrent((value) => (value === 0 ? total - 1 : value - 1));
        setTimeout(() => setIsAnimating(false), ANIM_DURATION);
        resetAuto();
    }

    function next() {
        if (isAnimating || total === 0) return;
        setIsAnimating(true);
        setCurrent((value) => (value + 1) % total);
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

    const trackWidth = `${pages.length * 100}%`;
    const translateX = `-${current * 100}%`;

    if (!pages.length) {
        return null;
    }

    return (
        <div className="client-carrosel" aria-roledescription="carrossel de clientes">
            <div className="cc-controls">
                <button onClick={prev} disabled={isAnimating || pages.length <= 1} aria-label="Anterior cliente">&lt;</button>
                <button onClick={next} disabled={isAnimating || pages.length <= 1} aria-label="Proximo cliente">&gt;</button>
            </div>

            <div className="cc-viewport">
                <div
                    className="cc-track"
                    style={{ transform: `translateX(${translateX})`, width: trackWidth }}
                >
                    {pages.map((page, idx) => (
                        <div className="cc-page" key={idx} style={{ width: "100%" }}>
                            {page.map((client) => (
                                <div className="cc-card" key={client.id}>
                                    <ClientCard
                                        logo={client.logo}
                                        name={client.name}
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
                        className={i === current ? "active" : ""}
                        onClick={() => goTo(i)}
                        aria-label={`Pagina ${i + 1}`}
                        disabled={isAnimating}
                    />
                ))}
            </div>
        </div>
    );
}
