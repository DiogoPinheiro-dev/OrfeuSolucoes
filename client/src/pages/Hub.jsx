import Header from "../components/Header";
import Footer from "../components/Footer";
import { ROLE_LABELS, getSolutionsForUser } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";

import "../styles/hub.css";

export default function Hub() {
    const { user } = useAuth();
    const solutions = getSolutionsForUser(user);

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
                            {user?.empresa?.nome && <p>{user.empresa.nome}</p>}
                            <p>{solutions.length} solucao(oes) disponivel(is) neste momento.</p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
