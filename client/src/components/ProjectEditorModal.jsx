import { useEffect, useMemo, useState } from "react";

import { useFormFieldErrors } from "../hooks/useFormFieldErrors";

import { CrudModal, CrudModalTabPanel, CrudModalTabs } from "./CrudModal";
import FormFieldError from "./FormFieldError";

const PROJECT_FORM_ID = "project-registration-form";
const PROJECT_FIELD_ORDER = ["nome", "chave", "metodologia", "objetivo", "descricao", "situacao", "saude", "inicioPrevistoEm", "fimPrevistoEm", "responsavelId", "participantes"];
const PROJECT_FIELD_TABS = {
    nome: "geral", chave: "geral", metodologia: "geral", objetivo: "geral", descricao: "geral",
    situacao: "planejamento", saude: "planejamento", inicioPrevistoEm: "planejamento", fimPrevistoEm: "planejamento",
    responsavelId: "equipe", participantes: "equipe"
};
const PROJECT_FIELD_MATCHERS = { chave: [/chave.*uso/i, /chave.*cadastrada/i] };

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
    const {
        applyError: applyFormError,
        clearErrors: clearFormErrors,
        clearFieldError,
        fieldErrorProps,
        fieldErrors,
        generalError: formError,
        showFieldErrors
    } = useFormFieldErrors({
        formId: PROJECT_FORM_ID,
        fieldOrder: PROJECT_FIELD_ORDER,
        fieldTabs: PROJECT_FIELD_TABS,
        fieldMatchers: PROJECT_FIELD_MATCHERS,
        setActiveTab
    });

    useEffect(() => {
        setForm(initialForm(project));
        setActiveTab("geral");
        clearFormErrors();
    }, [project, mode, clearFormErrors]);


    useEffect(() => {
        if (error) applyFormError(error, "Nao foi possivel salvar o projeto.");
    }, [error, applyFormError]);

    const participantIds = useMemo(
        () => new Set(form.participantes.map((item) => item.usuarioId)),
        [form.participantes]
    );

    const setField = (field, value) => {
        clearFieldError(field);
        setForm((current) => ({ ...current, [field]: value }));
    };

    const suggestKey = async () => {
        if (!form.nome.trim()) return;
        setSuggesting(true);
        try {
            clearFormErrors();
            setField("chave", await onSuggestKey(form.nome));
        } catch (suggestError) {
            applyFormError(suggestError, "Nao foi possivel sugerir a chave.");
        } finally {
            setSuggesting(false);
        }
    };

    const toggleParticipant = (usuarioId) => {
        clearFieldError("participantes");
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
        clearFormErrors();
        const localErrors = {};
        if (!form.nome.trim()) localErrors.nome = "Preencha o nome do projeto.";
        if (!form.chave.trim()) localErrors.chave = "Preencha a chave do projeto.";
        else if (!/^[A-Z][A-Z0-9]{1,9}$/.test(form.chave.trim())) localErrors.chave = "Use de 2 a 10 letras maiusculas ou numeros, iniciando por uma letra.";
        if (!form.responsavelId) localErrors.responsavelId = "Selecione o responsável pelo projeto.";
        if (form.inicioPrevistoEm && form.fimPrevistoEm && form.inicioPrevistoEm > form.fimPrevistoEm) {
            localErrors.fimPrevistoEm = "O início previsto não pode ser posterior ao término previsto.";
        }
        if (Object.keys(localErrors).length) {
            showFieldErrors(localErrors);
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
            formId={PROJECT_FORM_ID}
            noValidate
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

            {formError && <p className="project-detail-error" role="alert">{formError}</p>}

            <CrudModalTabPanel active={activeTab === "geral"}>
                <fieldset className="project-form-grid" disabled={!canEditDetails || saving}>
                <label className="project-form-wide">
                    Nome <FormFieldError formId={PROJECT_FORM_ID} field="nome" errors={fieldErrors} />
                    <input name="nome" maxLength={200} value={form.nome} onChange={(event) => setField("nome", event.target.value)} {...fieldErrorProps("nome")} />
                </label>
                <label>
                    Chave <FormFieldError formId={PROJECT_FORM_ID} field="chave" errors={fieldErrors} />
                    <span className="project-key-control">
                        <input name="chave" minLength={2} maxLength={10} pattern="[A-Z][A-Z0-9]{1,9}" value={form.chave} disabled={mode === "edit"} onChange={(event) => setField("chave", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} {...fieldErrorProps("chave")} />
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
                <label>Início previsto <FormFieldError formId={PROJECT_FORM_ID} field="inicioPrevistoEm" errors={fieldErrors} /><input type="date" name="inicioPrevistoEm" value={form.inicioPrevistoEm} onChange={(event) => setField("inicioPrevistoEm", event.target.value)} {...fieldErrorProps("inicioPrevistoEm")} /></label>
                <label>Término previsto <FormFieldError formId={PROJECT_FORM_ID} field="fimPrevistoEm" errors={fieldErrors} /><input type="date" name="fimPrevistoEm" value={form.fimPrevistoEm} onChange={(event) => setField("fimPrevistoEm", event.target.value)} {...fieldErrorProps("fimPrevistoEm")} /></label>
                </fieldset>
            </CrudModalTabPanel>

            <CrudModalTabPanel active={activeTab === "equipe"}>
                <fieldset disabled={!canManageTeam || saving}>
                    <legend>Responsável <FormFieldError formId={PROJECT_FORM_ID} field="responsavelId" errors={fieldErrors} /></legend>
                    <select name="responsavelId" value={form.responsavelId} onChange={(event) => setField("responsavelId", event.target.value)} {...fieldErrorProps("responsavelId")}>
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
