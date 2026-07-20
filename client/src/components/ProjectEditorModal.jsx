import { useEffect, useMemo, useState } from "react";

import { CrudModal, CrudModalTabPanel, CrudModalTabs } from "./CrudModal";

const emptyForm = {
    chave: "",
    nome: "",
    objetivo: "",
    descricao: "",
    metodologia: "SCRUM",
    situacao: "RASCUNHO",
    saude: "EM_DIA",
    inicioPrevistoEm: "",
    fimPrevistoEm: "",
    responsavelId: "",
    participantes: []
};

const dateValue = (value) => value?.slice?.(0, 10) || "";

const initialForm = (project) => project ? {
    chave: project.chave,
    nome: project.nome,
    objetivo: project.objetivo || "",
    descricao: project.descricao || "",
    metodologia: project.metodologia,
    situacao: project.situacao,
    saude: project.saude,
    inicioPrevistoEm: dateValue(project.inicioPrevistoEm),
    fimPrevistoEm: dateValue(project.fimPrevistoEm),
    responsavelId: project.responsavelId,
    participantes: (project.membros || []).map((member) => ({
        usuarioId: member.usuarioId,
        papel: member.papel
    }))
} : emptyForm;

const userLabel = (user) => user?.nome || user?.login || user?.email;

export default function ProjectEditorModal({
    mode,
    project,
    users,
    saving,
    error,
    canManageTeam,
    canEditDetails,
    onClose,
    onSuggestKey,
    onSubmit
}) {
    const [activeTab, setActiveTab] = useState("geral");
    const [form, setForm] = useState(() => initialForm(project));
    const [suggesting, setSuggesting] = useState(false);
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        setForm(initialForm(project));
        setActiveTab("geral");
        setLocalError("");
    }, [project, mode]);

    const participantIds = useMemo(
        () => new Set(form.participantes.map((item) => item.usuarioId)),
        [form.participantes]
    );

    const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    const suggestKey = async () => {
        if (!form.nome.trim()) return;
        setSuggesting(true);
        try {
            setLocalError("");
            setField("chave", await onSuggestKey(form.nome));
        } catch (suggestError) {
            setLocalError(suggestError.message);
        } finally {
            setSuggesting(false);
        }
    };

    const toggleParticipant = (usuarioId) => {
        setForm((current) => ({
            ...current,
            participantes: current.participantes.some((item) => item.usuarioId === usuarioId)
                ? current.participantes.filter((item) => item.usuarioId !== usuarioId)
                : [...current.participantes, { usuarioId, papel: "MEMBRO" }]
        }));
    };

    const changeParticipantRole = (usuarioId, papel) => {
        setForm((current) => ({
            ...current,
            participantes: current.participantes.map((item) => item.usuarioId === usuarioId ? { ...item, papel } : item)
        }));
    };

    const submit = (event) => {
        event.preventDefault();
        setLocalError("");
        if (!form.responsavelId) {
            setActiveTab("equipe");
            setLocalError("Selecione o responsável pelo projeto.");
            return;
        }
        if (form.inicioPrevistoEm && form.fimPrevistoEm && form.inicioPrevistoEm > form.fimPrevistoEm) {
            setActiveTab("planejamento");
            setLocalError("O início previsto não pode ser posterior ao término previsto.");
            return;
        }
        onSubmit({
            ...form,
            chave: form.chave.trim().toUpperCase(),
            nome: form.nome.trim(),
            objetivo: form.objetivo.trim() || null,
            descricao: form.descricao.trim() || null,
            inicioPrevistoEm: form.inicioPrevistoEm || null,
            fimPrevistoEm: form.fimPrevistoEm || null,
            participantes: form.participantes.filter((item) => item.usuarioId !== form.responsavelId)
        });
    };

    return (
        <CrudModal
            mode={mode}
            title={mode === "create" ? "Novo projeto" : `Alterar ${project?.chave}`}
            ariaLabel={mode === "create" ? "Cadastrar projeto" : "Alterar projeto"}
            onClose={onClose}
            onSubmit={submit}
            formClassName="project-form"
            actions={
                <>
                    <button type="button" className="secondary" onClick={onClose} disabled={saving}>Cancelar</button>
                    <button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
                </>
            }
        >
            <CrudModalTabs
                tabs={[
                    { id: "geral", label: "Geral" },
                    { id: "planejamento", label: "Planejamento" },
                    { id: "equipe", label: "Equipe" }
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            {(error || localError) && <p className="project-detail-error" role="alert">{error || localError}</p>}

            <CrudModalTabPanel active={activeTab === "geral"}>
                <fieldset className="project-form-grid" disabled={!canEditDetails || saving}>
                <label className="project-form-wide">
                    Nome
                    <input required maxLength={200} value={form.nome} onChange={(event) => setField("nome", event.target.value)} />
                </label>
                <label>
                    Chave
                    <span className="project-key-control">
                        <input required minLength={2} maxLength={10} pattern="[A-Z][A-Z0-9]{1,9}" value={form.chave} disabled={mode === "edit"} onChange={(event) => setField("chave", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
                        {mode === "create" && <button type="button" onClick={suggestKey} disabled={!form.nome.trim() || suggesting}>{suggesting ? "..." : "Sugerir"}</button>}
                    </span>
                </label>
                <label>
                    Metodologia
                    <select value={form.metodologia} onChange={(event) => setField("metodologia", event.target.value)}>
                        <option value="SCRUM">Scrum</option><option value="KANBAN">Kanban</option><option value="HIBRIDA">Híbrida</option><option value="OUTRA">Outra</option>
                    </select>
                </label>
                <label className="project-form-wide">
                    Objetivo
                    <textarea maxLength={500} rows={3} value={form.objetivo} onChange={(event) => setField("objetivo", event.target.value)} />
                </label>
                <label className="project-form-wide">
                    Descrição
                    <textarea maxLength={1000} rows={4} value={form.descricao} onChange={(event) => setField("descricao", event.target.value)} />
                </label>
                </fieldset>
            </CrudModalTabPanel>

            <CrudModalTabPanel active={activeTab === "planejamento"}>
                <fieldset className="project-form-grid" disabled={!canEditDetails || saving}>
                {mode === "create" && <label>Status inicial<select value={form.situacao} onChange={(event) => setField("situacao", event.target.value)}><option value="RASCUNHO">Rascunho</option><option value="PLANEJADO">Planejado</option></select></label>}
                {mode === "create" && <label>Saúde inicial<select value={form.saude} onChange={(event) => setField("saude", event.target.value)}><option value="EM_DIA">Em dia</option><option value="EM_RISCO">Em risco</option><option value="ATRASADO">Atrasado</option></select></label>}
                <label>Início previsto<input type="date" value={form.inicioPrevistoEm} onChange={(event) => setField("inicioPrevistoEm", event.target.value)} /></label>
                <label>Término previsto<input type="date" value={form.fimPrevistoEm} onChange={(event) => setField("fimPrevistoEm", event.target.value)} /></label>
                </fieldset>
            </CrudModalTabPanel>

            <CrudModalTabPanel active={activeTab === "equipe"}>
                <fieldset disabled={!canManageTeam || saving}>
                    <legend>Responsável</legend>
                    <select required value={form.responsavelId} onChange={(event) => setField("responsavelId", event.target.value)}>
                        <option value="">Selecione</option>
                        {users.map((user) => <option key={user.id} value={user.id}>{userLabel(user)} — {user.email}</option>)}
                    </select>
                </fieldset>
                <fieldset className="project-member-picker" disabled={!canManageTeam || saving}>
                    <legend>Participantes</legend>
                    {users.filter((user) => user.id !== form.responsavelId).map((user) => (
                        <div key={user.id}>
                            <label>
                                <input type="checkbox" checked={participantIds.has(user.id)} onChange={() => toggleParticipant(user.id)} />
                                <span>{userLabel(user)}<small>{user.email}</small></span>
                            </label>
                            {participantIds.has(user.id) && (
                                <select value={form.participantes.find((item) => item.usuarioId === user.id)?.papel || "MEMBRO"} onChange={(event) => changeParticipantRole(user.id, event.target.value)}>
                                    <option value="MEMBRO">Membro</option><option value="OBSERVADOR">Observador</option>
                                </select>
                            )}
                        </div>
                    ))}
                    {!users.length && <p>Nenhum participante disponível.</p>}
                </fieldset>
                {!canManageTeam && <p className="project-form-note">Você pode alterar os dados do projeto, mas não possui permissão para gerenciar a equipe.</p>}
            </CrudModalTabPanel>
        </CrudModal>
    );
}
