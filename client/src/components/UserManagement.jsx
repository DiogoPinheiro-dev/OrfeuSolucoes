import { useCallback, useEffect, useMemo, useState } from "react";

import { getEmpresas } from "../../services/Auth/AuthService";
import { getGruposUsuarios } from "../../services/GruposUsuarios/GrupoUsuarioService";
import { createUser, deleteUser, getUsers, updateUser } from "../../services/Users/UserService";
import { canUseFeatureAction, isGroupAdmin } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { useFormFieldErrors } from "../hooks/useFormFieldErrors";
import { useLatestRequest } from "../hooks/useLatestRequest";
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";
import FormFieldError from "./FormFieldError";
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
const USER_FORM_ID = "user-registration-form";
const USER_FIELD_ORDER = ["nome", "login", "email", "senha", "grupoId", "empresaIds"];
const USER_FIELD_TABS = {
    nome: "main",
    login: "main",
    email: "main",
    senha: "main",
    grupoId: "main",
    empresaIds: "companies"
};
const USER_FIELD_MATCHERS = {
    login: [/login/i],
    email: [/e-?mail/i],
    senha: [/senha/i],
    empresaIds: [/empresa/i],
    grupoId: [/grupo/i]
};

const isProtectedAdminUser = (user) => !!user?.padraoSistema;

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
    const usersRequest = useLatestRequest();
    const referencesRequest = useLatestRequest();
    const {
        applyError: applyFormError,
        clearErrors: clearFormErrors,
        clearFieldError,
        fieldErrorProps,
        fieldErrors,
        generalError: formError,
        showFieldErrors
    } = useFormFieldErrors({
        formId: USER_FORM_ID,
        fieldOrder: USER_FIELD_ORDER,
        fieldTabs: USER_FIELD_TABS,
        fieldMatchers: USER_FIELD_MATCHERS,
        setActiveTab
    });

    const loadUsers = useCallback(() => {
        setError("");
        setLoading(true);

        return usersRequest.run(getUsers, {
            onSuccess: (usersResponse) => {
                setUsers(usersResponse);
                setSelectedIds((current) =>
                    current.filter((id) => usersResponse.some((user) => user.id === id && !isProtectedAdminUser(user)))
                );
            },
            onError: (loadError) => setError(loadError.message || "Não foi possível carregar usuários."),
            onSettled: () => setLoading(false)
        });
    }, [usersRequest]);

    const loadReferences = useCallback(() => {
        return referencesRequest.run(
            () => Promise.all([getEmpresas(), getGruposUsuarios()]),
            {
                onSuccess: ([empresasResponse, gruposResponse]) => {
                    setEmpresas(empresasResponse);
                    setGrupos(gruposResponse);
                },
                onError: (loadError) => setError(loadError.message || "Não foi possível carregar empresas e grupos.")
            }
        );
    }, [referencesRequest]);

    useEffect(() => {
        void loadUsers();
        void loadReferences();
        return () => {
            usersRequest.invalidate();
            referencesRequest.invalidate();
        };
    }, [loadReferences, loadUsers, referencesRequest, usersRequest]);

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
        clearFormErrors();
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
        clearFormErrors();
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
        clearFieldError(name);
    };

    const toggleEmpresa = (empresaId) => {
        clearFieldError("empresaIds");
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

        const missingFields = {};
        if (!form.login.trim()) missingFields.login = "Informe o login.";
        if (!form.email.trim()) missingFields.email = "Informe o e-mail.";
        if (modalMode === "create" && !form.senha) missingFields.senha = "Informe a senha.";
        if (Object.keys(missingFields).length) {
            showFieldErrors(missingFields);
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
            applyFormError(saveError, "Nao foi possivel salvar o usuario.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        const idsToDelete = Array.isArray(user) ? user : [user.id];
        const deleteUsers = users.filter((item) => idsToDelete.includes(item.id));

        if (deleteUsers.some(isProtectedAdminUser)) {
            setError("O usuario administrador padrao do sistema nao pode ser excluido.");
            return;
        }

        setPendingDelete({
            ids: idsToDelete,
            label: deleteUsers.length === 1
                ? deleteUsers[0].nome || deleteUsers[0].email || "usuário selecionado"
                : `${deleteUsers.length} usuários selecionados`
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
            setError(deleteError.message || "Não foi possível deletar o usuário.");
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
    const empresasTotalPages = Math.max(1, Math.ceil(empresas.length / EMPRESAS_PAGE_SIZE));
    const empresasStart = (empresasPage - 1) * EMPRESAS_PAGE_SIZE;
    const visibleEmpresas = empresas.slice(empresasStart, empresasStart + EMPRESAS_PAGE_SIZE);
    const empresasSelecionadas = empresas.filter((empresa) => form.empresaIds.includes(Number(empresa.id)));

    return (
        <>
            <CrudGrid
                    title="Cadastro de usuários"
                    columns={[
                        { key: "nome", label: "Nome", render: (user) => user.nome || "-" },
                        { key: "login", label: "Login", render: (user) => user.login || "-" },
                        { key: "email", label: "E-mail" },
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
                    rows={loading ? [] : filteredUsers}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectedUser}
                    onToggleSelectAll={toggleVisibleUsers}
                    isRowSelectable={(user) => !isProtectedAdminUser(user)}
                    getRowSelectionDisabledReason={() => "O usuário administrador padrão não pode ser excluído."}
                    onCreate={() => openModal("create")}
                    onEdit={(user) => openModal("edit", user)}
                    onView={(user) => openModal("view", user)}
                    onDelete={handleDelete}
                    search={search}
                    onSearchChange={setSearch}
                    busy={gridBusy || loading}
                    error={error}
                    onRetry={() => Promise.all([loadUsers(), loadReferences()])}
                    emptyMessage="Nenhum usuário encontrado."
                    canCreate={canUseFeatureAction(currentUser, permissions, "incluir")}
                    canEdit={canUseFeatureAction(currentUser, permissions, "alterar")}
                    canView={canUseFeatureAction(currentUser, permissions, "visualizar")}
                    canDelete={canUseFeatureAction(currentUser, permissions, "excluir")}
                />

            {modalMode && (
                <CrudModal
                    mode={modalMode}
                    title="Usuário"
                    ariaLabel="Cadastro de usuário"
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    formId={USER_FORM_ID}
                    noValidate
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
                                ariaLabel="Seções do usuário"
                                tabs={[
                                    { id: "main", label: "Dados de acesso" },
                                    { id: "companies", label: "Empresas vinculadas" }
                                ]}
                            />

                            {formError && <div className="user-management-error" role="alert">{formError}</div>}

                            <CrudModalTabPanel active={activeTab === "main"}>
                            <div className="user-form-field">
                                <span className="user-form-field-label">
                                    <label htmlFor="usuario-nome">Nome</label>
                                    <FormFieldError formId={USER_FORM_ID} field="nome" message={fieldErrors.nome} />
                                </span>
                                <input id="usuario-nome" name="nome" value={form.nome || ""} onChange={handleChange} disabled={readonly || saving} {...fieldErrorProps("nome")} />
                            </div>

                            <div className="user-form-field">
                                <span className="user-form-field-label">
                                    <label htmlFor="usuario-login">Login</label>
                                    <FormFieldError formId={USER_FORM_ID} field="login" message={fieldErrors.login} />
                                </span>
                                <input
                                    id="usuario-login"
                                    name="login"
                                    value={form.login || ""}
                                    onChange={handleChange}
                                    disabled={readonly || saving}
                                    required
                                    {...fieldErrorProps("login")}
                                />
                            </div>

                            <div className="user-form-field">
                                <span className="user-form-field-label">
                                    <label htmlFor="usuario-email">E-mail</label>
                                    <FormFieldError formId={USER_FORM_ID} field="email" message={fieldErrors.email} />
                                </span>
                                <input
                                    id="usuario-email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    disabled={readonly || saving}
                                    required
                                    {...fieldErrorProps("email")}
                                />
                            </div>

                            {!readonly && (
                                <div className="user-form-field">
                                    <span className="user-form-field-label">
                                        <label htmlFor="usuario-senha">Senha</label>
                                        {modalMode === "edit" && <small>preencha apenas para alterar.</small>}
                                        <FormFieldError formId={USER_FORM_ID} field="senha" message={fieldErrors.senha} />
                                    </span>
                                    <PasswordInput
                                        id="usuario-senha"
                                        name="senha"
                                        value={form.senha}
                                        onChange={handleChange}
                                        disabled={saving}
                                        required={modalMode === "create"}
                                        minLength={6}
                                        {...fieldErrorProps("senha")}
                                    />
                                </div>
                            )}

                            <div className="user-form-field">
                                <span className="user-form-field-label">
                                    <span>Grupo</span>
                                    <FormFieldError formId={USER_FORM_ID} field="grupoId" message={fieldErrors.grupoId} />
                                </span>
                                <CustomDropdown
                                    name="grupoId"
                                    value={form.grupoId || ""}
                                    onChange={handleChange}
                                    disabled={readonly || saving}
                                    ariaLabel="Selecionar grupo do usuário"
                                    options={[
                                        { value: "", label: "Sem grupo" },
                                        ...grupos.map((grupo) => ({
                                            value: grupo.id,
                                            label: grupo.nome
                                        }))
                                    ]}
                                    invalid={!!fieldErrors.grupoId}
                                    ariaDescribedBy={fieldErrorProps("grupoId")["aria-describedby"]}
                                />
                            </div>
                            </CrudModalTabPanel>

                            <CrudModalTabPanel active={activeTab === "companies"} className="user-company-section">
                                <div className="user-company-header">
                                    <div>
                                        <span>Empresas vinculadas</span>
                                        <FormFieldError formId={USER_FORM_ID} field="empresaIds" message={fieldErrors.empresaIds} />
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
                                                                name="empresaIds"
                                                                checked={form.empresaIds.includes(empresaId)}
                                                                onChange={() => toggleEmpresa(empresaId)}
                                                                disabled={saving}
                                                                {...fieldErrorProps("empresaIds")}
                                                            />
                                                            <span>{empresa.nome || `Empresa ${empresa.id}`}</span>
                                                        </label>
                                                    );
                                                })
                                            ) : (
                                                <p className="user-company-empty">Nenhuma empresa cadastrada.</p>
                                            )}
                                        </div>

                                        <div className="user-company-pagination" aria-label="Paginação de empresas">
                                            <button
                                                type="button"
                                                onClick={() => setEmpresasPage((page) => Math.max(1, page - 1))}
                                                disabled={empresasPage === 1}
                                            >
                                                Anterior
                                            </button>
                                            <span>
                                                Página {empresasPage} de {empresasTotalPages}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setEmpresasPage((page) => Math.min(empresasTotalPages, page + 1))}
                                                disabled={empresasPage === empresasTotalPages}
                                            >
                                                Próxima
                                            </button>
                                        </div>
                                    </>
                                )}
                            </CrudModalTabPanel>
                </CrudModal>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                title="Confirmar exclusão"
                message={`Tem certeza que deseja deletar ${pendingDelete?.label || "o usuário selecionado"}?`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}
