import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
    const location = useLocation();
    const { isAuthenticated, bootstrapping } = useAuth();

    if (bootstrapping) {
        return (
            <div className="auth-loading-shell">
                <div className="auth-loading-card">
                    <span className="auth-loading-badge">Orfeu Hub</span>
                    <h2>Validando seu acesso...</h2>
                    <p>Estamos preparando suas permissoes e o ambiente certo para o seu perfil.</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}
