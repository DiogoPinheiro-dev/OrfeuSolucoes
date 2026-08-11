export default function RouteLoadingFallback() {
    return (
        <main className="auth-loading-shell" aria-live="polite" aria-busy="true">
            <section className="auth-loading-card route-loading-card" role="status">
                <span className="auth-loading-badge">Orfeu</span>
                <h2>Carregando página...</h2>
                <p>Preparando o conteúdo para você.</p>
                <span className="route-loading-indicator" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </span>
            </section>
        </main>
    );
}
