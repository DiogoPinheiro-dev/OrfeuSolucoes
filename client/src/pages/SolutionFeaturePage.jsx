import { Link, Navigate, useParams } from "react-router-dom";

import { FEATURE_COMPONENT_REGISTRY, canAccessSolution, getFeatureBySlug, getSolutionBySlug } from "../auth/hubConfig";
import CategoriaChamadoManagement from "../components/CategoriaChamadoManagement";
import ChamadoConfiguracaoManagement from "../components/ChamadoConfiguracaoManagement";
import ChamadoCreate from "../components/ChamadoCreate";
import ChamadoDashboard from "../components/ChamadoDashboard";
import ChamadoRelatorio from "../components/ChamadoRelatorio";
import ChamadosArquivados from "../components/ChamadosArquivados";
import CompanyManagement from "../components/CompanyManagement";
import FeatureManagement from "../components/FeatureManagement";
import Footer from "../components/Footer";
import GroupManagement from "../components/GroupManagement";
import Header from "../components/Header";
import MeusChamados from "../components/MeusChamados";
import ResponsavelChamadoManagement from "../components/ResponsavelChamadoManagement";
import PainelAtendimento from "../components/PainelAtendimento";
import SolutionManagement from "../components/SolutionManagement";
import SlaChamadoManagement from "../components/SlaChamadoManagement";
import EmailSolucaoChamadoManagement from "../components/EmailSolucaoChamadoManagement";
import UserManagement from "../components/UserManagement";
import { useHubNavigation } from "../hooks/useHubNavigation";

import "../styles/workspace.css";

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
    "email-solucao-chamado-management": EmailSolucaoChamadoManagement
};

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
                            <FeatureComponent permissions={area} />
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
