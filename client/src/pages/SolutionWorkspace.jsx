import { Link, Navigate, useParams } from "react-router-dom";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { ROLE_LABELS, canAccessSolution, getSolutionBySlug } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";

import "../styles/workspace.css";

export default function SolutionWorkspace() {
    const { slug } = useParams();
    const { role } = useAuth();

    const solution = getSolutionBySlug(slug);

    if (!solution) {
        return <Navigate to="/hub" replace />;
    }

    if (!canAccessSolution(role, slug)) {
        return <Navigate to="/hub" replace />;
    }

    return (
        <div className="page-wrapper workspace-page">
            <Header />

            <main className="workspace-main">
                <div className="container workspace-shell">
                    <div className="workspace-breadcrumb">
                        <Link to="/hub">Hub</Link>
                        <span>/</span>
                        <strong>{solution.title}</strong>
                    </div>

                    <section className="workspace-hero">
                        <span className="workspace-kicker">{solution.eyebrow}</span>
                        <h1>{solution.title}</h1>
                        <p>{solution.description}</p>
                    </section>

                    <section className="workspace-grid">
                        <article className="workspace-panel">
                            <span className="workspace-label">Status do modulo</span>
                            <h2>Base pronta para evolucao</h2>
                            <p>
                                Este espaco ja esta roteado e protegido por perfil. Agora voces podem desenvolver a experiencia
                                real de <strong>{solution.title}</strong> aqui dentro sem mexer na regra de acesso.
                            </p>
                        </article>

                        <article className="workspace-panel">
                            <span className="workspace-label">Perfil atual</span>
                            <h2>{ROLE_LABELS[role]}</h2>
                            <p>
                                O acesso foi liberado porque esse modulo faz parte do conjunto de ferramentas disponiveis para
                                o seu tipo de usuario.
                            </p>
                        </article>

                        <article className="workspace-panel workspace-panel-wide">
                            <span className="workspace-label">Proximo passo sugerido</span>
                            <h2>Conectar o modulo a funcionalidades reais</h2>
                            <p>
                                Podemos seguir implementando cada area com dados reais, menu interno, permissoes mais granulares
                                e integracao com o backend conforme a prioridade da empresa.
                            </p>
                        </article>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
