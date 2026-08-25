import { useCallback, useEffect, useMemo, useState } from "react";

import {
    createGrupoUsuario,
    deleteGrupoUsuario,
    getGruposUsuarios,
    updateGrupoUsuario
} from "../../services/GruposUsuarios/GrupoUsuarioService";
import { getSolucoes } from "../../services/Solucoes/SolucaoService";
import ConfirmDialog from "./ConfirmDialog";
import { FeedbackMessage } from "./CrudFeedback";
import CrudGrid from "./CrudGrid";
import FormFieldError from "./FormFieldError";
import { CrudModal, CrudModalTabPanel, CrudModalTabs } from "./CrudModal";
import { useAuth } from "../hooks/useAuth";
import { useFormFieldErrors } from "../hooks/useFormFieldErrors";
import { useLatestRequest } from "../hooks/useLatestRequest";
import { canUseFeatureAction, isAssignableSolution } from "../auth/hubConfig";

import "../styles/userManagement.css";

const GROUP_FORM_ID = "group-registration-form";
const GROUP_FIELD_ORDER = ["nome", "descricao", "solucaoIds", "funcionalidadeIds"];
const GROUP_FIELD_TABS = {
    nome: "main",
    descricao: "main",
    solucaoIds: "solutions",
    funcionalidadeIds: "features"
};
const GROUP_FIELD_MATCHERS = { nome: [/grupo.*cadastrado/i, /nome/i] };

const initialForm = {
    id: "",
    nome: "",
    descricao: "",
    solucaoIds: [],
    funcionalidadeIds: [],
    funcionalidadePermissoes: [],
    podeVisualizar: true,
    podeIncluir: false,
    podeAlterar: false,
    podeExcluir: false
};

const booleanLabel = (value) => (value ? "Sim" : "Não");
const canDeleteGroup = (group) => !group?.padraoSistema;

const legacyActionFields = {
    visualizar: "podeVisualizar",
    incluir: "podeIncluir",
    alterar: "podeAlterar",
    excluir: "podeExcluir"
};

const fallbackActions = [
    { chave: "visualizar", nome: "Visualizar" },
    { chave: "incluir", nome: "Incluir" },
    { chave: "alterar", nome: "Alterar" },
    { chave: "excluir", nome: "Excluir" }
];

const getFeatureActions = (funcionalidade) =>
    (funcionalidade?.acoes?.length ? funcionalidade.acoes : fallbackActions)
        .filter((acao) => acao.ativo !== false);

const defaultPermission = (funcionalidade) => ({
    funcionalidadeId: typeof funcionalidade === "number" ? funcionalidade : funcionalidade.id,
    podeVisualizar: true,
    podeIncluir: false,
    podeAlterar: false,
    podeExcluir: false,
    acoes: getFeatureActions(funcionalidade).map((acao) => ({
        funcionalidadeId: typeof funcionalidade === "number" ? funcionalidade : funcionalidade.id,
        acaoId: acao.id,
        chave: acao.chave,
        permitido: acao.chave === "visualizar"
    }))
});

const isActionPermitted = (permissao, acao) => {
    const acaoPermissao = permissao.acoes?.find((item) => acao.id ? item.acaoId === acao.id : item.chave === acao.chave);
    const legacyField = legacyActionFields[acao.chave];

    return acaoPermissao ? !!acaoPermissao.permitido : legacyField ? !!permissao[legacyField] : false;
};

const normalizePermissionPayload = (permissao) => ({
    funcionalidadeId: Number(permissao.funcionalidadeId),
    podeVisualizar: !!permissao.podeVisualizar,
    podeIncluir: !!permissao.podeIncluir,
    podeAlterar: !!permissao.podeAlterar,
    podeExcluir: !!permissao.podeExcluir,
    acoes: (permissao.acoes ?? [])
        .filter((acao) => acao.acaoId)
        .map((acao) => ({
            funcionalidadeId: Number(acao.funcionalidadeId ?? permissao.funcionalidadeId),
            acaoId: Number(acao.acaoId),
            chave: acao.chave || null,
            permitido: !!acao.permitido
        }))
});

const normalizeGroupForm = (group) => ({
    ...initialForm,
    ...group,
    solucaoIds: group?.solucaoIds ?? [],
    funcionalidadeIds: group?.funcionalidadeIds ?? [],
    funcionalidadePermissoes: group?.funcionalidadePermissoes?.length
        ? group.funcionalidadePermissoes
        : (group?.funcionalidadeIds ?? []).map((funcionalidadeId) => ({
            funcionalidadeId,
            podeVisualizar: group?.podeVisualizar ?? true,
            podeIncluir: group?.podeIncluir ?? false,
            podeAlterar: group?.podeAlterar ?? false,
            podeExcluir: group?.podeExcluir ?? false,
            acoes: []
        }))
});

export default function GroupManagement({ permissions }) {
    const { user: currentUser } = useAuth();
    const [groups, setGroups] = useState([]);
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
    const [activeTab, setActiveTab] = useState("main");
    const [pendingDelete, setPendingDelete] = useState(null);
    const groupsRequest = useLatestRequest();
    const {
        applyError: applyFormError,
        clearErrors: clearFormErrors,
        clearFieldError,
        fieldErrorProps,
        fieldErrors,
        generalError: formError,
        showFieldErrors
    } = useFormFieldErrors({
        formId: GROUP_FORM_ID,
        fieldOrder: GROUP_FIELD_ORDER,
        fieldTabs: GROUP_FIELD_TABS,
        fieldMatchers: GROUP_FIELD_MATCHERS,
        setActiveTab
    });

    const loadGroups = useCallback(() => {
        setError("");
        setLoading(true);

        return groupsRequest.run(
            () => Promise.all([getGruposUsuarios(), getSolucoes()]),
            {
                onSuccess: ([groupsResponse, solucoesResponse]) => {
                    setGroups(groupsResponse);
                    setSelectedIds((current) => current.filter((id) => groupsResponse.some((group) => group.id === id && canDeleteGroup(group))));
                    setSolucoes(solucoesResponse.filter(isAssignableSolution));
                },
                onError: (loadError) => setError(loadError.message || "Não foi possível carregar grupos."),
                onSettled: () => setLoading(false)
            }
        );
    }, [groupsRequest]);

    useEffect(() => {
        void loadGroups();
        return groupsRequest.invalidate;
    }, [groupsRequest, loadGroups]);

    const filteredGroups = useMemo(() => {
        const term = search.toLowerCase().trim();

        if (!term) {
            return groups;
        }

        return groups.filter((group) =>
            [group.nome, group.descricao]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term))
        );
    }, [groups, search]);

    const openModal = (mode, group = null) => {
        setError("");
        clearFormErrors();
        setModalMode(mode);
        setActiveTab("main");
        setForm(group ? normalizeGroupForm(group) : initialForm);
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
            showFieldErrors({ nome: "Preencha o nome do grupo." });
            return;
        }

        setSaving(true);

        const payload = {
            nome: form.nome.trim(),
            descricao: form.descricao.trim(),
            solucaoIds: form.solucaoIds,
            funcionalidadeIds: form.funcionalidadeIds,
            funcionalidadePermissoes: form.funcionalidadePermissoes
                .filter((permissao) => form.funcionalidadeIds.includes(permissao.funcionalidadeId))
                .map(normalizePermissionPayload),
            podeVisualizar: form.podeVisualizar,
            podeIncluir: form.podeIncluir,
            podeAlterar: form.podeAlterar,
            podeExcluir: form.podeExcluir
        };

        try {
            if (modalMode === "create") {
                await createGrupoUsuario(payload);
            }

            if (modalMode === "edit") {
                await updateGrupoUsuario({ id: form.id, ...payload });
            }

            closeModal();
            await loadGroups();
        } catch (saveError) {
            applyFormError(saveError, "Não foi possível salvar o grupo.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (ids) => {
        const groupsToDelete = groups.filter((group) => ids.includes(group.id) && canDeleteGroup(group));

        if (!groupsToDelete.length) {
            setError("O grupo Administradores padrão do sistema não pode ser excluído.");
            return;
        }

        setPendingDelete({
            ids: groupsToDelete.map((group) => group.id),
            label: groupsToDelete.length === 1
                ? groupsToDelete[0].nome || "grupo selecionado"
                : `${groupsToDelete.length} grupos selecionados`
        });
    };

    const toggleSolucao = (solucao) => {
        clearFieldError("solucaoIds");
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
                    : [...new Set([...current.funcionalidadeIds, ...funcionalidadeIds])],
                funcionalidadePermissoes: selected
                    ? current.funcionalidadePermissoes.filter((permissao) => !funcionalidadeIds.includes(permissao.funcionalidadeId))
                    : [
                        ...current.funcionalidadePermissoes,
                        ...funcionalidadeIds
                            .filter((funcionalidadeId) => !current.funcionalidadePermissoes.some((permissao) => permissao.funcionalidadeId === funcionalidadeId))
                            .map((funcionalidadeId) => defaultPermission(solucao.funcionalidades.find((funcionalidade) => funcionalidade.id === funcionalidadeId) ?? funcionalidadeId))
                    ]
            };
        });
    };

    const toggleFuncionalidade = (funcionalidade) => {
        clearFieldError("funcionalidadeIds");
        setForm((current) => {
            const funcionalidadeId = funcionalidade.id;
            const selected = current.funcionalidadeIds.includes(funcionalidadeId);

            return {
                ...current,
                funcionalidadeIds: selected
                    ? current.funcionalidadeIds.filter((id) => id !== funcionalidadeId)
                    : [...current.funcionalidadeIds, funcionalidadeId],
                funcionalidadePermissoes: selected
                    ? current.funcionalidadePermissoes.filter((permissao) => permissao.funcionalidadeId !== funcionalidadeId)
                    : current.funcionalidadePermissoes.some((permissao) => permissao.funcionalidadeId === funcionalidadeId)
                        ? current.funcionalidadePermissoes
                        : [...current.funcionalidadePermissoes, defaultPermission(funcionalidade)]
            };
        });
    };

    const toggleFuncionalidadePermissao = (funcionalidade, acao) => {
        const sameAction = (item) => acao.id ? item.acaoId === acao.id : item.chave === acao.chave;

        setForm((current) => ({
            ...current,
            funcionalidadePermissoes: current.funcionalidadePermissoes.map((permissao) => {
                if (permissao.funcionalidadeId !== funcionalidade.id) {
                    return permissao;
                }

                const currentActions = permissao.acoes?.length
                    ? permissao.acoes
                    : defaultPermission(funcionalidade).acoes;
                const exists = currentActions.some(sameAction);
                const acoes = exists
                    ? currentActions.map((item) =>
                        sameAction(item)
                            ? { ...item, acaoId: acao.id, chave: acao.chave, permitido: !item.permitido }
                            : item
                    )
                    : [
                        ...currentActions,
                        { funcionalidadeId: funcionalidade.id, acaoId: acao.id, chave: acao.chave, permitido: true }
                    ];
                const toggled = acoes.find(sameAction);
                const legacyField = legacyActionFields[acao.chave];

                return {
                    ...permissao,
                    ...(legacyField ? { [legacyField]: !!toggled?.permitido } : {}),
                    acoes
                };
            })
        }));
    };

    const selectAllFuncionalidadePermissions = (funcionalidade) => {
        clearFieldError("funcionalidadeIds");
        const actions = getFeatureActions(funcionalidade);

        setForm((current) => {
            const existingPermission = current.funcionalidadePermissoes.find(
                (permissao) => permissao.funcionalidadeId === funcionalidade.id
            ) ?? defaultPermission(funcionalidade);
            const existingActions = existingPermission.acoes ?? [];
            const selectedActions = actions.map((acao) => {
                const existingAction = existingActions.find((item) => acao.id ? item.acaoId === acao.id : item.chave === acao.chave);

                return {
                    ...existingAction,
                    funcionalidadeId: funcionalidade.id,
                    acaoId: acao.id,
                    chave: acao.chave,
                    permitido: true
                };
            });
            const actionIds = new Set(actions.map((acao) => acao.id).filter(Boolean));
            const actionKeys = new Set(actions.map((acao) => acao.chave));
            const preservedActions = existingActions.filter((acao) =>
                acao.acaoId ? !actionIds.has(acao.acaoId) : !actionKeys.has(acao.chave)
            );
            const selectedPermission = {
                ...existingPermission,
                podeVisualizar: true,
                podeIncluir: true,
                podeAlterar: true,
                podeExcluir: true,
                acoes: [...preservedActions, ...selectedActions]
            };

            return {
                ...current,
                funcionalidadeIds: current.funcionalidadeIds.includes(funcionalidade.id)
                    ? current.funcionalidadeIds
                    : [...current.funcionalidadeIds, funcionalidade.id],
                funcionalidadePermissoes: current.funcionalidadePermissoes.some(
                    (permissao) => permissao.funcionalidadeId === funcionalidade.id
                )
                    ? current.funcionalidadePermissoes.map((permissao) =>
                        permissao.funcionalidadeId === funcionalidade.id ? selectedPermission : permissao
                    )
                    : [...current.funcionalidadePermissoes, selectedPermission]
            };
        });
    };

    const getFuncionalidadePermissao = (funcionalidadeId) =>
        form.funcionalidadePermissoes.find((permissao) => permissao.funcionalidadeId === funcionalidadeId) ?? defaultPermission(funcionalidadeId);

    const summarizeGroupPermissions = (group) => {
        const total = group.funcionalidadePermissoes?.length ?? group.funcionalidadeIds?.length ?? 0;

        if (!total) {
            return "Sem rotinas";
        }

        const full = (group.funcionalidadePermissoes ?? []).filter((permissao) =>
            permissao.podeVisualizar && permissao.podeIncluir && permissao.podeAlterar && permissao.podeExcluir
        ).length;

        return `${total} rotina(s), ${full} com CRUD completo`;
    };

    const confirmDelete = async () => {
        if (!pendingDelete) {
            return;
        }

        setError("");
        setPendingDelete(null);
        setGridBusy(true);

        try {
            await Promise.all(pendingDelete.ids.map((id) => deleteGrupoUsuario(id)));
            setSelectedId("");
            setSelectedIds([]);
            await loadGroups();
        } catch (deleteError) {
            setError(deleteError.message || "Não foi possível deletar o grupo.");
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelectedGroup = (groupId) => {
        const group = groups.find((item) => item.id === groupId);

        if (!canDeleteGroup(group)) {
            return;
        }

        setSelectedIds((current) =>
            current.includes(groupId)
                ? current.filter((id) => id !== groupId)
                : [...current, groupId]
        );
    };

    const toggleVisibleGroups = (checked, visibleGroups) => {
        const visibleIds = visibleGroups.filter(canDeleteGroup).map((group) => group.id);

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
            <CrudGrid
                    title="Cadastro de grupos"
                    columns={[
                        { key: "nome", label: "Nome", render: (group) => group.nome || "-" },
                        { key: "descricao", label: "Descrição", render: (group) => group.descricao || "-" },
                        ...solucoes.map((solucao) => ({
                            key: `solucao-${solucao.id}`,
                            label: solucao.nome,
                            render: (group) => booleanLabel(group.solucaoIds?.includes(solucao.id))
                        })),
                        { key: "permissoes", label: "Permissões", render: summarizeGroupPermissions }
                    ]}
                    rows={loading ? [] : filteredGroups}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectedGroup}
                    onToggleSelectAll={toggleVisibleGroups}
                    isRowSelectable={canDeleteGroup}
                    getRowSelectionDisabledReason={() => "Grupos padrão do sistema não podem ser excluídos."}
                    onCreate={() => openModal("create")}
                    onEdit={(group) => openModal("edit", group)}
                    onView={(group) => openModal("view", group)}
                    onDelete={handleDelete}
                    search={search}
                    onSearchChange={setSearch}
                    busy={gridBusy || loading}
                    error={error}
                    onRetry={loadGroups}
                    emptyMessage="Nenhum grupo encontrado."
                    canCreate={canUseFeatureAction(currentUser, permissions, "incluir")}
                    canEdit={canUseFeatureAction(currentUser, permissions, "alterar")}
                    canView={canUseFeatureAction(currentUser, permissions, "visualizar")}
                    canDelete={canUseFeatureAction(currentUser, permissions, "excluir")}
                />

            {modalMode && (
                <CrudModal
                    mode={modalMode}
                    formId={GROUP_FORM_ID}
                    noValidate
                    title="Grupo de usuários"
                    ariaLabel="Cadastro de grupo"
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
                                ariaLabel="Seções do grupo"
                                tabs={[
                                    { id: "main", label: "Dados do grupo" },
                                    { id: "solutions", label: "Soluções" },
                                    { id: "features", label: "Permissões por rotina" }
                                ]}
                            />

                            {formError && <FeedbackMessage type="error" compact>{formError}</FeedbackMessage>}

                            <CrudModalTabPanel active={activeTab === "main"}>
                            <div className="user-form-field">
                                <span className="user-form-field-label">
                                    <label htmlFor="grupo-nome">Nome <FormFieldError formId={GROUP_FORM_ID} field="nome" errors={fieldErrors} /></label>
                                </span>
                                <input id="grupo-nome" name="nome" value={form.nome || ""} onChange={handleChange} disabled={readonly || saving} {...fieldErrorProps("nome")} />
                            </div>

                            <div className="user-form-field">
                                <span className="user-form-field-label">
                                    <label htmlFor="grupo-descricao">Descrição <FormFieldError formId={GROUP_FORM_ID} field="descricao" errors={fieldErrors} /></label>
                                </span>
                                <input id="grupo-descricao" name="descricao" value={form.descricao || ""} onChange={handleChange} disabled={readonly || saving} {...fieldErrorProps("descricao")} />
                            </div>
                            </CrudModalTabPanel>

                            <CrudModalTabPanel active={activeTab === "solutions"} className="user-company-section">
                                <div className="user-company-header">
                                    <div>
                                        <span>Acessos do grupo</span>
                                        <strong>Soluções liberadas no hub</strong>
                                    </div>
                                </div>

                                <div className="user-permissions-grid">
                                    {solucoes.map((solucao) => (
                                        <label key={solucao.id} className="user-permission-option">
                                            <input
                                                type="checkbox"
                                                name="solucaoIds"
                                                checked={form.solucaoIds.includes(solucao.id)}
                                                {...fieldErrorProps("solucaoIds")}
                                                onChange={() => toggleSolucao(solucao)}
                                                disabled={readonly || saving}
                                            />
                                            {solucao.nome}
                                        </label>
                                    ))}
                                </div>
                            </CrudModalTabPanel>

                            <CrudModalTabPanel active={activeTab === "features"} className="user-company-section">
                                <div className="user-company-header">
                                    <div>
                                        <span>Funcionalidades</span>
                                        <strong>Ações liberadas por rotina</strong>
                                    </div>
                                </div>

                                <div className="user-feature-permissions">
                                    {solucoes.filter((solucao) => form.solucaoIds.includes(solucao.id)).flatMap((solucao) =>
                                        (solucao.funcionalidades || []).map((funcionalidade) => {
                                            const selected = form.funcionalidadeIds.includes(funcionalidade.id);
                                            const permissao = getFuncionalidadePermissao(funcionalidade.id);
                                            const disabled = readonly || saving;
                                            const actions = getFeatureActions(funcionalidade);
                                            const allPermissionsSelected = selected && actions.every((acao) => isActionPermitted(permissao, acao));

                                            return (
                                                <div key={funcionalidade.id} className="user-feature-permission-row">
                                                    <div className="user-feature-permission-heading">
                                                    <label className="user-permission-option">
                                                        <input
                                                            type="checkbox"
                                                            name="funcionalidadeIds"
                                                            checked={selected}
                                                            {...fieldErrorProps("funcionalidadeIds")}
                                                            onChange={() => toggleFuncionalidade(funcionalidade)}
                                                            disabled={disabled}
                                                        />
                                                        <span>
                                                            <strong>{funcionalidade.titulo}</strong>
                                                            <small>{solucao.nome}</small>
                                                        </span>
                                                    </label>
                                                    {!readonly && (
                                                        <button
                                                            type="button"
                                                            className="user-feature-select-all"
                                                            onClick={() => selectAllFuncionalidadePermissions(funcionalidade)}
                                                            disabled={disabled || allPermissionsSelected}
                                                            aria-label={`Marcar todas as permissões — ${funcionalidade.titulo}`}
                                                        >
                                                            Marcar todas
                                                        </button>
                                                    )}
                                                    </div>

                                                    <div className="user-feature-crud-options">
                                                        {actions.map((acao) => {
                                                            const checked = isActionPermitted(permissao, acao);

                                                            return (
                                                            <label key={acao.id || acao.chave} className="user-permission-option">
                                                                <input
                                                                    type="checkbox"
                                                                    aria-label={`${acao.nome} — ${funcionalidade.titulo}`}
                                                                    checked={checked}
                                                                    onChange={() => toggleFuncionalidadePermissao(funcionalidade, acao)}
                                                                    disabled={disabled || !selected}
                                                                />
                                                                {acao.nome}
                                                            </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CrudModalTabPanel>
                </CrudModal>
            )}

            <ConfirmDialog
                open={!!pendingDelete}
                title="Confirmar exclusão"
                message={`Tem certeza que deseja deletar ${pendingDelete?.label || "o grupo selecionado"}?`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}
