import { useMemo, useState } from "react";

import { createAgrupamento, deleteAgrupamento, updateAgrupamento } from "../../services/Solucoes/SolucaoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { useCrudSelection } from "../hooks/useCrudSelection";
import { useFormFieldErrors } from "../hooks/useFormFieldErrors";
import ConfirmDialog from "./ConfirmDialog";
import { FeedbackMessage } from "./CrudFeedback";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";
import CustomDropdown from "./CustomDropdown";
import FormFieldError from "./FormFieldError";

import "../styles/userManagement.css";

const GROUP_FORM_ID = "feature-group-form";
const GROUP_FIELD_ORDER = ["solucaoId", "titulo", "slug", "ordem"];
const GROUP_FIELD_MATCHERS = { slug: [/identificador/i] };
const STANDARD_GROUP_DELETE_REASON = "Agrupamentos padrão do sistema não podem ser excluídos; desative-os para apresentar as funcionalidades separadamente.";

const emptyGroup = {
    id: "",
    solucaoId: "",
    slug: "",
    titulo: "",
    label: "",
    descricao: "",
    ordem: 0,
    ativo: true,
    padraoSistema: false
};

const booleanLabel = (value) => (value ? "Sim" : "Não");

const toForm = (group) => ({
    ...emptyGroup,
    ...group,
    solucaoId: group.solucaoId ? String(group.solucaoId) : "",
    label: group.label || "",
    descricao: group.descricao || ""
});

export default function FeatureGroupManagement({ solucoes, permissions, onChanged }) {
    const { user: currentUser } = useAuth();
    const groups = useMemo(() => solucoes.flatMap((solucao) =>
        (solucao.agrupamentos || []).map((grupo) => ({
            ...grupo,
            solucaoNome: solucao.nome,
            funcionalidades: (solucao.funcionalidades || []).filter((funcionalidade) => funcionalidade.agrupamentoId === grupo.id).length
        }))
    ), [solucoes]);
    const selection = useCrudSelection(groups);
    const [modalMode, setModalMode] = useState(null);
    const [form, setForm] = useState(emptyGroup);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [pendingDelete, setPendingDelete] = useState(null);
    const {
        applyError,
        clearErrors,
        clearFieldError,
        fieldErrorProps,
        fieldErrors,
        generalError,
        showFieldErrors
    } = useFormFieldErrors({
        formId: GROUP_FORM_ID,
        fieldOrder: GROUP_FIELD_ORDER,
        fieldTabs: {},
        fieldMatchers: GROUP_FIELD_MATCHERS,
        setActiveTab: () => {}
    });

    const readonly = modalMode === "view";
    const creating = modalMode === "create";

    const openModal = (mode, group = null) => {
        setError("");
        clearErrors();
        setModalMode(mode);
        setForm(group ? toForm(group) : emptyGroup);
    };

    const closeModal = () => {
        clearErrors();
        setModalMode(null);
        setForm(emptyGroup);
    };

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;
        clearFieldError(name);
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const localErrors = {};
        if (!form.solucaoId) localErrors.solucaoId = "Selecione a solução.";
        if (!form.titulo.trim()) localErrors.titulo = "Preencha o título do agrupamento.";
        if (!form.slug.trim()) localErrors.slug = "Preencha o identificador do agrupamento.";
        if (Object.keys(localErrors).length) {
            showFieldErrors(localErrors);
            return;
        }

        const presentation = {
            titulo: form.titulo.trim(),
            label: form.label.trim() || null,
            descricao: form.descricao.trim() || null,
            ordem: Number(form.ordem) || 0,
            ativo: !!form.ativo
        };

        setSaving(true);
        try {
            if (creating) {
                await createAgrupamento({ solucaoId: Number(form.solucaoId), slug: form.slug.trim(), ...presentation });
            } else {
                await updateAgrupamento({ id: form.id, ...presentation });
            }
            closeModal();
            await onChanged();
        } catch (saveError) {
            applyError(saveError, "Não foi possível salvar o agrupamento.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (ids) => {
        const deletable = groups.filter((group) => ids.includes(group.id) && !group.padraoSistema);
        if (!deletable.length) {
            setError(STANDARD_GROUP_DELETE_REASON);
            return;
        }
        setPendingDelete(deletable);
    };

    const confirmDelete = async () => {
        const toDelete = pendingDelete || [];
        setPendingDelete(null);
        setSaving(true);
        setError("");
        try {
            for (const group of toDelete) {
                await deleteAgrupamento(group.id);
            }
            selection.resetSelection();
            await onChanged();
        } catch (deleteError) {
            setError(deleteError.message || "Não foi possível excluir o agrupamento.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <CrudGrid
                compact
                kicker="Navegação"
                title="Agrupamentos"
                description="Reúna funcionalidades complementares da mesma solução em uma única tela com abas."
                toolbarLabel="Ações dos agrupamentos"
                actionLabels={{ create: "Incluir agrupamento", edit: "Alterar agrupamento", view: "Visualizar agrupamento" }}
                deleteLabel="Excluir agrupamentos selecionados"
                columns={[
                    { key: "titulo", label: "Título" },
                    { key: "slug", label: "Identificador" },
                    { key: "solucaoNome", label: "Solução" },
                    { key: "funcionalidades", label: "Funcionalidades" },
                    { key: "ordem", label: "Ordem" },
                    { key: "ativo", label: "Ativo", render: (group) => booleanLabel(group.ativo) },
                    { key: "padraoSistema", label: "Padrão", render: (group) => booleanLabel(group.padraoSistema) }
                ]}
                rows={groups}
                getRowLabel={(group) => group.titulo}
                selectedId={selection.selectedId}
                selectedIds={selection.selectedIds}
                onSelect={selection.selectRow}
                onToggleSelect={selection.toggleSelected}
                onToggleSelectAll={selection.toggleVisible}
                isRowSelectable={(group) => !group.padraoSistema}
                getRowSelectionDisabledReason={() => STANDARD_GROUP_DELETE_REASON}
                onCreate={() => openModal("create")}
                onEdit={(group) => openModal("edit", group)}
                onView={(group) => openModal("view", group)}
                onDelete={handleDelete}
                emptyMessage="Nenhum agrupamento cadastrado."
                busy={saving}
                error={error}
                canCreate={canUseFeatureAction(currentUser, permissions, "incluir")}
                canEdit={canUseFeatureAction(currentUser, permissions, "alterar")}
                canView={canUseFeatureAction(currentUser, permissions, "visualizar")}
                canDelete={canUseFeatureAction(currentUser, permissions, "excluir")}
            />

            {modalMode && (
                <CrudModal
                    mode={modalMode}
                    formId={GROUP_FORM_ID}
                    noValidate
                    title="Agrupamento"
                    ariaLabel="Cadastro de agrupamento"
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    actions={(
                        <>
                            <button type="button" onClick={closeModal}>Fechar</button>
                            {!readonly && (
                                <button type="submit" disabled={saving}>
                                    {saving ? "Salvando..." : "Salvar"}
                                </button>
                            )}
                        </>
                    )}
                >
                    {generalError && <FeedbackMessage type="error" compact>{generalError}</FeedbackMessage>}
                    {!creating && form.padraoSistema && (
                        <small>Agrupamento padrão do sistema: pode ser personalizado ou desativado, mas não pode ser excluído.</small>
                    )}

                    <div className="user-form-field">
                        <span className="user-form-field-label">
                            <span>Solução <FormFieldError formId={GROUP_FORM_ID} field="solucaoId" errors={fieldErrors} /></span>
                        </span>
                        <CustomDropdown
                            name="solucaoId"
                            value={form.solucaoId || ""}
                            onChange={handleChange}
                            disabled={!creating || saving}
                            invalid={!!fieldErrors.solucaoId}
                            ariaDescribedBy={fieldErrorProps("solucaoId")["aria-describedby"]}
                            ariaLabel="Selecionar solução do agrupamento"
                            options={[
                                { value: "", label: "Selecione uma solução" },
                                ...solucoes.map((solucao) => ({ value: solucao.id, label: solucao.nome }))
                            ]}
                        />
                    </div>

                    <div className="user-form-field">
                        <span className="user-form-field-label">
                            <label htmlFor="agrupamento-titulo">Título <FormFieldError formId={GROUP_FORM_ID} field="titulo" errors={fieldErrors} /></label>
                        </span>
                        <input id="agrupamento-titulo" name="titulo" value={form.titulo || ""} onChange={handleChange} disabled={readonly || saving} {...fieldErrorProps("titulo")} />
                    </div>

                    <div className="user-form-field">
                        <span className="user-form-field-label">
                            <label htmlFor="agrupamento-slug">Identificador <FormFieldError formId={GROUP_FORM_ID} field="slug" errors={fieldErrors} /></label>
                        </span>
                        <input id="agrupamento-slug" name="slug" value={form.slug || ""} onChange={handleChange} disabled={!creating || saving} {...fieldErrorProps("slug")} />
                        <small>O identificador compõe o endereço do agrupamento e não pode ser alterado depois de criado.</small>
                    </div>

                    <div className="user-form-field">
                        <span className="user-form-field-label">
                            <label htmlFor="agrupamento-label">Label</label>
                        </span>
                        <input id="agrupamento-label" name="label" value={form.label || ""} onChange={handleChange} disabled={readonly || saving} />
                    </div>

                    <div className="user-form-field">
                        <span className="user-form-field-label">
                            <label htmlFor="agrupamento-descricao">Descrição</label>
                        </span>
                        <input id="agrupamento-descricao" name="descricao" value={form.descricao || ""} onChange={handleChange} disabled={readonly || saving} />
                    </div>

                    <div className="user-form-field">
                        <span className="user-form-field-label">
                            <label htmlFor="agrupamento-ordem">Ordem</label>
                        </span>
                        <input id="agrupamento-ordem" name="ordem" type="number" value={form.ordem ?? 0} onChange={handleChange} disabled={readonly || saving} />
                    </div>

                    <section className="user-company-section" aria-label="Status do agrupamento">
                        <div className="user-permissions-grid">
                            <label className="user-permission-option">
                                <input type="checkbox" name="ativo" checked={!!form.ativo} onChange={handleChange} disabled={readonly || saving} />
                                Ativo
                            </label>
                        </div>
                    </section>
                </CrudModal>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                title="Confirmar exclusão"
                message={pendingDelete?.length === 1
                    ? `Tem certeza de que deseja excluir o agrupamento ${pendingDelete[0].titulo}?`
                    : `Tem certeza de que deseja excluir ${pendingDelete?.length || 0} agrupamentos selecionados?`}
                confirmLabel="Excluir"
                variant="destructive"
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={saving}
            />
        </>
    );
}
