import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, LogOut, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { ROLE_LABELS, USER_ROLE, getAreaAnchor, getSolutionsForUser } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";

import logo from "../assets/logo.ico";

import "../styles/header.css";

const LANDING_LINKS = [
    { id: "highlights", label: "Destaques" },
    { id: "about-company", label: "Quem Somos" },
    { id: "clients", label: "Clientes" },
    { id: "features", label: "Servicos", authOnly: true },
    { id: "contato", label: "Contato" }
];

const SCROLL_OFFSET = 75;

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, role, signOut, user } = useAuth();
    const [open, setOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(location.pathname !== "/");
    const [expandedSolutions, setExpandedSolutions] = useState({});

    const isHubView = location.pathname.startsWith("/hub");
    const isLandingView = location.pathname === "/";
    const isEcommerceView = location.pathname === "/ecommerce";
    const canShowEcommerceButton = !isAuthenticated || role === USER_ROLE.USUARIO;
    const hubSolutions = useMemo(() => getSolutionsForUser(user), [user]);
    const hubLinkClass = (path) => `nav-link px-2 nav-button ${location.pathname === path ? "nav-button--active" : ""}`;

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
        if (isEcommerceView) {
            window.dispatchEvent(new Event("orfeu:openLogin"));
        } else {
            navigate("/login");
        }
        closeMenu();
    };

    const toggleSolution = (slug) => {
        setExpandedSolutions((current) => ({
            ...current,
            [slug]: !current[slug]
        }));
    };

    const userDisplayName = user?.nome || user?.email || "Usuario";
    const userSubtitle = user?.empresa?.nome || ROLE_LABELS[role] || "Role";
    const renderLogoutButton = () => (
        <button
            onClick={handleLogout}
            className="header-icon-logout"
            type="button"
            aria-label="Sair"
            title="Sair"
        >
            <LogOut aria-hidden="true" size={20} strokeWidth={2} />
        </button>
    );
    const userCard = (
        <div className="hub-user-card">
            <span className="hub-user-avatar" aria-hidden="true">
                <UserRound size={18} strokeWidth={2.2} />
            </span>
            <span className="hub-user-text">
                {userDisplayName}
                <small>{userSubtitle}</small>
            </span>
            {renderLogoutButton()}
        </div>
    );

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

    useEffect(() => {
        if (!isHubView) {
            return;
        }

        const activeSolution = hubSolutions.find((solution) => location.pathname.startsWith(`/hub/${solution.slug}`));

        if (!activeSolution?.areas?.length) {
            return;
        }

        setExpandedSolutions((current) => ({
            ...current,
            [activeSolution.slug]: true
        }));
    }, [hubSolutions, isHubView, location.pathname]);

    return (
        <div className={`site-header ${isHubView ? "site-header--hub-sidebar" : ""} ${isPinned ? "site-header--pinned" : "site-header--overlay"} ${open ? "site-header--menu-open" : ""}`}>
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
                                <Link className={hubLinkClass("/hub")} to="/hub" onClick={closeMenu}>
                                    Hub
                                </Link>
                            </li>
                            {hubSolutions.map((solution) => {
                                const hasAreas = solution.areas?.length > 0;
                                const expanded = !!expandedSolutions[solution.slug];
                                const solutionPath = `/hub/${solution.slug}`;

                                return (
                                    <li className="hub-nav-item" key={solution.slug}>
                                        <div className={`hub-nav-row ${hasAreas ? "" : "hub-nav-row--single"}`}>
                                            <Link
                                                className={hubLinkClass(solutionPath)}
                                                to={solutionPath}
                                                onClick={closeMenu}
                                            >
                                                {solution.title}
                                            </Link>

                                            {hasAreas && (
                                                <button
                                                    type="button"
                                                    className="hub-submenu-toggle"
                                                    onClick={() => toggleSolution(solution.slug)}
                                                    aria-expanded={expanded}
                                                    aria-label={`${expanded ? "Fechar" : "Abrir"} funcionalidades de ${solution.title}`}
                                                >
                                                    {expanded ? (
                                                        <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
                                                    ) : (
                                                        <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {hasAreas && expanded && (
                                            <ul className="hub-submenu list-unstyled">
                                                {solution.areas.map((area) => (
                                                    <li key={area.title}>
                                                        <Link
                                                            to={`${solutionPath}/${getAreaAnchor(area.title)}`}
                                                            onClick={closeMenu}
                                                        >
                                                            {area.title}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                );
                            })}
                        </>
                    ) : (
                        <>
                            {LANDING_LINKS.filter((item) => !item.authOnly || isAuthenticated).map((item) => (
                                <li key={item.id}>
                                    <button
                                        className="nav-link px-2 nav-button"
                                        onClick={() => scrollToSection(item.id)}
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </>
                    )}

                    {canShowEcommerceButton && (
                        <li className="mobile-ecommerce">
                            <button
                                onClick={() => {
                                    navigate("/ecommerce");
                                    closeMenu();
                                }}
                            >
                                E-commerce
                            </button>
                        </li>
                    )}

                    {isAuthenticated ? (
                        <li className="mobile-auth-actions">
                            {!isHubView && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigate("/hub");
                                        closeMenu();
                                    }}
                                >
                                    Acessar hub
                                </button>
                            )}
                            {userCard}
                        </li>
                    ) : (
                        <li className="mobile-singup-login">
                            <button onClick={handleLogin}>Logar-se</button>
                        </li>
                    )}
                </ul>

                <div className="header-actions" aria-hidden={false}>
                    {isAuthenticated ? (
                        <>
                            {canShowEcommerceButton && (
                                <button onClick={() => navigate("/ecommerce")} className="btn header-ecommerce">
                                    E-commerce
                                </button>
                            )}
                            {!isHubView && (
                                <button onClick={() => navigate("/hub")} className="btn header-login">
                                    Acessar hub
                                </button>
                            )}
                            {userCard}
                        </>
                    ) : (
                        <>
                            {canShowEcommerceButton && (
                                <button onClick={() => navigate("/ecommerce")} className="btn header-ecommerce">
                                    E-commerce
                                </button>
                            )}
                            <button onClick={handleLogin} className="btn header-login">
                                Logar-se
                            </button>
                        </>
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
