import { useLayoutEffect, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getEmpresas } from "../../services/Auth/AuthService";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useAuth } from "../hooks/useAuth";

import "../styles/companyLogin.css";

export default function CompanyLogin() {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const empresaMeasureRef = useRef(null);

    const [empresas, setEmpresas] = useState([]);
    const [loadingEmpresas, setLoadingEmpresas] = useState(true);
    const [empresaBusca, setEmpresaBusca] = useState("");
    const [completionOffset, setCompletionOffset] = useState(0);
    const [showEmpresaSuggestions, setShowEmpresaSuggestions] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        empresaId: "",
        email: "",
        password: ""
    });

    useEffect(() => {
        let active = true;

        const loadEmpresas = async () => {
            try {
                const response = await getEmpresas();

                if (active) {
                    setEmpresas(response);
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError.message || "Nao foi possivel carregar as empresas.");
                }
            } finally {
                if (active) {
                    setLoadingEmpresas(false);
                }
            }
        };

        void loadEmpresas();

        return () => {
            active = false;
        };
    }, []);

    const handleChange = (event) => {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value
        }));
    };

    const normalize = (value = "") =>
        value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    const empresaSuggestions = empresas
        .filter((empresa) => {
            const term = normalize(empresaBusca);

            if (!term) {
                return true;
            }

            return normalize(empresa.nome || `Empresa ${empresa.id}`).includes(term);
        })
        .slice(0, 6);

    const firstSuggestion = empresaSuggestions[0] ?? null;
    const firstSuggestionName = firstSuggestion?.nome || (firstSuggestion ? `Empresa ${firstSuggestion.id}` : "");
    const canShowInlineCompletion =
        empresaBusca.trim().length > 0 &&
        firstSuggestionName &&
        normalize(firstSuggestionName).startsWith(normalize(empresaBusca)) &&
        normalize(firstSuggestionName) !== normalize(empresaBusca);
    const inlineCompletionText = canShowInlineCompletion
        ? firstSuggestionName.slice(empresaBusca.length)
        : "";

    useLayoutEffect(() => {
        if (!empresaMeasureRef.current) {
            setCompletionOffset(0);
            return;
        }

        setCompletionOffset(empresaMeasureRef.current.offsetWidth);
    }, [empresaBusca]);

    const selectEmpresa = (empresa) => {
        setEmpresaBusca(empresa.nome || `Empresa ${empresa.id}`);
        setForm((current) => ({
            ...current,
            empresaId: String(empresa.id)
        }));
        setShowEmpresaSuggestions(false);
        setError("");
    };

    const handleEmpresaSearch = (event) => {
        setEmpresaBusca(event.target.value);
        setForm((current) => ({
            ...current,
            empresaId: ""
        }));
        setShowEmpresaSuggestions(true);
    };

    const handleEmpresaKeyDown = (event) => {
        if (event.key !== "Tab" || !canShowInlineCompletion || !firstSuggestion) {
            return;
        }

        event.preventDefault();
        selectEmpresa(firstSuggestion);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const exactEmpresa = empresas.find((empresa) =>
            normalize(empresa.nome || `Empresa ${empresa.id}`) === normalize(empresaBusca)
        );
        const empresaId = form.empresaId || (exactEmpresa?.id ? String(exactEmpresa.id) : "");

        if (!empresaId || !form.email || !form.password) {
            setError("Selecione a empresa e informe email e senha.");
            return;
        }

        setSubmitting(true);

        try {
            await signIn({
                email: form.email.trim(),
                password: form.password,
                empresaId: Number(empresaId)
            });
            navigate("/hub");
        } catch (submitError) {
            setError(submitError.message || "Nao foi possivel autenticar nesta empresa.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-wrapper company-login-page">
            <Header />

            <main className="company-login-main">
                <section className="company-login-shell">
                    <span className="company-login-kicker">Acesso corporativo</span>
                    <h1>Selecione a empresa para continuar</h1>

                    <form className="company-login-form" onSubmit={handleSubmit}>
                        <label className="company-autocomplete-label">
                            Empresa
                            <div className="company-autocomplete">
                                <input
                                    name="empresaBusca"
                                    type="text"
                                    value={empresaBusca}
                                    onChange={handleEmpresaSearch}
                                    onKeyDown={handleEmpresaKeyDown}
                                    onFocus={() => setShowEmpresaSuggestions(true)}
                                    onBlur={() => {
                                        window.setTimeout(() => setShowEmpresaSuggestions(false), 120);
                                    }}
                                    disabled={loadingEmpresas || submitting}
                                    placeholder={loadingEmpresas ? "Carregando empresas..." : "Digite o nome da empresa"}
                                    autoComplete="off"
                                    role="combobox"
                                    aria-expanded={showEmpresaSuggestions}
                                    aria-controls="company-suggestions"
                                    aria-autocomplete="list"
                                    required
                                />
                                <span className="company-inline-measure" ref={empresaMeasureRef} aria-hidden="true">
                                    {empresaBusca}
                                </span>
                                {inlineCompletionText && (
                                    <span
                                        className="company-inline-completion"
                                        style={{ "--company-completion-offset": `${completionOffset}px` }}
                                        aria-hidden="true"
                                    >
                                        {inlineCompletionText}
                                    </span>
                                )}

                                {showEmpresaSuggestions && !loadingEmpresas && (
                                    <div className="company-suggestions" id="company-suggestions" role="listbox">
                                        {empresaSuggestions.length > 0 ? (
                                            empresaSuggestions.map((empresa) => (
                                                <button
                                                    key={empresa.id}
                                                    type="button"
                                                    role="option"
                                                    onMouseDown={(event) => event.preventDefault()}
                                                    onClick={() => selectEmpresa(empresa)}
                                                >
                                                    {empresa.nome || `Empresa ${empresa.id}`}
                                                </button>
                                            ))
                                        ) : (
                                            <span className="company-suggestions-empty">
                                                Nenhuma empresa encontrada.
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </label>

                        <label>
                            Email
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                disabled={submitting}
                                required
                            />
                        </label>

                        <label>
                            Senha
                            <input
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                disabled={submitting}
                                required
                            />
                        </label>

                        {error && <div className="company-login-error" role="alert">{error}</div>}

                        <button type="submit" disabled={submitting || loadingEmpresas}>
                            {submitting ? "Validando..." : "Entrar"}
                        </button>
                    </form>
                </section>
            </main>

            <Footer />
        </div>
    );
}
