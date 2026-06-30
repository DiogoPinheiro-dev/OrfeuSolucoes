import { useEffect, useMemo, useState } from "react";

import {
    createChamadoCategoria,
    deleteChamadoCategoria,
    getCategoriasChamado,
    updateChamadoCategoria
} from "../../services/Chamados/ChamadoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";

import "../styles/chamados.css";

const initialForm = {
    id: "",
    nome: "",
    descricao: "",
    ativo: true
};

const booleanLabel = (value) => (value ? "Sim" : "Nao");

export default function CategoriaChamadoManagement({ permissions }) {
    const { user } = useAuth();
    const [categorias, setCategorias] = useState([]);
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

    const loadCategorias = async () => {
        setError("");
        setLoading(true);

        try {
            setCategorias(await getCategoriasChamado(false));
        } catch (loadError) {
            setError(loadError.message || "Nao foi possivel carregar categorias.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadCategorias();
    }, []);

    const filteredCategorias = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) {
            return categorias;
        }

        return categorias.filter((categoria) =>
            [categoria.nome, categoria.descricao]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [categorias, search]);

    const openModal = (mode, categoria = null) => {
        setError("");
        setModalMode(mode);
        setForm(categoria ? { ...initialForm, ...categoria, descricao: categoria.descricao || "" } : initialForm);
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
        setError("");

        if (!form.nome.trim()) {
            setError("Preencha o nome da categoria.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                nome: form.nome.trim(),
                descricao: form.descricao.trim() || null,
                ativo: !!form.ativo
            };

            if (modalMode === "create") {
                await createChamadoCategoria(payload);
            }

            if (modalMode === "edit") {
                await updateChamadoCategoria({ id: form.id, ...payload });
            }

            closeModal();
            await loadCategorias();
        } catch (saveError) {
            setError(saveError.message || "Nao foi possivel salvar a categoria.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (ids) => {
        const categoriasToDelete = categorias.filter((categoria) => ids.includes(categoria.id));

        setPendingDelete({
            ids,
            label: categoriasToDelete.length === 1
                ? categoriasToDelete[0].nome || "categoria selecionada"
                : `${categoriasToDelete.length} categorias selecionadas`
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
                await deleteChamadoCategoria(id);
            }

            setSelectedId("");
            setSelectedIds([]);
            await loadCategorias();
        } catch (deleteError) {
            setError(deleteError.message || "Nao foi possivel desativar a categoria.");
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelected = (categoriaId) => {
        setSelectedIds((current) =>
            current.includes(categoriaId)
                ? current.filter((id) => id !== categoriaId)
                : [...current, categoriaId]
        );
    };

    const toggleVisible = (checked, visibleCategorias) => {
        const visibleIds = visibleCategorias.map((categoria) => categoria.id);

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
                <div className="user-management-loading">Carregando categorias...</div>
            ) : (
                <CrudGrid
                    title="Categorias de chamados"
                    columns={[
                        { key: "nome", label: "Nome", render: (categoria) => categoria.nome || "-" },
                        { key: "descricao", label: "Descricao", render: (categoria) => categoria.descricao || "-" },
                        { key: "ativo", label: "Ativo", render: (categoria) => booleanLabel(categoria.ativo) }
                    ]}
                    rows={filteredCategorias}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onToggleSelectAll={toggleVisible}
                    isRowSelectable={() => true}
                    onCreate={() => openModal("create")}
                    onEdit={(categoria) => openModal("edit", categoria)}
                    onView={(categoria) => openModal("view", categoria)}
                    onDelete={handleDelete}
                    search={search}
                    onSearchChange={setSearch}
                    busy={gridBusy}
                    canCreate={canUseFeatureAction(user, permissions, "incluir")}
                    canEdit={canUseFeatureAction(user, permissions, "alterar")}
                    canView={canUseFeatureAction(user, permissions, "visualizar")}
                    canDelete={canUseFeatureAction(user, permissions, "excluir")}
                />
            )}

            {modalMode && (
                <CrudModal
                    mode={modalMode}
                    title="Categoria de chamado"
                    ariaLabel="Categoria de chamado"
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
                    <label>
                        <span>Nome</span>
                        <input name="nome" value={form.nome || ""} onChange={handleChange} disabled={readonly || saving} required />
                    </label>

                    <label>
                        <span>Descricao</span>
                        <textarea name="descricao" value={form.descricao || ""} onChange={handleChange} disabled={readonly || saving} rows={4} />
                    </label>

                    <label className="chamado-checkbox">
                        <input type="checkbox" name="ativo" checked={!!form.ativo} onChange={handleChange} disabled={readonly || saving} />
                        <span>Ativo</span>
                    </label>
                </CrudModal>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                title="Desativar categoria"
                message={`Deseja desativar ${pendingDelete?.label || "a categoria selecionada"}? Os chamados existentes permanecem vinculados.`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}
