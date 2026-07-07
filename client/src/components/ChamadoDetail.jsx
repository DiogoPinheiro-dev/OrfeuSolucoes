import { useEffect, useState } from "react";

import {
    alterarPrioridadeChamado,
    alterarStatusChamado,
    atualizarAcompanhantesChamado,
    assumirChamado,
    atribuirChamado,
    arquivarChamado,
    getAcompanhantesElegiveisChamado,
    getChamado,
    getPrioridadesChamado,
    getResponsaveisParaAberturaChamado,
    liberarAtendimentoChamado,
    reabrirChamado,
    resolverChamado,
    responderChamado,
    transferirChamado,
    uploadChamadoAnexos,
    abrirChamadoAnexo,
    chamadoAnexoDownloadUrl
} from "../../services/Chamados/ChamadoService";
import { canUseFeatureAction, getFeatureBySlug, getSolutionBySlug, isGroupAdmin, isSystemAdmin } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { useHubNavigation } from "../hooks/useHubNavigation";
import {
    editableStatusOptions,
    formatDateTime,
    prioridadeClassName,
    prioridadeLabel,
    statusClassName,
    statusLabel,
    tipoClassName,
    tipoLabel
} from "./chamadoLabels";

import "../styles/chamados.css";
const usuarioDisplayName = (usuario) => usuario?.nome || usuario?.login || usuario?.email || null;
const responsavelOptionLabel = (responsavel) => responsavel?.nome || responsavel?.login || responsavel?.email || "Responsavel";
const responsavelOptionKey = (responsavel) => responsavel?.tipo === "GRUPO" ? `GRUPO:${responsavel.grupoId}` : `USUARIO:${responsavel.usuarioId || responsavel.id}`;
const chamadoResponsavelKey = (chamado) => chamado?.responsavelGrupoId ? `GRUPO:${chamado.responsavelGrupoId}` : chamado?.responsavelId ? `USUARIO:${chamado.responsavelId}` : "";
const chamadoResponsavelLabel = (chamado) => chamado?.responsavelGrupoNome || chamado?.responsavelNome || "Sem responsavel";
const MAX_ANEXO_FILES = 5;
const MAX_ANEXO_SIZE_BYTES = 10 * 1024 * 1024;
const ANEXO_ACCEPT = ".jpg,.jpeg,.png,.pdf,.docx,.txt";
const formatAnexoSize = (size) => `${(size / 1024 / 1024).toFixed(2)} MB`;

const isTechnicalId = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));

const formatHistoricoCampo = (campo) => {
    const labels = {
        responsavelId: "Responsavel",
        responsavelGrupoId: "Grupo responsavel",
        liderAtendimento: "Lider atendimento",
        responsavel: "Responsavel",
        status: "Status",
        prioridade: "Prioridade"
    };

    return labels[campo] || campo;
};

export default function ChamadoDetail({ chamadoId, mode, permissions, onBack }) {
    const { user } = useAuth();
    const { solutions } = useHubNavigation();
    const [chamado, setChamado] = useState(null);
    const [atendentes, setAtendentes] = useState([]);
    const [prioridades, setPrioridades] = useState([]);
    const [acompanhantesElegiveis, setAcompanhantesElegiveis] = useState([]);
    const [selectedAcompanhanteIds, setSelectedAcompanhanteIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [resposta, setResposta] = useState("");
    const [observacao, setObservacao] = useState("");
    const [observacaoArquivamentoMeus, setObservacaoArquivamentoMeus] = useState("");
    const [status, setStatus] = useState("");
    const [prioridade, setPrioridade] = useState("");
    const [responsavelId, setResponsavelId] = useState("");
    const [respostaAnexos, setRespostaAnexos] = useState([]);
    const [respostaAnexosInputKey, setRespostaAnexosInputKey] = useState(0);

    const isPainel = mode === "painel";
    const isMeus = mode === "meus";
    const isArquivados = mode === "arquivados";
    const controleChamadosSolution = getSolutionBySlug(solutions || [], "controle-de-chamados");
    const painelPermissions = getFeatureBySlug(controleChamadosSolution, "painel-atendimento");
    const atendimentoPermissions = isPainel ? permissions : painelPermissions;
    const hasAtendimentoContext = isPainel || isMeus;
    const baseCanReply = isPainel
        ? canUseFeatureAction(user, atendimentoPermissions, "responder_chamado")
        : canUseFeatureAction(user, permissions, "responder_proprio_chamado");
    const canUnarchive = isArquivados && (isSystemAdmin(user) || isGroupAdmin(user)) && canUseFeatureAction(user, permissions, "reabrir_chamado");
    const canReopenAtendimento = hasAtendimentoContext && canUseFeatureAction(user, atendimentoPermissions, "reabrir_chamado");
    const canReopenProprio = isMeus && canUseFeatureAction(user, permissions, "reabrir_proprio_chamado");
    const canReopen = isArquivados ? canUnarchive : canReopenAtendimento || canReopenProprio;
    const canAssume = hasAtendimentoContext && canUseFeatureAction(user, atendimentoPermissions, "assumir_chamado");
    const canAssign = hasAtendimentoContext && canUseFeatureAction(user, atendimentoPermissions, "atribuir_chamado");
    const canTransfer = hasAtendimentoContext && canUseFeatureAction(user, atendimentoPermissions, "transferir_chamado");
    const canManageResponsavel = canAssign || canTransfer;
    const canChangeStatus = hasAtendimentoContext && canUseFeatureAction(user, atendimentoPermissions, "alterar_status");
    const canChangePriority = hasAtendimentoContext && canUseFeatureAction(user, atendimentoPermissions, "alterar_prioridade");
    const canResolve = hasAtendimentoContext && canUseFeatureAction(user, atendimentoPermissions, "resolver_chamado");
    const canArchiveAtendimento = hasAtendimentoContext && canUseFeatureAction(user, atendimentoPermissions, "encerrar_chamado");
    const canArchiveProprio = isMeus && canUseFeatureAction(user, permissions, "excluir");
    const canArchive = canArchiveAtendimento || canArchiveProprio;
    const currentUserId = user?.id || user?.sub;
    const currentUserGroupId = Number(user?.grupo?.id ?? user?.grupoId ?? user?.grupoUsuarioId ?? 0) || null;
    const isCurrentUserSolicitante = chamado?.solicitanteId === currentUserId;
    const isCurrentUserAcompanhante = !!chamado?.acompanhantes?.some((acompanhante) => acompanhante.ativo !== false && acompanhante.usuarioId === currentUserId);
    const isCurrentUserResponsibleForChamado = chamado?.responsavelId
        ? chamado.responsavelId === currentUserId
        : chamado?.liderAtendimentoId
            ? chamado.liderAtendimentoId === currentUserId
            : !!chamado?.responsavelGrupoId && !!currentUserGroupId && Number(chamado.responsavelGrupoId) === currentUserGroupId;
    const isPureAcompanhante = isCurrentUserAcompanhante && !isCurrentUserSolicitante && !isCurrentUserResponsibleForChamado;
    const canReply = baseCanReply || isCurrentUserAcompanhante;
    const canManageAcompanhantes = !!chamado && !isPureAcompanhante && chamado.status !== "ARQUIVADO" && (isCurrentUserSolicitante || isCurrentUserResponsibleForChamado || canManageResponsavel);
    const showAtendimentoActions = !isPureAcompanhante && (isPainel || canAssume || canManageResponsavel || canChangeStatus || canChangePriority || canResolve || canReopenAtendimento || canArchiveAtendimento);

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
            setPrioridade(response?.prioridadeId ? String(response.prioridadeId) : "");
            setResponsavelId(chamadoResponsavelKey(response));
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
        if (!canManageResponsavel || !chamado?.solucaoId) {
            setAtendentes([]);
            return;
        }

        let active = true;

        const loadAtendentes = async () => {
            try {
                const response = await getResponsaveisParaAberturaChamado({
                    solucaoId: chamado.solucaoId,
                    funcionalidadeId: chamado.funcionalidadeId || null
                });

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
    }, [canManageResponsavel, chamado?.solucaoId, chamado?.funcionalidadeId]);

    useEffect(() => {
        const activeAcompanhantes = (chamado?.acompanhantes || [])
            .filter((acompanhante) => acompanhante.ativo !== false)
            .map((acompanhante) => acompanhante.usuarioId);

        setSelectedAcompanhanteIds(activeAcompanhantes);
    }, [chamado?.id, chamado?.versao]);

    useEffect(() => {
        if (!canManageAcompanhantes || !chamado?.id) {
            setAcompanhantesElegiveis([]);
            return;
        }

        let active = true;

        const loadAcompanhantesElegiveis = async () => {
            try {
                const response = await getAcompanhantesElegiveisChamado(chamado.id);

                if (active) {
                    setAcompanhantesElegiveis(response);
                }
            } catch {
                if (active) {
                    setAcompanhantesElegiveis([]);
                }
            }
        };

        void loadAcompanhantesElegiveis();

        return () => {
            active = false;
        };
    }, [canManageAcompanhantes, chamado?.id]);

    const runAction = async (action, success) => {
        setError("");
        setSaving(true);

        try {
            const updated = await action();

            setChamado(updated);
            setStatus(updated?.status || "");
            setPrioridade(updated?.prioridadeId ? String(updated.prioridadeId) : "");
            setResponsavelId(chamadoResponsavelKey(updated));
            setObservacao("");
            success?.(updated);
        } catch (actionError) {
            setError(actionError.message || "Nao foi possivel executar a acao.");
        } finally {
            setSaving(false);
        }
    };


    const buildResponsavelPayload = () => {
        const selected = atendentes.find((atendente) => atendente.id === responsavelId);

        if (!selected) {
            return { responsavelId: null, responsavelGrupoId: null };
        }

        return {
            responsavelId: selected.tipo === "USUARIO" ? selected.usuarioId : null,
            responsavelGrupoId: selected.tipo === "GRUPO" ? Number(selected.grupoId) : null
        };
    };

    const toggleAcompanhante = (usuarioId) => {
        setSelectedAcompanhanteIds((current) =>
            current.includes(usuarioId)
                ? current.filter((id) => id !== usuarioId)
                : [...current, usuarioId]
        );
    };

    const salvarAcompanhantes = () => runAction(() => atualizarAcompanhantesChamado({
        chamadoId: chamado.id,
        usuarioIds: selectedAcompanhanteIds
    }));

    const handleRespostaAnexosChange = (event) => {
        const selectedFiles = Array.from(event.target.files || []);

        if (selectedFiles.length > MAX_ANEXO_FILES) {
            setError(`Selecione no maximo ${MAX_ANEXO_FILES} anexos por resposta.`);
            event.target.value = "";
            return;
        }

        const oversizedFile = selectedFiles.find((file) => file.size > MAX_ANEXO_SIZE_BYTES);

        if (oversizedFile) {
            setError(`O arquivo "${oversizedFile.name}" ultrapassa o limite de 10 MB.`);
            event.target.value = "";
            return;
        }

        setError("");
        setRespostaAnexos(selectedFiles);
    };

    const clearRespostaAnexos = () => {
        setRespostaAnexos([]);
        setRespostaAnexosInputKey((current) => current + 1);
    };

    const handleResponder = async (event) => {
        event.preventDefault();

        if (!resposta.trim()) {
            setError("Digite uma resposta antes de enviar.");
            return;
        }

        setError("");
        setSaving(true);

        try {
            const updated = await responderChamado({ chamadoId, conteudo: resposta.trim() });
            let nextChamado = updated;

            if (respostaAnexos.length) {
                const mensagemId = updated?.mensagens?.[updated.mensagens.length - 1]?.id;

                if (!mensagemId) {
                    throw new Error("Nao foi possivel vincular os anexos a mensagem enviada.");
                }

                await uploadChamadoAnexos(chamadoId, respostaAnexos, mensagemId);
                nextChamado = await getChamado(chamadoId);
            }

            setChamado(nextChamado);
            setStatus(nextChamado?.status || "");
            setPrioridade(nextChamado?.prioridadeId ? String(nextChamado.prioridadeId) : "");
            setResponsavelId(chamadoResponsavelKey(nextChamado));
            setResposta("");
            clearRespostaAnexos();
        } catch (actionError) {
            setError(actionError.message || "Nao foi possivel enviar a resposta.");
        } finally {
            setSaving(false);
        }
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
    const isClosed = chamado.status === "ARQUIVADO";
    const hasOtherLeader = !!chamado.liderAtendimentoId && chamado.liderAtendimentoId !== currentUserId;
    const canReleaseAttendance = canAssume && !!chamado.liderAtendimentoId && (chamado.liderAtendimentoId === currentUserId || user?.login === "admin");
    const acompanhantesAtivos = (chamado.acompanhantes || []).filter((acompanhante) => acompanhante.ativo !== false);

    const handleAbrirAnexo = async (event, anexo) => {
        event.preventDefault();
        setError("");

        const previewWindow = window.open("about:blank", "_blank");

        if (previewWindow) {
            previewWindow.opener = null;
            previewWindow.document.title = anexo.nomeOriginal || "Anexo";
            previewWindow.document.body.innerHTML = "<p style=\"font-family: sans-serif; padding: 1rem;\">Carregando anexo...</p>";
        }

        try {
            const { objectUrl, nomeArquivo } = await abrirChamadoAnexo(anexo.downloadUrl, anexo.nomeOriginal);

            if (previewWindow && !previewWindow.closed) {
                previewWindow.location.href = objectUrl;
            } else {
                const link = document.createElement("a");
                link.href = objectUrl;
                link.target = "_blank";
                link.rel = "noreferrer";
                link.download = nomeArquivo || anexo.nomeOriginal || "anexo";
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
        } catch (openError) {
            if (previewWindow && !previewWindow.closed) {
                previewWindow.close();
            }

            setError(openError.message || "Nao foi possivel abrir o anexo.");
        }
    };

    const renderAnexos = (anexos = []) => {
        if (!anexos.length) {
            return null;
        }

        return (
            <div className="chamado-anexo-list chamado-anexo-list-links">
                {anexos.map((anexo) => (
                    <a
                        key={anexo.id}
                        className="chamado-anexo-link"
                        href={chamadoAnexoDownloadUrl(anexo.downloadUrl)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => handleAbrirAnexo(event, anexo)}
                    >
                        <span>{anexo.nomeOriginal}</span>
                        <small>{formatAnexoSize(anexo.tamanho)}{anexo.autorNome ? " - " + anexo.autorNome : ""}</small>
                    </a>
                ))}
            </div>
        );
    };

    return (
        <section className="chamados-shell">
            <button type="button" className="chamado-back" onClick={onBack}>Voltar para lista</button>

            <header className="chamado-detail-header">
                <div>
                    <h2>{chamado.titulo}</h2>
                </div>
                <div className="chamado-badges">
                    <span className={statusClassName(chamado.status)}>
                        {statusLabel(chamado.status)}
                    </span>
                    <span className={prioridadeClassName(chamado.prioridadeId)} style={chamado.prioridadeCor ? { backgroundColor: chamado.prioridadeCor } : undefined}>
                        {chamado.prioridadeNome || prioridadeLabel(chamado.prioridadeId)}
                    </span>
                    <span className={tipoClassName(chamado.tipoId)} style={chamado.tipoCor ? { backgroundColor: chamado.tipoCor } : undefined}>
                        {chamado.tipoNome || tipoLabel(chamado.tipoId)}
                    </span>
                </div>
            </header>

            {error && <div className="user-management-error" role="alert">{error}</div>}

            <div className="chamado-detail-grid">
                <div className="chamado-detail-main">
                <article className="chamado-panel">
                    <h3>Dados do chamado</h3>
                    <dl className="chamado-meta">
                        <div>
                            <dt>Solicitante</dt>
                            <dd>{chamado.solicitanteNome || "-"}</dd>
                        </div>
                        <div>
                            <dt>Responsavel</dt>
                            <dd>{chamadoResponsavelLabel(chamado)}</dd>
                        </div>
                        <div>
                            <dt>Atendimento</dt>
                            <dd>{chamado.liderAtendimentoNome || (chamado.responsavelGrupoId ? "Disponivel para assumir" : "-")}</dd>
                        </div>
                        <div>
                            <dt>Categoria</dt>
                            <dd>{chamado.categoriaNome || "Sem categoria"}</dd>
                        </div>
                        <div>
                            <dt>Setor</dt>
                            <dd>{chamado.solucaoNome || "Sem setor"}</dd>
                        </div>
                        <div>
                            <dt>Funcionalidade</dt>
                            <dd>{chamado.funcionalidadeNome || "Sem funcionalidade especifica"}</dd>
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
                    <div className="chamado-observacao">
                        <h4>Observacao</h4>
                        <p>{chamado.descricao || "-"}</p>
                    </div>
                </article>

                <article className="chamado-panel chamado-panel-action chamado-acompanhantes-panel">
                    <h3>Acompanhantes</h3>
                    {acompanhantesAtivos.length ? (
                        <div className="chamado-acompanhante-tags">
                            {acompanhantesAtivos.map((acompanhante) => (
                                <span key={acompanhante.id} className="chamado-acompanhante-tag">
                                    {acompanhante.usuarioNome || acompanhante.usuarioLogin || acompanhante.usuarioEmail || "Acompanhante"}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="chamado-muted">Nenhum acompanhante vinculado.</p>
                    )}

                    {canManageAcompanhantes ? (
                        <fieldset className="chamado-acompanhantes-fieldset chamado-acompanhantes-fieldset-compact">
                            <legend>Gerenciar acompanhantes</legend>
                            <small>O acompanhante pode visualizar, responder e anexar arquivos neste chamado.</small>
                            {acompanhantesElegiveis.length ? (
                                <div className="chamado-acompanhantes-grid">
                                    {acompanhantesElegiveis.map((acompanhante) => (
                                        <label key={acompanhante.id} className="chamado-acompanhante-option">
                                            <input
                                                type="checkbox"
                                                checked={selectedAcompanhanteIds.includes(acompanhante.id)}
                                                onChange={() => toggleAcompanhante(acompanhante.id)}
                                                disabled={saving || isClosed}
                                            />
                                            <span>
                                                {acompanhante.nome || acompanhante.login || acompanhante.email}
                                                <small>{acompanhante.grupoNome || acompanhante.email}</small>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="chamado-muted">Nenhum usuario elegivel para acompanhar este chamado.</p>
                            )}
                            <button type="button" onClick={salvarAcompanhantes} disabled={saving || isClosed}>
                                Salvar acompanhantes
                            </button>
                        </fieldset>
                    ) : isPureAcompanhante ? (
                        <p className="chamado-muted">Voce acompanha este chamado e pode responder ou anexar arquivos.</p>
                    ) : null}
                </article>
                </div>

                {showAtendimentoActions && (
                    <article className="chamado-panel chamado-atendimento-panel">
                        <h3>Acoes do atendimento</h3>
                        <div className="chamado-action-stack">
                            <button
                                type="button"
                                onClick={() => runAction(() => assumirChamado(chamado.id))}
                                disabled={!canAssume || saving || isResolved || isClosed || hasOtherLeader}
                            >
                                Assumir
                            </button>
                            {chamado.liderAtendimentoId && (
                                <button
                                    type="button"
                                    onClick={() => runAction(() => liberarAtendimentoChamado(chamado.id))}
                                    disabled={!canReleaseAttendance || saving || isResolved || isClosed}
                                >
                                    Liberar atendimento
                                </button>
                            )}

                            <label>
                                <span>Responsavel</span>
                                <select
                                    value={responsavelId}
                                    onChange={(event) => setResponsavelId(event.target.value)}
                                    disabled={!canManageResponsavel || saving || isResolved || isClosed}
                                >
                                    <option value="">Sem responsavel</option>
                                    {atendentes.map((atendente) => (
                                        <option key={atendente.id} value={atendente.id}>
                                            {atendente.tipo === "GRUPO" ? "Grupo: " : "Usuario: "}{responsavelOptionLabel(atendente)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="chamado-inline-actions chamado-inline-actions-wrap">
                                {canAssign && (
                                    <button
                                        type="button"
                                        onClick={() => runAction(() => atribuirChamado({ chamadoId: chamado.id, ...buildResponsavelPayload() }))}
                                        disabled={saving || isResolved || isClosed}
                                    >
                                        Salvar responsavel
                                    </button>
                                )}
                                {canTransfer && (
                                    <button
                                        type="button"
                                        onClick={() => runAction(() => transferirChamado({ chamadoId: chamado.id, ...buildResponsavelPayload() }))}
                                        disabled={saving || isResolved || isClosed}
                                    >
                                        Transferir chamado
                                    </button>
                                )}
                            </div>

                            <label>
                                <span>Status</span>
                                <select value={status} onChange={(event) => setStatus(event.target.value)} disabled={!canChangeStatus || saving || isResolved || isClosed}>
                                    {editableStatusOptions.map((option) => (
                                        <option key={option.id} value={option.id}>{option.nome}</option>
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
                                    {prioridades.map((option) => (
                                                <option key={option.id} value={option.id}>{option.nome}</option>
                                            ))}
                                </select>
                            </label>
                            <button
                                type="button"
                                onClick={() => runAction(() => alterarPrioridadeChamado({ chamadoId: chamado.id, prioridadeId: Number(prioridade) }))}
                                disabled={!canChangePriority || saving || isClosed || Number(prioridade) === Number(chamado.prioridadeId)}
                            >
                                Alterar prioridade
                            </button>

                            <label>
                                <span>Observacao da acao</span>
                                <textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} rows={3} disabled={saving} />
                            </label>

                            <div className="chamado-inline-actions">
                                <button type="button" className="chamado-action-resolve" onClick={() => runAction(() => resolverChamado(chamado.id, observacao || null))} disabled={!canResolve || saving || isResolved || isClosed}>
                                    Resolver
                                </button>
                                <button type="button" className="chamado-action-reopen" onClick={() => runAction(() => reabrirChamado(chamado.id, observacao || null))} disabled={!canReopenAtendimento || saving || !isResolved}>
                                    Reabrir
                                </button>
                                <button type="button" className="chamado-action-archive" onClick={() => runAction(() => arquivarChamado(chamado.id, observacao || null))} disabled={!canArchiveAtendimento || !isCurrentUserResponsibleForChamado || saving || isClosed}>
                                    Arquivar
                                </button>
                            </div>
                        </div>
                    </article>
                )}

                {isMeus && !isClosed && !canArchiveAtendimento && (
                    <article className="chamado-panel chamado-panel-action">
                        <h3>Arquivar chamado</h3>
                        <label>
                            <span>Observacao da acao</span>
                            <textarea value={observacaoArquivamentoMeus} onChange={(event) => setObservacaoArquivamentoMeus(event.target.value)} rows={3} disabled={saving} />
                        </label>
                        <button
                            type="button"
                            className="chamado-action-archive"
                            onClick={() => runAction(
                                () => arquivarChamado(chamado.id, observacaoArquivamentoMeus || null),
                                () => {
                                    setObservacaoArquivamentoMeus("");
                                    onBack?.();
                                }
                            )}
                            disabled={!canArchive || !isCurrentUserResponsibleForChamado || saving || isClosed}
                        >
                            Arquivar chamado
                        </button>
                        {!canArchive && (
                            <p className="chamado-muted">Seu grupo nao possui permissao para arquivar chamados em Meus chamados.</p>
                        )}
                        {canArchive && !isCurrentUserResponsibleForChamado && (
                            <p className="chamado-muted">Apenas o responsavel atual pelo chamado pode arquivar.</p>
                        )}
                    </article>
                )}

                {isArquivados && (
                    <article className="chamado-panel chamado-panel-action">
                        <h3>Acoes do arquivamento</h3>
                        <label>
                            <span>Observacao da acao</span>
                            <textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} rows={3} disabled={saving} />
                        </label>
                        <button
                            type="button"
                            onClick={() => runAction(() => reabrirChamado(chamado.id, observacao || null), onBack)}
                            disabled={!canReopen || saving || !isClosed}
                        >
                            Desarquivar chamado
                        </button>
                        {!canReopen && (
                            <p className="chamado-muted">Apenas o administrador ou usuarios do grupo Administradores podem desarquivar chamados.</p>
                        )}
                    </article>
                )}
            </div>

            {chamado.anexos?.length ? (
                <article className="chamado-panel">
                    <h3>Anexos do chamado</h3>
                    {renderAnexos(chamado.anexos)}
                </article>
            ) : null}

            {isMeus && isResolved && canReopenProprio && !canReopenAtendimento && (
                <article className="chamado-panel chamado-panel-action">
                    <h3>Reabrir chamado</h3>
                    <label>
                        <span>Observacao</span>
                        <textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} rows={3} disabled={saving} />
                    </label>
                    <button type="button" className="chamado-action-reopen" onClick={() => runAction(() => reabrirChamado(chamado.id, observacao || null))} disabled={saving}>
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
                    <label className="chamado-anexo-picker">
                        <span>Anexos da resposta</span>
                        <input
                            key={respostaAnexosInputKey}
                            type="file"
                            multiple
                            accept={ANEXO_ACCEPT}
                            onChange={handleRespostaAnexosChange}
                            disabled={!canReply || saving || isClosed}
                        />
                        <small>JPG, JPEG, PNG, PDF, DOCX ou TXT. Maximo de 5 arquivos, 10 MB cada.</small>
                    </label>

                    {respostaAnexos.length ? (
                        <div className="chamado-anexo-list">
                            {respostaAnexos.map((file) => (
                                <span key={file.name + "-" + file.size + "-" + file.lastModified} className="chamado-anexo-item">
                                    {file.name} <small>{formatAnexoSize(file.size)}</small>
                                </span>
                            ))}
                            <button type="button" className="chamado-link-button" onClick={clearRespostaAnexos} disabled={saving}>
                                Limpar anexos
                            </button>
                        </div>
                    ) : null}

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
                                {renderAnexos(mensagem.anexos)}
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
                            <small>{formatDateTime(item.criadoEm)} Â· {item.usuarioNome || "Sistema"}</small>
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
