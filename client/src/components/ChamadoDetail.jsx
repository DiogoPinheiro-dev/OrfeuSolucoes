import { useEffect, useState } from "react";

import {
    alterarPrioridadeChamado,
    alterarStatusChamado,
    assumirChamado,
    atribuirChamado,
    encerrarChamado,
    getAtendentesDisponiveis,
    getChamado,
    reabrirChamado,
    resolverChamado,
    responderChamado
} from "../../services/Chamados/ChamadoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import {
    editableStatusOptions,
    formatDateTime,
    prioridadeClassName,
    prioridadeEditOptions,
    prioridadeLabel,
    statusClassName,
    statusLabel,
    tipoClassName,
    tipoLabel
} from "./chamadoLabels";

import "../styles/chamados.css";
const usuarioDisplayName = (usuario) => usuario?.nome || usuario?.login || usuario?.email || null;

const isTechnicalId = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));

const formatHistoricoCampo = (campo) => {
    const labels = {
        responsavelId: "Responsavel",
        responsavel: "Responsavel",
        status: "Status",
        prioridade: "Prioridade"
    };

    return labels[campo] || campo;
};

export default function ChamadoDetail({ chamadoId, mode, permissions, onBack }) {
    const { user } = useAuth();
    const [chamado, setChamado] = useState(null);
    const [atendentes, setAtendentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [resposta, setResposta] = useState("");
    const [observacao, setObservacao] = useState("");
    const [status, setStatus] = useState("");
    const [prioridade, setPrioridade] = useState("");
    const [responsavelId, setResponsavelId] = useState("");

    const isPainel = mode === "painel";
    const canReply = isPainel
        ? canUseFeatureAction(user, permissions, "responder_chamado")
        : canUseFeatureAction(user, permissions, "responder_proprio_chamado");
    const canReopen = isPainel
        ? canUseFeatureAction(user, permissions, "reabrir_chamado")
        : canUseFeatureAction(user, permissions, "reabrir_proprio_chamado");
    const canAssume = isPainel && canUseFeatureAction(user, permissions, "assumir_chamado");
    const canAssign = isPainel && canUseFeatureAction(user, permissions, "atribuir_chamado");
    const canChangeStatus = isPainel && canUseFeatureAction(user, permissions, "alterar_status");
    const canChangePriority = isPainel && canUseFeatureAction(user, permissions, "alterar_prioridade");
    const canResolve = isPainel && canUseFeatureAction(user, permissions, "resolver_chamado");
    const canClose = isPainel && canUseFeatureAction(user, permissions, "encerrar_chamado");

    const formatHistoricoValor = (item, value) => {
        if (!value) {
            return "-";
        }

        if (["responsavelId", "responsavel"].includes(item.campo)) {
            const atendente = atendentes.find((candidate) => candidate.id === value);

            if (atendente) {
                return usuarioDisplayName(atendente) || "Responsavel";
            }

            if (value === chamado?.responsavelId && chamado?.responsavelNome) {
                return chamado.responsavelNome;
            }

            if ((value === user?.id || value === user?.sub) && usuarioDisplayName(user)) {
                return usuarioDisplayName(user);
            }

            return isTechnicalId(value) ? "Responsavel" : value;
        }

        return value;
    };

    const formatHistoricoLinha = (item) => {
        if (!item.campo) {
            return item.observacao || "-";
        }

        return `${formatHistoricoCampo(item.campo)}: ${formatHistoricoValor(item, item.valorAnterior)} -> ${formatHistoricoValor(item, item.valorNovo)}`;
    };

    const load = async () => {
        setError("");
        setLoading(true);

        try {
            const response = await getChamado(chamadoId);

            setChamado(response);
            setStatus(response?.status || "");
            setPrioridade(response?.prioridade || "");
            setResponsavelId(response?.responsavelId || "");
        } catch (loadError) {
            setError(loadError.message || "Nao foi possivel carregar o chamado.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [chamadoId]);

    useEffect(() => {
        if (!canAssign) {
            return;
        }

        let active = true;

        const loadAtendentes = async () => {
            try {
                const response = await getAtendentesDisponiveis();

                if (active) {
                    setAtendentes(response);
                }
            } catch {
                if (active) {
                    setAtendentes([]);
                }
            }
        };

        void loadAtendentes();

        return () => {
            active = false;
        };
    }, [canAssign]);

    const runAction = async (action, success) => {
        setError("");
        setSaving(true);

        try {
            const updated = await action();

            setChamado(updated);
            setStatus(updated?.status || "");
            setPrioridade(updated?.prioridade || "");
            setResponsavelId(updated?.responsavelId || "");
            setObservacao("");
            success?.(updated);
        } catch (actionError) {
            setError(actionError.message || "Nao foi possivel executar a acao.");
        } finally {
            setSaving(false);
        }
    };

    const handleResponder = async (event) => {
        event.preventDefault();

        if (!resposta.trim()) {
            setError("Digite uma resposta antes de enviar.");
            return;
        }

        await runAction(
            () => responderChamado({ chamadoId, conteudo: resposta.trim() }),
            () => setResposta("")
        );
    };

    if (loading) {
        return (
            <section className="chamados-shell">
                <div className="user-management-loading">Carregando chamado...</div>
            </section>
        );
    }

    if (!chamado) {
        return (
            <section className="chamados-shell">
                {error && <div className="user-management-error" role="alert">{error}</div>}
                <button type="button" className="chamado-secondary" onClick={onBack}>Voltar</button>
            </section>
        );
    }

    const isResolved = chamado.status === "RESOLVIDO";
    const isClosed = chamado.status === "ENCERRADO";

    return (
        <section className="chamados-shell">
            <button type="button" className="chamado-back" onClick={onBack}>Voltar para lista</button>

            <header className="chamado-detail-header">
                <div>
                    <span className="chamado-number">#{chamado.numero}</span>
                    <h2>{chamado.titulo}</h2>
                    <p>{chamado.descricao}</p>
                </div>
                <div className="chamado-badges">
                    <span className={statusClassName(chamado.status)}>
                        {statusLabel(chamado.status)}
                    </span>
                    <span className={prioridadeClassName(chamado.prioridade)}>
                        {prioridadeLabel(chamado.prioridade)}
                    </span>
                    <span className={tipoClassName(chamado.tipo)}>
                        {tipoLabel(chamado.tipo)}
                    </span>
                </div>
            </header>

            {error && <div className="user-management-error" role="alert">{error}</div>}

            <div className="chamado-detail-grid">
                <article className="chamado-panel">
                    <h3>Dados do chamado</h3>
                    <dl className="chamado-meta">
                        <div>
                            <dt>Solicitante</dt>
                            <dd>{chamado.solicitanteNome || "-"}</dd>
                        </div>
                        <div>
                            <dt>Responsavel</dt>
                            <dd>{chamado.responsavelNome || "Sem responsavel"}</dd>
                        </div>
                        <div>
                            <dt>Categoria</dt>
                            <dd>{chamado.categoriaNome || "Sem categoria"}</dd>
                        </div>
                        <div>
                            <dt>Criado em</dt>
                            <dd>{formatDateTime(chamado.criadoEm)}</dd>
                        </div>
                        <div>
                            <dt>Atualizado em</dt>
                            <dd>{formatDateTime(chamado.atualizadoEm)}</dd>
                        </div>
                    </dl>
                </article>

                {isPainel && (
                    <article className="chamado-panel">
                        <h3>Acoes do atendimento</h3>
                        <div className="chamado-action-stack">
                            <button
                                type="button"
                                onClick={() => runAction(() => assumirChamado(chamado.id))}
                                disabled={!canAssume || saving || isResolved || isClosed}
                            >
                                Assumir
                            </button>

                            <label>
                                <span>Responsavel</span>
                                <select
                                    value={responsavelId}
                                    onChange={(event) => setResponsavelId(event.target.value)}
                                    disabled={!canAssign || saving || isResolved || isClosed}
                                >
                                    <option value="">Sem responsavel</option>
                                    {atendentes.map((atendente) => (
                                        <option key={atendente.id} value={atendente.id}>
                                            {atendente.nome || atendente.login || atendente.email}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button
                                type="button"
                                onClick={() => runAction(() => atribuirChamado({ chamadoId: chamado.id, responsavelId: responsavelId || null }))}
                                disabled={!canAssign || saving || isResolved || isClosed}
                            >
                                Salvar responsavel
                            </button>

                            <label>
                                <span>Status</span>
                                <select value={status} onChange={(event) => setStatus(event.target.value)} disabled={!canChangeStatus || saving || isResolved || isClosed}>
                                    {editableStatusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                            <button
                                type="button"
                                onClick={() => runAction(() => alterarStatusChamado({ chamadoId: chamado.id, status, observacao: observacao || null }))}
                                disabled={!canChangeStatus || saving || isResolved || isClosed || status === chamado.status}
                            >
                                Alterar status
                            </button>

                            <label>
                                <span>Prioridade</span>
                                <select value={prioridade} onChange={(event) => setPrioridade(event.target.value)} disabled={!canChangePriority || saving || isClosed}>
                                    {prioridadeEditOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                            <button
                                type="button"
                                onClick={() => runAction(() => alterarPrioridadeChamado({ chamadoId: chamado.id, prioridade }))}
                                disabled={!canChangePriority || saving || isClosed || prioridade === chamado.prioridade}
                            >
                                Alterar prioridade
                            </button>

                            <label>
                                <span>Observacao da acao</span>
                                <textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} rows={3} disabled={saving} />
                            </label>

                            <div className="chamado-inline-actions">
                                <button type="button" onClick={() => runAction(() => resolverChamado(chamado.id, observacao || null))} disabled={!canResolve || saving || isResolved || isClosed}>
                                    Resolver
                                </button>
                                <button type="button" onClick={() => runAction(() => encerrarChamado(chamado.id, observacao || null))} disabled={!canClose || saving || !isResolved}>
                                    Encerrar
                                </button>
                                <button type="button" onClick={() => runAction(() => reabrirChamado(chamado.id, observacao || null))} disabled={!canReopen || saving || (!isResolved && !isClosed)}>
                                    Reabrir
                                </button>
                            </div>
                        </div>
                    </article>
                )}
            </div>

            {!isPainel && isResolved && canReopen && (
                <article className="chamado-panel">
                    <h3>Reabrir chamado</h3>
                    <label>
                        <span>Observacao</span>
                        <textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} rows={3} disabled={saving} />
                    </label>
                    <button type="button" onClick={() => runAction(() => reabrirChamado(chamado.id, observacao || null))} disabled={saving}>
                        Reabrir chamado
                    </button>
                </article>
            )}

            <article className="chamado-panel">
                <h3>Responder</h3>
                <form className="chamado-response-form" onSubmit={handleResponder}>
                    <textarea
                        value={resposta}
                        onChange={(event) => setResposta(event.target.value)}
                        rows={4}
                        maxLength={1000}
                        disabled={!canReply || saving || isClosed}
                        placeholder={canReply ? "Digite uma resposta publica..." : "Seu grupo nao possui permissao para responder."}
                    />
                    <button type="submit" disabled={!canReply || saving || isClosed}>
                        {saving ? "Enviando..." : "Enviar resposta"}
                    </button>
                </form>
            </article>

            <article className="chamado-panel">
                <h3>Mensagens</h3>
                <div className="chamado-timeline">
                    {chamado.mensagens?.length ? (
                        chamado.mensagens.map((mensagem) => (
                            <div key={mensagem.id} className="chamado-timeline-item">
                                <strong>{mensagem.autorNome || "Usuario"}</strong>
                                <small>{formatDateTime(mensagem.criadoEm)}</small>
                                <p>{mensagem.conteudo}</p>
                            </div>
                        ))
                    ) : (
                        <p className="chamado-muted">Nenhuma mensagem registrada.</p>
                    )}
                </div>
            </article>

            <article className="chamado-panel">
                <h3>Historico</h3>
                <div className="chamado-timeline">
                    {chamado.historico?.map((item) => (
                        <div key={item.id} className="chamado-timeline-item compacto">
                            <strong>{item.evento}</strong>
                            <small>{formatDateTime(item.criadoEm)} · {item.usuarioNome || "Sistema"}</small>
                            <p>
                                {formatHistoricoLinha(item)}
                            </p>
                            {item.observacao && item.campo && <p>{item.observacao}</p>}
                        </div>
                    ))}
                </div>
            </article>
        </section>
    );
}
