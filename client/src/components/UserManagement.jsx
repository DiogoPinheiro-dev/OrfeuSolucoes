import { useEffect, useMemo, useState } from "react";

import { getEmpresas } from "../../services/Auth/AuthService";
import { getGruposUsuarios } from "../../services/GruposUsuarios/GrupoUsuarioService";
import { createUser, deleteUser, getUsers, updateUser } from "../../services/Users/UserService";
import { canUseFeatureAction, isGroupAdmin, isSystemAdmin } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";
import { CrudModal, CrudModalTabPanel, CrudModalTabs } from "./CrudModal";
import CustomDropdown from "./CustomDropdown";
import PasswordInput from "./PasswordInput";

import "../styles/userManagement.css";

const initialForm = {
    id: "",
    nome: "",
    login: "",
    email: "",
    senha: "",
    grupoId: "",
    empresaIds: []
};

const EMPRESAS_PAGE_SIZE = 5;

const isProtectedAdminUser = (user) => isSystemAdmin(user);

export default function UserManagement({ permissions }) {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gridBusy, setGridBusy] = useState(false);
    const [error, setError] = useState("");
    const [modalMode, setModalMode] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [activeTab, setActiveTab] = useState("main");
    const [empresasPage, setEmpresasPage] = useState(1);
    const [pendingDelete, setPendingDelete] = useState(null);

    const loadUsers = async () => {
        setError("");
        setLoading(true);

        try {
            setUsers(await getUsers());
        } catch (loadError) {
            setError(loadError.message || "Nao foi possivel carregar usuarios.");
        } finally {
            setLoading(false);
        }
    };

    const loadEmpresas = async () => {
        try {
            const [empresasResponse, gruposResponse] = await Promise.all([getEmpresas(), getGruposUsuarios()]);
            setEmpresas(empresasResponse);
            setGrupos(gruposResponse);
        } catch (loadError) {
            setError(loadError.message || "Nao foi possivel carregar empresas e grupos.");
        }
    };

    useEffect(() => {
        void loadUsers();
        void loadEmpresas();
    }, []);

    const currentUserIsAdmin = isGroupAdmin(currentUser);

    const visibleUsers = useMemo(
        () => currentUserIsAdmin ? users : users.filter((user) => !isGroupAdmin(user)),
        [currentUserIsAdmin, users]
    );

    const filteredUsers = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) {
            return visibleUsers;
        }

        return visibleUsers.filter((user) =>
            [user.nome, user.login, user.email, user.grupo?.nome, ...(user.empresas || []).map((empresa) => empresa.nome)]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [search, visibleUsers]);

    const openModal = (mode, user = null) => {
        setError("");
        setModalMode(mode);
        setActiveTab("main");
        setEmpresasPage(1);
        setForm(
            user
                ? {
                    ...initialForm,
                    ...user,
                    grupoId: user.grupo?.id ? String(user.grupo.id) : "",
                    empresaIds: (user.empresas || []).map((empresa) => Number(empresa.id)),
                    senha: ""
                }
                : initialForm
        );
    };

    const closeModal = () => {
        setModalMode(null);
        setForm(initialForm);
        setSaving(false);
        setActiveTab("main");
        setEmpresasPage(1);
    };

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const toggleEmpresa = (empresaId) => {
        setForm((current) => {
            const selected = current.empresaIds.includes(empresaId);

            return {
                ...current,
                empresaIds: selected
                    ? current.empresaIds.filter((id) => id !== empresaId)
                    : [...current.empresaIds, empresaId]
            };
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.email.trim() || !form.login.trim() || (modalMode === "create" && !form.senha)) {
            setActiveTab("main");
            setError("Preencha login, email e senha para salvar o usuario.");
            return;
        }

        setSaving(true);

        try {
            if (modalMode === "create") {
                await createUser({
                    nome: form.nome.trim(),
                    login: form.login.trim(),
                    email: form.email.trim(),
                    senha: form.senha,
                    grupoId: form.grupoId ? Number(form.grupoId) : null,
                    empresaIds: form.empresaIds
                });
            }

            if (modalMode === "edit") {
                const payload = {
                    id: form.id,
                    nome: form.nome.trim(),
                    login: form.login.trim(),
                    email: form.email.trim(),
                    senha: form.senha,
                    grupoId: form.grupoId ? Number(form.grupoId) : null,
                    empresaIds: form.empresaIds
                };

                await updateUser(payload);
            }

            closeModal();
            await loadUsers();
        } catch (saveError) {
            setError(saveError.message || "Nao foi possivel salvar o usuario.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        const idsToDelete = Array.isArray(user) ? user : [user.id];
        const deleteUsers = users.filter((item) => idsToDelete.includes(item.id));

        if (deleteUsers.some(isProtectedAdminUser)) {
            setError("O usuario administrador inicial nao pode ser excluido.");
            return;
        }

        setPendingDelete({
            ids: idsToDelete,
            label: deleteUsers.length === 1
                ? deleteUsers[0].nome || deleteUsers[0].email || "usuario selecionado"
                : `${deleteUsers.length} usuarios selecionados`
        });
    };

    const confirmDelete = async () => {
        if (!pendingDelete) {
            return;
        }

        const idsToDelete = pendingDelete.ids;

        setError("");
        setPendingDelete(null);
        setGridBusy(true);

        try {
            await Promise.all(idsToDelete.map((id) => deleteUser(id)));
            setSelectedId("");
            setSelectedIds([]);
            await loadUsers();
        } catch (deleteError) {
            setError(deleteError.message || "Nao foi possivel deletar o usuario.");
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelectedUser = (userId) => {
        const user = users.find((item) => item.id === userId);

        if (isProtectedAdminUser(user)) {
            return;
        }

        setSelectedIds((current) =>
            current.includes(userId)
                ? current.filter((id) => id !== userId)
                : [...current, userId]
        );
    };

    const toggleVisibleUsers = (checked, visibleUsers) => {
        const visibleIds = visibleUsers.filter((user) => !isProtectedAdminUser(user)).map((user) => user.id);

        setSelectedIds((current) => {
            if (!checked) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };

    const readonly = modalMode === "view";
    const editingProtectedAdmin = isProtectedAdminUser(form);
    const empresasTotalPages = Math.max(1, Math.ceil(empresas.length / EMPRESAS_PAGE_SIZE));
    const empresasStart = (empresasPage - 1) * EMPRESAS_PAGE_SIZE;
    const visibleEmpresas = empresas.slice(empresasStart, empresasStart + EMPRESAS_PAGE_SIZE);
    const empresasSelecionadas = empresas.filter((empresa) => form.empresaIds.includes(Number(empresa.id)));

    return (
        <>
            {error && <div className="user-management-error" role="alert">{error}</div>}
            {loading ? (
                <div className="user-management-loading">Carregando usuarios...</div>
            ) : (
                <CrudGrid
                    title="Cadastro de usuarios"
                    columns={[
                        { key: "nome", label: "Nome", render: (user) => user.nome || "-" },
                        { key: "login", label: "Login", render: (user) => user.login || "-" },
                        { key: "email", label: "Email" },
                        { key: "grupo", label: "Grupo", render: (user) => user.grupo?.nome || "Sem grupo" },
                        {
                            key: "empresas",
                            label: "Empresas",
                            render: (user) => {
                                const total = user.empresas?.length || 0;
                                return total === 1 ? "1 empresa vinculada" : `${total} empresas vinculadas`;
                            }
                        }
                    ]}
                    rows={filteredUsers}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectedUser}
                    onToggleSelectAll={toggleVisibleUsers}
                    isRowSelectable={(user) => !isProtectedAdminUser(user)}
                    onCreate={() => openModal("create")}
                    onEdit={(user) => {
                        if (isProtectedAdminUser(user)) {
                            setError("O usuario administrador inicial nao pode ser alterado.");
                            return;
                        }

                        openModal("edit", user);
                    }}
                    onView={(user) => openModal("view", user)}
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
                <CrudModal
                    mode={modalMode}
                    title="Usuario"
                    ariaLabel="Cadastro de usuario"
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
                            <CrudModalTabs
                                activeTab={activeTab}
                                onChange={setActiveTab}
                                ariaLabel="Secoes do usuario"
                                tabs={[
                                    { id: "main", label: "Dados de acesso" },
                                    { id: "companies", label: "Empresas vinculadas" }
                                ]}
                            />

                            <CrudModalTabPanel active={activeTab === "main"}>
                            <label>
                                Nome
                                <input name="nome" value={form.nome || ""} onChange={handleChange} disabled={readonly || saving || editingProtectedAdmin} />
                            </label>

                            <label>
                                Login
                                <input
                                    name="login"
                                    value={form.login || ""}
                                    onChange={handleChange}
                                    disabled={readonly || saving || editingProtectedAdmin}
                                    required={!editingProtectedAdmin}
                                />
                            </label>

                            <label>
                                Email
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    disabled={readonly || saving}
                                    required
                                />
                            </label>

                            {!readonly && (
                                <label>
                                    Senha {modalMode === "edit" && <small>preencha apenas para alterar</small>}
                                    <PasswordInput
                                        name="senha"
                                        value={form.senha}
                                        onChange={handleChange}
                                        disabled={saving}
                                        required={modalMode === "create"}
                                        minLength={6}
                                    />
                                </label>
                            )}

                            <label>
                                Grupo
                                <CustomDropdown
                                    name="grupoId"
                                    value={form.grupoId || ""}
                                    onChange={handleChange}
                                    disabled={readonly || saving || editingProtectedAdmin}
                                    ariaLabel="Selecionar grupo do usuario"
                                    options={[
                                        { value: "", label: "Sem grupo" },
                                        ...grupos.map((grupo) => ({
                                            value: grupo.id,
                                            label: grupo.nome
                                        }))
                                    ]}
                                />
                            </label>
                            </CrudModalTabPanel>

                            <CrudModalTabPanel active={activeTab === "companies"} className="user-company-section">
                                <div className="user-company-header">
                                    <div>
                                        <span>Empresas vinculadas</span>
                                        <strong>
                                            {form.empresaIds.length === 1
                                                ? "1 empresa selecionada"
                                                : `${form.empresaIds.length} empresas selecionadas`}
                                        </strong>
                                    </div>
                                </div>

                                {readonly || editingProtectedAdmin ? (
                                    <div className="user-company-list">
                                        {empresasSelecionadas.length ? (
                                            empresasSelecionadas.map((empresa) => (
                                                <span key={empresa.id}>{empresa.nome || `Empresa ${empresa.id}`}</span>
                                            ))
                                        ) : (
                                            <p>Nenhuma empresa vinculada.</p>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="user-company-grid">
                                            <div className="user-company-row user-company-row-head">
                                                <span>Selecionar</span>
                                                <span>Empresa</span>
                                            </div>

                                            {visibleEmpresas.length ? (
                                                visibleEmpresas.map((empresa) => {
                                                    const empresaId = Number(empresa.id);

                                                    return (
                                                        <label className="user-company-row" key={empresa.id}>
                                                            <input
                                                                type="checkbox"
                                                                checked={form.empresaIds.includes(empresaId)}
                                                                onChange={() => toggleEmpresa(empresaId)}
                                                                disabled={saving}
                                                            />
                                                            <span>{empresa.nome || `Empresa ${empresa.id}`}</span>
                                                        </label>
                                                    );
                                                })
                                            ) : (
                                                <p className="user-company-empty">Nenhuma empresa cadastrada.</p>
                                            )}
                                        </div>

                                        <div className="user-company-pagination" aria-label="Paginacao de empresas">
                                            <button
                                                type="button"
                                                onClick={() => setEmpresasPage((page) => Math.max(1, page - 1))}
                                                disabled={empresasPage === 1}
                                            >
                                                Anterior
                                            </button>
                                            <span>
                                                Pagina {empresasPage} de {empresasTotalPages}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setEmpresasPage((page) => Math.min(empresasTotalPages, page + 1))}
                                                disabled={empresasPage === empresasTotalPages}
                                            >
                                                Proxima
                                            </button>
                                        </div>
                                    </>
                                )}
                            </CrudModalTabPanel>
                </CrudModal>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                title="Confirmar exclusao"
                message={`Tem certeza que quer deletar ${pendingDelete?.label || "o usuario selecionado"}?`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}
