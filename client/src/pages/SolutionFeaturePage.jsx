import { Link, Navigate, useParams } from "react-router-dom";

import { canAccessSolution, getAreaAnchor, getSolutionBySlug } from "../auth/hubConfig";
import Footer from "../components/Footer";
import Header from "../components/Header";
import UserManagement from "../components/UserManagement";
import { useAuth } from "../hooks/useAuth";

import "../styles/workspace.css";

export default function SolutionFeaturePage() {
    const { slug, areaSlug } = useParams();
    const { user } = useAuth();
    const solution = getSolutionBySlug(slug);

    if (!solution) {
        return <Navigate to="/hub" replace />;
    }

    if (!canAccessSolution(user, slug)) {
        return <Navigate to="/hub" replace />;
    }

    const area = solution.areas?.find((item) => getAreaAnchor(item.title) === areaSlug);

    if (!area) {
        return <Navigate to={`/hub/${solution.slug}`} replace />;
    }

    const isUserManagement = solution.slug === "configurador" && getAreaAnchor(area.title) === "cadastro-de-usuarios";

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

                    {isUserManagement ? (
                        <section className="workspace-feature-crud">
                            <UserManagement />
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
