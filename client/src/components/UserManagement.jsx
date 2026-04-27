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
    empresaId: ""
};

const roleLabels = {
    [USER_ROLE.ADMIN]: "Administrador",
    [USER_ROLE.CLIENTE]: "Cliente",
    [USER_ROLE.USUARIO]: "Usuario"
};

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [modalMode, setModalMode] = useState(null);
    const [form, setForm] = useState(initialForm);

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
            [user.nome, user.email, roleLabels[user.tipo], user.empresa?.nome]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [search, users]);

    const openModal = (mode, user = null) => {
        setError("");
        setModalMode(mode);
        setForm(user ? { ...initialForm, ...user, empresaId: user.empresa?.id ? String(user.empresa.id) : "", senha: "" } : initialForm);
    };

    const closeModal = () => {
        setModalMode(null);
        setForm(initialForm);
        setSaving(false);
    };

    const handleChange = (event) => {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value
        }));
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
                    empresaId: form.empresaId
                });
            }

            if (modalMode === "edit") {
                await updateUser({
                    id: form.id,
                    nome: form.nome.trim(),
                    email: form.email.trim(),
                    senha: form.senha,
                    tipo: form.tipo,
                    empresaId: form.empresaId
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
        const confirmed = window.confirm(`Deseja deletar o usuario ${user.nome || user.email}?`);

        if (!confirmed) {
            return;
        }

        setError("");

        try {
            await deleteUser(user.id);
            setSelectedId("");
            await loadUsers();
        } catch (deleteError) {
            setError(deleteError.message || "Nao foi possivel deletar o usuario.");
        }
    };

    const readonly = modalMode === "view";

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
                        { key: "empresa", label: "Empresa", render: (user) => user.empresa?.nome || "-" },
                        { key: "id", label: "Id" }
                    ]}
                    rows={filteredUsers}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
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

                            <label>
                                Empresa vinculada
                                <select name="empresaId" value={form.empresaId} onChange={handleChange} disabled={readonly || saving}>
                                    <option value="">Sem empresa vinculada</option>
                                    {empresas.map((empresa) => (
                                        <option key={empresa.id} value={empresa.id}>
                                            {empresa.nome || `Empresa ${empresa.id}`}
                                        </option>
                                    ))}
                                </select>
                            </label>

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
