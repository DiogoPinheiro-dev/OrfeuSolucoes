import { Link, Navigate, useParams } from "react-router-dom";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { ROLE_LABELS, canAccessSolution, getAreaAnchor, getSolutionBySlug } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";

import "../styles/workspace.css";

export default function SolutionWorkspace() {
    const { slug } = useParams();
    const { user, role } = useAuth();

    const solution = getSolutionBySlug(slug);

    if (!solution) {
        return <Navigate to="/hub" replace />;
    }

    if (!canAccessSolution(user, slug)) {
        return <Navigate to="/hub" replace />;
    }

    const workspacePanels = solution.areas ?? [
        {
            label: "Status do modulo",
            title: "Base pronta para evolucao",
            description: `Este espaco ja esta roteado e protegido por perfil. Agora voces podem desenvolver a experiencia real de ${solution.title} aqui dentro sem mexer na regra de acesso.`
        },
        {
            label: "Perfil atual",
            title: ROLE_LABELS[role],
            description: "O acesso foi liberado porque esse modulo faz parte do conjunto de ferramentas disponiveis para o seu tipo de usuario."
        },
        {
            label: "Proximo passo sugerido",
            title: "Conectar o modulo a funcionalidades reais",
            description: "Podemos seguir implementando cada area com dados reais, menu interno, permissoes mais granulares e integracao com o backend conforme a prioridade da empresa.",
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
                                to={`/hub/${solution.slug}/${getAreaAnchor(panel.title)}`}
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
