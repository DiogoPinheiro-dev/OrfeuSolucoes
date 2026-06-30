import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { getLoginCompanies } from "../../services/Auth/AuthService";
import Footer from "../components/Footer";
import Header from "../components/Header";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../hooks/useAuth";

import "../styles/companyLogin.css";
const getCompanySolutionLabels = (company) => [...new Set((company.solucaoNomes || []).filter(Boolean))];

export default function CompanyLogin() {
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [credentialsValidated, setCredentialsValidated] = useState(false);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        loginOrEmail: "",
        password: ""
    });

    const handleChange = (event) => {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value
        }));
    };

    const resetCompanyStep = () => {
        setCompanies([]);
        setSelectedCompanyId("");
        setCredentialsValidated(false);
    };

    const handleCredentialsSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.loginOrEmail.trim() || !form.password) {
            setError("Informe login ou e-mail e senha.");
            return;
        }

        setLoadingCompanies(true);
        resetCompanyStep();

        try {
            const linkedCompanies = await getLoginCompanies({
                loginOrEmail: form.loginOrEmail.trim(),
                password: form.password
            });

            if (!linkedCompanies.length) {
                setError("Este usuário não possui empresas vinculadas.");
                return;
            }

            setCompanies(linkedCompanies);
            setSelectedCompanyId(String(linkedCompanies[0].id));
            setCredentialsValidated(true);
        } catch (submitError) {
            setError(submitError.message || "Não foi possível validar as credenciais.");
        } finally {
            setLoadingCompanies(false);
        }
    };

    const handleCompanySubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!selectedCompanyId) {
            setError("Selecione a empresa para continuar.");
            return;
        }

        setSubmitting(true);

        try {
            await signIn({
                loginOrEmail: form.loginOrEmail.trim(),
                password: form.password,
                empresaId: Number(selectedCompanyId)
            });
            navigate("/hub");
        } catch (submitError) {
            setError(submitError.message || "Não foi possível autenticar nesta empresa.");
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
                    <h1>{credentialsValidated ? "Selecione a empresa" : "Entre com seu login"}</h1>
                    <p className="company-login-helper">
                        {credentialsValidated
                            ? "Mostramos apenas as empresas vinculadas ao seu usuário."
                            : "Informe seu login ou e-mail para validarmos seu acesso antes da escolha da empresa."}
                    </p>

                    {!credentialsValidated ? (
                        <form className="company-login-form" onSubmit={handleCredentialsSubmit}>
                            <label>
                                Login ou e-mail
                                <input
                                    name="loginOrEmail"
                                    type="text"
                                    value={form.loginOrEmail}
                                    onChange={handleChange}
                                    disabled={loadingCompanies}
                                    autoComplete="username"
                                    required
                                />
                            </label>

                            <label>
                                Senha
                                <PasswordInput
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    disabled={loadingCompanies}
                                    autoComplete="current-password"
                                    required
                                />
                            </label>

                            {error && <div className="company-login-error" role="alert">{error}</div>}

                            <button type="submit" disabled={loadingCompanies}>
                                {loadingCompanies ? "Validando..." : "Continuar"}
                            </button>
                        </form>
                    ) : (
                        <form className="company-login-form" onSubmit={handleCompanySubmit}>
                            <div className="company-login-companies" role="radiogroup" aria-label="Empresas vinculadas">
                                {companies.map((company) => (
                                    <label className="company-login-company" key={company.id}>
                                        <input
                                            type="radio"
                                            name="empresaId"
                                            value={company.id}
                                            checked={selectedCompanyId === String(company.id)}
                                            onChange={(event) => setSelectedCompanyId(event.target.value)}
                                            disabled={submitting}
                                        />
                                        <span>
                                            <strong>{company.nome || `Empresa ${company.id}`}</strong>
                                            <small>
                                                {getCompanySolutionLabels(company).join(" | ") || "Sem soluções contratadas"}
                                            </small>
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {error && <div className="company-login-error" role="alert">{error}</div>}

                            <div className="company-login-actions">
                                <button type="button" onClick={resetCompanyStep} disabled={submitting}>
                                    Voltar
                                </button>
                                <button type="submit" disabled={submitting}>
                                    {submitting ? "Entrando..." : "Acessar hub"}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}
