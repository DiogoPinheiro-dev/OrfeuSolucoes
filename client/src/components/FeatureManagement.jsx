import { useEffect, useMemo, useState } from "react";

import {
    createFuncionalidade,
    deleteFuncionalidade,
    getSolucoes,
    updateFuncionalidade
} from "../../services/Solucoes/SolucaoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";
import CustomDropdown from "./CustomDropdown";

import "../styles/userManagement.css";

const initialForm = {
    id: "",
    solucaoId: "",
    slug: "",
    titulo: "",
    label: "",
    descricao: "",
    ordem: 0,
    ativo: true,
    registryKey: "",
    somenteAdminSistema: false
};

const booleanLabel = (value) => (value ? "Sim" : "Nao");

const normalizeFeatureForm = (feature) => ({
    ...initialForm,
    ...feature,
    solucaoId: feature?.solucaoId ? String(feature.solucaoId) : "",
    ordem: feature?.ordem ?? 0
});

const flattenFeatures = (solucoes) =>
    solucoes.flatMap((solucao) =>
        (solucao.funcionalidades || []).map((funcionalidade) => ({
            ...funcionalidade,
            solucaoId: solucao.id,
            solucaoNome: solucao.nome,
            solucaoSlug: solucao.slug
        }))
    );

const normalizePayload = (form) => ({
    solucaoId: Number(form.solucaoId),
    slug: form.slug.trim(),
    titulo: form.titulo.trim(),
    label: form.label.trim() || null,
    descricao: form.descricao.trim() || null,
    ordem: Number(form.ordem) || 0,
    ativo: !!form.ativo,
    registryKey: form.registryKey.trim() || null,
    somenteAdminSistema: !!form.somenteAdminSistema
});

export default function FeatureManagement({ permissions }) {
    const { user: currentUser } = useAuth();
    const [solucoes, setSolucoes] = useState([]);
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

    const features = useMemo(() => flattenFeatures(solucoes), [solucoes]);

    const filteredFeatures = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) {
            return features;
        }

        return features.filter((feature) =>
            [feature.titulo, feature.slug, feature.label, feature.registryKey, feature.solucaoNome]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [features, search]);

    const loadSolucoes = async () => {
        setError("");
        setLoading(true);

        try {
            setSolucoes(await getSolucoes());
        } catch (loadError) {
            setError(loadError.message || "Nao foi possivel carregar funcionalidades.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadSolucoes();
    }, []);

    const openModal = (mode, feature = null) => {
        setError("");
        setModalMode(mode);
        setForm(feature ? normalizeFeatureForm(feature) : initialForm);
    };

    const closeModal = () => {
        setModalMode(null);
        setForm(initialForm);
        setSaving(false);
    };

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        const payload = normalizePayload(form);

        try {
            if (modalMode === "create") {
                await createFuncionalidade(payload);
            }

            if (modalMode === "edit") {
                await updateFuncionalidade({ id: form.id, ...payload });
            }

            closeModal();
            await loadSolucoes();
        } catch (saveError) {
            setError(saveError.message || "Nao foi possivel salvar a funcionalidade.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (ids) => {
        const featuresToDelete = features.filter((feature) => ids.includes(feature.id));

        setPendingDelete({
            ids,
            label: featuresToDelete.length === 1
                ? featuresToDelete[0].titulo || "funcionalidade selecionada"
                : `${featuresToDelete.length} funcionalidades selecionadas`
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
            await Promise.all(pendingDelete.ids.map((id) => deleteFuncionalidade(id)));
            setSelectedId("");
            setSelectedIds([]);
            await loadSolucoes();
        } catch (deleteError) {
            setError(deleteError.message || "Nao foi possivel deletar a funcionalidade.");
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelectedFeature = (featureId) => {
        setSelectedIds((current) =>
            current.includes(featureId)
                ? current.filter((id) => id !== featureId)
                : [...current, featureId]
        );
    };

    const toggleVisibleFeatures = (checked, visibleFeatures) => {
        const visibleIds = visibleFeatures.map((feature) => feature.id);

        setSelectedIds((current) => {
            if (!checked) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };

    const selectedSolution = solucoes.find((solucao) => String(solucao.id) === String(form.solucaoId));
    const readonly = modalMode === "view";

    return (
        <>
            {error && <div className="user-management-error" role="alert">{error}</div>}
            {loading ? (
                <div className="user-management-loading">Carregando funcionalidades...</div>
            ) : (
                <CrudGrid
                    title="Cadastro de funcionalidades"
                    columns={[
                        { key: "titulo", label: "Titulo", render: (feature) => feature.titulo || "-" },
                        { key: "slug", label: "Slug", render: (feature) => feature.slug || "-" },
                        { key: "solucao", label: "Solucao", render: (feature) => feature.solucaoNome || "-" },
                        { key: "registryKey", label: "Rota", render: (feature) => feature.registryKey || "-" },
                        { key: "ordem", label: "Ordem" },
                        { key: "ativo", label: "Ativo", render: (feature) => booleanLabel(feature.ativo) },
                        { key: "somenteAdminSistema", label: "Admin", render: (feature) => booleanLabel(feature.somenteAdminSistema) }
                    ]}
                    rows={filteredFeatures}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectedFeature}
                    onToggleSelectAll={toggleVisibleFeatures}
                    isRowSelectable={() => true}
                    onCreate={() => openModal("create")}
                    onEdit={(feature) => openModal("edit", feature)}
                    onView={(feature) => openModal("view", feature)}
                    onDelete={handleDelete}
                    search={search}
                    onSearchChange={setSearch}
                    busy={gridBusy}
                    canCreate={canUseFeatureAction(currentUser, permissions, "incluir")}
                    canEdit={canUseFeatureAction(currentUser, permissions, "alterar")}
                    canView={canUseFeatureAction(currentUser, permissions, "visualizar")}
                    canDelete={canUseFeatureAction(currentUser, permissions, "excluir")}
                />
            )}

            {modalMode && (
                <div className="crud-modal-backdrop" role="presentation">
                    <div className="crud-modal" role="dialog" aria-modal="true" aria-label="Cadastro de funcionalidade">
                        <header className="crud-modal-header">
                            <div>
                                <span>{modalMode === "create" ? "Incluir" : modalMode === "edit" ? "Alterar" : "Visualizar"}</span>
                                <h3>Funcionalidade</h3>
                            </div>
                            <button type="button" onClick={closeModal} aria-label="Fechar">X</button>
                        </header>

                        <form className="user-form" onSubmit={handleSubmit}>
                            <label>
                                Solucao
                                <CustomDropdown
                                    name="solucaoId"
                                    value={form.solucaoId || ""}
                                    onChange={handleChange}
                                    disabled={readonly || saving}
                                    ariaLabel="Selecionar solucao da funcionalidade"
                                    options={[
                                        { value: "", label: "Selecione uma solucao" },
                                        ...solucoes.map((solucao) => ({
                                            value: solucao.id,
                                            label: solucao.nome
                                        }))
                                    ]}
                                />
                            </label>

                            <label>
                                Titulo
                                <input name="titulo" value={form.titulo || ""} onChange={handleChange} disabled={readonly || saving} required />
                            </label>

                            <label>
                                Slug
                                <input name="slug" value={form.slug || ""} onChange={handleChange} disabled={readonly || saving} required />
                            </label>

                            <label>
                                Rota da funcionalidade
                                <input
                                    name="registryKey"
                                    value={form.registryKey || ""}
                                    onChange={handleChange}
                                    disabled={readonly || saving}
                                    placeholder={selectedSolution ? `${selectedSolution.slug}.${form.slug || "nova-rota"}` : "solucao.slug-da-funcionalidade"}
                                />
                            </label>

                            <label>
                                Label
                                <input name="label" value={form.label || ""} onChange={handleChange} disabled={readonly || saving} />
                            </label>

                            <label>
                                Descricao
                                <input name="descricao" value={form.descricao || ""} onChange={handleChange} disabled={readonly || saving} />
                            </label>

                            <label>
                                Ordem
                                <input name="ordem" type="number" value={form.ordem ?? 0} onChange={handleChange} disabled={readonly || saving} />
                            </label>

                            <section className="user-company-section" aria-label="Status da funcionalidade">
                                <div className="user-permissions-grid">
                                    <label className="user-permission-option">
                                        <input type="checkbox" name="ativo" checked={!!form.ativo} onChange={handleChange} disabled={readonly || saving} />
                                        Ativo
                                    </label>
                                    <label className="user-permission-option">
                                        <input type="checkbox" name="somenteAdminSistema" checked={!!form.somenteAdminSistema} onChange={handleChange} disabled={readonly || saving} />
                                        Somente admin
                                    </label>
                                </div>
                            </section>

                            <div className="crud-modal-actions">
                                <button type="button" onClick={closeModal}>Fechar</button>
                                {!readonly && (
                                    <button type="submit" disabled={saving || !form.solucaoId}>
                                        {saving ? "Salvando..." : "Salvar"}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                title="Confirmar exclusao"
                message={`Tem certeza que quer deletar ${pendingDelete?.label || "a funcionalidade selecionada"}?`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}
