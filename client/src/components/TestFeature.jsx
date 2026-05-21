import { useState } from "react";

import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";

import "../styles/testFeature.css";

const TEST_ACTION_HANDLER = "botaoTesteNovaFuncionalidade";

export default function TestFeature({ permissions }) {
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const testAction = permissions?.acoes?.find((acao) =>
        acao.configuracao === TEST_ACTION_HANDLER || acao.chave === "teste" || acao.nome?.toLowerCase() === "teste"
    );
    const canRunTestAction = testAction ? canUseFeatureAction(user, permissions, testAction.chave) : false;

    const handleTestClick = () => {
        setMessage("Botao clicado.");
        window.alert("Botao clicado.");
    };

    return (
        <div className="test-feature-shell">
            <section className="test-feature-panel">
                <span>Funcionalidade teste</span>
                <h2>Teste</h2>

                {testAction ? (
                    <button type="button" onClick={handleTestClick} disabled={!canRunTestAction}>
                        {testAction.nome || "Teste"}
                    </button>
                ) : (
                    <p>Acao de teste nao configurada para esta funcionalidade.</p>
                )}

                {message && <strong role="status">{message}</strong>}
            </section>
        </div>
    );
}
