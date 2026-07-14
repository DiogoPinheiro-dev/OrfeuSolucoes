import { useEffect, useMemo, useState } from "react";

import {
    createChamadoSlaRegra,
    deleteChamadoSlaRegra,
    getPrioridadesChamado,
    getRegrasSlaChamado,
    updateChamadoSlaRegra
} from "../../services/Chamados/ChamadoService";
import { canUseFeatureAction } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";
import { CrudModal } from "./CrudModal";

import "../styles/chamados.css";

const initialForm = {
    id: "",
    prioridadeId: "",
    primeiraRespostaPrazoMinutos: 60,
    resolucaoPrazoMinutos: 480,
    modoContagem: "CORRIDO",
    ativo: true
};

const booleanLabel = (value) => (value ? "Sim" : "Nao");

const prazoLabel = (minutes) => {
    const value = Number(minutes || 0);

    if (value > 0 && value % 60 === 0) {
        const hours = value / 60;
        return `${hours} ${hours === 1 ? "hora" : "horas"}`;
    }

    return `${value} minutos`;
};

export default function SlaChamadoManagement({ permissions }) {
    const { user } = useAuth();
    const [regras, setRegras] = useState([]);
    const [prioridades, setPrioridades] = useState([]);
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

    const loadData = async () => {
        setError("");
        setLoading(true);

        try {
            const [regrasData, prioridadesData] = await Promise.all([
                getRegrasSlaChamado(false),
                getPrioridadesChamado(false)
            ]);

            setRegras(regrasData);
            setPrioridades(prioridadesData);
        } catch (loadError) {
            setError(loadError.message || "Nao foi possivel carregar as regras de SLA.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const filteredRegras = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) {
            return regras;
        }

        return regras.filter((regra) =>
            [regra.prioridadeNome, regra.modoContagem]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term))
        );
    }, [regras, search]);

    const openModal = (mode, regra = null) => {
        setError("");
        setModalMode(mode);
        setForm(regra ? { ...initialForm, ...regra, prioridadeId: String(regra.prioridadeId) } : initialForm);
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
            [name]: type === "checkbox" ? checked : type === "number" ? Number(value || 0) : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.prioridadeId) {
            setError("Selecione a prioridade da regra de SLA.");
            return;
        }

        if (form.primeiraRespostaPrazoMinutos < 1 || form.resolucaoPrazoMinutos < 1) {
            setError("Os prazos de SLA devem ser maiores que zero.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                prioridadeId: Number(form.prioridadeId),
                primeiraRespostaPrazoMinutos: Number(form.primeiraRespostaPrazoMinutos),
                resolucaoPrazoMinutos: Number(form.resolucaoPrazoMinutos),
                modoContagem: form.modoContagem,
                ativo: !!form.ativo
            };

            if (modalMode === "create") {
                await createChamadoSlaRegra(payload);
            }

            if (modalMode === "edit") {
                await updateChamadoSlaRegra({ id: form.id, ...payload });
            }

            closeModal();
            await loadData();
        } catch (saveError) {
            setError(saveError.message || "Nao foi possivel salvar a regra de SLA.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (ids) => {
        const selected = regras.filter((regra) => ids.includes(regra.id));

        setPendingDelete({
            ids,
            label: selected.length === 1
                ? `a regra da prioridade ${selected[0].prioridadeNome}`
                : `${selected.length} regras selecionadas`
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
                await deleteChamadoSlaRegra(id);
            }

            setSelectedId("");
            setSelectedIds([]);
            await loadData();
        } catch (deleteError) {
            setError(deleteError.message || "Nao foi possivel desativar a regra de SLA.");
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelected = (id) => {
        setSelectedIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
        );
    };

    const toggleVisible = (checked, visibleItems) => {
        const visibleIds = visibleItems.map((item) => item.id);

        setSelectedIds((current) => checked
            ? [...new Set([...current, ...visibleIds])]
            : current.filter((id) => !visibleIds.includes(id))
        );
    };

    const readonly = modalMode === "view";

    return (
        <>
            {error && <div className="user-management-error" role="alert">{error}</div>}
            {loading ? (
                <div className="user-management-loading">Carregando regras de SLA...</div>
            ) : (
                <CrudGrid
                    title="Regras de SLA"
                    columns={[
                        { key: "prioridadeNome", label: "Prioridade", render: (regra) => regra.prioridadeNome || "-" },
                        { key: "primeiraRespostaPrazoMinutos", label: "Primeira resposta", render: (regra) => prazoLabel(regra.primeiraRespostaPrazoMinutos) },
                        { key: "resolucaoPrazoMinutos", label: "Resolucao", render: (regra) => prazoLabel(regra.resolucaoPrazoMinutos) },
                        { key: "modoContagem", label: "Contagem", render: (regra) => regra.modoContagem === "UTEIS" ? "Dias uteis" : "Tempo corrido" },
                        { key: "ativo", label: "Ativo", render: (regra) => booleanLabel(regra.ativo) }
                    ]}
                    rows={filteredRegras}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onToggleSelectAll={toggleVisible}
                    isRowSelectable={() => true}
                    onCreate={() => openModal("create")}
                    onView={(regra) => openModal("view", regra)}
                    onEdit={(regra) => openModal("edit", regra)}
                    onDelete={handleDelete}
                    canCreate={canUseFeatureAction(user, permissions, "incluir")}
                    canEdit={canUseFeatureAction(user, permissions, "alterar")}
                    canDelete={canUseFeatureAction(user, permissions, "excluir")}
                    search={search}
                    onSearch={setSearch}
                    loading={gridBusy}
                    getRowId={(regra) => regra.id}
                />
            )}

            {modalMode && (
                <CrudModal
                    mode={modalMode}
                    title="Regra de SLA"
                    ariaLabel="Regra de SLA"
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
                        <span>Prioridade</span>
                        <select name="prioridadeId" value={form.prioridadeId || ""} onChange={handleChange} disabled={readonly || saving} required>
                            <option value="">Selecione</option>
                            {prioridades.map((prioridade) => (
                                <option key={prioridade.id} value={prioridade.id}>
                                    {prioridade.nome}{prioridade.ativo ? "" : " (inativa)"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="chamado-form-grid chamado-config-grid">
                        <label>
                            <span>Prazo da primeira resposta (minutos)</span>
                            <input type="number" name="primeiraRespostaPrazoMinutos" min="1" value={form.primeiraRespostaPrazoMinutos} onChange={handleChange} disabled={readonly || saving} required />
                        </label>

                        <label>
                            <span>Prazo de resolucao (minutos)</span>
                            <input type="number" name="resolucaoPrazoMinutos" min="1" value={form.resolucaoPrazoMinutos} onChange={handleChange} disabled={readonly || saving} required />
                        </label>
                    </div>

                    <label>
                        <span>Modo de contagem</span>
                        <select name="modoContagem" value={form.modoContagem} onChange={handleChange} disabled={readonly || saving}>
                            <option value="CORRIDO">Tempo corrido</option>
                            <option value="UTEIS">Dias uteis (ignora sabados e domingos)</option>
                        </select>
                    </label>

                    <label className="chamado-checkbox">
                        <input type="checkbox" name="ativo" checked={!!form.ativo} onChange={handleChange} disabled={readonly || saving} />
                        <span>Ativo</span>
                    </label>
                </CrudModal>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                title="Desativar regra de SLA"
                message={`Deseja desativar ${pendingDelete?.label || "a regra selecionada"}? Chamados ja abertos manterao os prazos calculados.`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}
