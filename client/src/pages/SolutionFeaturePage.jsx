import { lazy, Suspense } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { resolveFeatureProvider } from "../auth/featureProviders";
import { canAccessSolution, getFeatureBySlug, getSolutionBySlug } from "../auth/hubConfig";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useHubNavigation } from "../hooks/useHubNavigation";

import "../styles/workspace.css";

const ChamadoCreate = lazy(() => import("../components/ChamadoCreate"));
function FeatureLoadingFallback() {
    return (
        <section className="workspace-panel workspace-panel-wide" aria-live="polite" aria-busy="true">
            <span className="workspace-label">Hub</span>
            <h2>Carregando funcionalidade...</h2>
        </section>
    );
}

export default function SolutionFeaturePage() {
    const { slug, areaSlug } = useParams();
    const { loading, solutions } = useHubNavigation();
    const solution = getSolutionBySlug(solutions, slug);
    const unavailableChamadoOpening = !solution
        && slug === "controle-de-chamados"
        && areaSlug === "abrir-chamado";

    if (loading) {
        return (
            <div className="page-wrapper workspace-page">
                <Header />
                <main className="workspace-main">
                    <div className="container workspace-shell">
                        <section className="workspace-panel workspace-panel-wide">
                            <span className="workspace-label">Hub</span>
                            <h2>Carregando funcionalidade...</h2>
                        </section>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (unavailableChamadoOpening) {
        return (
            <div className="page-wrapper workspace-page">
                <Header />

                <main className="workspace-main">
                    <div className="container workspace-shell">
                        <div className="workspace-breadcrumb">
                            <Link to="/hub">Hub</Link>
                            <span>/</span>
                            <strong>Controle de chamados</strong>
                            <span>/</span>
                            <strong>Abrir chamado</strong>
                        </div>

                        <section className="workspace-feature-crud">
                            <Suspense fallback={<FeatureLoadingFallback />}>
                                <ChamadoCreate
                                    permissions={{ podeVisualizar: false, podeIncluir: false, podeAlterar: false, podeExcluir: false }}
                                    contractUnavailable
                                />
                            </Suspense>
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

    const directArea = getFeatureBySlug(solution, areaSlug);
    const routeProvider = directArea ? null : resolveFeatureProvider(`${solution.slug}.${areaSlug}`);
    const area = directArea || solution.areas.find((candidate) =>
        routeProvider && resolveFeatureProvider(candidate.providerKey, candidate.providerVersion)?.key === routeProvider.key
    );


    if (!area) {
        return <Navigate to={`/hub/${solution.slug}`} replace />;
    }

    const provider = resolveFeatureProvider(area.providerKey, area.providerVersion);
    const FeatureComponent = provider?.loader;

    return (
        <div className="page-wrapper workspace-page">
            <Header />

            <main className="workspace-main">
                <div className="container workspace-shell">
                    <div className="workspace-breadcrumb">
                        <Link to="/hub">Hub</Link>
                        <span>/</span>
                        <Link to={`/hub/${solution.slug}`}>{solution.title}</Link>
                        <span>/</span>
                        <strong>{area.title}</strong>
                    </div>

                    <section className="workspace-feature-crud">
                        {FeatureComponent ? (
                            <Suspense fallback={<FeatureLoadingFallback />}>
                                <FeatureComponent permissions={area} {...provider.props} />
                            </Suspense>
                        ) : (
                            <section className="workspace-panel workspace-panel-wide">
                                <span className="workspace-label">{area.label}</span>
                                <h2>{area.title}</h2>
                                <p>Funcionalidade sem tela vinculada no momento.</p>
                            </section>
                        )}
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
