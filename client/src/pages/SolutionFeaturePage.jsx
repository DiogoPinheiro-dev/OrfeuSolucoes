import { Link, Navigate, useParams } from "react-router-dom";

import { FEATURE_COMPONENT_REGISTRY, canAccessSolution, getFeatureBySlug, getSolutionBySlug } from "../auth/hubConfig";
import CompanyManagement from "../components/CompanyManagement";
import FeatureManagement from "../components/FeatureManagement";
import Footer from "../components/Footer";
import GroupManagement from "../components/GroupManagement";
import Header from "../components/Header";
import TestFeature from "../components/TestFeature";
import UserManagement from "../components/UserManagement";
import { useHubNavigation } from "../hooks/useHubNavigation";

import "../styles/workspace.css";

export default function SolutionFeaturePage() {
    const { slug, areaSlug } = useParams();
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
                            <h2>Carregando funcionalidade...</h2>
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

    const area = getFeatureBySlug(solution, areaSlug);

    if (!area) {
        return <Navigate to={`/hub/${solution.slug}`} replace />;
    }

    const componentKey = FEATURE_COMPONENT_REGISTRY[area.registryKey] || FEATURE_COMPONENT_REGISTRY[`${solution.slug}.${area.slug}`];
    const isUserManagement = componentKey === "user-management";
    const isCompanyManagement = componentKey === "company-management";
    const isGroupManagement = componentKey === "group-management";
    const isFeatureManagement = componentKey === "feature-management";
    const isTestFeature = componentKey === "test-feature";

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

                    {isUserManagement || isCompanyManagement || isGroupManagement || isFeatureManagement || isTestFeature ? (
                        <section className="workspace-feature-crud">
                            {isUserManagement ? (
                                <UserManagement permissions={area} />
                            ) : isCompanyManagement ? (
                                <CompanyManagement permissions={area} />
                            ) : isGroupManagement ? (
                                <GroupManagement permissions={area} />
                            ) : isTestFeature ? (
                                <TestFeature permissions={area} />
                            ) : (
                                <FeatureManagement permissions={area} />
                            )}
                        </section>
                    ) : (
                        <section className="workspace-panel workspace-panel-wide">
                            <span className="workspace-label">Funcionalidade</span>
                            <h2>Base pronta para implementacao</h2>
                            <p>
                                Esta pagina ja esta roteada e protegida. Podemos conectar aqui os dados reais,
                                formulÃ¡rios, permissoes e operacoes especificas de {area.title}.
                            </p>
                        </section>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
