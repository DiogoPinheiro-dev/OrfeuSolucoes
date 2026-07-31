import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBullhorn, FaComment, FaDownload, FaEdit, FaHistory, FaPaperclip, FaSyncAlt, FaTrash } from "react-icons/fa";

import {
    abrirProjetoAnexo,
    createProjetoAtualizacao,
    createProjetoComentario,
    excluirProjetoAnexo,
    excluirProjetoComentario,
    getComunicacaoProjetos,
    getProjetoComunicacao,
    updateProjetoAtualizacao,
    updateProjetoComentario,
    uploadProjetoAnexos
} from "../../services/Projetos/ComunicacaoService";
import { CrudModal } from "./CrudModal";
import "../styles/crudGrid.css";
import "../styles/projectCommunication.css";

const emptyPanel = { atualizacoes: [], comentarios: [], feed: [], feedTotal: 0, feedPagina: 1, feedLimite: 5, feedTotalPaginas: 0, itensDisponiveis: [], permissoes: {}, ultimaAtualizacaoEm: null };
const FEED_PAGE_SIZE = 5;
const healthLabels = { EM_DIA: "Em dia", EM_RISCO: "Em risco", ATRASADO: "Atrasado" };
const userLabel = (user) => user?.nome || user?.login || user?.email || "Sistema";
const dateTime = (value) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const detailLabel = (value) => { const labels = { ATUALIZACAO: "Atualização", COMENTARIO: "Comentário", ORCAMENTO: "Orçamento", ORCAMENTO_CATEGORIA: "Categoria orçamentária", ALOCACAO: "Alocação", DEPENDENCIA: "Dependência" }; if (labels[value]) return labels[value]; const text = String(value || "").replace(/_/g, " ").toLowerCase(); return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Não informado"; };
const sizeLabel = (bytes) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function ProjectCommunicationManagement() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [panel, setPanel] = useState(emptyPanel);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [kind, setKind] = useState("ATUALIZACAO");
    const [editing, setEditing] = useState(null);
    const [selectedFeedItem, setSelectedFeedItem] = useState(null);
    const [feedPage, setFeedPage] = useState(1);
    const [form, setForm] = useState({ conteudo: "", saudePercebida: "", targetType: "PROJETO", targetId: "", files: [] });

    const selectedProject = useMemo(() => projects.find((item) => item.id === projectId), [projects, projectId]);
    const feedTotalPages = Math.max(1, panel.feedTotalPaginas || 0);
    const reload = useCallback(async (id = projectId, page = feedPage) => {
        if (!id) { setPanel(emptyPanel); setLoading(false); return; }
        setLoading(true); setError("");
        try {
            const result = await getProjetoComunicacao(id, { pagina: page, limite: FEED_PAGE_SIZE });
            setPanel(result);
            setFeedPage(result.feedPagina || page);
        }
        catch (loadError) { setError(loadError.message || "Não foi possível carregar a comunicação do projeto."); }
        finally { setLoading(false); }
    }, [feedPage, projectId]);

    useEffect(() => {
        let active = true;
        getComunicacaoProjetos().then((items) => {
            if (!active) return;
            setProjects(items);
            setProjectId((current) => current || items.find((item) => !item.arquivadoEm)?.id || items[0]?.id || "");
        }).catch((loadError) => active && setError(loadError.message)).finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);
    useEffect(() => { setFeedPage(1); }, [projectId]);
    useEffect(() => { if (projectId) void reload(projectId, feedPage); }, [projectId, feedPage, reload]);

    const resetComposer = (nextKind = kind) => {
        setEditing(null); setKind(nextKind);
        setForm({ conteudo: "", saudePercebida: "", targetType: "PROJETO", targetId: "", files: [] });
    };
    const startEdit = (feedItem) => {
        const record = feedItem.tipo === "ATUALIZACAO"
            ? panel.atualizacoes.find((item) => item.id === feedItem.entidadeId)
            : panel.comentarios.find((item) => item.id === feedItem.entidadeId);
        if (!record) return;
        setKind(feedItem.tipo);
        setEditing(record);
        setForm({ conteudo: record.conteudo, saudePercebida: record.saudePercebida || "", targetType: "PROJETO", targetId: "", files: [] });
        document.querySelector(".project-communication-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    const selectTarget = (type, id = "") => setForm((current) => ({ ...current, targetType: type, targetId: id }));

    const submit = async (event) => {
        event.preventDefault();
        if (!projectId || !form.conteudo.trim()) return;
        setSaving(true); setError(""); setSuccess("");
        try {
            let created;
            if (editing && kind === "ATUALIZACAO") {
                created = await updateProjetoAtualizacao({ id: editing.id, projetoId: projectId, versao: editing.versao,
                    conteudo: form.conteudo.trim(), saudePercebida: form.saudePercebida || null });
            } else if (editing) {
                created = await updateProjetoComentario({ id: editing.id, versao: editing.versao, conteudo: form.conteudo.trim() });
            } else if (kind === "ATUALIZACAO") {
                created = await createProjetoAtualizacao({ projetoId: projectId, conteudo: form.conteudo.trim(), saudePercebida: form.saudePercebida || null });
            } else {
                created = await createProjetoComentario({ projetoId: projectId, conteudo: form.conteudo.trim(),
                    atualizacaoId: form.targetType === "ATUALIZACAO" ? form.targetId : null,
                    itemId: form.targetType === "ITEM" ? form.targetId : null });
            }
            if (form.files.length) {
                await uploadProjetoAnexos(projectId, form.files, kind === "ATUALIZACAO" ? { atualizacaoId: created.id } : { comentarioId: created.id });
            }
            setSuccess(editing ? "Registro atualizado com sucesso." : "Publicação adicionada ao feed.");
            setFeedPage(1);
            resetComposer(kind); await reload(projectId, 1);
        } catch (saveError) { setError(saveError.message || "Não foi possível salvar a publicação."); }
        finally { setSaving(false); }
    };

    const removeComment = async (record) => {
        if (!window.confirm("Excluir este comentário?")) return;
        setSaving(true); setError("");
        try { await excluirProjetoComentario({ id: record.id, versao: record.versao }); setSuccess("Comentário excluído."); await reload(projectId); }
        catch (removeError) { setError(removeError.message); }
        finally { setSaving(false); }
    };
    const removeAttachment = async (attachment) => {
        if (!window.confirm(`Excluir o anexo "${attachment.nomeOriginal}"?`)) return;
        setSaving(true); setError("");
        try { await excluirProjetoAnexo(projectId, attachment.id); setSuccess("Anexo excluído."); await reload(projectId); }
        catch (removeError) { setError(removeError.message); }
        finally { setSaving(false); }
    };
    const openAttachment = async (event, attachment) => {
        event.preventDefault(); setError("");
        try {
            const { objectUrl, nomeArquivo } = await abrirProjetoAnexo(attachment.downloadUrl, attachment.nomeOriginal);
            const link = document.createElement("a"); link.href = objectUrl; link.download = nomeArquivo; link.click();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
        } catch (openError) { setError(openError.message); }
    };

    const openFeedDetails = (event, item) => {
        if (event.type === "click" && event.target?.closest?.("button, a, details, summary, input, select, textarea")) return;
        if (event.type === "keydown") {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
        }
        setSelectedFeedItem(item);
    };
    const permissions = panel.permissoes || {};
    const canCompose = kind === "ATUALIZACAO" ? permissions.podePublicarAtualizacao : permissions.podeComentar;
    const targetOptions = form.targetType === "ATUALIZACAO" ? panel.atualizacoes : form.targetType === "ITEM" ? panel.itensDisponiveis : [];

    return (
        <section className="crud-grid project-communication">
            <header className="crud-grid-header project-communication-header">
                <div><span className="workspace-label">Projetos</span><h2>Comunicação do projeto</h2><p>Centralize atualizações, decisões, comentários, anexos e eventos do projeto.</p></div>
                <label><span>Projeto</span><select value={projectId} onChange={(event) => { setFeedPage(1); setProjectId(event.target.value); }}><option value="">Selecione</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.chave} — {project.nome}{project.arquivadoEm ? " (arquivado)" : ""}</option>)}</select></label>
            </header>
            {error && <div className="project-communication-feedback error">{error}</div>}
            {success && <div className="project-communication-feedback success">{success}</div>}
            {selectedProject?.arquivadoEm && <div className="project-communication-readonly">Projeto arquivado: o feed permanece disponível somente para consulta.</div>}

            {!!projectId && !selectedProject?.arquivadoEm && (permissions.podePublicarAtualizacao || permissions.podeComentar) && (
                <form className="project-communication-composer" onSubmit={submit}>
                    <div className="project-communication-tabs" role="tablist">
                        {permissions.podePublicarAtualizacao && <button type="button" className={kind === "ATUALIZACAO" ? "active" : ""} onClick={() => resetComposer("ATUALIZACAO")}><FaBullhorn /> Atualização</button>}
                        {permissions.podeComentar && <button type="button" className={kind === "COMENTARIO" ? "active" : ""} onClick={() => resetComposer("COMENTARIO")}><FaComment /> Comentário</button>}
                    </div>
                    <label className="wide"><span>{editing ? "Editar publicação" : kind === "ATUALIZACAO" ? "Nova atualização" : "Novo comentário"}</span><textarea required rows={4} maxLength={kind === "ATUALIZACAO" ? 5000 : 3000} value={form.conteudo} onChange={(event) => setForm((current) => ({ ...current, conteudo: event.target.value }))} placeholder="Compartilhe contexto, decisão ou andamento relevante..." /></label>
                    {kind === "ATUALIZACAO" && <label><span>Percepção de saúde</span><select value={form.saudePercebida} onChange={(event) => setForm((current) => ({ ...current, saudePercebida: event.target.value }))}><option value="">Não informar</option>{Object.entries(healthLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
                    {kind === "COMENTARIO" && !editing && <><label><span>Comentar em</span><select value={form.targetType} onChange={(event) => selectTarget(event.target.value)}><option value="PROJETO">Projeto</option><option value="ATUALIZACAO">Atualização</option><option value="ITEM">Item do backlog</option></select></label>{form.targetType !== "PROJETO" && <label><span>Alvo *</span><select required value={form.targetId} onChange={(event) => selectTarget(form.targetType, event.target.value)}><option value="">Selecione</option>{targetOptions.map((item) => <option key={item.id} value={item.id}>{item.chave ? `${item.chave} — ${item.titulo}` : `${dateTime(item.criadoEm)} — ${item.conteudo.slice(0, 70)}`}</option>)}</select></label>}</>}
                    {!editing && permissions.podeGerenciarAnexos && <label className="project-communication-file"><span><FaPaperclip /> Anexos</span><input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.docx,.txt" onChange={(event) => setForm((current) => ({ ...current, files: Array.from(event.target.files || []) }))} /><small>Até 5 arquivos de 10 MB.</small></label>}
                    <div className="project-communication-composer-actions">{editing && <button type="button" className="button-cancel" onClick={() => resetComposer(kind)}>Cancelar edição</button>}<button type="submit" className="button-standard" disabled={saving || !canCompose}>{saving ? "Salvando..." : editing ? "Salvar alteração" : "Publicar"}</button></div>
                </form>
            )}

            <div className="project-communication-toolbar"><strong>Feed cronológico</strong><span>{panel.feedTotal} registro(s)</span><button type="button" onClick={() => reload(projectId, feedPage)} disabled={loading || !projectId}><FaSyncAlt /> Atualizar</button></div>
            <div className="project-communication-feed" aria-live="polite">
                {loading && <div className="project-communication-empty">Carregando comunicação...</div>}
                {!loading && panel.feed.map((item) => {
                    const record = item.tipo === "ATUALIZACAO" ? panel.atualizacoes.find((entry) => entry.id === item.entidadeId) : panel.comentarios.find((entry) => entry.id === item.entidadeId);
                    return <article key={item.id} className={`project-feed-card type-${item.tipo.toLowerCase()}`} role="button" tabIndex={0} aria-label={`Ver detalhes: ${item.conteudo}`} onClick={(event) => openFeedDetails(event, item)} onKeyDown={(event) => openFeedDetails(event, item)}>
                        <div className="project-feed-marker">{item.tipo === "ATUALIZACAO" ? <FaBullhorn /> : item.tipo === "COMENTARIO" ? <FaComment /> : <FaHistory />}</div>
                        <div className="project-feed-content"><header><div><strong>{userLabel(item.autor)}</strong><span>{item.tipo === "ATUALIZACAO" ? "Atualização" : item.tipo === "COMENTARIO" ? "Comentário" : "Evento"}{item.contexto ? ` · ${item.contexto}` : ""}</span></div><time>{dateTime(item.criadoEm)}{item.editado ? " · editado" : ""}</time></header>
                            {item.saudePercebida && <span className={`project-health health-${item.saudePercebida.toLowerCase()}`}>{healthLabels[item.saudePercebida]}</span>}
                            <p>{item.conteudo}</p>
                            {!!item.anexos?.length && <div className="project-feed-attachments">{item.anexos.map((attachment) => <div key={attachment.id} className="project-feed-attachment"><a href={attachment.downloadUrl} onClick={(event) => openAttachment(event, attachment)}><FaDownload /><span>{attachment.nomeOriginal}</span><small>{sizeLabel(attachment.tamanho)}</small></a>{permissions.podeGerenciarAnexos && <button type="button" onClick={() => removeAttachment(attachment)} aria-label={`Excluir ${attachment.nomeOriginal}`}><FaTrash /></button>}</div>)}</div>}
                            {record?.historico?.length > 0 && <details><summary>Histórico de edição ({record.historico.length})</summary>{record.historico.map((history) => <div key={history.id} className="project-feed-history"><small>{dateTime(history.criadoEm)} · {userLabel(history.editor)} · versão {history.versaoAnterior}</small><p>{history.conteudoAnterior}</p></div>)}</details>}
                            {record && <footer>{record.podeEditar && <button type="button" onClick={() => startEdit(item)}><FaEdit /> Editar</button>}{item.tipo === "COMENTARIO" && record.podeExcluir && <button type="button" className="danger" onClick={() => removeComment(record)}><FaTrash /> Excluir</button>}{item.tipo === "ATUALIZACAO" && permissions.podeComentar && <button type="button" onClick={() => { resetComposer("COMENTARIO"); selectTarget("ATUALIZACAO", item.entidadeId); }}><FaComment /> Comentar</button>}</footer>}
                        </div>
                    </article>;
                })}
                {!loading && !!projectId && panel.feedTotal === 0 && <div className="project-communication-empty">Nenhuma comunicação registrada neste projeto.</div>}
                {!loading && !projectId && <div className="project-communication-empty">Selecione um projeto para consultar o feed.</div>}
            </div>
            {selectedFeedItem && <CrudModal mode="view" title="Detalhes da modificação" ariaLabel="Detalhes do evento do projeto" onClose={() => setSelectedFeedItem(null)} onSubmit={(event) => event.preventDefault()} formClassName="project-feed-detail-modal" actions={<button type="button" onClick={() => setSelectedFeedItem(null)}>Fechar</button>}>
                <section className="project-feed-detail-summary"><span>{selectedFeedItem.funcionalidade}</span><h4>{selectedFeedItem.conteudo}</h4><p>{dateTime(selectedFeedItem.criadoEm)}</p></section>
                <dl className="project-feed-detail-meta">
                    <div><dt>Quem realizou</dt><dd>{userLabel(selectedFeedItem.autorAcao || selectedFeedItem.autor)}</dd></div>
                    <div><dt>Funcionalidade</dt><dd>{selectedFeedItem.funcionalidade}</dd></div>
                    <div><dt>Ação</dt><dd>{detailLabel(selectedFeedItem.evento)}</dd></div>
                    <div><dt>Entidade</dt><dd>{detailLabel(selectedFeedItem.entidade)}</dd></div>
                    <div><dt>Registro</dt><dd>{selectedFeedItem.registro || selectedFeedItem.entidadeId}</dd></div>
                    <div><dt>Data e hora</dt><dd>{dateTime(selectedFeedItem.criadoEm)}</dd></div>
                    {selectedFeedItem.contexto && <div><dt>Contexto</dt><dd>{selectedFeedItem.contexto}</dd></div>}
                    {selectedFeedItem.editado && <div><dt>Situação</dt><dd>Editado</dd></div>}
                    {selectedFeedItem.autor && selectedFeedItem.autorAcao?.id !== selectedFeedItem.autor.id && <div><dt>Autor original</dt><dd>{userLabel(selectedFeedItem.autor)}</dd></div>}
                </dl>
                {selectedFeedItem.alteracoes?.length ? <section className="project-feed-detail-changes"><h4>Campos envolvidos</h4><div>{selectedFeedItem.alteracoes.map((change, index) => <article key={`${change.campo}-${index}`}><strong>{change.campo}</strong><div><span>Antes</span><p>{change.valorAnterior || "Não informado"}</p></div><div><span>Depois</span><p>{change.valorNovo || "Não informado"}</p></div></article>)}</div></section> : <div className="project-feed-detail-empty">Este evento não possui valores de campos disponíveis para exibição.</div>}
            </CrudModal>}
            {!loading && feedTotalPages > 1 && (
                <footer className="project-communication-pagination" aria-label="Paginação do feed">
                    <span>
                        {((feedPage - 1) * FEED_PAGE_SIZE) + 1}–{Math.min(feedPage * FEED_PAGE_SIZE, panel.feedTotal)}
                        {" "}de {panel.feedTotal} registros · Página {feedPage} de {feedTotalPages}
                    </span>
                    <div>
                        <button type="button" onClick={() => setFeedPage((page) => Math.max(1, page - 1))} disabled={feedPage === 1}>Anterior</button>
                        <button type="button" onClick={() => setFeedPage((page) => Math.min(feedTotalPages, page + 1))} disabled={feedPage === feedTotalPages}>Próxima</button>
                    </div>
                </footer>
            )}
        </section>
    );
}