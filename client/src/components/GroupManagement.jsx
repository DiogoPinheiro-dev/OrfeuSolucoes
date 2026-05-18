import { useEffect, useMemo, useState } from "react";

import {
    createGrupoUsuario,
    deleteGrupoUsuario,
    getGruposUsuarios,
    updateGrupoUsuario
} from "../../services/GruposUsuarios/GrupoUsuarioService";
import { getSolucoes } from "../../services/Solucoes/SolucaoService";
import ConfirmDialog from "./ConfirmDialog";
import CrudGrid from "./CrudGrid";
import { useAuth } from "../hooks/useAuth";
import { canUseFeatureAction } from "../auth/hubConfig";

import "../styles/userManagement.css";

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

const booleanLabel = (value) => (value ? "Sim" : "Nao");

const permissionActions = [
    ["podeVisualizar", "Visualizar"],
    ["podeIncluir", "Incluir"],
    ["podeAlterar", "Alterar"],
    ["podeExcluir", "Excluir"]
];

const defaultPermission = (funcionalidadeId) => ({
    funcionalidadeId,
    podeVisualizar: true,
    podeIncluir: false,
    podeAlterar: false,
    podeExcluir: false
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
            podeExcluir: group?.podeExcluir ?? false
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
    const [pendingDelete, setPendingDelete] = useState(null);

    const loadGroups = async () => {
        setError("");
        setLoading(true);

        try {
            const [groupsResponse, solucoesResponse] = await Promise.all([getGruposUsuarios(), getSolucoes()]);
            setGroups(groupsResponse);
            setSolucoes(solucoesResponse.filter((solucao) => !solucao.somenteAdminSistema));
        } catch (loadError) {
            setError(loadError.message || "Nao foi possivel carregar grupos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadGroups();
    }, []);

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
        setModalMode(mode);
        setForm(group ? normalizeGroupForm(group) : initialForm);
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

        const payload = {
            nome: form.nome.trim(),
            descricao: form.descricao.trim(),
            solucaoIds: form.solucaoIds,
            funcionalidadeIds: form.funcionalidadeIds,
            funcionalidadePermissoes: form.funcionalidadePermissoes.filter((permissao) =>
                form.funcionalidadeIds.includes(permissao.funcionalidadeId)
            ),
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
            setError(saveError.message || "Nao foi possivel salvar o grupo.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (ids) => {
        const groupsToDelete = groups.filter((group) => ids.includes(group.id));

        setPendingDelete({
            ids,
            label: groupsToDelete.length === 1
                ? groupsToDelete[0].nome || "grupo selecionado"
                : `${groupsToDelete.length} grupos selecionados`
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
                    : [...new Set([...current.funcionalidadeIds, ...funcionalidadeIds])],
                funcionalidadePermissoes: selected
                    ? current.funcionalidadePermissoes.filter((permissao) => !funcionalidadeIds.includes(permissao.funcionalidadeId))
                    : [
                        ...current.funcionalidadePermissoes,
                        ...funcionalidadeIds
                            .filter((funcionalidadeId) => !current.funcionalidadePermissoes.some((permissao) => permissao.funcionalidadeId === funcionalidadeId))
                            .map(defaultPermission)
                    ]
            };
        });
    };

    const toggleFuncionalidade = (funcionalidadeId) => {
        setForm((current) => {
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
                        : [...current.funcionalidadePermissoes, defaultPermission(funcionalidadeId)]
            };
        });
    };

    const toggleFuncionalidadePermissao = (funcionalidadeId, permissionName) => {
        setForm((current) => ({
            ...current,
            funcionalidadePermissoes: current.funcionalidadePermissoes.map((permissao) =>
                permissao.funcionalidadeId === funcionalidadeId
                    ? { ...permissao, [permissionName]: !permissao[permissionName] }
                    : permissao
            )
        }));
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
            setError(deleteError.message || "Nao foi possivel deletar o grupo.");
        } finally {
            setGridBusy(false);
        }
    };

    const toggleSelectedGroup = (groupId) => {
        setSelectedIds((current) =>
            current.includes(groupId)
                ? current.filter((id) => id !== groupId)
                : [...current, groupId]
        );
    };

    const toggleVisibleGroups = (checked, visibleGroups) => {
        const visibleIds = visibleGroups.map((group) => group.id);

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
                <div className="user-management-loading">Carregando grupos...</div>
            ) : (
                <CrudGrid
                    title="Cadastro de grupos"
                    columns={[
                        { key: "nome", label: "Nome", render: (group) => group.nome || "-" },
                        { key: "descricao", label: "Descricao", render: (group) => group.descricao || "-" },
                        ...solucoes.map((solucao) => ({
                            key: `solucao-${solucao.id}`,
                            label: solucao.nome,
                            render: (group) => booleanLabel(group.solucaoIds?.includes(solucao.id))
                        })),
                        { key: "permissoes", label: "Permissoes", render: summarizeGroupPermissions }
                    ]}
                    rows={filteredGroups}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelectedGroup}
                    onToggleSelectAll={toggleVisibleGroups}
                    isRowSelectable={() => true}
                    onCreate={() => openModal("create")}
                    onEdit={(group) => openModal("edit", group)}
                    onView={(group) => openModal("view", group)}
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
                    <div className="crud-modal" role="dialog" aria-modal="true" aria-label="Cadastro de grupo">
                        <header className="crud-modal-header">
                            <div>
                                <span>{modalMode === "create" ? "Incluir" : modalMode === "edit" ? "Alterar" : "Visualizar"}</span>
                                <h3>Grupo de usuarios</h3>
                            </div>
                            <button type="button" onClick={closeModal} aria-label="Fechar">X</button>
                        </header>

                        <form className="user-form" onSubmit={handleSubmit}>
                            <label>
                                Nome
                                <input name="nome" value={form.nome || ""} onChange={handleChange} disabled={readonly || saving} required />
                            </label>

                            <label>
                                Descricao
                                <input name="descricao" value={form.descricao || ""} onChange={handleChange} disabled={readonly || saving} />
                            </label>

                            <section className="user-company-section" aria-label="Acessos do grupo">
                                <div className="user-company-header">
                                    <div>
                                        <span>Acessos do grupo</span>
                                        <strong>Solucoes liberadas no hub</strong>
                                    </div>
                                </div>

                                <div className="user-permissions-grid">
                                    {solucoes.map((solucao) => (
                                        <label key={solucao.id} className="user-permission-option">
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
                            </section>

                            <section className="user-company-section" aria-label="Funcionalidades do grupo">
                                <div className="user-company-header">
                                    <div>
                                        <span>Funcionalidades</span>
                                        <strong>Acoes liberadas por rotina</strong>
                                    </div>
                                </div>

                                <div className="user-feature-permissions">
                                    {solucoes.filter((solucao) => form.solucaoIds.includes(solucao.id)).flatMap((solucao) =>
                                        (solucao.funcionalidades || []).map((funcionalidade) => {
                                            const selected = form.funcionalidadeIds.includes(funcionalidade.id);
                                            const permissao = getFuncionalidadePermissao(funcionalidade.id);
                                            const disabled = readonly || saving;

                                            return (
                                                <div key={funcionalidade.id} className="user-feature-permission-row">
                                                    <label className="user-permission-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected}
                                                            onChange={() => toggleFuncionalidade(funcionalidade.id)}
                                                            disabled={disabled}
                                                        />
                                                        <span>
                                                            <strong>{funcionalidade.titulo}</strong>
                                                            <small>{solucao.nome}</small>
                                                        </span>
                                                    </label>

                                                    <div className="user-feature-crud-options">
                                                        {permissionActions.map(([name, label]) => (
                                                            <label key={name} className="user-permission-option">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!permissao[name]}
                                                                    onChange={() => toggleFuncionalidadePermissao(funcionalidade.id, name)}
                                                                    disabled={disabled || !selected}
                                                                />
                                                                {label}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
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

            <ConfirmDialog
                open={!!pendingDelete}
                title="Confirmar exclusao"
                message={`Tem certeza que quer deletar ${pendingDelete?.label || "o grupo selecionado"}?`}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                loading={false}
            />
        </>
    );
}
