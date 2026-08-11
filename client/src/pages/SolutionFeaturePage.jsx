import { lazy, Suspense } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { FEATURE_COMPONENT_REGISTRY, canAccessSolution, getFeatureBySlug, getSolutionBySlug } from "../auth/hubConfig";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useHubNavigation } from "../hooks/useHubNavigation";

import "../styles/workspace.css";

const CategoriaChamadoManagement = lazy(() => import("../components/CategoriaChamadoManagement"));
const ChamadoConfiguracaoManagement = lazy(() => import("../components/ChamadoConfiguracaoManagement"));
const ChamadoCreate = lazy(() => import("../components/ChamadoCreate"));
const ChamadoDashboard = lazy(() => import("../components/ChamadoDashboard"));
const ChamadoRelatorio = lazy(() => import("../components/ChamadoRelatorio"));
const ChamadosArquivados = lazy(() => import("../components/ChamadosArquivados"));
const CompanyManagement = lazy(() => import("../components/CompanyManagement"));
const FeatureManagement = lazy(() => import("../components/FeatureManagement"));
const GroupManagement = lazy(() => import("../components/GroupManagement"));
const MeusChamados = lazy(() => import("../components/MeusChamados"));
const PainelAtendimento = lazy(() => import("../components/PainelAtendimento"));
const ResponsavelChamadoManagement = lazy(() => import("../components/ResponsavelChamadoManagement"));
const ProjectManagement = lazy(() => import("../components/ProjectManagement"));
const BacklogManagement = lazy(() => import("../components/BacklogManagement"));
const SprintManagement = lazy(() => import("../components/SprintManagement"));
const MarcoEntregaManagement = lazy(() => import("../components/MarcoEntregaManagement"));
const CronogramaManagement = lazy(() => import("../components/CronogramaManagement"));
const ProjectCommunicationManagement = lazy(() => import("../components/ProjectCommunicationManagement"));
const ProjectBudgetManagement = lazy(() => import("../components/ProjectBudgetManagement"));
const ProjectResourcePlanningManagement = lazy(() => import("../components/ProjectResourcePlanningManagement"));
const SolutionManagement = lazy(() => import("../components/SolutionManagement"));
const SlaChamadoManagement = lazy(() => import("../components/SlaChamadoManagement"));
const GoogleEmailManagement = lazy(() => import("../components/GoogleEmailManagement"));
const UserManagement = lazy(() => import("../components/UserManagement"));

const FEATURE_COMPONENTS = {
    "user-management": UserManagement,
    "company-management": CompanyManagement,
    "group-management": GroupManagement,
    "solution-management": SolutionManagement,
    "feature-management": FeatureManagement,
    "chamado-create": ChamadoCreate,
    "meus-chamados": MeusChamados,
    "painel-atendimento": PainelAtendimento,
    "chamados-arquivados": ChamadosArquivados,
    "chamado-dashboard": ChamadoDashboard,
    "chamado-relatorio": ChamadoRelatorio,
    "categoria-chamado-management": CategoriaChamadoManagement,
    "tipo-chamado-management": (props) => <ChamadoConfiguracaoManagement {...props} kind="tipos" />,
    "prioridade-chamado-management": (props) => <ChamadoConfiguracaoManagement {...props} kind="prioridades" />,
    "responsavel-chamado-management": ResponsavelChamadoManagement,
    "sla-chamado-management": SlaChamadoManagement,
    "email-solucao-chamado-management": GoogleEmailManagement,
    "project-management": ProjectManagement,
    "project-backlog": BacklogManagement,
    "project-sprints": SprintManagement,
    "project-milestones-deliveries": MarcoEntregaManagement,
    "project-schedule-gantt": CronogramaManagement,
    "project-communication": ProjectCommunicationManagement,
    "project-resource-planning": ProjectResourcePlanningManagement,
    "project-budget": ProjectBudgetManagement
};

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
    const FeatureComponent = FEATURE_COMPONENTS[componentKey];

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
                                <FeatureComponent permissions={area} />
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
