import { useCallback, useEffect, useMemo, useState } from "react";

import { createEmpresa, deleteEmpresa, getEmpresas, updateEmpresa } from "../../services/Empresas/EmpresaService";
import { getSolucoes } from "../../services/Solucoes/SolucaoService";
import { getUsers } from "../../services/Users/UserService";
import { canUseFeatureAction, isGroupAdmin } from "../auth/hubConfig";
import { useAuth } from "../hooks/useAuth";
import { useFormFieldErrors } from "../hooks/useFormFieldErrors";
import { useLatestRequest } from "../hooks/useLatestRequest";
import ConfirmDialog from "./ConfirmDialog";
import { FeedbackMessage } from "./CrudFeedback";
import FormFieldError from "./FormFieldError";
import CrudGrid from "./CrudGrid";
import { CrudModal, CrudModalTabPanel, CrudModalTabs } from "./CrudModal";

import "../styles/companyManagement.css";
import "../styles/userManagement.css";

const COMPANY_FORM_ID = "company-registration-form";
const COMPANY_FIELD_ORDER = ["nome", "solucaoIds"];
const COMPANY_FIELD_TABS = { nome: "main", solucaoIds: "solutions" };

const initialForm = {
    id: "",
    nome: "",
    solucaoIds: [],
    funcionalidadeIds: []
};

const booleanLabel = (value) => (value ? "Sim" : "Não");
const canDeleteEmpresa = (empresa) => !empresa?.padraoSistema;

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
    const [activeTab, setActiveTab] = useState("main");
    const [pendingDelete, setPendingDelete] = useState(null);
    const companiesRequest = useLatestRequest();
    const {
        applyError: applyFormError,
        clearErrors: clearFormErrors,
        clearFieldError,
        fieldErrorProps,
        fieldErrors,
        generalError: formError,
        showFieldErrors
    } = useFormFieldErrors({
        formId: COMPANY_FORM_ID,
        fieldOrder: COMPANY_FIELD_ORDER,
        fieldTabs: COMPANY_FIELD_TABS,
        setActiveTab
    });
    const getFuncionalidadeIdsBySolucaoIds = (solucaoIds) =>
        solucoes
            .filter((solucao) => solucaoIds.includes(solucao.id))
            .flatMap((solucao) => solucao.funcionalidades?.map((funcionalidade) => funcionalidade.id) || []);

    const loadEmpresas = useCallback(() => {
        setError("");
        setLoading(true);

        return companiesRequest.run(
            () => Promise.all([getEmpresas(), getUsers(), getSolucoes()]),
            {
                onSuccess: ([empresasResponse, usersResponse, solucoesResponse]) => {
                    setEmpresas(empresasResponse);
                    setSelectedIds((current) => current.filter((id) => empresasResponse.some((empresa) => empresa.id === id && canDeleteEmpresa(empresa))));
                    setUsers(usersResponse);
                    setSolucoes(solucoesResponse.filter((solucao) => !solucao.somenteAdminSistema));
                },
                onError: (loadError) => setError(loadError.message || "Não foi possível carregar empresas."),
                onSettled: () => setLoading(false)
            }
        );
    }, [companiesRequest]);

    useEffect(() => {
        void loadEmpresas();
        return companiesRequest.invalidate;
    }, [companiesRequest, loadEmpresas]);

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
        clearFormErrors();
        setModalMode(mode);
        setActiveTab("main");
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
        clearFormErrors();
        setModalMode(null);
        setForm(initialForm);
        setSaving(false);
        setActiveTab("main");
    };

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;

        clearFieldError(name);

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.nome.trim()) {
            showFieldErrors({ nome: "Preencha o nome da empresa." });
            return;
        }

        setSaving(true);

        const funcionalidadeIds = getFuncionalidadeIdsBySolucaoIds(form.solucaoIds);

        try {
            if (modalMode === "create") {
                await createEmpresa({
                    nome: form.nome.trim(),
                    solucaoIds: form.solucaoIds,
                    funcionalidadeIds
                });
            }

            if (modalMode === "edit") {
                await updateEmpresa({
                    id: form.id,
                    nome: form.nome.trim(),
                    solucaoIds: form.solucaoIds,
                    funcionalidadeIds
                });
            }

            closeModal();
            await loadEmpresas();
        } catch (saveError) {
            applyFormError(saveError, "Não foi possível salvar a empresa.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (ids) => {
        const deleteEmpresas = empresas.filter((empresa) => ids.includes(empresa.id) && canDeleteEmpresa(empresa));

        if (!deleteEmpresas.length) {
            setError("A empresa padrão do sistema não pode ser excluída.");
            return;
        }

        setPendingDelete({
            ids: deleteEmpresas.map((empresa) => empresa.id),
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
            setError(deleteError.message || "Não foi possível deletar a empresa.");
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelectedEmpresa = (empresaId) => {
        const empresa = empresas.find((item) => item.id === empresaId);

        if (!canDeleteEmpresa(empresa)) {
            return;
        }

        setSelectedIds((current) =>
            current.includes(empresaId)
                ? current.filter((id) => id !== empresaId)
                : [...current, empresaId]
        );
    };

    const toggleVisibleEmpresas = (checked, visibleEmpresas) => {
        const visibleIds = visibleEmpresas.filter(canDeleteEmpresa).map((empresa) => empresa.id);

        setSelectedIds((current) => {
            if (!checked) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };

    const toggleSolucao = (solucao) => {
        clearFieldError("solucaoIds");
        setForm((current) => {
            const selected = current.solucaoIds.includes(solucao.id);
            const solucaoIds = selected
                ? current.solucaoIds.filter((id) => id !== solucao.id)
                : [...current.solucaoIds, solucao.id];

            return {
                ...current,
                solucaoIds,
                funcionalidadeIds: getFuncionalidadeIdsBySolucaoIds(solucaoIds)
            };
        });
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
                    rows={loading ? [] : filteredEmpresas}
                    selectedId={selectedId}
                    selectedIds={selectedIds}
                    onSelect={setSelectedId}
                    onToggleSelect={toggleSelectedEmpresa}
                    onToggleSelectAll={toggleVisibleEmpresas}
                    isRowSelectable={canDeleteEmpresa}
                    getRowSelectionDisabledReason={() => "A empresa padrão do sistema não pode ser excluída."}
                    onCreate={() => openModal("create")}
                    onEdit={(empresa) => openModal("edit", empresa)}
                    onView={(empresa) => openModal("view", empresa)}
                    onDelete={handleDelete}
                    search={search}
                    onSearchChange={setSearch}
                    busy={gridBusy || loading}
                    error={error}
                    onRetry={loadEmpresas}
                    emptyMessage="Nenhuma empresa encontrada."
                    canCreate={canUseFeatureAction(currentUser, permissions, "incluir")}
                    canEdit={canUseFeatureAction(currentUser, permissions, "alterar")}
                    canView={canUseFeatureAction(currentUser, permissions, "visualizar")}
                    canDelete={canUseFeatureAction(currentUser, permissions, "excluir")}
                />

            {modalMode && (
                <CrudModal
                    mode={modalMode}
                    formId={COMPANY_FORM_ID}
                    noValidate
                    title="Empresa"
                    ariaLabel="Cadastro de empresa"
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    formClassName="company-form"
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
                                ariaLabel="Seções da empresa"
                                tabs={[
                                    { id: "main", label: "Dados gerais" },
                                    { id: "solutions", label: "Soluções" },
                                    ...(readonly ? [{ id: "users", label: "Usuários vinculados" }] : [])
                                ]}
                            />

                            {formError && <FeedbackMessage type="error" compact>{formError}</FeedbackMessage>}

                            <CrudModalTabPanel active={activeTab === "main"}>
                            <div className="user-form-field">
                                <span className="user-form-field-label">
                                    <label htmlFor="empresa-nome">Nome <FormFieldError formId={COMPANY_FORM_ID} field="nome" errors={fieldErrors} /></label>
                                </span>
                                <input id="empresa-nome" name="nome" value={form.nome || ""} onChange={handleChange} disabled={readonly || saving} {...fieldErrorProps("nome")} />
                            </div>
                            </CrudModalTabPanel>

                            <CrudModalTabPanel active={activeTab === "solutions"}>
                            <div className="company-access-header">
                                <span>Soluções</span>
                            </div>
                            <div className="company-access-grid">
                                {solucoes.map((solucao) => (
                                    <label key={solucao.id}>
                                        <input
                                            type="checkbox"
                                            name="solucaoIds"
                                            checked={form.solucaoIds.includes(solucao.id)}
                                            onChange={() => toggleSolucao(solucao)} {...fieldErrorProps("solucaoIds")}
                                            disabled={readonly || saving}
                                        />
                                        {solucao.nome}
                                    </label>
                                ))}
                            </div>
                            </CrudModalTabPanel>

                            <CrudModalTabPanel active={readonly && activeTab === "users"} className="company-linked-users">
                                    <div className="company-linked-users-header">
                                        <span>Usuários vinculados</span>
                                        <strong>
                                            {linkedUsers.length === 1
                                                ? "1 usuário vinculado"
                                                : `${linkedUsers.length} usuários vinculados`}
                                        </strong>
                                    </div>

                                    {linkedUsers.length ? (
                                        <div className="company-linked-users-list">
                                            <div className="company-linked-user company-linked-user-head">
                                                <span>Nome</span>
                                                <span>E-mail</span>
                                                <span>Tipo</span>
                                            </div>
                                            {linkedUsers.map((user) => (
                                                <div className="company-linked-user" key={user.id}>
                                                    <strong>{user.nome || "Usuário sem nome"}</strong>
                                                    <span>{user.email}</span>
                                                    <small>{user.grupo?.nome || "Sem grupo"}</small>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="company-linked-users-empty">Nenhum usuário vinculado a esta empresa.</p>
                                    )}
                            </CrudModalTabPanel>
                </CrudModal>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                title="Confirmar exclusão"
                message={`Tem certeza que deseja deletar a ${pendingDelete?.label || "empresa selecionada"}?`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}

