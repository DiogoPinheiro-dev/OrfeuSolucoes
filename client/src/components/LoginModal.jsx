import { useEffect, useRef, useState } from "react";

import { login, register } from "../../services/Auth/AuthService";

import "../styles/loginModal.css";

export default function LoginModal({ open, onClose }) {
    const modalRef = useRef(null);

    const [mode, setMode] = useState("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        email: "",
        password: "",
        fullName: ""
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKey = (e) => {
            if (e.key === "Escape") {
                onClose?.();
            }
        };

        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) {
            setError("");
            setLoading(false);
        }
    }, [open]);

    if (!open) {
        return null;
    }

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const validate = () => {
        if (!form.email || !form.password) {
            setError("Preencha email e senha.");
            return false;
        }

        if (mode === "register" && !form.fullName.trim()) {
            setError("Preencha o nome completo para cadastro.");
            return false;
        }

        return true;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validate()) {
            return;
        }

        setLoading(true);

        try {
            if (mode === "register") {
                await register({
                    nome: form.fullName.trim(),
                    email: form.email.trim(),
                    password: form.password
                });
            }

            await login({
                email: form.email.trim(),
                password: form.password
            });

            onClose?.();
        } catch (submitError) {
            setError(submitError.message || "Nao foi possivel autenticar.");
        } finally {
            setLoading(false);
        }
    };

    const onOverlayClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose?.();
        }
    };

    return (
        <div
            className="lm-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={mode === "login" ? "Login" : "Cadastro"}
            onMouseDown={onOverlayClick}
        >
            <div
                className="lm-modal"
                ref={modalRef}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <header className="lm-header">
                    <h3>{mode === "login" ? "Entrar" : "Criar conta"}</h3>
                    <button className="lm-close" onClick={() => onClose?.()}>X</button>
                </header>

                <nav className="lm-tabs" aria-label="Modo">
                    <button
                        className={mode === "login" ? "active" : ""}
                        onClick={() => {
                            setMode("login");
                            setError("");
                        }}
                        aria-pressed={mode === "login"}
                    >
                        Login
                    </button>
                    <button
                        className={mode === "register" ? "active" : ""}
                        onClick={() => {
                            setMode("register");
                            setError("");
                        }}
                        aria-pressed={mode === "register"}
                    >
                        Cadastrar
                    </button>
                </nav>

                <form className="lm-form" onSubmit={onSubmit}>
                    <label className="lm-label">
                        Email
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </label>

                    {mode === "register" && (
                        <label className="lm-label">
                            Nome completo
                            <input
                                name="fullName"
                                type="text"
                                value={form.fullName}
                                onChange={handleChange}
                                required
                            />
                        </label>
                    )}

                    <label className="lm-label">
                        Senha
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    {error && <div className="lm-error" role="alert">{error}</div>}

                    <div className="lm-actions">
                        <button
                            type="submit"
                            className="lm-btn lm-btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
                        </button>
                        <button
                            type="button"
                            className="lm-btn lm-btn-ghost"
                            onClick={() => {
                                setMode((currentMode) => currentMode === "login" ? "register" : "login");
                                setError("");
                            }}
                        >
                            {mode === "login" ? "Quero me cadastrar" : "Ja tenho conta"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}