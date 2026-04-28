import { useEffect, useMemo, useState } from "react";

import { getEmpresas } from "../../services/Auth/AuthService";
import { createUser, deleteUser, getUsers, updateUser } from "../../services/Users/UserService";
import { USER_ROLE } from "../auth/hubConfig";
import CrudGrid from "./CrudGrid";

import "../styles/userManagement.css";

const initialForm = {
    id: "",
    nome: "",
    email: "",
    senha: "",
    tipo: USER_ROLE.USUARIO,
    empresaIds: []
};

const EMPRESAS_PAGE_SIZE = 5;

const roleLabels = {
    [USER_ROLE.ADMIN]: "Administrador",
    [USER_ROLE.CLIENTE]: "Cliente",
    [USER_ROLE.USUARIO]: "Usuario"
};

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [modalMode, setModalMode] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [empresasPage, setEmpresasPage] = useState(1);

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
            setEmpresas(await getEmpresas());
        } catch (loadError) {
            setError(loadError.message || "Nao foi possivel carregar empresas.");
        }
    };

    useEffect(() => {
        void loadUsers();
        void loadEmpresas();
    }, []);

    const filteredUsers = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) {
            return users;
        }

        return users.filter((user) =>
            [user.nome, user.email, roleLabels[user.tipo], ...(user.empresas || []).map((empresa) => empresa.nome)]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [search, users]);

    const openModal = (mode, user = null) => {
        setError("");
        setModalMode(mode);
        setEmpresasPage(1);
        setForm(
            user
                ? {
                    ...initialForm,
                    ...user,
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
        setEmpresasPage(1);
    };

    const handleChange = (event) => {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value
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
        setSaving(true);
        setError("");

        try {
            if (modalMode === "create") {
                await createUser({
                    nome: form.nome.trim(),
                    email: form.email.trim(),
                    senha: form.senha,
                    tipo: form.tipo,
                    empresaIds: form.empresaIds
                });
            }

            if (modalMode === "edit") {
                await updateUser({
                    id: form.id,
                    nome: form.nome.trim(),
                    email: form.email.trim(),
                    senha: form.senha,
                    tipo: form.tipo,
                    empresaIds: form.empresaIds
                });
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
        const total = idsToDelete.length;
        const confirmed = window.confirm(
            total === 1
                ? "Deseja deletar o usuario selecionado?"
                : `Deseja deletar ${total} usuarios selecionados?`
        );

        if (!confirmed) {
            return;
        }

        setError("");

        try {
            await Promise.all(idsToDelete.map((id) => deleteUser(id)));
            setSelectedId("");
            setSelectedIds([]);
            await loadUsers();
        } catch (deleteError) {
            setError(deleteError.message || "Nao foi possivel deletar o usuario.");
        }
    };

    const toggleSelectedUser = (userId) => {
        setSelectedIds((current) =>
            current.includes(userId)
                ? current.filter((id) => id !== userId)
                : [...current, userId]
        );
    };

    const toggleVisibleUsers = (checked, visibleUsers) => {
        const visibleIds = visibleUsers.map((user) => user.id);

        setSelectedIds((current) => {
            if (!checked) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };

    const readonly = modalMode === "view";
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
                        { key: "email", label: "Email" },
                        { key: "tipo", label: "Tipo", render: (user) => roleLabels[user.tipo] || user.tipo },
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
                    onCreate={() => openModal("create")}
                    onEdit={(user) => openModal("edit", user)}
                    onView={(user) => openModal("view", user)}
                    onDelete={handleDelete}
                    search={search}
                    onSearchChange={setSearch}
                />
            )}

            {modalMode && (
                <div className="crud-modal-backdrop" role="presentation">
                    <div className="crud-modal" role="dialog" aria-modal="true" aria-label="Cadastro de usuario">
                        <header className="crud-modal-header">
                            <div>
                                <span>{modalMode === "create" ? "Incluir" : modalMode === "edit" ? "Alterar" : "Visualizar"}</span>
                                <h3>Usuario</h3>
                            </div>
                            <button type="button" onClick={closeModal} aria-label="Fechar">X</button>
                        </header>

                        <form className="user-form" onSubmit={handleSubmit}>
                            <label>
                                Nome
                                <input name="nome" value={form.nome || ""} onChange={handleChange} disabled={readonly || saving} />
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
                                    <input
                                        name="senha"
                                        type="password"
                                        value={form.senha}
                                        onChange={handleChange}
                                        disabled={saving}
                                        required={modalMode === "create"}
                                        minLength={6}
                                    />
                                </label>
                            )}

                            <label>
                                Tipo
                                <select name="tipo" value={form.tipo} onChange={handleChange} disabled={readonly || saving}>
                                    <option value={USER_ROLE.USUARIO}>Usuario</option>
                                    <option value={USER_ROLE.CLIENTE}>Cliente</option>
                                    <option value={USER_ROLE.ADMIN}>Administrador</option>
                                </select>
                            </label>

                            <section className="user-company-section" aria-label="Empresas vinculadas ao usuario">
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

                                {readonly ? (
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
                            </section>

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
        </>
    );
}
