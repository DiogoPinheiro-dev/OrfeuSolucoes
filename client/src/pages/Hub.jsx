import { Link } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { ROLE_LABELS, getSolutionsForRole } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";

import "../styles/hub.css";

export default function Hub() {
    const { user, role } = useAuth();
    const solutions = getSolutionsForRole(role);

    return (
        <div className="page-wrapper hub-page">
            <Header />

            <main className="hub-main">
                <section className="hub-hero">
                    <div className="container hub-hero-inner">
                        <div>
                            <span className="hub-kicker">Hub de Desenvolvimento</span>
                            <h1>Bem-vindo, {user?.nome || user?.email}.</h1>
                        </div>

                        <div className="hub-summary-card">
                            <span className="hub-summary-label">Acesso ativo</span>
                            <strong>{ROLE_LABELS[role]}</strong>
                            <p>{solutions.length} solucao(oes) disponivel(is) neste momento.</p>
                        </div>
                    </div>
                </section>

                <section className="hub-grid-section">
                    <div className="container">
                        <div className="hub-section-header">
                            <div>
                                <span className="hub-eyebrow">Solucoes</span>
                                <h2>Escolha por onde quer continuar</h2>
                            </div>
                        </div>

                        <div className="hub-grid">
                            {solutions.map((solution) => (
                                <article className="hub-card" key={solution.slug}>
                                    <div className="hub-card-top">
                                        <span>{solution.eyebrow}</span>
                                        <strong>{solution.status}</strong>
                                    </div>
                                    <h3>{solution.title}</h3>
                                    <p>{solution.description}</p>
                                    <Link to={`/hub/${solution.slug}`} className="hub-card-link">
                                        Abrir modulo
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
