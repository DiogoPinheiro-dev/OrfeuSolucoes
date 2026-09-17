import { ArrowUpRight } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { canAccessSolution, getSolutionBySlug, getWorkspaceEntries } from "../auth/hubConfig";
import { useHubNavigation } from "../hooks/useHubNavigation";

import "../styles/workspace.css";

const entryDescription = (entry) => entry.description
    || (entry.type === "group" ? entry.tabs.map((tab) => tab.label || tab.title).join(" · ") : "");

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

    const workspaceEntries = getWorkspaceEntries(solution);
    const hasAreas = workspaceEntries.length > 0;

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
                            {workspaceEntries.map((entry) => (
                                <Link
                                    className="workspace-panel workspace-panel-link"
                                    to={entry.path}
                                    key={entry.key}
                                >
                                    <span className="workspace-label">{entry.label}</span>
                                    <span className="workspace-panel-copy">
                                        <h2>{entry.title}</h2>
                                        <p>{entryDescription(entry)}</p>
                                    </span>
                                    <span className="workspace-panel-action">
                                        <ArrowUpRight size={18} aria-hidden="true" />
                                    </span>
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
