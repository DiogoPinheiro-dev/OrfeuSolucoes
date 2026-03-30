import { useEffect, useState } from "react";

import { logout } from "../../services/Auth/AuthService";
import { isAuthenticated } from "../../services/Auth/session";

import logo from "../assets/Logo.ico";

import "../styles/header.css";

export default function Header() {
    const [auth, setAuth] = useState(isAuthenticated());
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth > 768 && open) {
                setOpen(false);
            }
        };

        const onAuth = () => setAuth(isAuthenticated());

        window.addEventListener("resize", onResize);
        window.addEventListener("orfeu:authChanged", onAuth);
        window.addEventListener("storage", onAuth);

        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orfeu:authChanged", onAuth);
            window.removeEventListener("storage", onAuth);
        };
    }, [open]);

    const handleLogout = async () => {
        await logout();
        setOpen(false);
    };

    const handleLogin = () => {
        window.dispatchEvent(new Event("orfeu:openLogin"));
    };

    return (
        <div className="container site-header">
            <header className="header-main py-3 mb-4" role="navigation" aria-label="Main navigation">
                <a href="/" className="header-brand text-decoration-none" aria-label="Orfeu Sistemas">
                    <img src={logo} alt="Orfeu Sistemas" className="brand-logo" />
                </a>

                <button
                    className="mobile-toggle"
                    aria-expanded={open}
                    aria-label="Abrir menu"
                    onClick={() => setOpen((isOpen) => !isOpen)}
                >
                    <span className="hamburger">&#9776;</span>
                </button>

                <ul className={`nav-links list-unstyled mb-0 ${open ? "open" : ""}`}>
                    {auth && (
                        <li>
                            <a
                                href="#features"
                                className="nav-link px-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const el = document.getElementById("features");
                                    if (el) {
                                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }
                                    setOpen(false);
                                }}
                            >
                                Servicos
                            </a>
                        </li>
                    )}

                    <li>
                        <a
                            href="#contato"
                            className="nav-link px-2"
                            onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById("contato");
                                if (el) {
                                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                                setOpen(false);
                            }}
                        >
                            Contato
                        </a>
                    </li>

                    <li>
                        <a
                            href="#highlights"
                            className="nav-link px-2"
                            onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById("highlights");
                                if (el) {
                                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                                setOpen(false);
                            }}
                        >
                            Destaques
                        </a>
                    </li>

                    <li>
                        <a
                            href="#about-company"
                            className="nav-link px-2"
                            onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById("about-company");
                                if (el) {
                                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                                setOpen(false);
                            }}
                        >
                            Quem Somos
                        </a>
                    </li>

                    <li>
                        <a
                            href="#clients"
                            className="nav-link px-2"
                            onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById("clients");
                                if (el) {
                                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                                setOpen(false);
                            }}
                        >
                            Nossos Clientes
                        </a>
                    </li>

                    {auth ? (
                        <li className="mobile-logout">
                            <button onClick={handleLogout}>
                                Sair
                            </button>
                        </li>
                    ) : (
                        <li className="mobile-singup-login">
                            <button onClick={handleLogin}>
                                Cadastrar/Entrar
                            </button>
                        </li>
                    )}
                </ul>

                <div className="header-actions" aria-hidden={false}>
                    {auth ? (
                        <button onClick={handleLogout} className="btn btn-outline-secondary header-logout">Sair</button>
                    ) : (
                        <button onClick={handleLogin} className="btn header-login">Cadastrar/Entrar</button>
                    )}
                </div>
            </header>

            {open && (
                <div
                    className="menu-overlay"
                    onClick={() => setOpen(false)}
                ></div>
            )}
        </div>
    );
}