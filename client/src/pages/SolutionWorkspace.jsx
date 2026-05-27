import { Link, Navigate, useParams } from "react-router-dom";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { canAccessSolution, getAreaAnchor, getSolutionBySlug } from "../auth/hubConfig";
import { useHubNavigation } from "../hooks/useHubNavigation";

import "../styles/workspace.css";

export default function SolutionWorkspace() {
    const { slug } = useParams();
    const { loading, solutions } = useHubNavigation();

    const solution = getSolutionBySlug(solutions, slug);

    if (loading) {
        return (
            <div className="page-wrapper workspace-page">
                <Header />
                <main className="workspace-main">
                    <div className="container workspace-shell">
                        <section className="workspace-panel workspace-panel-wide">
                            <span className="workspace-label">Hub</span>
                            <h2>Carregando soluções...</h2>
                        </section>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!solution) {
        return <Navigate to="/hub" replace />;
    }

    if (!canAccessSolution(solutions, slug)) {
        return <Navigate to="/hub" replace />;
    }

    const workspacePanels = solution.areas || [];
    const hasAreas = workspacePanels.length > 0;

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

                    {hasAreas ? (
                        <section className="workspace-grid">
                            {workspacePanels.map((panel) => (
                                <Link
                                    className={`workspace-panel workspace-panel-link ${panel.wide ? "workspace-panel-wide" : ""}`}
                                    to={`/hub/${solution.slug}/${panel.slug || getAreaAnchor(panel.title)}`}
                                    key={panel.title}
                                >
                                    <span className="workspace-label">{panel.label}</span>
                                    <h2>{panel.title}</h2>
                                    <p>{panel.description}</p>
                                    <strong>Acessar funcionalidade</strong>
                                </Link>
                            ))}
                        </section>
                    ) : (
                        <section className="workspace-panel workspace-panel-wide">
                            <span className="workspace-label">{solution.eyebrow}</span>
                            <h2>Nenhuma funcionalidade cadastrada</h2>
                            <p className="workspace-empty-note">
                                Cadastre funcionalidades para esta solução quando quiser disponibilizar telas específicas.
                            </p>
                        </section>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
