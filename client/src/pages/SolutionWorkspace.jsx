import { Link, Navigate, useParams } from "react-router-dom";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { canAccessSolution, getAreaAnchor, getSolutionBySlug, getUserGroupLabel } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { useHubNavigation } from "../hooks/useHubNavigation";

import "../styles/workspace.css";

export default function SolutionWorkspace() {
    const { slug } = useParams();
    const { user } = useAuth();
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

    const workspacePanels = solution.areas ?? [
        {
            label: "Status do módulo",
            title: "Base pronta para evolução",
            description: `Este espaço já está roteado e protegido por grupo. Agora vocês podem desenvolver a experiência real de ${solution.title} aqui dentro sem mexer na regra de acesso.`
        },
        {
            label: "Grupo atual",
            title: getUserGroupLabel(user),
            description: "O acesso foi liberado porque esse módulo faz parte das soluções disponíveis para o grupo do usuário."
        },
        {
            label: "Próximo passo sugerido",
            title: "Conectar o módulo a funcionalidades reais",
            description: "Podemos seguir implementando cada área com dados reais, menu interno, permissões mais granulares e integração com o backend conforme a prioridade da empresa.",
            wide: true
        }
    ];

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
                </div>
            </main>

            <Footer />
        </div>
    );
}
