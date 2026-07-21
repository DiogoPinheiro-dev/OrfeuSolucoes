import { useCallback, useEffect, useMemo, useState } from "react";

import {
    createChamadoPrioridade,
    createChamadoTipo,
    deleteChamadoPrioridade,
    deleteChamadoTipo,
    getPrioridadesChamado,
    getTiposChamado,
    updateChamadoPrioridade,
    updateChamadoTipo
} from "../../services/Chamados/ChamadoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { useFormFieldErrors } from "../hooks/useFormFieldErrors";
import ConfirmDialog from "./ConfirmDialog";
import FormFieldError from "./FormFieldError";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";

import "../styles/chamados.css";

const initialForm = {
    id: "",
    nome: "",
    descricao: "",
    cor: "",
    ordem: 0,
    ativo: true
};

const booleanLabel = (value) => (value ? "Sim" : "Nao");
const colorLabel = (value) => value || "-";

const config = {
    tipos: {
        title: "Tipos de chamados",
        singular: "Tipo de chamado",
        loading: "Carregando tipos...",
        emptyDelete: "o tipo selecionado",
        deleteTitle: "Desativar tipo",
        deleteMessage: "Deseja desativar {label}? Novos chamados nao poderao usar este cadastro.",
        load: getTiposChamado,
        create: createChamadoTipo,
        update: updateChamadoTipo,
        remove: deleteChamadoTipo
    },
    prioridades: {
        title: "Prioridades de chamados",
        singular: "Prioridade de chamado",
        loading: "Carregando prioridades...",
        emptyDelete: "a prioridade selecionada",
        deleteTitle: "Desativar prioridade",
        deleteMessage: "Deseja desativar {label}? Novos chamados nao poderao usar este cadastro.",
        load: getPrioridadesChamado,
        create: createChamadoPrioridade,
        update: updateChamadoPrioridade,
        remove: deleteChamadoPrioridade
    }
};

export default function ChamadoConfiguracaoManagement({ permissions, kind }) {
    const { user } = useAuth();
    const settings = config[kind] || config.tipos;
    const formId = `ticket-${kind}-registration-form`;
    const [items, setItems] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gridBusy, setGridBusy] = useState(false);
    const [error, setError] = useState("");
    const [modalMode, setModalMode] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [pendingDelete, setPendingDelete] = useState(null);
    const {
        applyError: applyFormError,
        clearErrors: clearFormErrors,
        clearFieldError,
        fieldErrorProps,
        fieldErrors,
        generalError: formError,
        showFieldErrors
    } = useFormFieldErrors({ formId, fieldOrder: ["nome", "descricao", "cor", "ordem"] });
    const loadItems = useCallback(async () => {
        setError("");
        setLoading(true);

        try {
            setItems(await settings.load(false));
        } catch (loadError) {
            setError(loadError.message || `Nao foi possivel carregar ${settings.title.toLowerCase()}.`);
        } finally {
            setLoading(false);
        }
    }, [settings]);

    useEffect(() => {
        void loadItems();
    }, [loadItems]);

    const filteredItems = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) {
            return items;
        }

        return items.filter((item) =>
            [item.nome, item.descricao, item.cor]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term))
        );
    }, [items, search]);

    const openModal = (mode, item = null) => {
        setError("");
        clearFormErrors();
        setModalMode(mode);
        setForm(item ? { ...initialForm, ...item, descricao: item.descricao || "", cor: item.cor || "" } : initialForm);
    };

    const closeModal = () => {
        clearFormErrors();
        setModalMode(null);
        setForm(initialForm);
        setSaving(false);
    };

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;

        clearFieldError(name);

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : type === "number" ? Number(value || 0) : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.nome.trim()) {
            showFieldErrors({ nome: `Preencha o nome de ${settings.singular.toLowerCase()}.` });
            return;
        }

        setSaving(true);

        try {
            const payload = {
                nome: form.nome.trim(),
                descricao: form.descricao.trim() || null,
                cor: form.cor.trim() || null,
                ordem: Number(form.ordem || 0),
                ativo: !!form.ativo
            };

            if (modalMode === "create") {
                await settings.create(payload);
            }

            if (modalMode === "edit") {
                await settings.update({ id: form.id, ...payload });
            }

            closeModal();
            await loadItems();
        } catch (saveError) {
            applyFormError(saveError, `Nao foi possivel salvar ${settings.singular.toLowerCase()}.`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (ids) => {
        const selected = items.filter((item) => ids.includes(item.id));

        setPendingDelete({
            ids,
            label: selected.length === 1
                ? selected[0].nome || settings.emptyDelete
                : `${selected.length} registros selecionados`
        });
    };

    const confirmDelete = async () => {
        if (!pendingDelete) {
            return;
        }

        setError("");
        setPendingDelete(null);
        setGridBusy(true);

        try {
            for (const id of pendingDelete.ids) {
                await settings.remove(id);
            }

            setSelectedId("");
            setSelectedIds([]);
            await loadItems();
        } catch (deleteError) {
            setError(deleteError.message || `Nao foi possivel desativar ${settings.singular.toLowerCase()}.`);
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelected = (itemId) => {
        setSelectedIds((current) =>
            current.includes(itemId)
                ? current.filter((id) => id !== itemId)
                : [...current, itemId]
        );
    };

    const toggleVisible = (checked, visibleItems) => {
        const visibleIds = visibleItems.map((item) => item.id);

        setSelectedIds((current) => {
            if (!checked) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };

    const readonly = modalMode === "view";

    return (
        <>
            {error && <div className="user-management-error" role="alert">{error}</div>}
            {loading ? (
                <div className="user-management-loading">{settings.loading}</div>
            ) : (
                <CrudGrid
                    title={settings.title}
                    columns={[
                        { key: "ordem", label: "Ordem", render: (item) => item.ordem ?? 0 },                        { key: "nome", label: "Nome", render: (item) => item.nome || "-" },
                        { key: "cor", label: "Cor", render: (item) => colorLabel(item.cor) },
                        { key: "ativo", label: "Ativo", render: (item) => booleanLabel(item.ativo) }
                    ]}
                    rows={filteredItems}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onToggleSelectAll={toggleVisible}
                    isRowSelectable={() => true}
                    onCreate={() => openModal("create")}
                    onView={(item) => openModal("view", item)}
                    onEdit={(item) => openModal("edit", item)}
                    onDelete={handleDelete}
                    canCreate={canUseFeatureAction(user, permissions, "incluir")}
                    canEdit={canUseFeatureAction(user, permissions, "alterar")}
                    canDelete={canUseFeatureAction(user, permissions, "excluir")}
                    search={search}
                    onSearch={setSearch}
                    loading={gridBusy}
                    getRowId={(item) => item.id}
                />
            )}

            {modalMode && (
                <CrudModal
                    mode={modalMode}
                    formId={formId}
                    noValidate
                    title={settings.singular}
                    ariaLabel={settings.singular}
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

                    {formError && <div className="crud-error" role="alert">{formError}</div>}
                    <label>
                        <span>Nome <FormFieldError formId={formId} field="nome" errors={fieldErrors} /></span>
                        <input name="nome" value={form.nome || ""} onChange={handleChange} disabled={readonly || saving} {...fieldErrorProps("nome")} />
                    </label>

                    <label>
                        <span>Descricao</span>
                        <textarea name="descricao" value={form.descricao || ""} onChange={handleChange} disabled={readonly || saving} rows={4} />
                    </label>

                    <div className="chamado-form-grid chamado-config-grid">
                        <label>
                            <span>Cor</span>
                            <input name="cor" value={form.cor || ""} onChange={handleChange} disabled={readonly || saving} placeholder="#174ea6" />
                        </label>

                        <label>
                            <span>Ordem</span>
                            <input type="number" name="ordem" min="0" value={form.ordem ?? 0} onChange={handleChange} disabled={readonly || saving} />
                        </label>
                    </div>

                    <label className="chamado-checkbox">
                        <input type="checkbox" name="ativo" checked={!!form.ativo} onChange={handleChange} disabled={readonly || saving} />
                        <span>Ativo</span>
                    </label>
                </CrudModal>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                title={settings.deleteTitle}
                message={settings.deleteMessage.replace("{label}", pendingDelete?.label || settings.emptyDelete)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}

