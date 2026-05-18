import { useEffect, useMemo, useState } from "react";

import { createEmpresa, deleteEmpresa, getEmpresas, updateEmpresa } from "../../services/Empresas/EmpresaService";
import { getSolucoes } from "../../services/Solucoes/SolucaoService";
import { getUsers } from "../../services/Users/UserService";
import { canUseFeatureAction, isGroupAdmin } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";

import "../styles/companyManagement.css";

const initialForm = {
    id: "",
    nome: "",
    solucaoIds: [],
    funcionalidadeIds: []
};

const booleanLabel = (value) => (value ? "Sim" : "Nao");

export default function CompanyManagement({ permissions }) {
    const { user: currentUser } = useAuth();
    const [empresas, setEmpresas] = useState([]);
    const [solucoes, setSolucoes] = useState([]);
    const [users, setUsers] = useState([]);
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

    const loadEmpresas = async () => {
        setError("");
        setLoading(true);

        try {
            const [empresasResponse, usersResponse, solucoesResponse] = await Promise.all([getEmpresas(), getUsers(), getSolucoes()]);
            setEmpresas(empresasResponse);
            setUsers(usersResponse);
            setSolucoes(solucoesResponse.filter((solucao) => !solucao.somenteAdminSistema));
        } catch (loadError) {
            setError(loadError.message || "Nao foi possivel carregar empresas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadEmpresas();
    }, []);

    const filteredEmpresas = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) {
            return empresas;
        }

        return empresas.filter((empresa) =>
            [empresa.nome]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [empresas, search]);

    const openModal = (mode, empresa = null) => {
        setError("");
        setModalMode(mode);
        setForm(
            empresa
                ? {
                    ...initialForm,
                    ...empresa,
                    adminSenha: ""
                }
                : initialForm
        );
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

        try {
            if (modalMode === "create") {
                await createEmpresa({
                    nome: form.nome.trim(),
                    solucaoIds: form.solucaoIds,
                    funcionalidadeIds: form.funcionalidadeIds
                });
            }

            if (modalMode === "edit") {
                await updateEmpresa({
                    id: form.id,
                    nome: form.nome.trim(),
                    solucaoIds: form.solucaoIds,
                    funcionalidadeIds: form.funcionalidadeIds
                });
            }

            closeModal();
            await loadEmpresas();
        } catch (saveError) {
            setError(saveError.message || "Nao foi possivel salvar a empresa.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (ids) => {
        const deleteEmpresas = empresas.filter((empresa) => ids.includes(empresa.id));

        setPendingDelete({
            ids,
            label: deleteEmpresas.length === 1
                ? deleteEmpresas[0].nome || "empresa selecionada"
                : `${deleteEmpresas.length} empresas selecionadas`
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
                await deleteEmpresa(id);
            }

            setSelectedId("");
            setSelectedIds([]);
            await loadEmpresas();
        } catch (deleteError) {
            setError(deleteError.message || "Nao foi possivel deletar a empresa.");
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelectedEmpresa = (empresaId) => {
        setSelectedIds((current) =>
            current.includes(empresaId)
                ? current.filter((id) => id !== empresaId)
                : [...current, empresaId]
        );
    };

    const toggleVisibleEmpresas = (checked, visibleEmpresas) => {
        const visibleIds = visibleEmpresas.map((empresa) => empresa.id);

        setSelectedIds((current) => {
            if (!checked) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };

    const toggleSolucao = (solucao) => {
        setForm((current) => {
            const selected = current.solucaoIds.includes(solucao.id);
            const funcionalidadeIds = solucao.funcionalidades?.map((funcionalidade) => funcionalidade.id) || [];

            return {
                ...current,
                solucaoIds: selected
                    ? current.solucaoIds.filter((id) => id !== solucao.id)
                    : [...current.solucaoIds, solucao.id],
                funcionalidadeIds: selected
                    ? current.funcionalidadeIds.filter((id) => !funcionalidadeIds.includes(id))
                    : [...new Set([...current.funcionalidadeIds, ...funcionalidadeIds])]
            };
        });
    };

    const toggleFuncionalidade = (funcionalidadeId) => {
        setForm((current) => ({
            ...current,
            funcionalidadeIds: current.funcionalidadeIds.includes(funcionalidadeId)
                ? current.funcionalidadeIds.filter((id) => id !== funcionalidadeId)
                : [...current.funcionalidadeIds, funcionalidadeId]
        }));
    };

    const readonly = modalMode === "view";
    const currentUserIsAdmin = isGroupAdmin(currentUser);
    const linkedUsers = useMemo(() => {
        const empresaId = Number(form.id);

        if (!empresaId) {
            return [];
        }

        return users.filter((user) =>
            (currentUserIsAdmin || !isGroupAdmin(user)) &&
            (user.empresas || []).some((empresa) => Number(empresa.id) === empresaId)
        );
    }, [currentUserIsAdmin, form.id, users]);

    return (
        <>
            {error && <div className="company-management-error" role="alert">{error}</div>}
            {loading ? (
                <div className="company-management-loading">Carregando empresas...</div>
            ) : (
                <CrudGrid
                    title="Cadastro de empresas"
                    columns={[
                        { key: "nome", label: "Nome", render: (empresa) => empresa.nome || "-" },
                        ...solucoes.map((solucao) => ({
                            key: `solucao-${solucao.id}`,
                            label: solucao.nome,
                            render: (empresa) => booleanLabel(empresa.solucaoIds?.includes(solucao.id))
                        }))
                    ]}
                    rows={filteredEmpresas}
                    selectedId={selectedId}
                    selectedIds={selectedIds}
                    onSelect={setSelectedId}
                    onToggleSelect={toggleSelectedEmpresa}
                    onToggleSelectAll={toggleVisibleEmpresas}
                    onCreate={() => openModal("create")}
                    onEdit={(empresa) => openModal("edit", empresa)}
                    onView={(empresa) => openModal("view", empresa)}
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
                    <div className="crud-modal" role="dialog" aria-modal="true" aria-label="Cadastro de empresa">
                        <header className="crud-modal-header">
                            <div>
                                <span>{modalMode === "create" ? "Incluir" : modalMode === "edit" ? "Alterar" : "Visualizar"}</span>
                                <h3>Empresa</h3>
                            </div>
                            <button type="button" onClick={closeModal} aria-label="Fechar">X</button>
                        </header>

                        <form className="company-form" onSubmit={handleSubmit}>
                            <label>
                                Nome
                                <input name="nome" value={form.nome || ""} onChange={handleChange} disabled={readonly || saving} required />
                            </label>

                            <div className="company-access-grid">
                                {solucoes.map((solucao) => (
                                    <label key={solucao.id}>
                                        <input
                                            type="checkbox"
                                            checked={form.solucaoIds.includes(solucao.id)}
                                            onChange={() => toggleSolucao(solucao)}
                                            disabled={readonly || saving}
                                        />
                                        {solucao.nome}
                                    </label>
                                ))}
                            </div>

                            <section className="user-company-section" aria-label="Funcionalidades da empresa">
                                <div className="user-company-header">
                                    <div>
                                        <span>Funcionalidades</span>
                                        <strong>Areas contratadas pela empresa</strong>
                                    </div>
                                </div>

                                <div className="user-permissions-grid">
                                    {solucoes.flatMap((solucao) =>
                                        (solucao.funcionalidades || []).map((funcionalidade) => (
                                            <label key={funcionalidade.id} className="user-permission-option">
                                                <input
                                                    type="checkbox"
                                                    checked={form.funcionalidadeIds.includes(funcionalidade.id)}
                                                    onChange={() => toggleFuncionalidade(funcionalidade.id)}
                                                    disabled={readonly || saving || !form.solucaoIds.includes(solucao.id)}
                                                />
                                                {funcionalidade.titulo}
                                            </label>
                                        ))
                                    )}
                                </div>
                            </section>

                            {readonly && (
                                <section className="company-linked-users" aria-label="Usuarios vinculados a empresa">
                                    <div className="company-linked-users-header">
                                        <span>Usuarios vinculados</span>
                                        <strong>
                                            {linkedUsers.length === 1
                                                ? "1 usuario vinculado"
                                                : `${linkedUsers.length} usuarios vinculados`}
                                        </strong>
                                    </div>

                                    {linkedUsers.length ? (
                                        <div className="company-linked-users-list">
                                            <div className="company-linked-user company-linked-user-head">
                                                <span>Nome</span>
                                                <span>Email</span>
                                                <span>Tipo</span>
                                            </div>
                                            {linkedUsers.map((user) => (
                                                <div className="company-linked-user" key={user.id}>
                                                    <strong>{user.nome || "Usuario sem nome"}</strong>
                                                    <span>{user.email}</span>
                                                    <small>{user.grupo?.nome || "Sem grupo"}</small>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="company-linked-users-empty">Nenhum usuario vinculado a esta empresa.</p>
                                    )}
                                </section>
                            )}

                            <div className="crud-modal-actions">
                                <button type="button" onClick={closeModal}>Fechar</button>
                                {!readonly && (
                                    <button type="submit" disabled={saving}>
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
                message={`Tem certeza que quer deletar a ${pendingDelete?.label || "empresa selecionada"}?`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}
