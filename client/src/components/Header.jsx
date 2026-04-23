import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { ROLE_LABELS } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";

import logo from "../assets/logo.ico";

import "../styles/header.css";

const LANDING_LINKS = [
    { id: "highlights", label: "Destaques" },
    { id: "features", label: "Servicos", authOnly: true },
    { id: "about-company", label: "Quem Somos" },
    { id: "clients", label: "Clientes" },
    { id: "contato", label: "Contato" }
];

const SCROLL_OFFSET = 75;

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, role, signOut } = useAuth();
    const [open, setOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(location.pathname !== "/");

    const isHubView = location.pathname.startsWith("/hub");
    const isLandingView = location.pathname === "/";

    const closeMenu = () => setOpen(false);

    const scrollWithOffset = (element) => {
        const top = element.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
        window.scrollTo({
            top: Math.max(0, top),
            behavior: "smooth"
        });
    };

    const scrollToSection = (sectionId) => {
        if (location.pathname !== "/") {
            navigate("/", { state: { scrollTo: sectionId, scrollOffset: SCROLL_OFFSET } });
            closeMenu();
            return;
        }

        const el = document.getElementById(sectionId);

        if (el) {
            scrollWithOffset(el);
        }

        closeMenu();
    };

    const handleLogout = async () => {
        await signOut();
        closeMenu();
        navigate("/");
    };

    const handleLogin = () => {
        window.dispatchEvent(new Event("orfeu:openLogin"));
        closeMenu();
    };

    useEffect(() => {
        if (!isLandingView) {
            setIsPinned(true);
            return;
        }

        const syncHeaderState = () => {
            const hero = document.querySelector(".hero");

            if (!hero) {
                setIsPinned(false);
                return;
            }

            const heroHeight = hero.getBoundingClientRect().height;
            const headerHeight = parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")
            ) || 96;

            setIsPinned(window.scrollY >= Math.max(0, heroHeight - headerHeight));
        };

        syncHeaderState();
        window.addEventListener("scroll", syncHeaderState, { passive: true });
        window.addEventListener("resize", syncHeaderState);

        return () => {
            window.removeEventListener("scroll", syncHeaderState);
            window.removeEventListener("resize", syncHeaderState);
        };
    }, [isLandingView]);

    return (
        <div className={`site-header ${isPinned ? "site-header--pinned" : "site-header--overlay"}`}>
            <header className="header-main py-3 mb-4" role="navigation" aria-label="Main navigation">
                <Link to="/" className="header-brand text-decoration-none" aria-label="Orfeu Solucoes">
                    <img src={logo} alt="Orfeu Solucoes" className="brand-logo" />
                </Link>

                <button
                    className="mobile-toggle"
                    aria-expanded={open}
                    aria-label="Abrir menu"
                    onClick={() => setOpen((isOpen) => !isOpen)}
                >
                    <span className="hamburger">&#9776;</span>
                </button>

                <ul className={`nav-links list-unstyled mb-0 ${open ? "open" : ""}`}>
                    {isHubView ? (
                        <>
                            <li>
                                <button className="nav-link px-2 nav-button" onClick={() => navigate("/hub")}>
                                    Hub
                                </button>
                            </li>
                            <li>
                                <button className="nav-link px-2 nav-button" onClick={() => navigate("/")}>
                                    Home
                                </button>
                            </li>
                            {role && (
                                <li className="nav-role-chip">
                                    <span>{ROLE_LABELS[role]}</span>
                                </li>
                            )}
                        </>
                    ) : (
                        LANDING_LINKS.filter((item) => !item.authOnly || isAuthenticated).map((item) => (
                            <li key={item.id}>
                                <button
                                    className="nav-link px-2 nav-button"
                                    onClick={() => scrollToSection(item.id)}
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))
                    )}

                    {isAuthenticated ? (
                        <li className="mobile-logout">
                            <button onClick={handleLogout}>Sair</button>
                        </li>
                    ) : (
                        <li className="mobile-singup-login">
                            <button onClick={handleLogin}>Cadastrar/Entrar</button>
                        </li>
                    )}
                </ul>

                <div className="header-actions" aria-hidden={false}>
                    {isAuthenticated ? (
                        <>
                            {!isHubView && (
                                <button onClick={() => navigate("/hub")} className="btn header-login">
                                    Acessar hub
                                </button>
                            )}
                            <button onClick={handleLogout} className="btn btn-outline-secondary header-logout">
                                Sair
                            </button>
                        </>
                    ) : (
                        <button onClick={handleLogin} className="btn header-login">Cadastrar/Entrar</button>
                    )}
                </div>
            </header>

            {open && (
                <div
                    className="menu-overlay"
                    onClick={closeMenu}
                ></div>
            )}
        </div>
    );
}
